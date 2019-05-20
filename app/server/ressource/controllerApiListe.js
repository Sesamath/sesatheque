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
const {pick} = require('lodash')
const config = require('../config')
const configRessource = require('./config')
const Ref = require('../../constructors/Ref')
const Ressource = require('../../constructors/Ressource')
const url = require('../lib/url')

const myBaseUrl = config.application.baseUrl
const updateUrl = (context, options) => myBaseUrl + url.update(context.request.originalUrl, options).substr(1)

const {listeMax, listeNbDefault} = configRessource.limites
if (!listeMax) throw new Error('settings.ressource.limites.listeMax manquant')
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
     * Envoie une liste de ressources (ajoute les droits)
     * @private
     * @param {Context} context
     * @param {Error} [error]
     * @param {EntityRessource[]} ressources La liste des ressources
     * @param {object} listOptions
     * @param {object} listOptions.query La query qui a donné cette liste
     * @param {object} listOptions.queryOptions Les queryOptions (skip, limit, orderBy) utilisés
     * @param {number} listOptions.total
     * @param {string[]} [listOptions.warnings]
     */
    function sendListe (context, error, ressources, {query, queryOptions, total}) {
      if (error) return $json.sendKo(context, error)
      // @todo virer ça dès que tout le monde nous appellera avec ces infos
      if (!queryOptions) queryOptions = {}
      if (total === undefined) total = ressources.length

      const liste = []
      const reponse = {query, queryOptions, total, liste}
      if (ressources && ressources.length) {
        // construction de nextUrl
        const limit = queryOptions.limit || Number(context.get.limit) || listeNbDefault
        if (ressources.length === limit) {
          const skip = (queryOptions.skip || Number(context.get.skip) || 0) + limit
          reponse.nextUrl = updateUrl(context, {...query, skip})
        }
        // on regarde le format reçu en get ou post
        const format = context.post.format || context.get.format || 'ref'
        ressources.forEach(function (ressource) {
          // vérif des droits
          let droits = ''
          if ($accessControl.hasReadPermission(context, ressource)) {
            droits += 'R'
            if ($accessControl.hasPermission('update', context, ressource)) droits += 'W'
            if ($accessControl.hasPermission('delete', context, ressource)) droits += 'D'
          } else {
            // ça devrait pas arriver, mais au cas où on crée une ressource fake
            // pour avoir le bon nb dans la liste et montrer le pb
            log.error(`sendListe récupère la ressource ${ressource.oid} à envoyer à ${$accessControl.getCurrentUserPid(context)} alors qu’il n’a pas les droits de lecture dessus`, ressource)
            ressource = new Ressource({
              titre: 'Vous n’avez pas les droits suffisants pour voir cette ressource',
              type: 'error'
            })
          }

          // formatage
          let item
          if (format === 'full') {
            item = ressource
          } else if (format === 'light') {
            item = pick(ressource, ['oid', 'titre', 'type', 'resume', 'rid', 'description', 'commentaires'])
          } else {
            item = new Ref(ressource)
            // on rajoute les parametres pour les sequenceModele
            if (ressource.type === 'sequenceModele') item.parametres = ressource.parametres
          }
          item.$droits = droits
          liste.push(item)
        })
      }
      $json.sendOk(context, reponse)
    }

    const controller = this

    /**
     * Récupère des résultats de recherche
     * @route GET /api/liste
     */
    controller.get('', function (context) {
      // on vérifie les paramètres pour construire query et queryOptions
      const params = $accessControl.sanitizeSearch(context)

      $ressourceRepository.search(params.query, params.queryOptions, function (error, result) {
        if (error) return $json.sendKo(context, error)

        const {ressources, total} = result
        params.total = total
        sendListe(context, error, ressources, params)
      })
    })

    /**
     * Récupère les ressources d'une liste de pids, classée par pid (avec prénom & nom du pid)
     * Retourne {@link reponseListesByPid}
     * Utilisé par sesathequeClient.getListeAuteurs()
     * @route GET /api/liste/auteurs
     * @param {string} pids la liste de pids séparés par des virgules
     */
    controller.get('auteurs', function (context) {
      const pids = context.get.pids && context.get.pids.split(',').filter(pid => pid.indexOf('/') > 0)
      if (!pids) return $json.sendKo(context, 'Argument pids manquant')
      if (!pids.length) return $json.sendKo(context, 'Aucun auteur demandé')
      const {queryOptions} = $accessControl.sanitizeSearch(context)
      const {limit, skip} = queryOptions
      const query = {'auteurs': []}

      let nbRessources = 0 // pour savoir s'il faut du nextUrl
      let nbForbidden = 0
      let nbLost = 0

      const retour = {warnings: []}
      flow().seq(function () {
        // grab auteurs
        $personneRepository.loadByPids(pids, this)
      }).seqEach(function (personne, index) {
        if (personne) {
          retour[personne.pid] = {
            pid: personne.pid,
            label: `${personne.prenom} ${personne.nom}`,
            liste: []
          }
          query.auteurs.push(personne.pid)
        } else {
          retour.warnings.push(`Auteur ${pids[index]} inconnu`)
        }

        // grab ressources
        $ressourceRepository.search(query, queryOptions, this)
      }).seq(function ({ressources, total}) {
        retour.total = total
        if (!total) return $json.sendOk(context, retour)

        ressources.forEach((ressource) => {
          nbRessources++
          if ($accessControl.hasReadPermission(context, ressource)) {
            ressource.auteurs.forEach(pid => {
              if (retour[pid]) retour[pid].liste.push(new Ref(ressource))
              else nbLost++
            })
          } else {
            nbForbidden++
          }
        })

        if (nbForbidden) retour.warnings.push(`${nbForbidden} ressources supprimées de la liste car vous n’aviez pas les droits de lecture dessus`)
        if (nbLost) retour.warnings.push(`${nbLost} ressources supprimées car leur auteur n’existe plus`)
        if (!retour.warnings.length) delete retour.warnings

        if (nbRessources === listeMax) retour.nextUrl = updateUrl(context, {skip: skip + limit})
        if (context.get.skip > 0) retour.prevUrl = updateUrl(context, {skip: Math.max(skip - limit, 0)})

        $json.sendOk(context, retour)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Cherche parmi les ressources du user courant (qui doit être connecté avant)
     * Retourne {@link reponseListe}
     * @route GET /api/liste/perso
     * @param {requeteListe}
     */
    controller.get('perso', function (context) {
      context.timeout = 3000
      const pid = $accessControl.getCurrentUserPid(context)
      if (!pid) return $json.denied(context, 'Ressources personnelles inaccessibles (session expirée sur la Sésathèque), veuillez vous déconnecter et reconnecter')

      const {queryOptions} = $accessControl.sanitizeSearch(context)
      const query = {auteurs: [pid]}
      flow().seq(function () {
        $ressourceRepository.search(query, queryOptions, this)
      }).seq(function ({ressources, total}) {
        sendListe(context, null, ressources, {total, query, queryOptions})
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })
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
