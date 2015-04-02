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
 * Init de notre service $ressourceRepository
 */
module.exports = function (Ressource, Archive, $ressourceControl, $accessControl, $cacheRessource) {
  /**
   * Service d'accès aux ressources, utilisé par les différents contrôleurs
   * @namespace $ressourceRepository
   * @requires Ressource
   * @requires $accessControl
   * @requires $cacheRessource
   */
  var $ressourceRepository = {}

  var _ = require('lodash')
  var flow          = require('seq')
  var elementtree = require('elementtree')

  var config = require('./config')
  var limitMax = config.limites.maxSql || 100 // on appliquera toujours un limit inférieur à cette valeur

  /**
   * Fonctions privées, helper des méthodes du service
   */

  /**
   * Incrémente le n° de version si la ressource a une propriété versionNeedIncrement
   * ou si une des propriétés listées dans config.versionTriggers a changée de valeur
   * @param {Ressource} ressource
   * @param {Function} next
   * @private
   */
  function updateVersion(ressource, next) {

    /**
     * Compare la ressource à la ressource qui existait pour savoir s'il faut incrémenter la version
     * @param ressourceInitiale
     */
    function analyse(ressourceInitiale) {
      var needIncrement = !!ressource.versionNeedIncrement
      // on regarde si nos champs qui déclenchent un changement de version on changé
      if (!needIncrement && ressourceInitiale.id) {
        _.forEach(config.versionTriggers, function (prop) {
          // pour la comparaison, deux objets avec la même définition littérale sont vus != en js
          // on utilise https://lodash.com/docs#isEqual
          if (!_.isEqual(ressource[prop], ressourceInitiale[prop])) {
            // debug
            if (!GLOBAL.isProd) {
              try {
                log.debug('La modif du champ ' + prop + ' entraîne un incrément de version de ' + ressourceInitiale.id +
                    '\n' + 'avant\n' + JSON.parse(ressourceInitiale[prop]) + '\n' +
                    'après\n' + JSON.parse(ressource[prop]))
              } catch (e) {
                log.debug('le parsing de ressource[' + prop + '] a planté ' + ressource.id + ' ' +
                    ressource.origine + '-' + ressource.idOrigine)
              }
            }
            needIncrement = true
            return false // pas la peine de continuer le forEach, cf https://lodash.com/docs#forEach
          }
        })
      }
      // on recopie version et oid (pour écrasement éventuel de l'ancienne ressource)
      ressource.version = ressourceInitiale.version
      ressource.oid = ressourceInitiale.oid

      if (needIncrement) $ressourceRepository.archive(ressourceInitiale, next)
      else next(null, ressource)
    } // analyse

    if (ressource.id) { // pas le cas au create
      // ira seulement en cache dans la plupart des cas, de toute façon faut récupérer le n° de version actuel
      $ressourceRepository.load(ressource.id, function (error, ressourceInitiale) {
        if (error) next(error)
        else if (ressourceInitiale) analyse(ressourceInitiale)
        else {
          log.error(new Error("updateVersion a reçu une ressource avec id " +ressource.id +
              " qui n'existait pas en base"))
          next(null, ressource)
        }
      })
    } else if (ressource.idOrigine) {
      $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceInitiale) {
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
   * Créé les objets date à partir des Strings, met en cache et fait suivre
   * Si on trouve un seul paramètre xml, on le jsonify
   * @private
   * @param error
   * @param ressources ressource ou tableau de ressources (ou rien, sera passé à next tel quel)
   * @param next
   * @throws {Error} Si ressources est défini mais n'est pas une ressource ou un tableau de ressources
   */
  function cacheAndNext(error, ressources, next) {
    /**
     * Helper qui process une ressource
     * @param ressource
     */
    function processOne(ressource) {
      if (!ressource || !ressource.oid) throw new Error("Paramètre invalide (ressource attendue)")
      // faut transformer les dates en objets date
      if (ressource.dateCreation) ressource.dateCreation = new Date(ressource.dateCreation);
      if (ressource.dateMiseAJour) ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
      // on regarde si on a un xml et rien d'autre
      if (ressource.typeTechnique === 'ec2' && ressource.parametres && ressource.parametres.xml) {
        convertXmlEc2(ressource)
      }
      $cacheRessource.set(ressource)
    }

    if (error) next(error)
    else {
      if (_.isArray(ressources)) ressources.forEach(processOne)
      else if (ressources) processOne(ressources)
      next(null, ressources)
    }
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
      $ressourceRepository.write(ressource)
    }
    log("convertXmlEc2", params)
  }

  /**
   * Les méthodes du service exportées
   */

  /**
   * Enregistre la ressource en archive, màj archiveOid et incrémente la version sur la ressource
   * puis la passe à next
   * @param {Ressource} ressource
   * @param next
   */
  $ressourceRepository.archive = function (ressource, next) {
    if (!ressource.oid) {
      next(new Error("Impossible d'archiver une ressource qui n'existe pas encore"))
    } else {
      // debug
      if (!ressource.store) {
        log.error(new Error("La ressource " +ressource.oid +" n'a pas de méthode store"))
        next(null, ressource)
        return
      }
      // on archive
      Archive.create(ressource).store(function (error, archive) {
        if (error) next(error)
        else {
          log.debug("On a archivé la ressource " + ressource.id + " (avec l'oid en archive " + archive.oid + ')')
          //updateRessource(archive)
          ressource.archiveOid = archive.oid
          ressource.version++
          ressource.store(next)
        }
      })
    }
  }

  /**
   * Ajoute ou modifie une ressource
   * @param {Ressource} ressource
   * @param {Function} next Callback qui sera passé au store() et recevra les arguments (error, ressource)
   * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
   * @return {string} L'id de la ressource insérée
   */
  $ressourceRepository.write = function(ressource, next) {
    if (ressource.constructor.name !== 'Ressource') {
      ressource = Ressource.create(ressource)
      log.debug('cast en Ressource : ' +ressource.constructor.name)
    }
    /* mesure de perfs * /
     var t
     if (ressource.id && lassi.tmp && lassi.tmp[ressource.id]) t = lassi.tmp[ressource.id]
     else t = {m:'',s:0}
     /* fin mesures (avec la ligne t.m += ... un peu plus bas) */
    //log.debug("avant validation dans write", ressource)
    flow()
      // validation
        .seq(function() { $ressourceControl.valide(ressource, this) })
      // updateVersion
        .seq(function (ressource) { updateVersion(ressource, this) })
      // store
        .seq(function (ressource) { /* t.m += '\tvsv ' +log.getElapsed(t.s);*/ ressource.store(this) })
      // ajout de l'id si c'était un insert, et
        .seq(function (ressource) {
          // t.m += '\tst ' +log.getElapsed(t.s)
          if (ressource.id) { this(null, ressource) }// rien à faire
          else {
            // pas d'id, pas le choix faut une 2e requete d'update avec l'id qu'on génère ici :-(
            if (ressource.oid != parseInt(ressource.oid, 10)) {
              throw new Error("L'oid n'est plus entier, faut venir changer le code de $ressourceRepository.write")
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
            $cacheRessource.set(ressource)
            log.debug('write ' + ressource.id + ' ok')
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
  $ressourceRepository.del = function(id, next) {
    log.debug("La ressource " +id + " va être effacée")
    var query
    if (_.isArray(id)) query = Ressource.match('id').in(id)
    else query = Ressource.match('id').equals(id)
    query.delete(function(error, nbObjects, nbIndexes) {
      if (error) next(error, nbObjects, nbIndexes)
      else {
        // faut effacer aussi en cache
        if (_.isArray(id)) {
          id.forEach(function (idToDel) {
            $cacheRessource.delete(idToDel)
          })
        } else {
          $cacheRessource.delete(id)
        }
        next(error, nbObjects, nbIndexes)
      }
      log.debug("La ressource " +id + " a été effacée (" +nbObjects +" versions et " +nbIndexes +" index)")
    })
  }

  /**
   * Efface l'entity par son oid (on peut passer un tableau)
   * @param {string} origine L'origine
   * @param {Integer} idOrigine L'id à supprimer
   * @param {Function} next La callback qui sera appelée en lui passant (error, nbObjects, nbIndexes)
   * @returns {undefined}
   */
  $ressourceRepository.delByOrigine = function(origine, idOrigine, next) {
    log.debug("La ressource d'origine " +origine +" et d'id " +idOrigine + " va être effacée")
    Ressource
        .match('origine').equals(origine)
        .match('idOrigine').equals(idOrigine)
        .delete(function(error, nbObjects, nbIndexes) {
          if (nbObjects) {
            // faut regarder si on l'a en cache pour la virer (on a pas l'id)
            $cacheRessource.getByOrigine(origine, idOrigine, function(error, ressource) {
              if (ressource) {
                $cacheRessource.delete(ressource.id)
              }
            })
          }
          log.debug("La ressource d'origine " +origine +" et d'id " +idOrigine + " a été effacée (" +
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
  $ressourceRepository.load = function(id, next) {
    log.debug('load ressource_' +id)
    log('load ressource_' +id)
    $cacheRessource.get(id, function (error, ressourceCached) {
      log("retour de cache ressource_" +id, [error, ressourceCached])
      if (ressourceCached) next(null, ressourceCached)
      else Ressource.match('id').equals(id).grabOne(function (error, ressource) {
        cacheAndNext(error, ressource, next)
      })
    })
  }

  /**
   * Récupère une ressource publique et la passe à next (seulement une erreur si elle n'existe pas)
   * @param {Number|String} id  L'identifiant de la ressource
   * @param {Function}      next La callback qui sera appelée avec (error, ressource).
   * @returns {undefined}
   */
  $ressourceRepository.loadPublic = function(id, next) {
    $cacheRessource.get(id, function (error, ressourceCached) {
      if (ressourceCached) next(null, ressourceCached)
      else {
        Ressource
            .match('id').equals(id)
            .match('restriction').equals(0)
            .grabOne(function (error, ressource) {
              cacheAndNext(error, ressource, next)
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
  $ressourceRepository.loadByOrigin = function(origine, idOrigine, next) {
    if (!idOrigine) {
      log.error('loadByOrigin sans idOrigine')
      return next(null, undefined)
    }

    $cacheRessource.getByOrigine(origine, idOrigine, function(error, ressourceCached) {
      if (ressourceCached) next(null, ressourceCached)
      else {
        Ressource
            .match('origine').equals(origine)
            .match('idOrigine').equals(idOrigine)
            .grabOne(function (error, ressource) {
              cacheAndNext(error, ressource, next)
            })
      }

    })
  }

  /**
   * Récupère un liste de ressource d'après critères
   * @param {string}   [visibilite=public] peut valoir public|prof|perso|tout
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
  $ressourceRepository.getListe = function(visibilite, ctx, options, next) {
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
      } else {
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
      log.debug('getListe visibilite :' +visibilite, options)

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
      var query = Ressource
      optionsSafe.filters.forEach(function (filter) {
        log.debug("filter", filter)
        if (filter.values && filter.values.length) {
          if (filter.values.length > 1) query = query.match(filter.index).in(filter.values)
          else query = query.match(filter.index).equals(filter.values[0])
        } else query = query.match(filter.index)
      })

      // restriction d'après les droits
      if (publicOnly) {
        query = query.match('restriction').equals(0)

      } else if (visibilite == 'prof') {
        if (!$accessControl.hasPermission('corrections', ctx)) {
          return next(new Error("Vous n'avez pas les droits suffisants pour consulter ces ressources"))
        }
        query = query.match('restriction').equals(1)

      } else if (visibilite == 'perso') {
        if (!ctx.session.user || !ctx.session.user.id)
          return next(new Error("Autentification nécéssaire pour consulter vos propres ressources"))
        query = query.match('auteurs').equals(ctx.session.user.id)

      } else if (visibilite == 'tout') {
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
        // on vire les param sauf si on les réclame
        if (!error && ressources && !options.full) ressources.forEach(function(ressource) {
          if (ressource.parametres) delete ressource.parametres
        })
        cacheAndNext(error, ressources, next)
      })

    } catch (error) {
      log.debug(error)
      if (error.userMessage) next(new Error(error.userMessage))
      else next(error)
    }
  }

  return $ressourceRepository
}
