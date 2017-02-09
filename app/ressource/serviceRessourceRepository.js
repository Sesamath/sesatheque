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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

var _ = require('lodash')
var flow = require('an-flow')
var elementtree = require('elementtree')
var request = require('request')
var uuid = require('an-uuid')

var config = require('./config')
var appConfig = require('../config')

var j3pGraphe2json = require('../../tasks/modules/j3pGraphe2json')

/**
 * Service d'accès aux ressources, utilisé par les différents contrôleurs
 * @service $ressourceRepository
 * @requires EntityRessource
 * @requires EntityArchive
 * @requires $ressourceControl
 * @requires $cacheRessource
 * @requires $cache
 */
var $ressourceRepository = {}

module.exports = function (EntityRessource, EntityArchive, $ressourceControl, $cacheRessource, $cache, $routes) {
  var limitMax = config.limites.maxSql || 100 // on appliquera toujours un limit inférieur à cette valeur
  var listeNbDefault = config.limites.listeNbDefault || 10

  /**
   * Fait un peu de nettoyage avant d'enregistrer en base de données
   * @private
   * @param ressource
   * @param next
   */
  function beforeStore (ressource, next) {
    if (ressource) {
      // pour les messages d'erreur
      const id = ressource.oid || (ressource.origine && ressource.origine + ressource.idOrigine) || ressource.titre
      const myBaseId = appConfig.application.baseId
      // bizarre, parfois errors est un object, on cherche à savoir d'où ça vient
      if (ressource._errors && !Array.isArray(ressource._errors)) {
        return next(new Error(`ressource._errors n'est pas un array ${typeof ressource._errors}`), ressource._errors)
      }
      // on vérifie que l'on a bien la paire origine et idOrigine
      if (ressource.origine) {
        if (ressource.origine === myBaseId) {
          if (!ressource.idOrigine && ressource.oid) ressource.idOrigine = ressource.oid
          // sinon faudra le mettre en afterStore
        } else if (!ressource.idOrigine) {
          return next(new Error('propriété idOrigine obligatoire'))
        }
      } else {
        // on pourrait mettre une origine locale ici, mais on préfère laisser le contrôleur le faire
        return next(new Error('propriété origine obligatoire'))
      }
      // on vire un éventuel token
      if (ressource.token) delete ressource.token
      // on génère la clé si elle manque
      if (ressource.restriction && !ressource.cle) {
        ressource.cle = uuid()
      }
      // date de mise à jour
      ressource.dateMiseAJour = new Date()
      // cohérence de la restriction
      if (ressource.restriction === config.constantes.restriction.groupe && _.isEmpty(ressource.groupes)) {
        log.error(`Ressource ${id} restreinte à ses groupes sans préciser lesquels, on la passe privée`)
        ressource.restriction = config.constantes.restriction.prive
      }
      // check des relations
      if (ressource.relations && ressource.relations.length) {
        checkRelations(ressource.relations, id, function (error, relations) {
          if (error) return next(error)
          ressource.relations = relations
          next(null, ressource)
        })
      } else {
        next(null, ressource)
      }
      // vérif alias
      if (ressource.ref && !ressource.baseId) {
        if (ressource.ref === ressource.oid) delete ressource.ref
        else next(new Error('Alias sans baseId (pour désigner la sésathèque d’origine)'))
      }
    } else {
      next(new Error("beforeStore n'a pas reçu de ressource"))
    }
  }

  /**
   * Nettoie les relations
   * @private
   * @param {Array} relations
   * @param {string|number} id identifiant de la ressource pour l'ajouter aux messages d'erreur
   * @param next
   */
  function checkRelations (relations, id, next) {
    // on gère l'unicité avec un objet Map, en prenant une string qui concatene
    // les deux éléments de la relation comme clé
    const map = new Map()
    const cleanRelations = relations.filter((relation) => Array.isArray(relation) && relation.length === 2)
    if (cleanRelations.length < relations.length) log.errorData(`Il y avait une relation invalide dans ${id}`, relations)
    if (cleanRelations.length) {
      flow(cleanRelations).parEach(function (relation) {
        const nextRelation = this
        // on regarde si on a des cibles sous la forme origine/idOrigine
        if (typeof relation[ 1 ] === 'string' && relation[ 1 ].indexOf('/') !== -1) {
          const [origine, idOrigine] = relation[ 1 ].split('/')
          $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
            if (error) {
              log.error(error)
              nextRelation(null, relation)
            } else if (ressource) {
              nextRelation(null, [ relation[ 0 ], ressource.oid ])
            } else {
              log.errorData(`La ressource ${id} a une relation vers ${relation[ 1 ]} qui n’existe pas`)
              // on la laisse, pour les cas où 2 ressources sont mutuellement liées et insérées en suivant
              nextRelation(null, relation)
            }
          })
        } else {
          nextRelation(null, relation)
        }
      }).seq(function (relations) {
        relations.forEach((relation) => map.set('' + relation[ 0 ] + relation[ 1 ], relation))
        if (map.size < relations.length) {
          log.errorData('Il y avait des relations en double (ou invalides) dans ' + id)
          next(null, Array.from(map.values()))
        } else {
          next(null, relations)
        }
      }).catch(next)
    } else {
      next(null, [])
    }
  }

  /**
   * Met à jour titre/résumé/description de cette ressource dans tous les arbres la contiennent,
   * en tâche de fond
   * @private
   * @param {Ressource} ressource
   */
  function majArbres (ressource) {
    var refOrig = ressource.origine + '/' + ressource.idOrigine
    // cherche un enfant et le modifie si besoin, retourne true si on a fait une modif
    function findChild (arbre, ref) {
      var modif
      // avec _.each on pourrait sortir dès qu'on a trouvé, mais un arbre pourrait avoir
      // deux fois le même enfant, on les parse tous
      arbre.enfants.forEach(function (enfant) {
        var mod
        if (enfant.ref === ref) {
          mod = majChild(enfant)
        } else if (enfant.enfants) {
          mod = findChild(enfant, ref)
        }
        if (!modif && mod) modif = true
      })
      return modif
    }

    // regarde s'il faut mettre à jour l'enfant et retourne true si c'est le cas
    function majChild (child) {
      var modif = false
      // on passe la ref sur l'oid si c'est pas le cas
      if (child.ref === refOrig) {
        child.ref = ressource.oid
        modif = true
      }
      if (child.ref === ressource.oid) {
        if (child.titre !== ressource.titre || child.resume !== ressource.resume || child.description !== ressource.description) {
          modif = true
          child.titre = ressource.titre
          child.resume = ressource.resume
          child.description = ressource.description
        }
      } else {
        log.error(new Error('majChild appelée avec des paramètres incohérents sur la ressource ' + ressource.oid), child)
      }
      return modif
    }

    // on cherche les enfants d'après l'oid de la ressource
    flow().seq(function () {
      EntityRessource.match('enfants').equals(ressource.oid).grab(this)
    }).seqEach(function (arbre) {
      // ici arbre vient direct de la base, on zappe notre beforeStore
      // pour éviter la mise en cache et la modif de dateMiseAJour
      if (findChild(arbre, ressource.oid)) arbre.store((error) => log.error(error))
    }).catch(log.error)
  }

  /**
   * Purge les urls publiques de la ressource sur varnish (si varnish est dans la conf, ne fait rien sinon)
   * (rend la main avant les réponses mais après avoir lancé les requêtes)
   * @param {Ressource} ressource
   * @returns {{}}
   */
  function purgeVarnish (ressource) {
    var base = appConfig.application.baseUrl
    // on ne purge que les ressources publiques (les autres ne sont pas en cache)
    if (appConfig.varnish && ressource.publie && ressource.restriction === config.constantes.restriction.aucune) {
      [
        $routes.getAbs('api', ressource),
        $routes.getAbs('display', ressource),
        $routes.getAbs('describe', ressource),
        $routes.getAbs('preview', ressource)
      ].forEach(function (url) {
        request({
          method: 'PURGE',
          url: base + url.substr(1) // pour pas avoir de double slash
        }, function (error, response) {
          if (error || !response || response.statusCode !== 200) {
            if (error) {
              log.error('purge KO pour ' + url, error)
            } else {
              log.error('purge KO (!200) pour ' + url, response)
              log.error('avec le body', arguments[2])
            }
          }
          log.debug('purge ' + url + ' ' + (response && response.statusCode))
        })
      })
    }
  }

  /**
   * Renvoie un Alias à une ressource (le controleur devra ajouter le userOid)
   * @memberOf $ressourceConverter
   * @param {Ressource} ressource
   * @return {object}
   */
  function toAlias (ressource) {
    if (!ressource.oid) throw new Error('Impossible de convertir en alias une ressource sans oid')
    // c'est déjà un alias ?
    if (ressource.ref) return ressource
    // on vérifie quand même ça
    if (ressource.baseId && ressource.baseId !== config.application.baseId) log.errorData('ressource sans ref avec baseId externe', ressource)
    return {
      ref: ressource.oid,
      baseId: config.application.baseId,
      titre: ressource.titre,
      type: ressource.type,
      resume: ressource.resume,
      description: ressource.description
    }
  }

  /**
   * Incrémente le n° de version si la ressource a une propriété versionNeedIncrement
   * ou si une des propriétés listées dans config.versionTriggers a changée de valeur
   * Affecte la propriété oid si la ressource existait mais qu'on ne l'avait pas chargée depuis le cache ou la bdd
   * Ajoute l'idOrigine si inexistant avec origine local
   * @private
   * @param {EntityRessource} ressource
   * @param {Function} next
   */
  function updateVersion (ressource, next) {
    /**
     * Compare la ressource à la ressource qui existait pour savoir s'il faut incrémenter la version
     * @private
     * @param ressource
     * @param ressourceBdd
     * @param next
     */
    function compare (ressource, ressourceBdd, next) {
      var needIncrement = !!ressource.versionNeedIncrement
      // on regarde si nos champs qui déclenchent un changement de version on changé
      if (!needIncrement && ressourceBdd.oid) {
        config.versionTriggers.forEach(function (prop) {
          // pour la comparaison, deux objets avec la même définition littérale sont vus != en js
          // on utilise https://lodash.com/docs#isEqual
          if (!_.isEqual(ressource[prop], ressourceBdd[prop])) {
            // debug
            if (!isProd) {
              log.debug('La modif du champ ' + prop + ' entraîne un incrément de version de ' + ressourceBdd.oid +
                '\navant : ' + (ressourceBdd[prop] === undefined) ? 'undefined' : JSON.stringify(ressourceBdd[prop]) +
                '\naprès : ' + (ressourceBdd[prop] === undefined) ? 'undefined' : JSON.stringify(ressource[prop]))
            }
            needIncrement = true
            return false // pas la peine de continuer le forEach, cf https://lodash.com/docs#forEach
          }
        })
      }
      // on recopie l'oid (pour écrasement éventuel de l'ancienne ressource)
      ressource.oid = ressourceBdd.oid
      ressource.version = ressourceBdd.version

      if (needIncrement) {
        $ressourceRepository.archive(ressourceBdd, function (error, archive) {
          if (error) next(error)
          else {
            ressource.version++
            ressource.archiveOid = archive.oid
            next(null, ressource)
          }
        })
      } else {
        next(null, ressource)
      }
    } // compare

    if (ressource.oid) {
      // pas le cas au create ou sur un update via l'api
      // ira seulement en cache dans la plupart des cas, et de toute façon faut récupérer
      // le n° de version actuel et l'oid éventuel
      $ressourceRepository.load(ressource.oid, function (error, ressourceBdd) {
        if (error) next(error)
        else if (ressourceBdd) compare(ressource, ressourceBdd, next)
        else next(new Error("updateVersion a reçu une ressource qui n'existait pas (oid=" + ressource.oid + ')'))
      })
    } else if (ressource.idOrigine) {
      $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceBdd) {
        if (error) next(error)
        else if (ressourceBdd) compare(ressource, ressourceBdd, next)
        else next(null, ressource)
      })
    } else { // normal à la création
      next(null, ressource)
    }
  }

  /**
   * Créé les objets date à partir des Strings, met en cache et fait suivre
   * Si on trouve un seul paramètre xml, on le jsonify
   * @private
   * @param error
   * @param ressources ressource ou tableau de ressources (ou rien, sera passé à next tel quel)
   * @param next appelé avec (error, ressources)
   * @throws {Error} Si ressources est défini mais n'est pas une ressource ou un tableau de ressources
   */
  function cacheAndNext (error, ressources, next) {
    /**
     * Helper qui process une ressource et la met en cache (et rend la main sans attendre le résultat)
     * @private
     * @param ressource
     */
    function processOne (ressource) {
      if (!ressource || !ressource.oid) throw new Error('Paramètre invalide (ressource attendue)')
      // pour ec2 on regarde si on a un xml et rien d'autre pour le mettre directement en parametres
      // (car c'est pas du xml mais du json)
      if (ressource.type === 'ec2' && ressource.parametres && ressource.parametres.xml) {
        convertXmlEc2(ressource)
      } else if (ressource.type === 'j3p' && ressource.parametres && ressource.parametres.xml) {
        convertXmlJ3p(ressource)
      }
      if (ressource.type === 'arbre') delete ressource.parametres
      else delete ressource.enfants
      $cacheRessource.set(ressource)
    }

    try {
      if (error) {
        next(error)
      } else {
        if (_.isArray(ressources)) ressources.forEach(processOne)
        else if (ressources) processOne(ressources)
        next(null, ressources)
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Converti un xml qui trainerait en parametres en json pour les ec2
   * @param ressource
   */
  function convertXmlEc2 (ressource) {
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
          params[ child.tag ] = child.text
        }
      })
      ressource.parametres = params
      // on enregistre la ressource modifiée en async
      $ressourceRepository.save(ressource)
    }
    log.debug('convertXmlEc2', params)
  }

  /**
   * Modifie les parametres de ressource pour remplacer un éventuel xml par un graphe
   * @param {Ressource} ressource
   */
  function convertXmlJ3p (ressource) {
    if (ressource.parametres && ressource.parametres.xml) {
      var string = j3pGraphe2json(ressource.parametres.xml)
      try {
        var graphe = JSON.parse(string)
        ressource.parametres = {
          g: graphe
        }
      } catch (error) {
        log.error('plantage dans la conversion du xml de la ressource j3p')
        if (!ressource._errors) ressource._errors = []
        ressource._errors.push('la propriété xml des parametres ne contient pas de graphe valide')
      }
    }
  }

  /**
   * Les méthodes du service exportées
   */

  /**
   * Enregistre la ressource en archive et appelle next avec, mais ne modifie pas la ressource
   * @memberOf $ressourceRepository
   * @param {EntityRessource} ressource
   * @param next appelé avec (error, archive)
   */
  $ressourceRepository.archive = function archive (ressource, next) {
    try {
      if (!ressource.oid) throw new Error("Impossible d'archiver une ressource qui n'existe pas encore")
      EntityArchive.create(ressource).store(function (error, ressource) {
        if (ressource && !error) $cacheRessource.set(ressource)
        next(error, ressource)
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Efface une ressource (et ses index)
   * @memberOf $ressourceRepository
   * @param {EntityRessource} ressource
   * @param {errorCallback}   next
   * @returns {undefined}
   */
  $ressourceRepository.delete = function repoDelete (ressource, next) {
    if (ressource && ressource.oid) {
      log.debug('La ressource ' + ressource.oid + ' va être effacée')
      ressource.delete(function (error) {
        // on vire du cache de toute façon
        $cacheRessource.delete(ressource.oid)
        if (error) {
          next(error)
        } else {
          log.debug('La ressource ' + ressource.oid + ' (' + ressource.oid + ') a été effacée')
          next()
        }
      })
    } else {
      next(new Error('delete appelé sans ressource'))
    }
  }

  /**
   * Récupère un liste de ressource d'après critères
   * @memberOf $ressourceRepository
   * @param {string}   visibilite peut valoir public | correction | all | auteur/id | groupe/nom
   * @param {Object}   options    Un objet (ou son json) avec éventuellement les propriétés
   *                                filters : un tableau d'objets {index:'indexAFiltrer', values:valeur},
   *                                          où valeur peut être undefined ou un tableau de valeurs
   *                                          (si non précisé filtrera sur les ressources ayant cet index)
   *                                orderBy : L'index sur lequel trier
   *                                order   : asc ou desc
   *                                start   : L'indice de la 1re valeur à remonter
   *                                nb      : Le nombre de ressources à remonter
   * @param {Function} next       La callback qui sera appelée en lui passant la liste de ressources en argument et le nb total de résultat
   */
  $ressourceRepository.getListe = function getListe (visibilite, options, next) {
    try {
      log.debug('getListe avec visibilite : ' + visibilite, options, next)

      // avant de construire la query on fait un minimum de vérifications
      var start, nb
      var optionsSafe = {
        filters: []
      }
      // filtres
      if (options.filters) {
        if (!_.isArray(options.filters)) throw new Error('Filtres incorrects')
        options.filters.forEach(function (filter) {
          if (!filter.index || !_.isString(filter.index)) throw new Error('index invalide ou manquant')
          if (!_.isArray(filter.values)) throw new Error('values invalides (pas un tableau) pour filter ' + filter.index)
          // on ne prend que ce que l'on connait, et on ignore le filtre restriction (c'est visibilite qui l'impose éventuellement)
          if (config.labels[ filter.index ] && filter.index !== 'restriction') optionsSafe.filters.push(filter)
        })
      } else {
        // donc tous, mais faut un argument à match
        optionsSafe.filters.push({ index: 'idOrigine' })
      }
      // le reste
      if (options.orderBy && !_.isString(options.orderBy)) throw new Error('orderBy invalide')
      optionsSafe.orderBy = options.orderBy || 'oid'
      if (options.order === 'desc') optionsSafe.order = 'desc'
      start = parseInt(options.start, 10) || 0
      nb = parseInt(options.nb, 10) || listeNbDefault
      if (nb > limitMax) {
        log.error(new Error('nb de résultats demandés supérieur à la limite max ' + nb + '>' + limitMax))
        nb = limitMax
      }
      // le format est géré par le controleur

      // si on est toujours là on peut construire la requete
      var query = EntityRessource
      optionsSafe.filters.forEach(function (filter) {
        // log.debug('getListe filter ' + filter.index)
        if (filter.values && filter.values.length) {
          if (filter.values.length > 1) {
            query = query.match(filter.index).in(filter.values)
          } else {
            // une seule valeur, on regarde si on veut du like
            var value = filter.values[ 0 ]
            var action = (typeof value === 'string' && (value.indexOf('%') > -1 || value.indexOf('_') > -1)) ? 'like' : 'equals'
            query = query.match(filter.index)[ action ](filter.values[ 0 ])
          }
        } else {
          query = query.match(filter.index)
        }
      })

      // restriction d'après la visibilité
      if (visibilite === 'public') {
        query = query.match('restriction').equals(config.constantes.restriction.aucune)
      } else if (visibilite === 'correction') {
        query = query.match('restriction').lowerThanOrEquals(config.constantes.restriction.correction)
      } else if (visibilite.indexOf('/') > 0) {
        var fragments = visibilite.split('/', 2)
        if (fragments[ 0 ] === 'auteur') {
          query = query.match('auteurs').equals(fragments[ 1 ])
        } else if (fragments[ 0 ] === 'groupe') {
          query = query.match('groupes').equals(fragments[ 1 ])
        } else {
          throw new Error('Clé de recherche ' + visibilite + ' incorrecte')
        }
      } else if (visibilite === 'all') {
        log.debug('recherche sur tout')
      } else {
        // on a pas mis de restriction, c'est pas normal, on met public
        query = query.match('restriction').equals(config.constantes.restriction.aucune)
        log.error(new Error('Appel de getListe avec visibilite ' + visibilite))
      }

      // orderBy
      if (optionsSafe.orderBy) {
        if (optionsSafe.order === 'desc') query = query.sort(optionsSafe.orderBy, 'desc')
        else query = query.sort(optionsSafe.orderBy)
      }
      let nbTotal = 0
      flow().seq(function () {
        // le nb total de résultats
        query.count(this)
      }).seq(function (nbTot) {
        nbTotal = nbTot
        // log.debug('trouvé ' + nbTot + ' résultats')
        if (nbTot) query.grab(nb, start, this)
        else this(null, [])
      }).seq(function (ressources) {
        if (ressources.length) cacheAndNext(null, ressources, this)
        else this(null, [])
      }).seq(function (ressources) {
        next(null, ressources, nbTotal)
      }).catch(next)
    } catch (error) {
      log.error(error)
      next(error)
    }
  } // getListe

  /**
   * Récupère une ressource et la passe à next (seulement une erreur si elle n'existe pas)
   * @memberOf $ressourceRepository
   * @param {number|String}     oid  L'identifiant de la ressource (on accepte oid ou string origine/idOrigine)
   * @param {ressourceCallback} next appelée avec une EntityRessource
   * @returns {undefined}
   */
  $ressourceRepository.load = function load (oid, next) {
    if (_.isString(oid) && oid.indexOf('/') > 0) {
      var p = oid.split('/')
      if (p.length === 2) {
        if (p[ 0 ] === 'cle') $ressourceRepository.loadByCle(p[ 1 ], next)
        else $ressourceRepository.loadByOrigin(p[ 0 ], p[ 1 ], next)
      } else {
        next(new Error('identifiant invalide : ' + oid))
      }
    } else {
      $cacheRessource.get(oid, function (error, ressourceCached) {
        if (error) log.error(error)
        if (ressourceCached) {
          next(null, EntityRessource.create(ressourceCached))
        } else {
          EntityRessource.match('oid').equals(oid).grabOne(function (error, ressource) {
            cacheAndNext(error, ressource, next)
          })
        }
      })
    }
  }

  /**
   * Récupère une ressource d'après sa cle et la passe à next
   * @memberOf $ressourceRepository
   * @param {string}            cle
   * @param {ressourceCallback} next      appelée avec une EntityRessource
   */
  $ressourceRepository.loadByCle = function loadByCle (cle, next) {
    if (cle) {
      $cacheRessource.getByOrigine('cle', cle, function (error, ressourceCached) {
        if (error) log.error(error)
        if (ressourceCached) {
          next(null, EntityRessource.create(ressourceCached))
        } else {
          EntityRessource
            .match('cle').equals(cle)
            .grabOne(function (error, ressource) {
              cacheAndNext(error, ressource, next)
            })
        }
      })
    } else {
      return next(new Error('Clé manquante, impossible de charger la ressource'))
    }
  } // loadByOrigin

  /**
   * Récupère une ressource d'après son idOrigine et la passe à next
   * @memberOf $ressourceRepository
   * @param {string}            origine
   * @param {string}            idOrigine
   * @param {ressourceCallback} next      appelée avec une EntityRessource
   */
  $ressourceRepository.loadByOrigin = function loadByOrigin (origine, idOrigine, next) {
    if (origine && idOrigine) {
      if (origine === 'cle') {
        $ressourceRepository.loadByCle(idOrigine, next)
      } else {
        $cacheRessource.getByOrigine(origine, idOrigine, function (error, ressourceCached) {
          if (error) log.error(error)
          if (ressourceCached) {
            next(null, EntityRessource.create(ressourceCached))
          } else {
            EntityRessource
              .match('origine').equals(origine)
              .match('idOrigine').equals(idOrigine)
              .grabOne(function (error, ressource) {
                cacheAndNext(error, ressource, next)
              })
          }
        })
      }
    } else {
      return next(new Error('Origine ou idOrigine manquant, impossible de charger la ressource'))
    }
  } // loadByOrigin

  /**
   * Récupère une ressource publique et la passe à next (seulement une erreur si elle n'existe pas)
   * @memberOf $ressourceRepository
   * @param {number|String}      oid  L'identifiant de la ressource
   * @param {ressourceCallback}  next avec une EntityRessource
   * @returns {undefined}
   */
  $ressourceRepository.loadPublic = function loadPublic (oid, next) {
    $cacheRessource.get(oid, function (error, ressourceCached) {
      if (error) log.error(error)
      if (ressourceCached) {
        if (ressourceCached.restriction === config.constantes.restriction.aucune) next(null, EntityRessource.create(ressourceCached))
        else next(null, null)
      } else {
        EntityRessource
          .match('oid').equals(oid)
          .match('restriction').equals(config.constantes.restriction.aucune)
          .grabOne(function (error, ressource) {
            cacheAndNext(error, ressource, next)
          })
      }
    })
  }

  /**
   * Récupère une ressource d'après son idOrigine et la passe à next
   * @memberOf $ressourceRepository
   * @param {string}            origine
   * @param {string}            idOrigine
   * @param {ressourceCallback} next      Appelée avec une EntityRessource
   */
  $ressourceRepository.loadPublicByOrigin = function loadPublicByOrigin (origine, idOrigine, next) {
    if (!origine || !idOrigine) {
      log.error('origine ou idOrigine manquant dans loadByOrigin')
      return next()
    }

    $cacheRessource.getByOrigine(origine, idOrigine, function (error, ressourceCached) {
      if (error) log.error(error)
      if (ressourceCached) {
        if (ressourceCached.restriction === config.constantes.restriction.aucune) next(null, EntityRessource.create(ressourceCached))
        else next(null, null)
      } else {
        EntityRessource
          .match('origine').equals(origine)
          .match('idOrigine').equals(idOrigine)
          .match('restriction').equals(config.constantes.restriction.aucune)
          .grabOne(function (error, ressource) {
            cacheAndNext(error, ressource, next)
          })
      }
    })
  }

  /**
   * Met en cache la ressource et le user pour modification ultérieure
   * @param {number} oid
   * @param {function} next
   */
  $ressourceRepository.saveDeferred = function (oid, next) {
    var token = uuid()
    // on met 10h en cache, vu le peu de data c'est pas un souci
    $cache.set('defer_' + token, {oid: oid, action: 'saveRessource'}, 36000, function (error) {
      if (error) next(error)
      else next(null, token)
    })
  }

  /**
   * Récupère oid et user d'après le token
   * @param token
   * @param next
   */
  $ressourceRepository.getDeferred = function (token, next) {
    /* $cache.get('defer_' + token, function (error, data) {
      if (!error && data) $cache.delete('defer_' + token, function () {})
      next(error, data)
    }) */
    $cache.get('defer_' + token, next)
  }

  /**
   * Ajoute ou modifie une ressource (contrôle la validité avant et incrémente la version au besoin)
   * @memberOf $ressourceRepository
   * @param {EntityRessource}   ressource
   * @param {ressourceCallback} [next]    appelée avec une EntityRessource
   */
  $ressourceRepository.save = function save (ressource, next) {
    if (ressource.constructor.name !== 'Entity') {
      ressource = EntityRessource.create(ressource)
    }
    flow().seq(function () {
      updateVersion(ressource, this)
    }).seq(function (ressource) {
      if (ressource.type === 'ec2' && ressource.parametres && ressource.parametres.xml) {
        convertXmlEc2(ressource)
      } else if (ressource.type === 'j3p' && ressource.parametres && ressource.parametres.xml) {
        convertXmlJ3p(ressource)
        log.debug('ressource j3p après conversion avant write', ressource)
      }
      beforeStore(ressource, this)
    }).seq(function (ressource) {
      log.debug('on va enregistrer ' + ressource.origine + '/' + ressource.idOrigine, ressource, 'avirer', {max: 10000})
      ressource.store(this)
    }).seq(function (ressource) {
      // mise en cache (pas possible en afterStore car le cache dépend de l'entité), purge varnish et passage au suivant
      if (ressource.oid) {
        $cacheRessource.set(ressource)
        purgeVarnish(ressource)
        majArbres(ressource)
        log.debug('write ' + ressource.oid + ' ok')
        if (next) next(null, ressource)
      } else {
        this(new Error("Après un write la ressource n'a toujours pas d'oid"))
      }
    }).catch(function (error) {
      log.error(error)
      if (next) next(error)
    })
  }

  /**
   * Enregistre un alias de la ressource passée en argument
   * @memberOf $ressourceRepository
   * @param {EntityRessource}   ressource
   * @param {ressourceCallback} [next]    appelée avec une EntityRessource (l'alias)
   */
  $ressourceRepository.saveNewAlias = function saveNewAlias (ressource, next) {
    if (!ressource.oid) return next(new Error('Impossible de sauver un alias d’une ressource qui n’est pas encore sauvegardée'))
    var alias = EntityRessource.create(toAlias(ressource))

    flow().seq(function () {
      alias.store(this)
    }).seq(function (ressource) {
      // mise en cache (pas possible en afterStore car le cache dépend de l'entité), purge varnish et passage au suivant
      if (ressource.oid) {
        $cacheRessource.set(ressource)
        log.debug('write ' + ressource.oid + ' ok')
        if (next) next(null, ressource)
      } else {
        this(new Error("Après un write l’alias n'a toujours pas d'oid"))
      }
    }).catch(function (error) {
      log.error(error)
      if (next) next(error)
    })
  }

  return $ressourceRepository
}
