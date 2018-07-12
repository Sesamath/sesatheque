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
const {parse} = require('sesajstools')
const {merge} = require('sesajstools/utils/object')
const config = require('../config')
const configRessource = require('./config')
const Ref = require('../../constructors/Ref')
const {ensure} = require('../lib/tools')
const {pageNextFromContext, pagePreviousFromContext, update: updateUrl} = require('../lib/url')
const {getNormalizedGrabOptions} = require('../lib/grab')

const myBaseUrl = config.application.baseUrl

/**
 * Controleur de la route /api/ (qui répond en json) pour les ressources
 * Toutes les routes contenant /public/ ignorent la session (cookies viré par varnish,
 * cela permet de mettre le résultat en cache et devrait être privilégié pour les ressources publiques)
 *
 * Tout ce qui renvoie une ressource (ou un oid pour du post) accepte en queryString
 * - format=(ref|ressource|full) ref renvoie une ref (toujours avec les _droits), full ajoute la résolution des id (auteurs, relations, groupes…)
 * - droits=1 pour ajouter une propriété _droits (string contenant des lettres parmi RWD)
 *
 * @Controller controllerApi
 */
module.exports = function (component) {
  component.controller('api/liste', function ($ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $personneRepository, $json) {
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
      const limit = ensure(context.get.limit, 'integer', listeMax)
      const skip = ensure(context.get.skip, 'integer', 0)
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
        $ressourceRepository.getListeCount('all', args, this)
      }).seq(function (total) {
        retour.total = total
        if (!total) return $json.sendOk(context, retour)
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
          retour.nextUrl = myBaseUrl + updateUrl(context.request.originalUrl, {skip: skip + limit})
          if (context.get.skip > 0) {
            const prevSkip = Math.max(skip - limit, 0)
            retour.prevUrl = myBaseUrl + updateUrl(context.request.originalUrl, {skip: prevSkip})
          }
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
        sendListe(context, null, mesRessources, nbOwnRessources)
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    }

    /**
     * Traite GET|POST /api/liste/prof
     * À priori appelé par un utilisateur connecté, mais pas forcément avec des droits de correction…
     * @private
     * @param {Context} context
     */
    function getListeProf (context) {
      context.timeout = 3000
      let visibility = 'public'
      if ($accessControl.hasGenericPermission('correction', context)) visibility = 'correction'
      grabListe(context, visibility)
      // @todo ajouter une visibility readableBy/xxx
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
      // @todo ajouter une clé de cache à partir de filter + visibility pour mettre le count en cache
      log.debug('grabListe ' + visibility, args)
      $ressourceRepository.getListeCount(visibility, args, function (error, total) {
        if (error) return sendListe(context, error)
        if (total === 0) return sendListe(context, error, [], 0)
        $ressourceRepository.getListe(visibility, args, function (error, ressources) {
          sendListe(context, error, ressources, total)
        })
      })
    }

    /**
     * Envoie une liste de ressources (en filtrant d'après les droits en lecture)
     * @private
     * @param {Context} context
     * @param error
     * @param ressources
     */
    function sendListe (context, error, ressources, total) {
      if (error) return $json.send(context, error)
      if (!ressources) ressources = []
      if (!total) total = ressources.length
      const liste = []
      const reponse = {liste, total}
      if (total) {
        // url next|previous
        const {limit, skip} = getNormalizedGrabOptions(context.get)
        if (ressources.length === limit) reponse.nextUrl = pageNextFromContext(context)
        if (skip > 0) reponse.previousUrl = pagePreviousFromContext(context)

        // on regarde le format demandé en get ou post
        const format = context.post.format || context.get.format
        ressources.forEach(function (ressource, index) {
          let item
          if (!$accessControl.hasReadPermission(context, ressource)) {
            log.dataError(`ressource ${ressource.oid} virée de la liste car pas de droit en lecture`)
            // on remplace la ressource par une erreur
            item = {
              oid: ressource.oid,
              titre: 'Vous n’avez pas les droits de lecture sur cette ressource',
              type: 'error',
              $droits: ''
            }
          } else {
            item = (format === 'full') ? ressource : new Ref(ressource)
            if (ressource.type === 'sequenceModele' && format !== 'full') {
              // on rajoute les parametres pour les sequenceModele
              item.parametres = ressource.parametres
            }
            item.$droits = 'R'
            if ($accessControl.hasPermission('update', context, ressource)) item.$droits += 'W'
            if ($accessControl.hasPermission('delete', context, ressource)) item.$droits += 'D'
          }
          liste.push(item)
        })
      }
      $json.sendOk(context, reponse)
    }

    const controller = this

    const listeMax = configRessource.limites.listeMax
    if (!listeMax) throw new Error('settings.ressource.limites.listeMax manquant')

    /**
     * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin.
     * Retourne {@link reponseListe}
     * @route GET /api/liste/all
     * @param {requeteListe}
     */
    controller.get('all', getListeAll)
    /**
     * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin
     * Retourne {@link reponseListe}
     * @route POST /api/liste/all
     * @param {requeteListe}
     */
    controller.post('all', getListeAll)
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
    controller.get('auteurs', getListeAuteurs)

    /**
     * Récupère la liste des ressources d'un groupe
     * Retourne {@link reponseListe}
     * @route GET /api/liste/groupe/:nom
     */
    controller.get('groupe/:nom', function (context) {
      const {nom} = context.arguments
      const options = getNormalizedGrabOptions(context.get)
      $ressourceRepository.fetchPublishedInGroup(nom, options, (error, data) => {
        if (error) return sendListe(context, error, [], 0)
        const {total, ressources} = data
        sendListe(context, error, ressources, total)
      })
    })

    /**
     * Cherche parmi les ressources du user courant (qui doit être connecté avant)
     * Retourne {@link reponseListe}
     * @route GET /api/liste/perso
     * @param {requeteListe}
     */
    controller.get('perso', getListePerso)
    /**
     * Cherche parmi les ressources du user courant (qui doit être connecté avant), retourne {@link reponseListe}
     * @route POST /api/liste/perso
     * @param {requeteListe}
     */
    controller.post('perso', getListePerso)
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
    controller.get('prof', getListeProf)
    /**
     * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
     * @route POST /api/liste/prof
     * @param {requeteListe}
     */
    controller.post('prof', getListeProf)
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
    controller.get('public', getListePublic)
    /**
     * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
     * @route POST /api/liste/public
     * @param {requeteListe}
     */
    controller.post('public', function (context) {
      grabListe(context, 'public')
    })
    /**
     * Pour le preflight, ajoute aux headers cors habituels le header
     *   Access-Control-Allow-Methods: POST OPTIONS
     * @route OPTIONS /api/liste/public
     */
  })
}

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
