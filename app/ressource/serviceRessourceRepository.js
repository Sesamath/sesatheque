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

const flow = require('an-flow')
const uuid = require('an-uuid')
const elementtree = require('elementtree')
const _ = require('lodash')
const request = require('request')
const {exists, getBaseIdFromRid} = require('sesatheque-client/dist/sesatheques')
const Ref = require('../constructors/Ref')
const {ensure} = require('../tools')
const {getRidEnfants} = require('../tools/ressource')

const config = require('./config')
const appConfig = require('../config')

const j3pGraphe2json = require('../../tasks/modules/j3pGraphe2json')

const myBaseId = appConfig.application.baseId

// et des petites fonctions utiles
const prependMyBaseId = (oid) => myBaseId + '/' + oid
const getRealRid = (ressource) => ressource.aliasOf || ressource.rid

/**
 * Service d'accès aux ressources, utilisé par les différents contrôleurs
 * @service $ressourceRepository
 * @requires EntityRessource
 * @requires EntityArchive
 * @requires $ressourceControl
 * @requires $cacheRessource
 * @requires $cache
 */
const $ressourceRepository = {}

module.exports = function (EntityRessource, EntityArchive, EntityExternalRef, $ressourceRemote, $ressourceControl, $cacheRessource, $cache, $routes, $json) {
  // on applique toujours un limit
  const listeMax = config.limites.listeMax
  if (!listeMax) throw new Error('ressource.limites.listeMax manquant en configuration')

  /**
   * Applique checkRelations et dropEnfantsAliased avant d'appeler next
   * @private
   * @param {Ressource} ressource
   * @param {ressourceCallback} next
   */
  function beforeSave (ressource, next) {
    flow().seq(function () {
      checkRelations(ressource, this)
    }).seq(function () {
      if (ressource.enfants && ressource.enfants.length) dropEnfantsAliased(ressource)
      this(null, ressource)
    }).done(next)
  }

  /**
   * Nettoie les relations (helper de save, en complément de beforeStore)
   * @private
   * @param {Ressource} ressource
   * @param {function} next
   */
  function checkRelations (ressource, next) {
    const id = ressource.oid || ressource.rid || ressource.titre
    const cleanRelations = ressource.relations
      // on veut un tableau de 2 éléments dont le 1er est une relation connue
      .filter(relation => Array.isArray(relation) && relation.length === 2 && config.listes.relations[relation[0]])
      // cast des 2 éléments
      .map(relation => [Number(relation[0]), String(relation[1])])

    // le format est bon (typeRel connu), reste à voir si on a des cibles sous la forme origine/idOrigine
    // et ajouter éventuellement baseId pour avoir un rid valide
    if (cleanRelations.length) {
      flow(cleanRelations).parEach(function (relation) {
        const nextRelation = this
        const [relId, relTarget] = relation
        const pos = relTarget.indexOf('/')
        if (pos === -1) {
          // on suppose que c'est un oid
          nextRelation(null, [relId, prependMyBaseId(relTarget)])
        } else {
          // au moins un slash
          const debut = relTarget.substr(0, pos)
          const fin = relTarget.substr(pos + 1)

          // si c'est chez nous on vérifie
          if (debut === myBaseId) {
            $ressourceRepository.load(fin, function (error, ressource) {
              if (error) return nextRelation(error)
              if (ressource) {
                nextRelation(null, [relId, getRealRid(ressource)])
              } else {
                log.dataError(`${fin} n’existe pas sur cette sesathèque (mentionné comme relation de ${id}`)
                nextRelation()
              }
            })

          // ailleurs, on fait confiance et une tâche en cli vérifiera de tps en tps
          } else if (exists(debut)) {
            nextRelation(null, relation)

          // debut devrait être une origine, on vérifie que la ressource existe
          } else {
            $ressourceRepository.loadByOrigin(debut, fin, function (error, ressource) {
              if (error) {
                log.dataError(`${relTarget} n’existe pas sur cette sesathèque (mentionné comme relation de ${id}`)
                nextRelation()
              } else {
                nextRelation(null, [relId, getRealRid(ressource)])
              }
            })
          }
        }
      }).seq(function (relations) {
        // reste à virer les éventuels undefined et les doublons
        // pour les doublons, on utilise un accumulateur avec des clés plutôt qu'un map
        // (test sur booléen plus pertinent que set puis Array.from)
        const acc = {}
        const checkedRelations = relations.filter(([typeRel, targetRid]) => {
          const key = typeRel + targetRid
          const isOk = typeRel && !acc[key]
          if (isOk) acc[key] = true
          return isOk
        })
        const perte = ressource.relations.length - checkedRelations.length
        const s = perte > 1 ? 's' : ''
        if (perte) {
          log.dataError(`Il y avait ${perte} relation${s} en double (ou invalide${s}) dans ${id}`, relations)
          ressource.relations = checkedRelations
        }

        next(null, ressource)
      }).catch(next)
    } else {
      ressource.relations = []
      next(null, ressource)
    }
  }

  /**
   * Modifie ressource en virant récursivement les enfants de tout item qui serait un alias
   * (pour garder l'aspect dynamique)
   * @param {Ressource} ressource
   * @returns {Ressource} la ressource modifiée (pas toujours utile d'utiliser ce retour car la ressource passée en argument a été modifiée)
   */
  function dropEnfantsAliased (ressource) {
    if (ressource.enfants) {
      if (ressource.aliasOf) delete ressource.enfants
      else if (ressource.enfants.length) ressource.enfants = ressource.enfants.map(dropEnfantsAliased)
    }
    return ressource
  }

  /**
   * Retourne la requête préparée d'après visibilite et options.filters
   * @private
   * @param {string}   visibilite peut valoir public | correction | all | auteur/pid | groupe/nom
   * @param {Object}   options    Un objet (ou son json) avec éventuellement les propriétés
   * @param {getListeFilters} [options.filters] tableau de filtres
   * @return {EntityQuery}
   */
  function getListeQuery (visibilite, options) {
    // avant de construire la query on fait un minimum de vérifications
    const filters = []
    if (options.filters) {
      if (!Array.isArray(options.filters)) throw new Error('Filtres incorrects')
      options.filters.forEach(function (filter) {
        if (!filter.index || !_.isString(filter.index)) throw new Error('index invalide ou manquant pour un des filtres')
        if (!Array.isArray(filter.values)) throw new Error(`values invalides (pas un tableau) pour filter ${filter.index}`)
        // on ne prend que ce que l'on connait, le filtre restriction est ignoré car c'est visibilite qui l'impose éventuellement
        if (filter.index === 'restriction') log.error(new Error('le filtre restriction doit passer par le paramètre visibilité'))
        else if (config.labels[ filter.index ]) filters.push(filter)
        else log.error(new Error(`Index ${filter.index} non déclaré en config`))
      })
    } else {
      // donc pas de filtre, mais faut un argument à match
      filters.push({ index: 'oid' })
    }

    const query = EntityRessource.match() // sans argument ça retourne une EntityQuery vierge
    filters.forEach(function (filter) {
      // log.debug('getListe filter ' + filter.index)
      if (filter.values) {
        switch (filter.values.length) {
          case 0:
            query.match(filter.index)
            break
          case 1:
            // une seule valeur, on regarde si on veut du like
            const value = filter.values[ 0 ]
            const action = (typeof value === 'string' && (value.indexOf('%') !== -1 || value.indexOf('_') !== -1)) ? 'like' : 'equals'
            query.match(filter.index)[ action ](filter.values[ 0 ])
            break
          default:
            query.match(filter.index).in(filter.values)
        }
      } else {
        query.match(filter.index)
      }
    })

    // restriction d'après la visibilité
    if (visibilite === 'public') {
      query.match('restriction').equals(config.constantes.restriction.aucune)
    } else if (visibilite === 'correction') {
      query.match('restriction').lowerThanOrEquals(config.constantes.restriction.correction)
    } else if (visibilite === 'all') {
      log.debug('recherche sur tout')
    } else {
      const slashPos = visibilite.indexOf('/')
      if (slashPos > 0) {
        const type = visibilite.substr(0, slashPos)
        const target = visibilite.substr(slashPos + 1)
        if (type === 'auteur') {
          query.match('auteurs').equals(target)
        } else if (type === 'groupe') {
          query.match('groupes').equals(target.toLowerCase())
        } else {
          throw new Error('Clé de recherche ' + visibilite + ' incorrecte')
        }
      } else {
        // on a pas mis de restriction connue, c'est pas normal, on met public
        query.match('restriction').equals(config.constantes.restriction.aucune)
        log.error(new Error('Appel de getListe avec visibilite ' + visibilite))
      }
    }

    return query
  }

  /**
   * Met à jour cette ressource dans tous les arbres des autres sesathèques qui la contiennent,
   * @private
   * @param {Ref} ref
   */
  function updateParentsExternes (ref) {
    // et on met à jour sur les autres sesathèques qui pourraient avoir mis cet enfant dans un arbre
    const stCalled = new Set()
    const rid = ref.aliasOf
    flow().seq(function () {
      EntityExternalRef.match('rid').equals(rid).grab(this)
    }).seqEach(function (extRef) {
      const {baseId} = extRef
      if (stCalled.has(baseId)) {
        log.error(new Error(`EntityExternalRef ${extRef.oid} en double pour ${baseId} et ${rid}, on la supprime`))
        extRef.delete(this)
        return
      }
      stCalled.add(baseId)
      $ressourceRemote.externalUpdate(baseId, ref, this)
    }).catch(log.error)
  }

  /**
   * Purge les urls publiques de la ressource sur varnish (si varnish est dans la conf, ne fait rien sinon)
   * (rend la main avant les réponses mais après avoir lancé les requêtes)
   * @param {Ressource|string} ressource ou son oid
   */
  function purgeVarnish (ressource) {
    if (!appConfig.varnish) return
    const myBaseUrl = appConfig.application.baseUrl
    // on ne purge que les ressources publiques (les autres ne sont pas en cache)
    if (ressource.publie && ressource.restriction === config.constantes.restriction.aucune) {
      // log.debug(`purge varnish de ${ressource.oid} en utilisant ${myBaseUrl}`)
      ;[
        $routes.getAbs('api', ressource),
        $routes.getAbs('display', ressource),
        $routes.getAbs('describe', ressource),
        $routes.getAbs('preview', ressource)
      ].forEach(function (url) {
        request({
          method: 'PURGE',
          url: myBaseUrl + url.substr(1) // pour pas avoir de double slash
        }, function (error, response) {
          log.debug('purge ' + url + ' ' + (response && response.statusCode))
          if (error) {
            log.error('purge KO pour ' + url, error)
          } else if (!response || response.statusCode !== 200) {
            log.error('purge KO (!200) pour ' + url, response)
            log.error('avec le body', arguments[2])
          }
        })
      })
    }
  }

  /**
   * Charge l'ancienne version encore en base pour
   * - incrémenter le n° de version si la ressource a une propriété versionNeedIncrement
   *   ou si une des propriétés listées dans config.versionTriggers a changée de valeur
   * - affecter la propriété oid si la ressource existait en base mais qu'on avait pas l'oid (seulement rid ou idOrigine)
   * - lancer en tâche de fond, si besoin (car modif à répercuter), l'update des arbres qui utilisent
   *   cette ressource, ici et sur toutes les sésathèques qui référence cette ressource via un ExternalRef
   * @private
   * @param {EntityRessource} ressource
   * @param {Function} next
   */
  function checkAgainstPrevious (ressource, next) {
    if (ressource.oid) {
      // pas le cas au create ou sur un update via l'api
      // ira seulement en cache dans la plupart des cas, et de toute façon faut récupérer
      // le n° de version actuel et l'oid éventuel
      $ressourceRepository.load(ressource.oid, function (error, ressourceBdd) {
        if (error) next(error)
        else if (ressourceBdd) compare(ressource, ressourceBdd, next)
        else next(new Error(`checkAgainstPrevious a reçu une ressource avec oid ${ressource.oid} qui n’existe pas`))
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
   * Enregistre ou supprime des listeners pour nos enfants externes
   * @param {Ressource} ressource
   * @param {Ressource} ressourceBdd
   */
  function checkRegisterListener (ressource, ressourceBdd) {
    if ((ressource.enfants && ressource.enfants.length) || (ressourceBdd.enfants && ressourceBdd.enfants)) {
      // faut la liste des rid externes qui ont changés
      const oldRids = getRidEnfants(ressourceBdd)
      const newRids = getRidEnfants(ressource)
      const externalRidsAdded = newRids.filter(rid => !oldRids.includes(rid) && getBaseIdFromRid(rid) !== myBaseId)
      // on pourrait facilement trouver les rids qui ont été virés, mais on peut pas faire de unregister
      // sans vérifier que personne d'autre ne les utilise, on laisse tomber et ça sera viré au 1er update
      // si personne s'en sert
      appConfig.sesatheques.forEach(sesatheque => {
        const rids = externalRidsAdded.filter(rid => getBaseIdFromRid(rid) === sesatheque.baseId)
        if (rids.length) $ressourceRemote.register(rids, error => { if (error) log.error(error) })
      })
    }
  }

  /**
   * Met à jour si besoin nos ressources parentes d'une ref interne,
   * et lance la mise à jour des parents externes
   * @param ressource
   * @param ressourceBdd
   */
  function checkUpdateParent (ressource, ressourceBdd) {
    // log.debug('checkUpdateParent')
    if (
      ressource.titre !== ressourceBdd.titre ||
      ressource.resume !== ressourceBdd.resume ||
      ressource.description !== ressourceBdd.description ||
      ressource.commentaires !== ressourceBdd.commentaires ||
      (ressource.publie && !ressource.restriction) !== (ressourceBdd.publie && !ressourceBdd.restriction)
    ) {
      // on lance tout ça en // en tâche de fond
      const ref = new Ref(ressource)
      // log.debug('faut lancer une màj des parents')
      $ressourceRepository.updateParent(ref)
      updateParentsExternes(ref)
    }
  }

  /**
   * Compare la ressource à la ressource qui existait pour savoir s'il faut incrémenter la version,
   * mettre à jour les arbres qui la contienne ou enregistrer un listener si on a des enfants externes
   * @private
   * @param ressource
   * @param ressourceBdd
   * @param next
   */
  function compare (ressource, ressourceBdd, next) {
    // log.debug('compare')
    let needIncrement = !!ressource.versionNeedIncrement
    // on regarde si nos champs qui déclenchent un changement de version on changé
    if (!needIncrement && ressourceBdd.oid) {
      config.versionTriggers.forEach(function (prop) {
        // pour la comparaison, deux objets avec la même définition littérale sont vus != en js
        // on utilise https://lodash.com/docs#isEqual
        if (!_.isEqual(ressource[prop], ressourceBdd[prop])) {
          // debug
          if (!global.isProd) {
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
        if (error) return next(error)
        ressource.version++
        ressource.archiveOid = archive.oid
        next(null, ressource)
      })
    } else {
      next(null, ressource)
    }
    // on passe à la propagation éventuelle sur les arbres qui nous contiennent
    checkUpdateParent(ressource, ressourceBdd)
    // et au register / unregister sur les modifications d'enfants externes
    checkRegisterListener(ressource, ressourceBdd)
  } // compare

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
      else if (ressource.hasOwnProperty('enfants')) delete ressource.enfants
      $cacheRessource.set(ressource)
    }

    try {
      if (error) {
        log.error(error)
        return next(new Error('Problème d’accès à la base de données'))
      }
      if (Array.isArray(ressources)) ressources.forEach(processOne)
      else if (ressources) processOne(ressources)
      next(null, ressources)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Converti un xml qui trainerait en parametres en json pour les ec2
   * @param ressource
   */
  function convertXmlEc2 (ressource) {
    const config = elementtree.parse(ressource.parametres.xml)
    const params = {}
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
      const string = j3pGraphe2json(ressource.parametres.xml)
      try {
        const graphe = JSON.parse(string)
        ressource.parametres = {
          g: graphe
        }
      } catch (error) {
        log.error('plantage dans la conversion du xml de la ressource j3p')
        if (!ressource.$errors) ressource.$errors = []
        ressource.$errors.push('la propriété xml des parametres ne contient pas de graphe valide')
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
  function archive (ressource, next) {
    try {
      if (!ressource.oid) throw new Error("Impossible d'archiver une ressource qui n’existe pas encore")
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
   * @param {EntityRessource|string} ressource (ou son oid)
   * @param {errorCallback}   next
   * @returns {undefined}
   */
  function remove (ressource, next) {
    const ressourceOid = typeof ressource === 'string' ? ressource : (ressource && ressource.oid)
    if (!ressourceOid) return next(new Error('remove appelé sans ressource'))
    log.debug(`La ressource ${ressourceOid} va être effacée`)
    // on vire du cache de toute façon
    $cacheRessource.delete(ressourceOid)
    EntityRessource.match('oid').equals(ressourceOid).purge(function (error, nb) {
      if (error) return next(error)
      if (nb > 1) next(new Error(`L’effacement de la ressource ${ressourceOid} a provoqué ${nb} suppressions`))
      if (nb === 1) log.debug(`La ressource ${ressourceOid} a été effacée`)
      else log.debug(`La ressource ${ressourceOid} n’existait pas`)
      purgeVarnish(ressourceOid)
      next()
    })
  }

  /**
   * Récupère un liste de ressource d'après critères
   * @memberOf $ressourceRepository
   * @param {string}   visibilite peut valoir public | correction | all | auteur/pid | groupe/nom
   * @param {Object}   options    Un objet (ou son json) avec éventuellement les propriétés
   * @param {getListeFilters} [options.filters] Les filtres à appliquer
   * @param {string}   [options.orderBy] L'index sur lequel trier
   * @param {string}   [options.order=asc] asc|desc
   * @param {string}   [options.skip] L'indice de la 1re valeur à remonter
   * @param {string}   [options.limit=listeMax] Le nombre max de ressources à remonter
   * @param {ressourcesCallback} next La callback qui sera appelée en lui passant la liste de ressources en argument et le nb total de résultat
   */
  function getListe (visibilite, options, next) {
    try {
      if (!options) options = {}
      log.debug(`getListe avec visibility=${visibilite} et les options`, options)
      const query = getListeQuery(visibilite, options)
      // order
      if (typeof (options.orderBy) === 'string') {
        const order = (options.order === 'desc') ? 'desc' : 'asc'
        query.sort(options.orderBy, order)
      }
      // limit
      let limit
      const wantedLimit = ensure(options.limit, 'integer', listeMax)
      if (wantedLimit > 0 && wantedLimit <= listeMax) {
        limit = wantedLimit
      } else {
        if (wantedLimit > listeMax) {
          log.error(new Error(`limite ${options.limit} demandée trop haute, ramenée à ${listeMax}`))
        } else if (wantedLimit < 1) {
          log.error(new Error(`limite ${options.limit} invalide, mise à ${listeMax}`))
        }
        limit = listeMax
      }
      const skip = ensure(options.skip, 'integer', 0)
      log.debug(`getListe démarre ${skip} avec max ${limit} et les options valides`, options)

      flow().seq(function () {
        query.grab({limit, skip}, this)
      }).seq(function (ressources) {
        if (ressources.length) cacheAndNext(null, ressources, this)
        else this(null, [])
      }).seq(function (ressources) {
        log.debug('getListe remonte', ressources)
        next(null, ressources)
      }).catch(next)
    } catch (error) {
      log.error(error)
      next(error)
    }
  } // getListe

  /**
   * Compte le nb de ressources d'après ces critères
   * @memberOf $ressourceRepository
   * @param {string}   visibilite peut valoir public | correction | all | auteur/pid | groupe/nom
   * @param {Object}   options    Un objet (ou son json) avec éventuellement les propriétés
   * @param {Object[]} [options.filters] tableau d'objets {index:'indexAFiltrer', values:valeurs},
   *                                       valeurs peut être un tableau de valeurs ou [undefined]
   *                                       (ça filtrera sur les ressources ayant cet index)
   * @param {ressourcesCallback} next La callback qui sera appelée en lui passant la liste de ressources en argument et le nb total de résultat
   */
  function getListeCount (visibilite, options, next) {
    try {
      const query = getListeQuery(visibilite, options)
      query.count(next)
    } catch (error) {
      log.error(error)
      next(error)
    }
  }

  /**
   * Récupère une liste de ressource complète (no limit) d'après critères ATTENTION à ne pas l'utiliser n'importe où !
   * Il y a quand même une limite, 50 × listeMax
   * @memberOf $ressourceRepository
   * @param {string}   visibilite peut valoir public | correction | all | auteur/pid | groupe/nom
   * @param {Object}   options    Un objet (ou son json) avec éventuellement les propriétés
   * @param {getListeFilters} [options.filters] Les filtres à appliquer
   * @param {string}   [options.orderBy] L'index sur lequel trier
   * @param {string}   [options.order=asc] asc|desc
   * @param {ressourcesCallback} next La callback qui sera appelée en lui passant la liste de ressources en argument et le nb total de résultat
   */
  function getListeFull (visibilite, options, next) {
    function fetch () {
      getListe(visibilite, options, function (error, ressources) {
        if (error) return next(error)
        nbCalls++
        allRessources = allRessources.concat(ressources)
        if (ressources.length === listeMax && nbCalls < 50) {
          skip += listeMax
          fetch()
        } else {
          if (nbCalls === 50) log.error(`getListeFull remonte ${nbCalls * listeMax} ressources et il en reste, on arrête là`)
          next(null, allRessources)
        }
      })
    }
    let nbCalls = 0
    let skip = 0
    let allRessources = []
    fetch()
  }

  /**
   * Récupère une ressource et la passe à next (ressource undefined si elle n’existe pas)
   * @memberOf $ressourceRepository
   * @param {number|String}     oid  L'identifiant de la ressource (on accepte oid ou string origine/idOrigine)
   * @param {ressourceCallback} next appelée avec une EntityRessource
   * @returns {undefined}
   */
  function load (oid, next) {
    if (_.isString(oid) && oid.indexOf('/') > 0) {
      const [origin, idOrigin, bug] = oid.split('/')
      if (bug) return next(new Error('identifiant invalide : ' + oid))
      if (origin === 'cle') $ressourceRepository.loadByCle(idOrigin, next)
      else $ressourceRepository.loadByOrigin(origin, idOrigin, next)
    } else {
      $cacheRessource.get(oid, function (error, ressourceCached) {
        if (error) return next(error)
        if (ressourceCached) return next(null, ressourceCached)
        EntityRessource.match('oid').equals(oid).grabOne(function (error, ressource) {
          cacheAndNext(error, ressource, next)
        })
      })
    }
  }

  /**
   * Récupère une ressource d'un auteur d'après son aliasOf et la passe à next
   * @memberOf $ressourceRepository
   * @param {string}            aliasOf
   * @param {string}            rid
   * @param {ressourcesCallback} next  appelée avec une EntityRessource
   */
  function loadByAliasAndPid (aliasOf, pid, next) {
    EntityRessource
      .match('aliasOf').equals(aliasOf)
      .match('auteurs').equals(pid)
      .grabOne(next)
  } // loadByAliasAndPid

  /**
   * Récupère une ressource d'après sa cle et la passe à next
   * @memberOf $ressourceRepository
   * @param {string}            cle
   * @param {ressourceCallback} next      appelée avec une EntityRessource
   */
  function loadByCle (cle, next) {
    if (!cle) return next(new Error('Clé manquante, impossible de charger la ressource'))
    $cacheRessource.getByOrigine('cle', cle, function (error, ressourceCached) {
      if (error) return next(error)
      if (ressourceCached) return next(null, ressourceCached)
      EntityRessource
        .match('cle').equals(cle)
        .grabOne(function (error, ressource) {
          cacheAndNext(error, ressource, next)
        })
    })
  } // loadByCle

  /**
   * Récupère une ressource d'après son idOrigine (ou son rid, dans ce cas origine est notre baseId) et la passe à next
   * @memberOf $ressourceRepository
   * @param {string}            origine (ou "cle" avec idOrigine qui est la clé, ou la baseId courante avec idOrigine qui est l'oid)
   * @param {string}            idOrigine
   * @param {ressourceCallback} next      appelée avec une EntityRessource
   */
  function loadByOrigin (origine, idOrigine, next) {
    if (origine && idOrigine) {
      // on est appelé par les controleurs sur les urls xxx/:origine/:idOrigine
      // mais le client de l'api peut passer un rid ou une clé,
      // on le gère ici plutôt que de mettre des if dans chaque contrôleur
      if (origine === 'cle') {
        return $ressourceRepository.loadByCle(idOrigine, next)
      }
      if (origine === myBaseId) {
        return $ressourceRepository.load(idOrigine, next)
      }
      // c'est un vraie origine
      $cacheRessource.getByOrigine(origine, idOrigine, function (error, ressourceCached) {
        if (error) return next(error)
        if (ressourceCached) return next(null, ressourceCached)
        EntityRessource
          .match('origine').equals(origine)
          .match('idOrigine').equals(idOrigine)
          .grabOne(function (error, ressource) {
            cacheAndNext(error, ressource, next)
          })
      })
    } else {
      return next(new Error('Origine ou idOrigine manquant, impossible de charger la ressource'))
    }
  } // loadByOrigin

  /**
   * Met en cache la ressource et le user pour modification ultérieure
   * @param {number} oid
   * @param {function} next
   */
  function saveDeferred (oid, next) {
    const token = uuid()
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
  function getDeferred (token, next) {
    /* $cache.get('defer_' + token, function (error, data) {
      if (!error && data) $cache.delete('defer_' + token, function () {})
      next(error, data)
    }) */
    $cache.get('defer_' + token, next)
  }

  /**
   * Ajoute ou modifie une ressource (contrôle la validité avant et incrémente la version au besoin),
   * met à jour le cache (interne + varnish) et toutes les relations (passe en revue tous les éventuels
   * arbres qui référencent cette ressource)
   *
   * ATTENTION, c'est la seule méthode qui garanti l'intégrité du cache, entityRessource.store()
   * utilisé directement peut être plus efficace pour du batch, mais faut y réfléchir à deux fois !
   * @memberOf $ressourceRepository
   * @param {EntityRessource}   ressource
   * @param {ressourceCallback} [next]    appelée avec une EntityRessource
   */
  function save (ressource, next) {
    if (ressource.constructor.name !== 'Entity') {
      ressource = EntityRessource.create(ressource)
    }
    flow().seq(function () {
      checkAgainstPrevious(ressource, this)
    }).seq(function (ressource) {
      if (ressource.type === 'ec2' && ressource.parametres && ressource.parametres.xml) {
        convertXmlEc2(ressource)
      } else if (ressource.type === 'j3p' && ressource.parametres && ressource.parametres.xml) {
        convertXmlJ3p(ressource)
        log.debug('ressource j3p après conversion avant write', ressource)
      }
      log.debug('on va enregistrer ' + ressource.origine + '/' + ressource.idOrigine, ressource, 'avirer', {max: 10000})
      beforeSave(ressource, this)
    }).seq(function (ressource) {
      ressource.store(this)
    }).seq(function (ressource) {
      if (!ressource.oid) throw new Error('Après un write la ressource n’a pas d’oid')
      // mise en cache, purge varnish et passage au suivant
      // gestion du cache pas possible en afterStore car le cache dépend de l'entité.
      // C'est aussi plus logique que $ressourceRepository gère cache + intégrité croisée des données,
      // et le gestionnaire d'entité seulement l'intégrité interne des données d'une entité
      $cacheRessource.set(ressource)
      purgeVarnish(ressource)
      log.debug('write ' + ressource.oid + ' ok')
      if (next) next(null, ressource)
    }).catch(function (error) {
      // on log toujours ici
      log.error(error)
      if (next) next(error)
    })
  }

  /**
   * Met à jour les arbres ou séries stockés ici qui ont ref comme enfant
   * @param {Ref} ref
   * @param {function} next appelée avec (error, nbArbres)
   */
  function updateParent (ref, next) {
    // cherche un enfant et le modifie si besoin, retourne true si on a fait une modif
    function findChild (arbre) {
      let modif = false
      if (arbre.enfants && arbre.enfants.length) {
        // avec Array.some on pourrait sortir dès qu'on a trouvé, mais un arbre pourrait avoir
        // deux fois le même enfant, on les parse tous
        arbre.enfants.forEach(function (enfant) {
          let mod = false
          if (enfant.aliasOf === rid) mod = majChild(enfant)
          else if (enfant.enfants && enfant.enfants.length) mod = findChild(enfant)
          if (mod) modif = true
        })
      }
      return modif
    }

    // regarde s'il faut mettre à jour l'enfant et retourne true si c'est le cas
    function majChild (child) {
      let modif = false
      if (child.aliasOf === ref.aliasOf) {
        if (
          child.titre !== ref.titre ||
          child.resume !== ref.resume ||
          child.description !== ref.description ||
          child.commentaires !== ref.commentaires ||
          child.public !== (ref.publie && !ref.restriction)
        ) {
          modif = true
          Object.assign(child, ref)
          // on veut pas les enfants car on a une vraie ref
          if (child.enfants) delete child.enfants
        }
      } else {
        log.error(new Error(`majChild appelée avec des paramètres incohérents sur ${ref.aliasOf}`), child)
      }
      return modif
    }

    // on cherche les enfants d'après le rid de la ressource
    const rid = ref.aliasOf
    let nbArbres = 0
    flow().seq(function () {
      // on cherche nos arbres contenant cet enfant
      EntityRessource.match('enfants').equals(rid).grab(this)
    }).seqEach(function (arbre) {
      // log.debug(`updateParent a trouvé ${rid} dans l'arbre parent ${arbre.oid}`)
      nbArbres++
      if (findChild(arbre, rid)) $ressourceRepository.save(arbre, this)
      else log.dataError(`majArbres appelé suite à un update de ${rid}, trouvé l’arbre ${arbre.oid} mais il n’y a pas eu de modification à répercuter`)
    }).seq(function () {
      if (next) next(null, nbArbres)
    }).catch(next || log.error)
  }

  /**
   * @service $ressourceRepository
   */
  return {
    archive,
    getDeferred,
    getListe,
    getListeCount,
    getListeFull,
    load,
    loadByAliasAndPid,
    loadByCle,
    loadByOrigin,
    remove,
    save,
    saveDeferred,
    updateParent
  }
}

/**
 * @callback ressourcesCallback
 * @param {Error} error
 * @param {Ressource[]} ressources
 */
/**
 * Tableau de filtres
 * @typedef {getListeFilter[]} getListeFilters
 */
/**
 * Filtre de la forme {index:'indexAFiltrer', values:valeurs},
 * valeurs peut être un tableau de valeurs ou [undefined] (ça filtrera sur les ressources ayant cet index)
 * @typedef {{index: string, values: Array}} getListeFilter
 */
