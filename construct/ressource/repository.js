/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict';

/**
 * Les méthodes génériques de notre composant, utilisées par les différents contrôleurs
 */

var _ = require('underscore')._
var flow          = require('seq')
var elementtree = require('elementtree')

var config = require('./config')
var limitMax = config.limites.maxSql || 100 // on appliquera toujours un limit inférieur à cette valeur

var ressourceRepository = {}

/**
 * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
 * @param {Ressource} ressource
 * @param {Function} next Callback qui recevra les arguments (error, ressource)
 * @return {Boolean}
 */
ressourceRepository.valide = function(ressource, next) {
  // log.dev('on va valider ', ressource)
  /** tableau d'erreurs qui sera concaténé et passé à next si non vide */
  var errors = [];
  if (_.isEmpty(ressource)) {
    errors.push("Ressource vide");
  } else {
    // vérif présence et type
    _.each(config.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(ressource[key]) && config.required[key]) {
        errors.push("Le champ " + config.labels[key] + " est obligatoire")
      }
      // le type
      if (ressource[key] && ! _['is' + typeVar](ressource[key])) {
        errors.push("Le champ " + config.labels[key] + " ne contient pas le type attendu");
        log.dev("à la validation on a reçu pour " + key + ' : ' + lassi.tools.stringify(ressource[key]))
      } else if (typeVar === 'Number') {
        // on vérifie entier positif
        if (Math.floor(ressource[key]) !== ressource[key]) {
          errors.push("Le champ " + config.labels[key] + " ne contient pas un entier");
        }
        if (ressource[key] < 0) {
          errors.push("Le champ " + config.labels[key] + " ne contient pas un entier positif");
        }
      }
    })
  }

  if (next) {
    if (errors.length) {
      // on passe les erreurs mais pas la ressource invalide
      next(new Error("Ressource invalide : \n" + errors.join("\n")))
    } else {
      next(null, ressource)
    }
  }

  return !errors.length;
}

/**
 * Incrémente le n° de version si la ressource a une propriété newVersion ou si une des propriétés listées
 * dans config.versionTriggers a changée de valeur
 * @param ressource
 * @private
 */
function setVersion(ressource, next) {
  var needIncrement

  /**
   * Compare la ressource à la ressource qui existait pour savoir s'il faut incrémenter la version
   * @param ressourceInitiale
   */
  function analyse(ressourceInitiale) {
    // on peut réclamer une nouvelle version via un flag sur la ressource
    if (ressource.versionNeedIncrement) needIncrement = true
    // on regarde si nos champs qui déclenchent un changement de version on changé
    else {
      _.each(config.versionTriggers, function (prop) {
        // pour la comparaison, deux objets avec la même définition littérale sont vus != en js
        // on utilise http://underscorejs.org/#isEqual
        if (!_.isEqual(ressource[prop], ressourceInitiale[prop])) {
          try {
            log.dev('La modif du champ ' + prop + ' entraîne un incrément de version de ' + ressourceInitiale.id +
                '\n' +'avant\n' + JSON.parse(ressourceInitiale[prop]) + '\n' +
                'après\n' + JSON.parse(ressource[prop]))
          } catch (e) {
            log.dev('le parsing de ressource[' +prop +'] a planté ' +ressource.id +' ' +
                ressource.origine +'-' +ressource.idOrigine)
          }
          needIncrement = true
        }
      })
    }
    // on recopie version et oid (pour écrasement éventuel de l'ancienne ressource)
    ressource.version = ressourceInitiale.version
    ressource.oid = ressourceInitiale.oid

    if (needIncrement) ressourceInitiale.archive(function (error, archive) {
      if (error) next(error)
      else {
        // incrément version et màj dateMiseAJour
        log.dev("On a archivé la ressource " + ressourceInitiale.id + " (avec l'oid en archive " + archive.oid + ')')
        ressource.version++
        ressource.dateMiseAJour = new Date();
        next(null, ressource)
      }
    })
    else {
      next(null, ressource)
    }
  } // analyse

  if (ressource.id) { // pas le cas au create
    // ira seulement en cache dans la plupart des cas, de toute façon faut récupérer le n° de version actuel
    ressourceRepository.load(ressource.id, function (error, ressourceInitiale) {
      if (error) next(error)
      else if (ressourceInitiale) analyse(ressourceInitiale)
      else {
        log.error(new Error("setVersion a reçu une ressource avec id " +ressource.id +" qui n'existait pas en base"))
        next(null, ressource)
      }
    })
  } else if (ressource.idOrigine) {
    ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceInitiale) {
      // on lui ajoute l'id qui n'a pas été fourni (l'oid est ajouté par analyse dans les 2 cas)
      if (ressourceInitiale) {
        ressource.id = ressourceInitiale.id
        analyse(ressourceInitiale)
      } else next(null, ressource)
    })
  } else {
    next(null, ressource)
  }
}

/**
 * Ajoute ou modifie une ressource
 * @param {Ressource} ressource
 * @param {Function} next Callback qui sera passé au store() et recevra les arguments (error, ressource)
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {string} L'id de la ressource insérée
 */
ressourceRepository.write = function(ressource, next) {
  if (ressource.constructor.name !== 'Ressource') {
    ressource = lassi.entity.Ressource.create(ressource)
    log.dev('cast en Ressource : ' +ressource.constructor.name)
  }
  /* mesure de perfs */
  var t
  if (ressource.id && lassi.tmp && lassi.tmp[ressource.id]) t = lassi.tmp[ressource.id]
  else t = {m:'',s:0}
  /* fin mesures */
  //log.dev("avant validation dans write", ressource)
  flow()
      // validation
      .seq(function() { ressourceRepository.valide(ressource, this) })
      // setVersion
      .seq(function (ressource) { setVersion(ressource, this) })
      // store
      .seq(function (ressource) { t.m += '\tvsv ' +log.getElapsed(t.s); ressource.store(this) })
      // ajout de l'id si c'était un insert, et
      .seq(function (ressource) {
        t.m += '\tst ' +log.getElapsed(t.s)
          if (ressource.id) { this(null, ressource) }// rien à faire
          else {
            // pas d'id, pas le choix faut une 2e requete d'update avec l'id qu'on génère ici :-(
            if (ressource.oid != parseInt(ressource.oid, 10)) {
              throw new Error("L'oid n'est plus entier, faut venir changer le code de ressourceRepository.write")
            }
            // on prend l'oid tant qu'il est entier
            ressource.id = ressource.oid;
            // et on enregistre
            ressource.store(this)
          }
      })
      // mise en cache et passage au suivant
      .seq(function (ressource) {
        if (!ressource.id) this("Après un write la ressource n'a toujours pas d'id")
        else {
          lassi.cache.set('ressource_' +ressource.id, ressource, lassi.ressource.cacheTTL)
          log.dev('write ' + ressource.id + ' ok')
          if (next) next(null, ressource)
        }
      })
      .catch(function(error) {
        log.error(error)
        if (next) next(error);
      })
}

/**
 * Efface l'entity par son oid (on peut passer un tableau)
 * @param {Number|Array} id  Le ou les id à supprimer
 * @param {Function}     next La callback qui sera appelée en lui passant (error, nbObjects, nbIndexes)
 * @returns {undefined}
 */
ressourceRepository.del = function(id, next) {
  log.dev("La ressource " +id + " va être effacée")
  var query
  if (_.isArray(id)) query = lassi.entity.Ressource.match('id').in(id)
  else query = lassi.entity.Ressource.match('id').equals(id)
  query.delete(function(error, nbObjects, nbIndexes) {
    if (error) next(error, nbObjects, nbIndexes)
    else {
      if (_.isArray(id)) {
        id.forEach(function (idToDel) {
          lassi.cache.delete('ressource_' +idToDel)
        })
      } else lassi.cache.delete('ressource_' +id)
      next(error, nbObjects, nbIndexes)
    }
    log.dev("La ressource " +id + " a été effacée (" +nbObjects +" versions et " +nbIndexes +" index)")
  })
}

/**
 * Efface l'entity par son oid (on peut passer un tableau)
 * @param {string} origine L'origine
 * @param {Integer} idOrigine L'id à supprimer
 * @param {Function} next La callback qui sera appelée en lui passant (error, nbObjects, nbIndexes)
 * @returns {undefined}
 */
ressourceRepository.delByOrigine = function(origine, idOrigine, next) {
  log.dev("La ressource d'origine " +origine +" et d'id " +idOrigine + " va être effacée")
  lassi.entity.Ressource
      .match('origine').equals(origine)
      .match('idOrigine').equals(idOrigine)
      .delete(function(error, nbObjects, nbIndexes) {
        if (nbObjects) {
          // faut regarder si on l'a en cache pour la virer (on a pas l'id)
          lassi.cache.get('ressourceIdByOrigine_' +origine +'_' +idOrigine, function(error, id) {
            if (id) {
              lassi.cache.delete('ressource_' +id)
              lassi.cache.delete('ressourceIdByOrigine_' +origine +'_' +idOrigine)
            }
          })
        }
        log.dev("La ressource d'origine " +origine +" et d'id " +idOrigine + " a été effacée (" +
            nbObjects +" versions et " +nbIndexes +" index)")
        next(error, nbObjects, nbIndexes)
      })
}

/**
 * Récupère une ressource et la passe à next (seulement une erreur si elle n'existe pas)
 * @param {Number|String} id  L'identifiant de la ressource
 * @param {Function}      next La callback qui sera appelée avec (error, ressource)
 *                             Attention, ressource peut avoir perdu son prototype s'il vient du cache
 * @returns {undefined}
 */
ressourceRepository.load = function(id, next) {
  log.dev('load ressource_' +id)
  cacheGet(id, function (error, ressourceCached) {
    if (ressourceCached) next(null, ressourceCached)
    else {
      lassi.entity.Ressource.match('id').equals(id).grabOne(function (error, ressource) {
        if (error) next(error)
        else if (ressource) {
          // log.dev('on a récupéré en db la ressource', ressource)
          prepareAndSend(ressource, next)
        } else {
          next(null, null)
        }
      })
    }
  })
}

/**
 * Récupère une ressource publique et la passe à next (seulement une erreur si elle n'existe pas)
 * @param {Number|String} id  L'identifiant de la ressource
 * @param {Function}      next La callback qui sera appelée avec (error, ressource).
 * @returns {undefined}
 */
ressourceRepository.loadPublic = function(id, next) {
  cacheGet(id, function (error, ressourceCached) {
    if (ressourceCached) next(null, ressourceCached)
    else {
      lassi.entity.Ressource
          .match('id').equals(id)
          .match('restriction').equals(0)
          .grabOne(function (error, ressource) {
            if (error) next(error)
            else if (ressource) {
              prepareAndSend(ressource, next)
            } else {
              next(null, null)
            }
          })
    }
  })
}

/**
 * Récupère une ressource d'après son idOrigine et la passe à next
 * @param {String}   origine
 * @param {String}   idOrigine
 * @param {Function} next     La callback qui sera appelée en lui passant le nb de ligne effacées en argument
 */
ressourceRepository.loadByOrigin = function(origine, idOrigine, next) {
  if (!idOrigine) {
    log.error('loadByOrigin sans idOrigine')
    return next(null, undefined)
  }

  cacheGetByOrigine(origine, idOrigine, function(error, ressourceCached) {
    if (ressourceCached) next(null, ressourceCached)
    else {
      lassi.entity.Ressource
          .match('origine').equals(origine)
          .match('idOrigine').equals(idOrigine)
          .grabOne(function (error, ressource) {
            if (error) next(error)
            else if (ressource) {
              prepareAndSend(ressource, next)
            } else {
              next(null, null)
            }
          })
    }

  })
}

/**
 * Récupère un liste de ressource d'après critères
 * @param {string}   [visibilite=public] peut valoir public|prof|moi
 * @param {Context}  [ctx]     facultatif si visibilite n'est pas précisé
 * @param {Object}   options Un objet (ou son json) avec éventuellement les propriétés
 *                             filters : un tableau d'objets {index:'indexAFiltrer', values:valeur},
 *                                       où valeur peut être undefined ou un tableau de valeurs
 *                                       (si non précisé filtrera sur les ressources ayant cet index)
 *                             orderBy : L'index sur lequel trier
 *                             order   : asc ou desc
 *                             start   : L'indice de la 1re valeur à remonter
 *                             nb      : Le nombre de ressources à remonter
 *                             full    : Préciser true si on veut aussi la propriété parametres des ressources
 *                                       (sinon on renvoie tout sauf elle)
 * @param {Function} next    La callback qui sera appelée en lui passant la liste de ressources en argument
 */
ressourceRepository.getListe = function(visibilite, ctx, options, next) {
  try {
    // on normalise les arguments
    var publicOnly
    if (arguments.length < 4) {
      if (arguments.length == 3) throw new Error("nombre d'arguments incorrect")
      // 2 args
      options = visibilite
      next = ctx
      publicOnly = true
    } else if (visibilite === 'public') {
      publicOnly = true
    } else if (visibilite === 'all') {
      publicOnly = false
    }

    // on converti si json si besoin
    if (options && _.isString(options)) {
      try {
        options = JSON.parse(options)
      } catch (error) {
        error.userMessage = "options de recherche invalides"
        throw error
      }
    }
    log.dev('getListe visibilite :' +visibilite, options)

    // avant de construire la query on fait un minimum de vérifications
    var start, nb
    var optionsSafe = {
      filters: []
    }
    // filtres
    if (options.filters) {
      if (!_.isArray(options.filters)) throw new Error("Filtres incorrects")
      options.filters.forEach(function (filter) {
        if (!filter.index || !_.isString(filter.index)) throw new Error('index invalide ou manquant')
        if (!_.isArray(filter.values)) throw new Error('valeurs invalides')
        // on ignore le filtre restriction, c'est visibilite qui l'impose éventuellement
        if (filter.index !== 'restriction') optionsSafe.filters.push(filter)
      })

    } else optionsSafe.filters.push({index: 'id'}) // donc tous, mais faut un argument à match
    // le reste
    if (options.orderBy && !_.isString(options.orderBy)) throw new Error('orderBy invalide')
    optionsSafe.orderBy = options.orderBy || 'id'
    if (options.order === 'desc') optionsSafe.order = 'desc'
    start = parseInt(options.start, 10) || 0
    nb = parseInt(options.nb, 10) || 10
    if (nb > limitMax) nb = limitMax

    // si on est toujours là on peut construire la requete
    var query = lassi.entity.Ressource
    optionsSafe.filters.forEach(function (filter) {
      log.dev("filter", filter)
      if (filter.values && filter.values.length) {
        if (filter.values.length > 1) query = query.match(filter.index).in(filter.values)
        else query = query.match(filter.index).equals(filter.values[0])
      } else query = query.match(filter.index)
    })

    // restriction d'après les droits
    if (publicOnly) {
      query = query.match('restriction').equals(0)

    } else if (visibilite == 'prof') {
      if (!lassi.personne.hasPermission('corrections', ctx)) {
        return next(new Error("Vous n'avez pas les droits suffisants pour consulter ces ressources"))
      }
      query = query.match('restriction').equals(1)

    } else if (visibilite == 'moi') {
      if (!ctx.session.user || !ctx.session.user.id)
        return next(new Error("Autentification nécéssaire pour consulter vos propres ressources"))
      query = query.match('auteurs').equals(ctx.session.user.id)

    } else if (visibilite == 'all') {
      if (!ctx.session.user.roles || !ctx.session.user.roles.admin)
        return next(new Error("Il faut être admin pour tout voir"))

    } else {
      // on a pas mis de restriction, c'est pas normal
      log.error(new Error("Appel de getListe avec visibilite " +visibilite))
      return next(new Error("Appel de getListe incorrect"))
    }

    // orderBy
    if (optionsSafe.orderBy) {
      if (optionsSafe.order === 'desc') query = query.sort(optionsSafe.orderBy, 'desc')
      else query = query.sort(optionsSafe.orderBy)
    }

    // limit
    if (nb > config.limites.maxSql) {
      log.error("La limite de cette requete sql (" + nb + ") dépasse le maximum autorisé par la configuration (" +
          config.limites.maxSql + ")")
      nb = config.limites.maxSql
    }
    query.grab(nb, start, function(error, ressources) {
      if (error) next(error)
      else if (options.full) next(null, ressources)
      else {
        if (ressources) ressources.forEach(function(ressource) {
          if (ressource.parametres) delete ressource.parametres
        })
        next(null, ressources)
      }
    })

  } catch (error) {
    log.dev(error)
    if (error.userMessage) next(new Error(error.userMessage))
    else next(error)
  }
}

module.exports = ressourceRepository;

/********************
 * Nos fcts privées *
 *******************/

/**
 * Créé les objets date à partir des Strings, met en cache et fait suivre
 * Si on trouve un seul paramètre xml, on le jsonify
 * @private
 * @param ressources ressource ou tableau de ressources
 * @param next
 * @throws {Error} Si ressources n'est pas une ressource ou un tableau de ressources
 */
function prepareAndSend(ressources, next) {
  /**
   * Helper qui process une ressource
   * @param ressource
   */
  function processOne(ressource) {
    if (!ressource.oid) throw new Error("Paramètre invalide (n'est pas une ressource)")
    // faut transformer les dates en objets date
    if (ressource.dateCreation) ressource.dateCreation = new Date(ressource.dateCreation);
    if (ressource.dateMiseAJour) ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
    // on regarde si on a un xml et rien d'autre
    if (ressource.typeTechnique === 'ec2' && ressource.parametres && ressource.parametres.xml) {
      convertXmlEc2(ressource)
    }
    // pas forcément le cas au 1er insert
    if (ressource.id) lassi.cache.set('ressource_' +ressource.id, ressource, lassi.ressource.cacheTTL)
  }

  if (_.isEmpty(ressources)) throw new Error("Paramètre invalide (n'est pas une ressource ni une liste)")
  if (_.isArray(ressources)) ressources.forEach(processOne)
  else processOne(ressources)
  next(null, ressources)
}

function convertXmlEc2(ressource) {
  var config = elementtree.parse(ressource.parametres.xml)
  var params = {}
  /*
   { _root:
     { _id: 0,
       tag: 'config',
       attrib: {},
       text: '\r\n',
       tail: null,
       _children: [
         [ { _id: 1,
         tag: 'swf',
         attrib: {},
         text: 'calcul-differe-3.swf',
         tail: '\n',
         _children: [] },
         { _id: 2,
         tag: 'json',
         attrib: {},
         text: 'default',
         tail: '\r\n',
         _children: [] } ]
       ]
     }
   }

   */
  if (config._root && config._root.tag === 'config' && config._root._children) {
    config._root._children.forEach(function (child) {
      if (child.tag) {
        params[child.tag] = child.text
      }
    })
    ressource.parametres = params
    // on enregistre la ressource modifiée en async
    ressourceRepository.write(ressource)
  }
    log(params)
}

/**
 * Renvoie la ressource en cache (ou undefined si elle n'y est pas)
 * @param id
 * @returns {Ressource}
 */
function cacheGet(id, next) {
  lassi.cache.get('ressource_' + id, next)
}

/**
 * Renvoie la ressource en cache d'après son origine (ou undefined si elle n'y est pas)
 * @param origine
 * @param idOrigine
 * @returns {Ressource}
 */
function cacheGetByOrigine(origine, idOrigine, next) {
  if (idOrigine) {
    lassi.cache.get('ressourceIdByOrigine_' + origine + '_' + idOrigine, function (error, id) {
      if (id) {
        lassi.cache.get('ressource_' + id, next)
      } else next(null, undefined)
    })
  } else next(null, undefined)
}
