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
const {looksLikePid} = require('../../utils/validators')

module.exports = function (component) {
  /**
   * Controleurs de la route /api/personne/
   * @Controller controllerApiPersonne
   */
  component.controller('api/personne', function (EntityPersonne, $accessControl, $json, $groupeRepository, $personneRepository, $session) {
    // service $auth qu'on ne peut pas mettre en dépendance car le component auth
    // est chargé après ce component personne (il utilise ses services)
    let $auth

    /**
     * Create / update une personne (poster un objet ayant les propriétés de {@link Personne})
     * @route POST /api/personne/add
     */
    this.post('add', function (context) {
      if (context.perf) {
        var msg = 'start-pers-' + context.post.id
        log.perf(context.response, msg)
      }
      // log.debug('post /api/personne a reçu', context.post, 'api', {max: 1000})
      log.debug('post /api/personne a reçu', context.post, 'api')
      if (!$accessControl.hasAllRights(context)) return $json.denied(context)

      // l'appelant est censé être de confiance, on vérifie rien sinon passer par le constructeur
      // pour garantir l'intégrité des données
      if (context.post.origine && context.post.idOrigine) {
        var personne = EntityPersonne.create(context.post)
        personne.store(function (error, personneBdd) {
          if (error) $json.sendKo(context, error)
          else if (personneBdd && personneBdd.oid) $json.sendOk(context, {oid: personneBdd.oid})
          else $json.sendKo(context, new Error("Erreur interne (personne.store ne renvoie pas d'objet avec oid)"))
        })
      } else {
        $json.sendKo(context, new Error('origine ou idOrigine manquant'))
      }
    })

    /**
     * Affiche les infos du user courant, pour debug
     * @route GET /api/personne/me
     */
    this.get('me', function (context) {
      $json.sendOk(context, $session.getCurrentPersonne(context))
    })

    /**
     * Renvoie le user courant et les liens pour le SSO
     * Retourne un objet
     * {
     *   user: {pid, nom, prenom},
     *   sso: {links: link[], name: string} // links peut être vide si le sso ne propose pas de liens (ça devrait pas arriver mais rien ne l'y oblige)
     *   logoutUrl: string, // si on est authentifié
     *   loginLinks: link[]
     * }
     * un link est de la forme {href: string, icon: string, value: string}
     * @route GET /api/personne/current
     */
    this.get('current', function (context) {
      if (!$auth) $auth = lassi.service('$auth')
      const response = {}
      flow().seq(function () {
        const send = this
        const oid = $accessControl.getCurrentUserOid(context)
        if (oid) {
          // on retourne chercher la personne pour avoir des groupes à jour
          // (indépendamment de la session)
          flow().seq(function () {
            $personneRepository.load(oid, this)
          }).seq(function (personne) {
            const {
              pid,
              nom,
              prenom,
              groupesMembre,
              groupesSuivis,
              permissions
            } = personne
            response.personne = {
              oid,
              pid,
              nom,
              prenom,
              groupesMembre,
              groupesSuivis,
              permissions
            }
            response.logoutUrl = $auth.getLogoutUrl(context)
            response.sso = {
              links: $auth.getSsoLinks(context),
              name: $auth.getName(context)
            }
            // et on charge les groupes gérés (on veut leurs noms)
            $groupeRepository.fetchListManagedBy(oid, this)
          }).seq(function (groupesAdmin) {
            response.personne.groupesAdmin = groupesAdmin.map(({nom}) => nom)
            send()
          }).catch(send)
        } else {
          response.personne = null
          response.loginLinks = $auth.getLoginLinks(context)
          send()
        }
      }).seq(function () {
        $json.sendOk(context, response)
      }).catch(function (error) {
        $json.sendKo(context, error)
      })
    })

    /**
     * Vérifie qu'un pid correspond à un nom et retourne un user: {oid,pid,nom,prenom} ou un message d'erreur
     * @route GET /api/personne/checkPid?pid=xxx&nom=yyy
     */
    this.get('checkPid', function (context) {
      const myOid = $accessControl.getCurrentUserOid(context)
      if (!myOid) return $json.denied(context, 'Vous devez être authentifié pour chercher des utilisateurs')

      const {nom: askedNom, pid: askedPid} = context.get

      if (!looksLikePid(askedPid)) return $json.sendKo(context, 'Paramètre pid invalide')
      if (!askedNom) return $json.sendKo(context, 'Paramètre nom manquant')

      $personneRepository.loadByPidAndNom(askedPid, askedNom, (error, personne) => {
        if (error) return $json.sendKo(context, error)
        const {nom, oid, pid, prenom} = personne
        $json.sendOk(context, {nom, oid, pid, prenom})
      })
    })
  })
}
