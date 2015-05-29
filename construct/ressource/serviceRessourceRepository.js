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
module.exports = function (Ressource, Archive, $ressourceControl, $cacheRessource, $cache) {
  /**
   * Service d'accès aux ressources, utilisé par les différents contrôleurs
   * @namespace $ressourceRepository
   * @requires Ressource
   * @requires Archive
   * @requires $ressourceControl
   * @requires $cacheRessource
   * @requires $cache
   */
  var $ressourceRepository = {}

  var _ = require('lodash')
  var flow          = require('seq')
  var elementtree = require('elementtree')
  //var util = require('util')

  var config = require('./config')
  var limitMax = config.limites.maxSql || 100 // on appliquera toujours un limit inférieur à cette valeur

  /**
   * Le dernier (plus grand) idOrigine utilisé pour l'origine "local"
   * @type {number}
   */
  var lastLocalId = 0

  /**
   * Fonctions privées, helper des méthodes du service
   */

  /**
   * Initialise idOrigine s'il est absent sur une ressource local
   * @param ressource
   * @param next
   */
  function initIdOrigine(ressource, next) {
    if (ressource.origine === 'local' && !ressource.idOrigine) {
      $ressourceRepository.getLastLocalId(function (error, id) {
        if (error) next(error)
        else {
          ressource.idOrigine = id
          next(null, ressource)
        }
      })
    } else next(null, ressource)
  }

  /**
   * Incrémente le n° de version si la ressource a une propriété versionNeedIncrement
   * ou si une des propriétés listées dans config.versionTriggers a changée de valeur
   * Affecte la propriété oid si la ressource existait mais qu'on ne l'avait pas chargée depuis le cache ou la bdd
   * Ajoute l'idOrigine si inexistant avec origine local
   * @param {Ressource} ressource
   * @param {Function} next
   * @private
   */
  function updateVersion(ressource, next) {
    /**
     * Compare la ressource à la ressource qui existait pour savoir s'il faut incrémenter la version
     * @param ressource
     * @param ressourceBdd
     * @param next
     */
    function compare(ressource, ressourceBdd, next) {
      var needIncrement = !!ressource.versionNeedIncrement
      // on regarde si nos champs qui déclenchent un changement de version on changé
      if (!needIncrement && ressourceBdd.oid) {
        _.forEach(config.versionTriggers, function (prop) {
          // pour la comparaison, deux objets avec la même définition littérale sont vus != en js
          // on utilise https://lodash.com/docs#isEqual
          if (!_.isEqual(ressource[prop], ressourceBdd[prop])) {
            // debug
            if (!GLOBAL.isProd) {
              try {
                log.debug('La modif du champ ' + prop + ' entraîne un incrément de version de ' + ressourceBdd.oid +
                    '\navant : ' +(ressourceBdd[prop] === undefined) ? undefined : JSON.parse(ressourceBdd[prop]) +
                    '\naprès : ' +(ressourceBdd[prop] === undefined) ? undefined : JSON.parse(ressource[prop]))
              } catch (e) {
                log.debug(
                    'le parsing de ressource[' +prop +'] a planté pour ' +ressource.oid +' ' +ressource.origine +'/' +ressource.idOrigine,
                    [ressourceBdd[prop], ressource[prop]]
                )
              }
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
      }
      else next(null, ressource)
    } // compare

    if (ressource.oid) {
      // pas le cas au create ou sur un update via l'api
      // ira seulement en cache dans la plupart des cas, et de toute façon faut récupérer
      // le n° de version actuel et l'oid éventuel
      $ressourceRepository.load(ressource.oid, function (error, ressourceBdd) {
        if (error) next(error)
        else if (ressourceBdd) compare(ressource, ressourceBdd, next)
        else next(new Error("updateVersion a reçu une ressource qui n'existait pas (oid=" +ressource.oid +')'))
      })
    } else if (ressource.idOrigine) {
      $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceBdd) {
        if (error) next(error)
        else if (ressourceBdd) compare(ressource, ressourceBdd, next)
        else next(null, ressource)
      })
    } else {
      next(new Error("ressource sans oid ni idOrigine"))
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
     * Helper qui process une ressource et la met en cache
     * @param ressource
     */
    function processOne(ressource) {
      if (!ressource || !ressource.oid) throw new Error("Paramètre invalide (ressource attendue)")
      // pour ec2 on regarde si on a un xml et rien d'autre pour le mettre directement en parametres
      // (car c'est pas du xml mais du json)
      if (ressource.typeTechnique === 'ec2' && ressource.parametres && ressource.parametres.xml) {
        convertXmlEc2(ressource)
      }
      $cacheRessource.set(ressource)
    }

    try {
      if (error) next(error)
      else {
        if (_.isArray(ressources)) ressources.forEach(processOne)
        else if (ressources) processOne(ressources)
        next(null, ressources)
      }
    } catch(error) {
      next(error)
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
   * Enregistre la ressource en archive et appelle next avec, mais ne modifie pas la ressource
   * @param {Ressource} ressource
   * @param next
   */
  $ressourceRepository.archive = function (ressource, next) {
    try {
      if (!ressource.oid) throw new Error("Impossible d'archiver une ressource qui n'existe pas encore")
      if (!ressource.store) throw new Error("La ressource " + ressource.oid + " n'a pas de méthode store")

      Archive.create(ressource).store(next)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Ajoute ou modifie une ressource (contrôle la validité avant)
   * @param {Ressource} ressource
   * @param {Function} next Callback qui sera passé au store() et recevra les arguments (error, ressource)
   */
  $ressourceRepository.write = function(ressource, next) {
    if (ressource.constructor.name !== 'Entity') {
      log.debug("cast en Ressource dans write")
      ressource = Ressource.create(ressource)
    }
    flow().seq(function() {
        $ressourceControl.valide(ressource, this)
      }).seq(function (ressource) {
        updateVersion(ressource, this)
      }).seq(function (ressource) {
        initIdOrigine(ressource, this)
      }).seq(function (ressource) {
        log.debug('on va enregistrer ' +ressource.origine +'/' +ressource.idOrigine)
        ressource.store(this)
      }).seq(function (ressource) {
        // mise en cache et passage au suivant
        if (!ressource.oid) this(new Error("Après un write la ressource n'a toujours pas d'oid"))
        else {
          $cacheRessource.set(ressource)
          log.debug('write ' + ressource.oid + ' ok')
          if (next) next(null, ressource)
        }
      }).catch(function(error) {
        log.error(error)
        if (next) next(error);
      })
  }

  /**
   * Efface une ressource (et ses index)
   * @param {Ressource} ressource
   * @param {Function}  next      La callback qui sera appelée en lui passant error ou undefined
   * @returns {undefined}
   */
  $ressourceRepository.delete = function(ressource, next) {
    if (ressource && ressource.oid) {
      log.debug("La ressource " + ressource.oid + " va être effacée")
      ressource.delete(function (error) {
        // on vire du cache de toute façon
        $cacheRessource.delete(ressource.oid)
        if (error) {
          next(error)
        } else {
          log.debug("La ressource " + ressource.oid + ' (' + ressource.oid + ") a été effacée")
          next()
        }
      })
    } else {
      next(new Error("delete appelé sans ressource"))
    }
  }

  /**
   * Récupère une ressource et la passe à next (seulement une erreur si elle n'existe pas)
   * @param {number|String} oid  L'identifiant de la ressource (on accepte oid ou string origine/idOrigine)
   * @param {Function}      next La callback qui sera appelée avec (error, ressource)
   *                             Attention, ressource peut avoir perdu son prototype s'il vient du cache
   * @returns {undefined}
   */
  $ressourceRepository.load = function(oid, next) {
    log.debug('load ressource_' +oid, null, 'repository')
    if (_.isString(oid) && oid.indexOf('/') > 0) {
      var p = oid.split('/')
      if (p.length === 2) $ressourceRepository.loadByOrigin(p[0], p[1], next)
      else next(new Error("identifiant invalide : " +oid))
    } else {
      $cacheRessource.get(oid, function (error, ressourceCached) {
        if (ressourceCached) next(null, ressourceCached)
        else Ressource.match('oid').equals(oid).grabOne(function (error, ressource) {
          cacheAndNext(error, ressource, next)
        })
      })
    }
  }

  /**
   * Récupère une ressource publique et la passe à next (seulement une erreur si elle n'existe pas)
   * @param {number|String} oid  L'identifiant de la ressource
   * @param {Function}      next La callback qui sera appelée avec (error, ressource).
   * @returns {undefined}
   */
  $ressourceRepository.loadPublic = function(oid, next) {
    $cacheRessource.get(oid, function (error, ressourceCached) {
      if (ressourceCached) next(null, ressourceCached)
      else {
        Ressource
            .match('oid').equals(oid)
            .match('restriction').equals(0)
            .grabOne(function (error, ressource) {
              cacheAndNext(error, ressource, next)
            })
      }
    })
  }

  /**
   * Récupère une ressource d'après son idOrigine et la passe à next
   * @param {string}   origine
   * @param {string}   idOrigine
   * @param {Function} next     La callback qui sera appelée en lui passant le nb de ligne effacées en argument
   */
  $ressourceRepository.loadByOrigin = function(origine, idOrigine, next) {
    if (!origine || !idOrigine) {
      log.error('origine ou idOrigine manquant dans loadByOrigin')
      return next()
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
   * @param {string}   visibilite peut valoir public | correction | all | auteur/id | groupe/nom
   * @param {Object}   options    Un objet (ou son json) avec éventuellement les propriétés
   *                                filters : un tableau d'objets {index:'indexAFiltrer', values:valeur},
   *                                          où valeur peut être undefined ou un tableau de valeurs
   *                                          (si non précisé filtrera sur les ressources ayant cet index)
   *                                orderBy : L'index sur lequel trier
   *                                order   : asc ou desc
   *                                start   : L'indice de la 1re valeur à remonter
   *                                nb      : Le nombre de ressources à remonter
   * @param {Function} next       La callback qui sera appelée en lui passant la liste de ressources en argument
   */
  $ressourceRepository.getListe = function(visibilite, options, next) {
    try {
      // on normalise les arguments
      var publicOnly

      if (arguments.length < 3) throw new Error("nombre d'arguments incorrect")

      // on converti le json si besoin
      if (_.isString(options)) {
        try {
          options = JSON.parse(options)
        } catch (error) {
          error.message = "options de recherche invalides (erreur de syntaxe json)"
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

      } else {
        // donc tous, mais faut un argument à match
        optionsSafe.filters.push({index: 'idOrigine'})
      }
      // le reste
      if (options.orderBy && !_.isString(options.orderBy)) throw new Error('orderBy invalide')
      optionsSafe.orderBy = options.orderBy || 'oid'
      if (options.order === 'desc') optionsSafe.order = 'desc'
      start = parseInt(options.start, 10) || 0
      nb = parseInt(options.nb, 10) || 10
      if (nb > limitMax) {
        log.error(new Error("nb de résultats demandés supérieur à la limite max " +nb +'>' +limitMax))
        nb = limitMax
      }

      // si on est toujours là on peut construire la requete
      var query = Ressource
      optionsSafe.filters.forEach(function (filter) {
        log.debug("filter", filter)
        if (filter.values && filter.values.length) {
          if (filter.values.length > 1) query = query.match(filter.index).in(filter.values)
          else query = query.match(filter.index).equals(filter.values[0])
        } else query = query.match(filter.index)
      })

      // restriction d'après la visibilité
      if (visibilite == 'public') {
        query = query.match('restriction').equals(0)
      } else if (visibilite == 'correction') {
        query = query.match('restriction').lowerThan(2)
      } else if (visibilite.indexOf('/')) {
        var fragments = visibilite.split('/', 2)
        if (fragments[0] === 'auteur') {
          query = query.match('auteurs').equals(fragments[1])
        } else if (fragments[0] === 'groupe') {
          query = query.match('groupes').equals(fragments[1])
        } else {
          throw new Error('Clé de recherche ' +visibilite +' incorrecte')
        }
      } else if (visibilite == 'all') {
        log.debug('recherche sur tout')
      } else {
        // on a pas mis de restriction, c'est pas normal, on met public
        query = query.match('restriction').equals(0)
        log.error(new Error("Appel de getListe avec visibilite " +visibilite))
      }

      // orderBy
      if (optionsSafe.orderBy) {
        if (optionsSafe.order === 'desc') query = query.sort(optionsSafe.orderBy, 'desc')
        else query = query.sort(optionsSafe.orderBy)
      }

      query.grab(nb, start, function(error, ressources) {
        cacheAndNext(error, ressources, next)
      })

    } catch (error) {
      log.debug(error)
      next(error)
    }
  }

  $ressourceRepository.getLastLocalId = function (next) {
    var ttl = 3600 * 24 * 7
    var nbTest = 0

    /**
     * Récupère le dernier id en bdd (0 si aucune ressource local)
     * @param cb callback appelée avec cb(error, id)
     */
    function getFromDb(cb) {
      Ressource.match('origine').equals('local').sort('idOrigine', 'desc').grabOne(function (error, entity) {
        if (error) cb(error)
        else if (entity) cb(null, entity.idOrigine)
        else cb(null, 0) // aucune ressource d'origine local
      })
    }

    /**
     * appelle next(error, id) ou elle même (10x max)
     */
    function getReserved() {
      nbTest ++
      if (nbTest > 10) throw new Error("impossible de récupérer le dernier idOrigine pour l'origine 'local'")

      $cache.get('lastLocalId', function (error, id) {
        if (error) next(error)
        else if (id && id >= lastLocalId) {
          // ça pourrait être le bon, on réserve, incrémente et vérifie
          var idReserved = id + 1
          lastLocalId = idReserved
          $cache.set('lastLocalId', idReserved, ttl, function (error) {
            if (error) next(error)
            else {
              $cache.get('lastLocalId', function (error, id) {
                if (error) next(error)
                else if (id && id === idReserved) next(null, idReserved)
                else getReserved() // faut recommencer
              })
            }
          })
        } else {
          if (error) next(error)
          else {
            // faut aller en db
            getFromDb(function (error, id) {
              if (error) next(error)
              else {
                lastLocalId = id
                $cache.set('lastLocalId', id, ttl, getReserved)
              }
            })
          }
        }
      })
    }
    // et on lance la recherche
    try {
      getReserved()
    } catch(error) {
      next(error)
    }
  }

  return $ressourceRepository
}
