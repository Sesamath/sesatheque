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
const _ = require('lodash')
const request = require('request')
const flow = require('an-flow')
const {parse, stringify} = require('sesajstools')
const {merge, update} = require('sesajstools/utils/object')
const config = require('../config')
const configRessource = require('./config')
const Ref = require('../../constructors/Ref')
const {ensure} = require('../tools')
const url = require('../tools/url')
const {getBaseId, getBaseIdFromRid, getRidComponents} = require('sesatheque-client/src/sesatheques')
const {getJstreeChildren, toJstree} = require('sesatheque-client/dist/jstreeConvert')

const myBaseId = config.application.baseId
const myBaseUrl = config.application.baseUrl

/**
 * Ajoute une erreur dans les logs
 * @param {Object} data Si propriété rid ira dans dataError.log (error.log sinon)
 */
function notifyError (data) {
  // on remplace les Error par leur stack avant stringify (pas en profondeur)
  Object.keys(data).forEach(k => {
    if (data[k] && data[k].stack) data[k] = data[k].stack
  })
  const message = 'notifyError : ' + stringify(data)
  if (data.rid) log.dataError(message)
  else log.error(message)
}

/**
 * Controleur de la route /api/ (qui répond en json) pour les ressources
 * Toutes les routes contenant /public/ ignorent la session (cookies viré par varnish,
 * cela permet de mettre le résultat en cache et devrait être privilégié pour les ressources publiques)
 * @Controller controllerApi
 */
module.exports = function (component) {
  component.controller('api', function ($ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $personneRepository, $json, EntityRessource, EntityExternalRef, $ressourceFetch, $ressourceRemote) {
    /**
     * Efface une ressource d'après son id, appellera denied ou sendJson avec error ou deleted:id
     * @private
     * @param {Context} context
     * @param id ou oid ou origine/idOrigine
     */
    function deleteAndSend (context, id) {
      log.debug('dans cb api deleteRessource ' + id)
      // faut charger la ressource pour vérifier les droits (elle est probablement en cache)
      $ressourceRepository.load(id, function (error, ressource) {
        if (error) return $json.sendError(context, error)
        if (!ressource) return $json.notFound(context, `La ressource ${id} n’existe pas`)
        if (!$accessControl.hasPermission('delete', context, ressource)) return $json.denied(context, `Vous n’avez pas de droits suffisants pour supprimer cette ressource`)
        $ressourceRepository.remove(ressource.oid, function (error) {
          if (error) return $json.sendError(context, error)
          $json.sendOk(context, {deleted: ressource.oid})
        })
      })
    }

    /**
     * Renvoie l'id trouvé dans le post ou le get (en acceptant les propriétés id, oid ou origine&idOrigine, en GET ou POST)
     * @private
     * @param {Context} context
     * @returns {string} oid ou origine/idOrigine ou undefined
     */
    function extractId (context) {
      let id
      if (context.post.origine && context.post.idOrigine) id = context.post.origine + '/' + context.post.idOrigine
      else if (context.get.origine && context.get.idOrigine) id = context.get.origine + '/' + context.get.idOrigine
      else id = context.post.oid || context.post.id || context.get.oid || context.get.id

      return id
    }

    /**
     * Traite GET|POST /api/liste/all
     * @private
     * @param {Context} context
     */
    function getListeAll (context) {
      context.timeout = 3000
      // on vérifie les droits all avant de lancer la requete,
      // ce serait idiot de remonter des milliers de résultats tous privés
      // (et ça compliquerait bcp la pagination)
      if ($accessControl.hasAllRights(context)) grabListe(context, 'all')
      else $json.denied(context, "Vous n'avez pas de droits suffisants pour consulter toutes les ressources (privées comprises)")
    }

    /**
     * Traite GET /api/liste/auteurs?pids=pid1,pid2…
     * @param context
     */
    function getListeAuteurs (context) {
      const pids = context.get.pids && context.get.pids.split(',').filter(pid => pid.indexOf('/') > 0)
      if (!pids) return $json.sendError(context, 'Argument pids manquant')
      if (!pids.length) return $json.sendError(context, 'Aucun auteur demandé')
      const retour = {warnings: []}
      const args = {
        filters: [{
          index: 'auteurs',
          values: pids
        }]
      }
      let iAuteurs = 0 // pour retrouver le pid d'une personne qu'on a pas trouvé
      let nbRessources = 0 // pour savoir s'il faut du nextUrl
      flow(pids).seqEach(function (pid) {
        // on a pas de loadMulti, tant pis, toujours mieux de passer par ce load qui utilise le cache
        // plutôt que d'écrire directement ici une requête
        $personneRepository.load(pid, this)
      }).seqEach(function (personne) {
        if (personne && personne.pid) {
          retour[personne.pid] = {
            pid: personne.pid,
            label: `${personne.prenom} ${personne.nom}`,
            liste: []
          }
        } else {
          retour.warnings.push(`Auteur ${pids[iAuteurs]} inconnu`)
          if (personne) log.dataError('personne sans pid', personne)
        }
        iAuteurs++
        this()
      }).seq(function () {
        $ressourceRepository.getListe('all', args, this)
      }).seqEach(function (ressource) {
        nbRessources++
        log.debug('ressource', {rid: ressource.rid, auteurs: ressource.auteurs})
        if (!$accessControl.hasReadPermission(context, ressource)) return this()
        ressource.auteurs.forEach(pid => {
          if (retour[pid]) retour[pid].liste.push(new Ref(ressource))
        })
        this()
      }).seq(function () {
        if (!retour.warnings.length) delete retour.warnings
        if (nbRessources === listeMax) {
          const skip = context.get.skip || 0
          retour.nextUrl = myBaseUrl + url.update(context.request.originalUrl, {skip})
        }
        $json.sendOk(context, retour)
      }).catch(function (error) {
        log.error(error)
        $json.sendError(context, error)
      })
    }

    /**
     * Traite GET /api/liste/perso (appelé par sesatheque-client)
     * @private
     * @param {Context} context
     */
    function getListePerso (context) {
      context.timeout = 3000
      const pid = $accessControl.getCurrentUserPid(context)
      if (!pid) return $json.denied(context, 'Ressources personnelles inaccessibles (session expirée sur la Sésathèque), veuillez vous déconnecter et reconnecter')
      const listeMax = configRessource.limites.listeMax
      const limit = ensure(context.get.limit, 'integer', listeMax)
      const skip = ensure(context.get.skip, 'integer', 0)
      /**
       * Liste des ressources perso
       * @type {Ressources[]}
       */
      let mesRessources = []
      // la visibilité, c'est pour cet auteur,
      const visibility = 'auteur/' + pid
      let nbOwnRessources = 0
      flow().seq(function () {
        // skip est à cheval sur les ressources dont on est l'auteur et celles où on est que contributeur
        // faut d'abord compter les premières
        const options = {
          filters: [{index: 'auteurs', values: [pid]}]
        }
        $ressourceRepository.getListeCount(visibility, options, this)
      }).seq(function (nb) {
        nbOwnRessources = nb
        if (skip >= nbOwnRessources) return this(null, [])
        // sinon on veut des ressources dont on est l'auteur
        const options = {
          filters: [{index: 'auteurs', values: [pid]}],
          limit,
          skip
        }
        // les ressources dont on est l'auteur
        $ressourceRepository.getListe(visibility, options, this)
      }).seq(function (ressources) {
        if (ressources.length) mesRessources = ressources
        // si on est déjà au max on arrête là
        if (ressources.length === limit) return this(null, [])
        // on va aussi chercher les contributeurs
        const options = {
          filters: [{index: 'contributeurs', values: [pid]}],
          limit: limit - ressources.length,
          skip: (skip >= nbOwnRessources) ? skip - nbOwnRessources : 0
        }
        $ressourceRepository.getListe(visibility, options, this)
      }).seq(function (ressources) {
        if (ressources.length) mesRessources = mesRessources.concat(ressources)
        this()
      }).seq(function () {
        sendListe(context, null, mesRessources)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    }

    /**
     * Traite GET|POST /api/liste/prof
     * @private
     * @param {Context} context
     */
    function getListeProf (context) {
      context.timeout = 3000
      if ($accessControl.hasGenericPermission('correction', context)) {
        grabListe(context, 'correction')
      } else if ($accessControl.isAuthenticated(context)) {
        $json.denied(context, "Vous n'avez pas les droits suffisants pour accéder aux corrigés")
      } else {
        $json.denied(context, 'Il faut être authentifié pour accéder aux corrigés')
      }
    }

    /**
     * Traite GET|POST /api/liste/public
     * @private
     * @param context
     */
    function getListePublic (context) {
      grabListe(context, 'public')
    }

    /**
     * Recupère une liste de ressource (d'après les argument get et post mergés) et l'envoie
     * @private
     * @param {Context} context
     * @param {string} visibility
     */
    function grabListe (context, visibility) {
      let args
      if (context.get.json) {
        args = parse(context.get.json)
      } else {
        args = context.get
        // en get on a des string, faut parser ce qui devrait être un objet
        if (args.filters) {
          args.filters = parse(args.filters)
        }
      }
      merge(args, context.post)
      log.debug('grabListe ' + visibility, args)
      $ressourceRepository.getListe(visibility, args, function (error, ressources) {
        sendListe(context, error, ressources)
      })
    }

    /**
     * Répond ok pour les options delete
     * @private
     * @param {Context} context
     */
    function optionsDeleteOk (context) {
      context.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
      // context.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept')
      // et on laisse le middleware CORS faire son boulot
      context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
    }

    // noinspection FunctionWithMoreThanThreeNegationsJS
    /**
     * Traite la ressource de POST /api/ressource
     * @private
     * @param {Context} context
     */
    function postRessource (context) {
      context.timeout = 5000
      /* const reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
       log.error(new Error('une trace pour ' +reqHttp)) */
      const ressourcePostee = context.post
      const pid = $accessControl.getCurrentUserPid(context)
      let ressourceBdd

      if (context.perf) {
        let msg = 'start-'
        if (ressourcePostee.origine && ressourcePostee.idOrigine) msg += ressourcePostee.origine + '/' + ressourcePostee.idOrigine
        else msg += ressourcePostee.oid
        log.perf(context.response, msg)
      }

      log.debug('post /api/ressource a reçu', ressourcePostee, 'api', {max: 10000})
      // faut au moins être authentifié
      if (!$accessControl.isAuthenticated(context) && !$accessControl.hasAllRights(context)) {
        return $json.denied(context, 'Vous devez être authentifié pour ajouter une ressource')
      }
      // si y'a pas qqchose pour identifier une ressource existante, faut avoir les droits de création

      flow().seq(function () {
        const next = this
        // si y'à un rid sans oid on traduit
        if (ressourcePostee.rid) {
          const [baseId, oid] = getRidComponents(ressourcePostee.rid)
          if (baseId !== myBaseId) return next(new Error(`Cette ressource doit être enregistrée sur ${baseId} et non ici`))
          if (ressourcePostee.oid && ressourcePostee.oid !== oid) return next(new Error(`oid ${ressourcePostee.oid} et rid ${ressourcePostee.rid} incohérents`))
          ressourcePostee.oid = oid
        }
        // faut la charger, ne serait-ce que pour savoir si elle existe
        if (ressourcePostee.oid) { // par oid
          $ressourceRepository.load(ressourcePostee.oid, next)
        } else if (ressourcePostee.origine && ressourcePostee.idOrigine) { // ou par origine/idOrigine
          $ressourceRepository.loadByOrigin(ressourcePostee.origine, ressourcePostee.idOrigine, next)
        } else {
          if (!ressourcePostee.origine) ressourcePostee.origine = myBaseId
          // l'idOrigine n'est pas obligatoire si c'est une création ici ($ressourceRepository.save créera une clé si besoin
          if (ressourcePostee.origine !== myBaseId && !ressourcePostee.idOrigine) {
            log.debug('ressource postée invalide', ressourcePostee)
            next(new Error('Il faut fournir oid ou au moins origine'))
          } else {
            next()
          }
        }
      }).seq(function (_ressourceBdd) {
        ressourceBdd = _ressourceBdd
        if (log.perf) log.perf(context.response, 'loaded')
        const errMsg = ressourceBdd
          ? $accessControl.getDeniedMessage('update', context, ressourceBdd)
          : $accessControl.getDeniedMessage('create', context, ressourcePostee)
        if (errMsg) return $json.denied(context, errMsg)
        if (ressourceBdd) log.debug(`auteurs venant de la bdd ${ressourceBdd.auteurs.join(' ')}, version ${ressourceBdd.version}`)
        // on ajoute la catégorie si y'en a pas et qu'on peut la déduire
        const tt = ressourcePostee.type
        if (!ressourcePostee.categories && tt) ressourcePostee.categories = configRessource.categoriesToTypes[tt]

        // le contenu est partiel si on le réclame ou si on a oid (ou idOrigine) sans titre ni catégorie
        let partial = !!context.get.partial
        if (!partial && !ressourcePostee.titre && !ressourcePostee.categories) {
          partial = (ressourcePostee.oid || (ressourcePostee.origine && ressourcePostee.idOrigine))
        }
        const data = partial ? Object.assign({}, ressourceBdd, ressourcePostee) : ressourcePostee
        $ressourceControl.valideRessourceFromPost(data, this)
      }).seq(function (cleanData) {
        log.debug(`après valide ${cleanData.auteurs && cleanData.auteurs.join(' ')}, version ${cleanData.version}`)
        // la ressource est cohérente, ou avec errors/warnings et c'est writeAndOut qui gèrera
        const groupesSup = ressourcePostee.hasOwnProperty('_groupesSup') ? ressourcePostee._groupesSup : ''
        $personneControl.checkGroupes(context, ressourceBdd, cleanData, groupesSup, this)
      }).seq(function (cleanData) {
        log.debug(`après checkGroupes ${cleanData.auteurs && cleanData.auteurs.join(' ')}, version ${cleanData.version}`)
        // on ajoute le user courant pour serie et sequenceModele,
        // pas encore pour tous les types par crainte d'effets de bords pas prévus…
        if (pid && (cleanData.type === 'serie' || cleanData.type === 'sequenceModele')) {
          cleanData.auteurs = [pid]
        }
        $personneControl.checkPersonnes(context, ressourceBdd, cleanData, this)
      }).seq(function (cleanData) {
        // on màj ressourceBdd par simplicité (ça évitera aussi de recréer une entity en cas d'update)
        if (ressourceBdd) update(ressourceBdd, cleanData)
        else ressourceBdd = cleanData
        writeAndOut(context, ressourceBdd)
      }).catch(function (error) {
        $json.send(context, error)
      })
    }

    /**
     * Ajoute des relations à une ressource
     * @private
     * @param {Context} context
     */
    function postRessourceAddRelations (context) {
      context.timeout = 5000
      if (context.perf) {
        let msg = 'start-'
        if (context.post.origine && context.post.idOrigine) msg += context.post.origine + '/' + context.post.idOrigine
        else msg += context.post.oid
        log.perf(context.response, msg)
      }
      log.debug('post /api/ressource/addRelations a reçu', context.post, 'api')
      const relations = context.post.relations
      if (!relations || !relations.length) return $json.send(context, new Error('relations manquantes'))
      const id = extractId(context)
      if (!id) return $json.send(context, new Error("pas d'identifiant de ressource"))

      $ressourceRepository.load(id, function (error, ressource) {
        if (error) return $json.send(context, error)
        if (!ressource) return $json.notFound(context, `La ressource ${id} n’existe pas`)
        if (!$accessControl.hasPermission('update', context, ressource)) return $json.denied(context, 'Vous n’avez pas les droits suffisants pour modifier cette ressource')
        const errors = $ressourceConverter.addRelations(ressource, relations)
        // rien changé
        if (errors === false) $json.sendOk(context, {oid: ressource.oid})
        // y'a eu des erreurs lors de l'ajout
        else if (errors.length) $json.send(context, errors)
        // ni l'un ni l'autre, faut sauvegarder
        else writeAndOut(context, ressource)
      })
    }

    /**
     * Demande d'update des arbres contenant une Ref
     * @param context
     * @returns {*}
     */
    function postRessourceExternalUpdate (context) {
      log.debug('externalUpdate avec', context.post)
      if (!$accessControl.hasAllRights(context)) return $json.denied(context)
      try {
        if (!context.post.ref) return $json.sendError(context, 'ref manquante')
        const ref = new Ref(context.post.ref)
        if (!ref.aliasOf) return $json.sendError(context, 'aliasOf manquant')
        if (!ref.titre) return $json.sendError(context, 'titre manquant')
        if (!ref.type) return $json.sendError(context, 'type manquant')
        $ressourceRepository.updateParent(ref, function (error, nbArbres) {
          if (error) {
            log.error(error)
            $json.sendError(context, error)
          } else {
            $json.sendOk(context)
          }
          // si aucun arbre n'a été mis à jour, c'est qu'on est enregistré pour cette ref sur sa sesatheque
          // mais qu'on ne l'utilise plus, faut virer le listener pour éviter que ça ne se reproduise.
          if (nbArbres === 0) {
            log.dataError(`On nous a averti d’une modif de ${ref.aliasOf} mais plus aucune ressource ici ne la référence, on vire le listener`)
            $ressourceRemote.unregister([ref.aliasOf], log.error)
          }
        })
      } catch (error) {
        log.error(error)
        $json.sendError(context, error)
      }
    }

    /**
     * Register ou unregister une EntityExternalRef
     * @private
     * @param context
     */
    function postRessourceRegisterListener (context) {
      log.debug('registerListener avec', context.post)
      if (!$accessControl.hasAllRights(context)) return $json.denied(context)
      const {action, baseId, rids} = context.post
      if (!action) return $json.sendError(context, 'action manquante')
      if (!baseId) return $json.sendError(context, 'baseId manquante')
      if (!rids || !rids.length) return $json.sendError(context, 'rids manquant')

      // ajouter un listener (pour prévenir baseId que rid a changé)
      if (action === 'add') {
        const warnings = []
        // on regarde si on l'a pas déjà
        flow(rids).seqEach(function (rid) {
          const nextRid = this
          // on vérifie que ça nous concerne
          const ownerBaseId = getBaseIdFromRid(rid)
          if (ownerBaseId !== myBaseId) {
            warnings.push(`Impossible de s’enregistrer sur ${myBaseId} pour une ressource qui est gérée par ${ownerBaseId} (pour ${rid})`)
            nextRid()
          }
          EntityExternalRef
            .match('baseId').equals(baseId)
            .match('rid').equals(rid)
            .grabOne(function (error, externalRef) {
              if (error) return nextRid(error)
              if (externalRef) {
                warnings.push(`${rid} avait déjà un listener pour ${baseId} sur ${myBaseId}`)
                return nextRid()
              }
              // faut la créer
              EntityExternalRef.create({baseId, rid}).store(nextRid)
            })
        }).seq(function () {
          $json.sendOk(context, warnings.length ? {warnings} : {})
        }).catch(function (error) {
          $json.sendError(context, error)
        })

        // retirer un listener (car baseId ne référence plus rid)
      } else if (action === 'remove') {
        const warnings = []
        let i = 0 // pour savoir à quel rid correspond le tableau externalRefs
        flow(rids).seqEach(function (rid) {
          log.debug('remove listener pour ' + rid)
          EntityExternalRef
            .match('baseId').equals(baseId)
            .match('rid').equals(rid)
            .grab(this)
          // seqEach car chaque rid fait un grab qui remonte un tableau de externalRefs
        }).seqEach(function (externalRefs) {
          log.debug(`remove ${rids[i]} remonte les extRefs`, externalRefs)
          if (externalRefs.length) {
            if (externalRefs.length > 1) {
              const msg = `Il y avait ${externalRefs.length - 1} doublon(s) exernalRef pour ${baseId} sur ${externalRefs[0].rid} (tous supprimés)`
              log.dataError(msg)
              warnings.push(msg)
            }
            externalRefs.forEach(er => er.delete(log.error))
          } else {
            warnings.push(`Aucun listener pour le rid ${rids[i]}`)
          }
          i++
          this()
        }).seq(function () {
          $json.sendOk(context, warnings.length ? {warnings} : {})
        }).catch(function (error) {
          $json.sendError(context, error)
        })
      } else {
        $json.sendError(context, `action ${context.post.action} inconnue (add|remove)`)
      }
    }

    /**
     * Retourne un array pour jstree
     * @private
     * @param {Context} context
     * @param error
     * @param data
     */
    function sendJsonJstreeArray (context, error, data) {
      let errorMsg
      if (error) {
        errorMsg = (typeof error === 'string') ? error : error.toString()
        $json.send(context, null, {arrayOnly: [{text: 'Erreur : ' + errorMsg}]})
      } else if (!Array.isArray(data)) {
        log.error(new Error("sendJsonJstreeArray appelé avec autre chose qu'un array"))
        $json.send(context, null, data)
      } else {
        log.debug('sendJson va renvoyer le tableau', data, 'api')
        $json.send(context, null, {arrayOnly: data})
      }
    }

    /**
     * Envoie une liste de ressources (en filtrant d'après les droits en lecture)
     * @private
     * @param {Context} context
     * @param error
     * @param ressources
     */
    function sendListe (context, error, ressources) {
      if (error) return $json.send(context, error)
      const liste = []
      const reponse = {liste}
      if (ressources && ressources.length) {
        // construction de nextUrl
        if (ressources.length === listeMax) {
          const skip = context.get.skip || 0
          reponse.nextUrl = myBaseUrl + url.update(context.request.originalUrl, {skip})
        }
        // on regarde le format reçu en get ou post
        const format = context.post.format || context.get.format
        ressources.forEach(function (ressource) {
          if (!$accessControl.hasReadPermission(context, ressource)) return log.debug(`ressource ${ressource.oid} virée de la liste car pas de droit en lecture`)
          const item = (format === 'full') ? ressource : new Ref(ressource)
          if (ressource.type === 'sequenceModele' && format !== 'full') {
            // on rajoute les parametres pour les sequenceModele
            item.parametres = ressource.parametres
          }
          item.$droits = ''
          if ($accessControl.hasPermission('update', context, ressource)) item.$droits += 'W'
          if ($accessControl.hasPermission('delete', context, ressource)) item.$droits += 'D'
          liste.push(item)
        })
      }
      $json.sendOk(context, reponse)
    }

    /**
     * Renvoie la ressource (ou l'erreur) après avoir vérifié les droits, complète ou au format de context.get.format (avec ref ça ajoute les droits)
     * @private
     * @param {Context} context
     * @param error
     * @param ressource
     */
    function sendRessource (context, error, ressource) {
      if (error) return $json.send(context, error)
      if (!ressource) return $json.notFound(context, 'Cette ressource n’existe pas.')
      if (!$accessControl.hasReadPermission(context, ressource)) return $json.denied(context)
      const format = context.get.format
      if (format === 'ref') {
        const ref = new Ref(ressource)
        // avec ajout des droits
        ref.$droits = 'R'
        if ($accessControl.hasPermission('update', context, ressource)) ref.$droits += 'W'
        if ($accessControl.hasPermission('delete', context, ressource)) ref.$droits += 'D'
        $json.send(context, null, ref)
      } else if (format === 'full') {
        $ressourceConverter.enhance(ressource, (error, ressource) => {
          if (error) return $json.send(context, error)
          log.debug('ressource full', ressource, 'aVirer', {max: 10000})
          $json.send(context, null, ressource)
        })
      } else {
        $json.send(context, null, ressource)
      }
    }

    /**
     * Si la ressource contient des erreurs les renvoie, sinon l'enregistre et sort avec oid et warnings éventuels
     * ou le ?format= demandé (ref ou normalized, le reste donnant la ressource complète)
     * @private
     * @param {Context} context
     * @param ressource
     */
    function writeAndOut (context, ressource) {
      if (!_.isEmpty(ressource.$errors)) return $json.send(context, ressource.$errors)
      $ressourceRepository.save(ressource, function (error, ressource) {
        if (error) return $json.send(context, error)
        log.perf(context.response, 'written')
        if (context.get.format) {
          // on veut la ressource formatée, sendRessource le gère
          sendRessource(context, null, ressource)
        } else {
          // on ne renvoie que l'oid et des warnings éventuels
          const data = {oid: ressource.oid}
          if (!_.isEmpty(ressource.$warnings)) {
            data.warnings = ressource.$warnings
          }
          $json.send(context, null, data)
        }
      })
    }

    /**
     * Met éventuellement à jour un titre bateau si on en a un meilleur (asynchrone, lance la màj en bdd et rend la main)
     * @param ressource
     * @param newTitre
     */
    /*
     function updateTitre(ressource, newTitre) {
       // on regarde si l'arbre nous apporte un titre que l'on aurait pas
       if (newTitre) {
         //noinspection SwitchStatementWithNoDefaultBranchJS
         switch (ressource.titre) {
               // titres par défaut mis par importMEPS
               case 'Exercice mathenpoche':
               case 'Aide mathenpoche':
               // titres par défaut mis par importLabomep
               case 'Message ou question':
               case 'Figure TracenPoche':
               case 'Test diagnostique':
               case 'Opération posée':
               case 'Exercice avec la calculatrice cassée':
               case 'Figure GeoGebra':
               case 'Page externe':
               case 'Exercice de calcul mental':
               case 'Animation interactive':
               case 'QCM interactif':
               case 'Exercice corrigé':
               case 'QCM':
               case 'Animation instrumenpoche':
               case 'Titre manquant':
               case 'Parcours interactif':
               case "Test diagnostique d'algèbre":
               case 'Exercice Calcul@TICE':
                 // on sauvegarde le nouveau titre
                 log.debug('titre de ' +ressource.oid +' changé : ' +ressource.titre +' => ' +newTitre)
                 ressource.titre = newTitre
                 $ressourceRepository.save(ressource) // pas de next, on laisse comme c'était si ça plante
             }
       }
     } /* */

    const controller = this

    const listeMax = configRessource.limites.listeMax
    if (!listeMax) throw new Error('settings.ressource.limites.listeMax manquant')

    /**
     * Passe au suivant pour toutes les requetes OPTIONS (traitées par le middleware cors)
     * @route OPTIONS /api/*
     */
    controller.options('*', function (context) {
      log.debug('headers de la requete options', context.request.headers, 'xhr', {max: 5000, indent: 2})
      // on laisse le middleware CORS faire son boulot
      context.next()
    })

    /**
     * Retourne la baseId d'une baseUrl (sesatheque ou sesalab)
     * @route GET /api/baseId?baseUrl=xxx
     */
    controller.get('baseId', function (context) {
      const baseUrl = context.get.baseUrl
      if (!baseUrl) return $json.sendError(context, 'baseUrl manquante')
      // on cherche d'abord dans les sesalabs
      const sesalab = config.sesalabs.find(sesalab => sesalab.baseUrl === baseUrl)
      if (sesalab) {
        if (sesalab.baseId) return $json.sendOk(context, {baseId: sesalab.baseId, type: 'sesalab'})
        log.error('pb de sesalab en configuration sans baseId', sesalab)
        return $json.sendError(context, 'Problème de configuration de la Sésathèque')
      }
      // c'est pas un sesalab, on cherche une sésathèque
      const baseId = getBaseId(baseUrl, null)
      if (baseId) return $json.sendOk(context, {baseId, type: 'sesatheque'})
      $json.sendError(context, `baseUrl ${baseUrl} inconnue`)
    })

    /**
     * Clone une ressource de la bibli courante en mettant l'utilisateur courant contributeur, avec publié et privé
     * Retourne {@link reponseRessourceOid}
     * La route devrait être /api/ressource/clone/:oid, mais on a déjà une route
     * qui match 2 arguments après ressource (ressource/:origine/:idOrigine)
     * donc on utilise l'action en premier
     * @route GET /api/clone/:oid
     */
    controller.get('clone/:oid', function (context) {
      const {oid} = context.arguments
      const pid = $accessControl.getCurrentUserPid(context)
      if (!pid) return $json.denied(context, 'Vous devez être authentifié pour cloner une ressource')
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) return $json.send(context, error)
        if (!ressource) return $json.notFound(context, `La ressource ${oid} n’existe pas`)
        if (!$accessControl.hasReadPermission(context, ressource)) return $json.denied(context, `Vous n’avez pas les droits suffisant pour lire la ressource ${oid}`)
        // droits ok, 2 cas suivant editable ou pas
        if (configRessource.editable[ressource.type]) {
          // editable on duplique
          delete ressource.oid
          delete ressource.rid
          delete ressource.idOrigine
          ressource.origine = config.application.baseId
          // faut mettre le user en auteur sinon il aura pas le droit de supprimer
          if (ressource.auteurs.indexOf(pid) < 0) ressource.auteurs.push(pid)
          // on laisse publie et restriction à l'identique
          // modif du titre
          ressource.titre += ' (copie)'
          // ajout de la relation avec la ressource originale
          if (!ressource.relations) ressource.relations = []
          ressource.relations.push([configRessource.constantes.relations.estVersionDe, ressource.rid])
          $ressourceRepository.save(ressource, function (error, ressource) {
            if (error) return $json.sendError(context, error)
            if (!ressource || !ressource.oid) return $json.send(context, new Error('L’enregistrement de la ressource a échoué'))
            $json.sendOk(context, {oid: ressource.oid})
          })
        } else {
          // pas éditable, on crée un alias, mais on regarde si on en a pas déjà un pour cette ressource et ce user
          $ressourceRepository.loadByAliasAndPid(myBaseId + '/' + oid, pid, function (error, alias) {
            if (error) return $json.sendError(context, error.toString())
            if (alias) return $json.sendOk(context, {oid: alias.oid})
            // faut le créer
            const data = {}
            ;['titre', 'type', 'categories', 'publie', 'restriction', 'cle'].forEach((p) => {
              data[p] = ressource[p]
            })
            data.aliasOf = myBaseId + '/' + ressource.oid
            data.auteursParents = ressource.auteurs
            data.auteurs = [pid]
            alias = EntityRessource.create(data)
            alias.store(function (error, ressAlias) {
              if (error) return $json.sendError(context, error)
              if (!ressAlias || !ressAlias.oid) return $json.sendError(context, new Error('L’enregistrement de l’alias a échoué'))
              $json.sendOk(context, {oid: ressAlias.oid})
            })
          })
        }
      })
    })

    /**
     * Crée un alias de ressource en mettant l'utilisateur courant en auteur (de l'alias)
     * (sinon il pourra pas le supprimer)
     * Ne deviendra une vraie ressource clonée que si on l'édite
     * Retourne {@link Ref}
     * Utiliser la méthode sesatheque-client:cloneItem
     * @route GET /api/externalClone/:baseId/:oid
     */
    controller.get('externalClone/:baseId/:oid', function (context) {
      const {baseId, oid} = context.arguments
      const rid = `${baseId}/${oid}`
      const myBaseId = config.application.baseId
      const pid = $accessControl.getCurrentUserPid(context)
      flow().seq(function () {
        if (!pid) return this(new Error('Vous devez être authentifié pour créer une ressource'))
        // on accepte de cloner une ressource locale ou d'une sésathèque connue
        if (baseId === myBaseId || config.sesatheques.some(({baseId: id}) => id === baseId)) {
          $ressourceFetch.fetchOriginal(rid, this)
        } else {
          this(new Error(`La sésathèque ${baseId} n'est pas déclarée comme source possible de cette sésathèque`))
        }
      }).seq(function (ressource) {
        log.debug('externalClone a récupéré la ressource', ressource, 'clone', {max: 5000, indent: 2})
        // on passe par Ref pour filtrer ce qu'on garde (pour un alias, seulement ce que ref utilise)
        const aliasData = new Ref(ressource)
        // on récupère les auteursParents d'origine que l'on cumule avec les auteurs de l'original
        aliasData.auteursParents = (ressource.auteursParents || []).concat(ressource.auteurs || [])
        aliasData.auteurs = [pid]
        aliasData.origine = config.application.baseId
        aliasData.dateCreation = new Date()
        // important sinon une ressource non restreinte mais pas publiée se retrouverait avec un alias public,
        // et ça afficherait des pbs de droits à la consultation
        aliasData.publie = ressource.publie
        aliasData.restriction = ressource.restriction
        // la relation vers l'original est inutile pour un alias,
        // elle sera ajoutée lors de l'édition de cette alias (qui deviendra une ressource),
        // mais on doit conserver les autres relations
        if (ressource.relations && ressource.relations.length) aliasData.relations = ressource.relations
        $ressourceRepository.save(aliasData, this)
      }).seq(function (ressAlias) {
        const refAlias = new Ref(ressAlias)
        // le user courant peut toujours effacer l'alias
        refAlias.$droits = 'D'
        // modif autorisée sur les ressources éditables seulement
        // (qui deviendront à l'édition des ressources dérivées et plus des alias)
        if (configRessource.editable[refAlias.type]) refAlias.$droits += 'W'
        // le context.json de lassi filtre les propriétés $ au 1er niveau, on ajoute un niveau (ici la propriété clone)…
        $json.send(context, null, {clone: refAlias})
      }).catch(function (error) {
        $json.sendError(context, error.toString())
      })
    })

    /**
     * Loggue un user d'un sesalab localement, répond {success:true} ou {success:false, error:"message d'erreur"}
     * Dupliqué dans app/personne/controllerPersonne.js en html
     * @Route POST /api/connexion
     * @param {string} origine L'url de la racine du sesalab appelant (qui doit être déclaré dans le config de la sésathèque), avec préfixe http ou https
     * @param {string} token   Le token de sesalab qui servira à récupérer le user
     */
    controller.get('connexion', function (context) {
      const token = context.get.token
      let origine = context.get.origine
      const timeout = 5000
      if (token && origine) {
        if (origine.substr(-1) !== '/') origine += '/'
        if (config.sesalabsByOrigin[origine]) {
          const postOptions = {
            url: origine + 'api/utilisateur/check-token',
            json: true,
            content_type: 'charset=UTF-8',
            timeout: timeout,
            form: {
              token: token
            }
          }
          // on ne garde que le nom de domaine en origine
          const domaine = /https?:\/\/([a-z.0-9]+(:[0-9]+)?)/.exec(origine)[1] // si ça plante fallait pas mettre n'importe quoi en config
          request.post(postOptions, function (error, response, body) {
            if (error) {
              $json.send(context, error)
            } else if (body.error) {
              $json.send(context, new Error(body.error))
            } else if (body.ok && body.utilisateur) {
              // on peut connecter
              $accessControl.loginFromSesalab(context, body.utilisateur, domaine, function (error) {
                log.debug('dans cb loginFromSesalab on a en session', context.session.user)
                if (error) $json.send(context, error)
                else $json.sendOk(context, {random: +new Date()})
              })
            } else {
              const msg = 'réponse du sso sesalab incohérente (ko sans erreur) sur ' + postOptions.url
              error = new Error(msg)
              log.error(error)
              log.debug(msg, body)
              $json.send(context, error)
            }
          })
        } else {
          $json.send(context, new Error('Origine ' + origine + 'non autorisée à se connecter ici'))
        }
      } else {
        $json.send(context, new Error('token ou origine manquant'))
      }
    })

    /**
     * Déconnecte l'utilisateur courant
     * @route GET /api/deconnexion
     */
    controller.get('deconnexion', function (context) {
      if ($accessControl.isAuthenticated(context)) {
        $accessControl.logout(context)
        $json.sendOk(context)
      } else {
        $json.sendOk(context, {warning: 'Utilisateur non connecté'})
      }
    })

    /**
     * Une route pour mathgraph qui répond en plain/text
     * @route POST /api/action/mathgraph/:token
     */
    controller.post('action/mathgraph/:token', function (context) {
      function sendError (error) {
        // si on passe une string, c'est juste une info pour le client mg32 desktop
        if (typeof error === 'string') return context.plain(`Erreur : ${error}`)
        if (error.stack) log.error(error)
        context.status = 500
        context.plain('Erreur : ' + error.toString())
      }

      $ressourceRepository.getDeferred(context.arguments.token, function (error, data) {
        if (error) return sendError(error)
        if (!data) {
          context.status = 404
          return sendError('jeton invalide ou périmé')
        }
        if (data.action !== 'saveRessource' || !data.oid) return sendError(new Error('jeton valide mais données impossibles à traiter'))
        // on peut traiter
        $ressourceRepository.load(data.oid, function (error, ressource) {
          if (error) return sendError(error)
          if (!ressource) {
            context.status = 404
            return sendError(`la ressource d’identifiant ${data.oid} n’existe pas (ou plus)`)
          }
          if (ressource.type !== 'mathgraph') return sendError(`cette ressource n’est pas de type mathgraph (${ressource.type})`)
          if (!context.post.base64) return sendError('impossible de trouver une figure dans les données envoyées')
          // on ne vérifie pas les droits, on l'a fait à la mise en cache, et ici on a probablement pas de session
          log.debug(`la ressource ${data.oid} avait la figure\n${ressource.parametres.figure}\nque l’on remplace par\n${context.post.base64}`)
          ressource.parametres.figure = context.post.base64
          $ressourceRepository.save(ressource, function (error, ressource) {
            if (error) sendError(error)
            else if (ressource) context.plain('La figure de la ressource ' + data.oid + ' a bien été mise à jour')
            else sendError(new Error('Le save de la ressource ' + data.oid + ' ne remonte ni erreur ni ressource'))
          })
        })
      })
    })

    /**
     * Forward un post vers un sesalab (au unload on ne peut pas poster en crossdomain,
     * on le fait en synchrone ici qui fera suivre)
     * @Route POST /api/deferPost
     */
    controller.post('deferPost', function (context) {
      // on accepte du json en text/plain (pour le sendBeacon au unload)
      const data = (typeof context.post === 'string') ? parse(context.post) : context.post
      log.debug('deferPost appelé avec', data)
      if (typeof data.deferUrl !== 'string') {
        return $json.send(context, new Error('Il faut poster une url via deferUrl'))
      }

      const url = data.deferUrl
      delete data.deferUrl

      // on peut nous envoyer en sync des messages pour notifyError
      if (url === '/api/notifyError') {
        notifyError(data)
        return $json.sendOk(context)
      }

      if (!config.sesalabs.some((sesalab) => url.indexOf(sesalab.baseUrl) === 0)) {
        const error = new Error(`deferPost appelé pour faire suivre à ${url} qui n’est pas dans les sesalab autorisés`)
        return $json.send(context, error)
      }

      const postOptions = {
        url: url,
        json: true,
        content_type: 'charset=UTF-8',
        timeout: 3000,
        headers: {
          'Cookie': context.request.cookies
        },
        form: context.post
      }
      request.post(postOptions, function (error, response, body) {
        if (error) return $json.sendError(error)
        log.debug('deferPost, après envoi vers ' + postOptions.url + ' de ', postOptions.form)
        log.debug('on récupère la réponse', response)
        log.debug('on récupère et le body', body)
        // si on renvoie rien ça donne une erreur 500 en timeout,
        // context.next() donnerait une 404 car pas de contenu
        $json.sendOk(context)
      })
    })

    /**
     * Une url pour envoyer des notifications d'erreur, à priori par un client
     * qui trouve des incohérences dans ce qu'on lui a envoyé
     * @Route POST /api/notifyError
     */
    controller.post('notifyError', function (context) {
      notifyError(context.post)
      $json.sendOk(context)
    })

    /**
     * Récupère un arbre au format jstree (cf le plugin arbre pour un exemple d'utilisation)
     * @route GET /api/jstree?ref=xx[&children=1]
     * @param {string} ref        Un oid ou origine/idOrigine
     * @param {string} [children] Passer 1 pour ne récupérer que les enfants
     */
    controller.get('jstree', function (context) {
      const id = context.get.rid || context.get.aliasOf || context.get.id || context.get.oid
      const onlyChildren = !!context.get.children
      if (id) {
        $ressourceRepository.load(id, function (error, ressource) {
          if (error) {
            sendJsonJstreeArray(context, error)
          } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
            // on ajoute baseId s'il n'y est pas
            if (!ressource.baseId) ressource.baseId = config.application.baseId
            if (onlyChildren) {
              if (ressource.type === 'arbre') {
                const jstData = getJstreeChildren(ressource)
                // log.debug('à partir de', ressource, 'avirer', {max: 5000, indent: 2})
                // log.debug('on récupère les enfants', jstData, 'avirer', {max: 5000, indent: 2})
                sendJsonJstreeArray(context, null, jstData)
              } else {
                sendJsonJstreeArray(context, "impossible de réclamer les enfants d'une ressource qui n'est pas un arbre")
              }
            } else {
              const jstData = toJstree(ressource)
              sendJsonJstreeArray(context, null, [jstData]) // il veut toujours un Array (liste d'élément), ici le root
            }
          } else {
            sendJsonJstreeArray(context, 'la ressource ' + id + " n’existe pas ou vous n'avez pas suffisamment de droits pour y accéder")
          }
        })
      } else {
        sendJsonJstreeArray(context, 'il faut fournir un id de ressource')
      }
    })

    /**
     * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin.
     * Retourne {@link reponseListe}
     * @route GET /api/liste/all
     * @param {requeteListe}
     */
    controller.get('liste/all', getListeAll)
    /**
     * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin
     * Retourne {@link reponseListe}
     * @route POST /api/liste/all
     * @param {requeteListe}
     */
    controller.post('liste/all', getListeAll)
    /**
     * Ajoute aux headers cors habituels le header
     * Access-Control-Allow-Methods', 'POST, OPTIONS'
     * @route OPTIONS /api/liste/all
     */

    /**
     * Récupère les ressources d'une liste de pids, classée par pid (avec prénom & nom du pid)
     * Retourne {@link reponseListesByPid}
     * @route GET /api/liste/auteurs
     * @param {string} pids la liste de pids séparés par des virgules
     */
    controller.get('liste/auteurs', getListeAuteurs)

    /**
     * Récupère la liste des ressources d'un groupe
     * Retourne {@link reponseListe}
     * @route GET /api/liste/groupe/:nom
     */
    controller.get('liste/groupe/:nom', function (context) {
      const options = {
        limit: context.get.limit,
        skip: context.get.skip || 0
      }
      $ressourceRepository.getListe('groupe/' + context.arguments.nom, options, function (error, ressources) {
        sendListe(context, error, ressources)
      })
    })

    /**
     * Cherche parmi les ressources du user courant (qui doit être connecté avant)
     * Retourne {@link reponseListe}
     * @route GET /api/liste/perso
     * @param {requeteListe}
     */
    controller.get('liste/perso', getListePerso)
    /**
     * Cherche parmi les ressources du user courant (qui doit être connecté avant), retourne {@link reponseListe}
     * @route POST /api/liste/perso
     * @param {requeteListe}
     */
    controller.post('liste/perso', getListePerso)
    /**
     * Pour le preflight, ajoute les headers allow… si autorisé
     * @route OPTIONS /api/liste/perso
     * @param {requeteListe}
     */

    /**
     * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
     * @route GET /api/liste/prof
     * @param {requeteListe}
     */
    controller.get('liste/prof', getListeProf)
    /**
     * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
     * @route POST /api/liste/prof
     * @param {requeteListe}
     */
    controller.post('liste/prof', getListeProf)
    /**
     * Pour le preflight, ajoute aux headers cors habituels le header
     *   Access-Control-Allow-Methods:POST OPTIONS
     * @route OPTIONS /api/liste/prof
     */

    /**
     * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
     * @route GET /api/liste/public
     * @param {requeteListe}
     */
    controller.get('liste/public', getListePublic)
    /**
     * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
     * @route POST /api/liste/public
     * @param {requeteListe}
     */
    controller.post('liste/public', function (context) {
      grabListe(context, 'public')
    })
    /**
     * Pour le preflight, ajoute aux headers cors habituels le header
     *   Access-Control-Allow-Methods: POST OPTIONS
     * @route OPTIONS /api/liste/public
     */

    /**
     * Retourne la ressource publique et publiée (sinon 404) d'après son oid, accepte ?format=(alias|normalized)
     * Retourne {@link reponseListe}
     * @route GET /api/public/:oid
     * @param {Integer} :oid
     */
    controller.get('public/:oid', function (context) {
      const {oid} = context.arguments
      if (oid === 'getRid') return context.next() // c'est pas pour nous
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) return $json.send(context, error)
        if (!ressource) return $json.notFound(context, `La ressource ${oid} n’existe pas`)
        if ($accessControl.isPublic(ressource)) return sendRessource(context, null, ressource)
        $json.denied(context, `La ressource ${oid} n’est pas publique`)
      })
    })

    /**
     * Retourne la ressource publique et publiée (sinon 404) d'après son id d'origine, accepte ?format=(alias|normalized)
     * Retourne {@link reponseRessource}
     * @route GET /api/public/:origine/:idOrigine
     * @param {string} :origine
     * @param {string} :idOrigine
     */
    controller.get('public/:origine/:idOrigine', function (context) {
      const {idOrigine, origine} = context.arguments
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) $json.send(context, error)
        else if (ressource && ressource.restriction === 0) sendRessource(context, null, ressource)
        else if (ressource) $json.denied(context, `La ressource ${origine}/${idOrigine} n’est pas publique`)
        else $json.notFound(context, `La ressource ${origine}/${idOrigine} n’existe pas`)
      })
    })

    /**
     * Retourne le rid d'une ressource (même privée, juste pour avoir la correspondance
     * origine/idOrigine => rid ou vérifier que l'id existe)
     * @route GET /api/public/getRid?id=xxx
     */
    controller.get('public/getRid', function (context) {
      let id = context.get.id
      if (id) {
        const slashPos = id.indexOf('/')
        const debut = id.substr(0, slashPos)
        if (debut === myBaseId) id = id.substr(slashPos + 1)
        $ressourceRepository.load(id, function (error, ressource) {
          if (error) $json.sendError(context, error.toString())
          else if (ressource) $json.sendOk(context, {rid: ressource.rid})
          else $json.sendOk(context, {rid: null, error: 'pas de ressource ' + id})
        })
      } else {
        $json.sendError(context, 'id manquant')
      }
    })

    /**
     * Denied (rerouting interne ressource => public si on a ni session ni token)
     * @internal
     * @route DEL /api/public/:origine/:idOrigine
     */
    controller.delete('public/:origine/:idOrigine', function (context) {
      $json.denied(context, 'droits insuffisant pour effacer cette ressource')
    })

    /**
     * Denied (rerouting interne ressource => public si on a ni session ni token)
     * @internal
     * @route DEL /api/public/:oid
     */
    controller.delete('public/:oid', function (context) {
      $json.denied(context, 'droits insuffisant pour effacer cette ressource')
    })

    /**
     * Create / update une ressource
     * Prend un objet ressource, éventuellement incomplète mais oid ou origine/idOrigine sont obligatoires
     * Si le titre et la catégorie sont manquants, ou que l'on passe ?merge=1 à l'url, ça merge avec la ressource
     * existante que l'on update, sinon on écrase (ou on créé si elle n'existait pas)
     *
     * Retourne {@link reponseRessourceOid} ou {@link Ref} si on le réclame avec ?format=ref
     * @route POST /api/ressource
     * @param {object} Les propriétés de la ressource
     */
    controller.post('ressource', postRessource)
    /**
     * Pour le preflight, ajoute aux headers cors habituels le header
     *   Access-Control-Allow-Methods:POST OPTIONS
     * @route OPTIONS /api/ressource
     */

    /**
     * Retourne la ressource d'après son oid (si on a les droit de lecture dessus), accepte ?format=(alias|normalized)
     * Au format {@link reponseRessource} ou {@link Ref} si on le réclame avec ?format=ref
     * @Route GET /api/ressource/:oid
     * @param {Integer} oid
     */
    controller.get('ressource/:oid', function (context) {
      $ressourceRepository.load(context.arguments.oid, function (error, ressource) {
        sendRessource(context, error, ressource)
      })
    })

    /**
     * Fork un alias et retourne la ressource créée (qui conserve l'oid de l'alias)
     * @route GET /api/forkAlias/:oid
     */
    controller.get('forkAlias/:oid', function (context) {
      const myPid = $accessControl.getCurrentUserPid(context)
      if (!myPid) return $json.denied(context, 'Vous devez être authentifié pour dupliquer un alias')

      flow()
        .seq(function () {
          $ressourceRepository.load(context.arguments.oid, this)
        })
        .seq(function (ressource) {
          if (!ressource) return $json.notFound(context, `La ressource n'existe pas`)
          if (!$accessControl.hasReadPermission(context, ressource)) return $json.denied(context, 'Vous n’avez pas de droits suffisants pour dupliquer cette ressource')
          if (!ressource.aliasOf) $json.sendError(context, 'Cette ressource n’est pas un alias')

          $ressourceConverter.forkAlias(myPid, ressource, (error, forkedRessource) => {
            if (error) return $json.sendError(context, error)
            if (!forkedRessource) throw new Error('Une erreur s’est produite pendant la duplication de cet alias (forkAlias ne remonte ni erreur ni ressource')
            sendRessource(context, null, forkedRessource)
          })
        })
        .catch(function (error) {
          log.error(error)
          $json.sendError(context, error)
        })
    })

    /**
     * Retourne la ressource d'après son id d'origine (si on a les droit de lecture dessus), accepte ?format=(alias|normalized)
     * Au format {@link reponseRessource} ou {@link Ref} si on le réclame avec ?format=ref
     * @route GET /api/ressource/:origine/:idOrigine
     * @param {string} :origine
     * @param {string} :idOrigine
     */
    controller.get('ressource/:origine/:idOrigine', function (context) {
      const {idOrigine, origine} = context.arguments
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        sendRessource(context, error, ressource)
      })
    })

    /**
     * Delete ressource par oid, retourne {@link reponseDeleted}
     * @route DELETE /api/ressource/:oid
     * @param {Integer} oid
     */
    controller.delete('ressource/:oid', function (context) {
      deleteAndSend(context, context.arguments.oid)
    })
    controller.options('ressource/:oid', optionsDeleteOk)

    /**
     * Delete par id d'origine ou par rid, retourne {@link reponseDeleted}
     * @route DEL /api/ressource/:origine/:idOrigine
     * @param {string} :origine ou baseId si c'était un rid
     * @param {string} :idOrigine ou oid si c'était un rid
     */
    controller.delete('ressource/:origine/:idOrigine', function (context) {
      const rid = context.arguments.origine + '/' + context.arguments.idOrigine
      deleteAndSend(context, rid)
    })
    controller.options('ressource/:origine/:idOrigine', optionsDeleteOk)

    /**
     * Ajoute des relations à une ressource (pour identifier la ressource on accepte dans le post oid ou origine+idOrigine ou ref)
     * Retourne {@link reponseRessourceOid} ou {@link Ref} si on le réclame avec ?format=ref
     * @param {Integer} [oid]
     * @param {string} [origine]
     * @param {string} [idOrigine]
     * @param {string} [ref]
     * @param {Array} relations
     * @route POST /api/ressource/addRelations
     */
    controller.post('ressource/addRelations', postRessourceAddRelations)
    /**
     * Pour le preflight, ajoute aux headers cors habituels le header
     *   Access-Control-Allow-Methods:POST OPTIONS
     * @route OPTIONS /api/ressource/addRelations
     */

    /**
     * Permet à une autre sésathèque d'ajouter un listener ici pour être prévenu sur une modif d'une de nos ressource
     * @route POST /api/ressource/registerListener
     */
    controller.post('ressource/registerListener', postRessourceRegisterListener)

    /**
     * Pour poster une Ref afin de mettre à jour tous les éventuels arbres qui l'utilisent
     * @route POST /api/ressource/externalUpdate
     */
    controller.post('ressource/externalUpdate', postRessourceExternalUpdate)
  })
}

/**
 * Format de la réponse à une demande de suppression
 * @typedef reponseDeleted
 * @type {Object}
 * @property {boolean} success
 * @property {string}  [error] Message d'erreur éventuel (si success vaut false)
 * @property {string}  deleted L'id passé en argument (DEPRECATED, pour compatibilité avec les versions anterieures)
 */

/**
 * Format de la réponse à une demande de liste
 * @typedef reponseListe
 * @type {Object}
 * @property {boolean}                     success
 * @property {string}                      [error] Message d'erreur éventuel
 * @property {Ref[]|Ressource[]} liste   Une liste de Ref (ou de Ressource si on le demande)
 */

/**
 * Format de la réponse à une demande de liste
 * @typedef reponseListesByPid
 * @type {Object}
 * @property {boolean} success
 * @property {string}   [error] Message d'erreur éventuel
 * @property {string[]} [warnings] Éventuelle liste de warnings (auteurs inconnus)
 * @property {object}   pidXX   Objet contenant les ressources de pidXX
 * @property {string}   pidXX.pid   rappel de son pid
 * @property {string}   pidXX.label prénom & nom
 * @property {Ref[]}    pidXX.liste Ses ressources (lisibles par le demandeur)
 */

/**
 * La réponse à une demande de ressource
 * @typedef reponseRessource
 * @type {Object}
 * @property {boolean}   success
 * @property {string}    [error]        Message d'erreur éventuel
 * @property {string[]}  [warnings]     Avertissements éventuels sur la ressource (incohérences ne justifiant pas une erreur et le rejet de l'enregistrement)
 * @property {Integer}   oid
 * @property {string}    titre
 * @property {Integer[]} categories
 * @property {string}    type
 * @property … Autre propriétés d'une ressource
 */

/**
 * La réponse à un post pour enregistrer une ressource (ou une modif)
 * @typedef reponseRessourceOid
 * @type {Object}
 * @property {boolean}  success
 * @property {string}   [error]    Message d'erreur éventuel
 * @property {string[]} [warnings] Avertissements éventuels sur la ressource (incohérences ne justifiant pas une erreur et le rejet de l'enregistrement)
 * @property {Integer}  oid
 */

/**
 * Arguments à donner à une requête qui renvoie une liste de ressources
 * @typedef requeteListe
 * @type {Object}
 * @property {string}             [json]    Tous les paramètres qui suivent dans une chaîne json (GET seulement, ignoré en POST)
 * @property {requeteArgFilter[]} [filters] Les filtres à appliquer
 * @property {string}             [orderBy] Un nom d'index
 * @property {string}             [order]   Préciser 'desc' si on veut l'ordre descendant
 * @property {Integer}            [start]   offset
 * @property {Integer}            [nb]      Nombre de résultats voulus (Cf settings.ressource.limites.listeNbDefault, à priori 25),
 *                                          sera ramené à settings.ressource.limites.maxSql si supérieur (à priori 500)
 * @property {string}             [format]  ref|full par défaut on remonte les ressource au format {@link Ref}
 */

/**
 * Format d'un filtre à passer à une requete de demande de liste
 * @typedef requeteArgFilter
 * @type {Object}
 * @property {string} index  Le nom de l'index
 * @property {Array}  [values] Une liste de valeurs à chercher (avec des ou), remontera toutes les ressource ayant l'index si omis
 */
