/**
 * controller file is part of Sesatheque.
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
 *
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
const {getBaseUrl} = require('sesatheque-client/dist/server/sesatheques')

const displayRessource = require('./displayRessource')
const displayError = require('./displayError')

module.exports = function (component) {
  component.controller('', function ($ressourceRepository, $accessControl) {
    /**
     * Controleur des pages html d'affichage de ressource (sur /public/ ou /ressource/)
     * @controller controllerHtml
     */
    const controller = this

    const isPublic = (ressource) => !ressource.restriction && ressource.publie

    /**
     * Page display d'une ressource publique
     * (redirige vers /ressource si elle n'est pas publique)
     * @route GET /public/voir/:oid
     */
    controller.get('public/voir/:oid', function (context) {
      $ressourceRepository.load(context.arguments.oid, function (error, ressource) {
        if (error) {
          context.status = 500
          displayError(context, error)
        } else if (ressource && isPublic(ressource)) {
          // faut préciser les droits en lecture seule (on est sur /public/, donc pas de cookie)
          ressource._droits = 'R'
          displayRessource(context, ressource)
        } else if (ressource) {
          // elle n'était pas publique
          context.redirect(context.request.originalUrl.replace('public/', 'ressource/'), 302)
        } else {
          context.status = 404
          displayError(context, `La ressource ${context.arguments.oid} n’existe pas`)
        }
      })
    })

    /**
     * Page display d'une ressource publique d'après son origine
     * (redirige vers /ressource si elle n'est pas publique)
     * @route GET /public/voir/:origine/:idOrigine
     */
    controller.get('public/voir/:origine/:idOrigine', function (context) {
      const {origine, idOrigine} = context.arguments
      // loadByOrigine gère le cas origine = 'cle' ou bien origine = myBaseId
      // mais on veut un redirect si origine est une baseId connue
      const baseUrl = getBaseUrl(origine, false)
      if (baseUrl) return context.redirect(`${baseUrl}public/voir/${idOrigine}`, 302)

      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) {
          context.status = 500
          displayError(context, error)
        } else if (ressource && (isPublic(ressource) || origine === 'cle')) {
          ressource._droits = 'R'
          displayRessource(context, ressource)
        } else if (ressource) {
          // elle n'était pas publique
          context.redirect(context.request.originalUrl.replace('public/', 'ressource/'), 302)
        } else {
          context.status = 404
          displayError(context, `La ressource ${origine}/${idOrigine} n’existe pas`)
        }
      })
    })

    /**
     * Page display (voir en pleine page, à priori pour mettre en iframe)
     * (redirige vers /public si elle est publique)
     * @route GET /ressource/voir/:oid
     */
    controller.get('ressource/voir/:oid', function (context) {
      $ressourceRepository.load(context.arguments.oid, function (error, ressource) {
        if (error) {
          context.status = 500
          displayError(context, error)
        } else if (ressource) {
          if (isPublic(ressource)) {
            context.redirect(context.request.originalUrl.replace('ressource/', 'public/'), 302)
          } else if (!$accessControl.isAuthenticated(context)) {
            context.status = 401
            displayError(context, 'Vous devez être authentifié pour visionner cette ressource')
          } else if ($accessControl.hasReadPermission(context, ressource)) {
            displayRessource(context, ressource)
          } else {
            context.status = 403
            displayError(context, 'Vous n’avez pas de droits suffisants pour visionner cette ressource')
          }
        } else {
          context.status = 404
          displayError(context, `La ressource ${context.arguments.oid} n’existe pas`)
        }
      })
    })

    /**
     * Page display d'une ressource privée d'après son origine
     * (redirige vers /public si elle est publique)
     * @route GET /ressource/voir/:origine/:idOrigine
     */
    controller.get('ressource/voir/:origine/:idOrigine', function (context) {
      const {origine, idOrigine} = context.arguments

      // on redirige si c'est un rid
      const baseUrl = getBaseUrl(origine, false)
      if (baseUrl) return context.redirect(`${baseUrl}ressource/voir/${idOrigine}`, 302)

      // on ne veut pas de cle/xxx sur /ressource (public only), c'est probablement une erreur en amont
      if (origine === 'cle') {
        context.status = 404
        return displayError(context, 'Chemin /ressource/cle inconnu')
      }

      // on peut charger
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) {
          context.status = 500
          displayError(context, error)
        } else if (ressource) {
          if (isPublic(ressource)) {
            context.redirect(context.request.originalUrl.replace('ressource/', 'public/'), 302)
          } else if (!$accessControl.isAuthenticated(context)) {
            context.status = 401
            displayError(context, 'Vous devez être authentifié pour visionner cette ressource')
          } else if ($accessControl.hasReadPermission(context, ressource)) {
            displayRessource(context, ressource)
          } else {
            context.status = 403
            displayError(context, 'Vous n’avez pas de droits suffisants pour visionner cette ressource')
          }
        } else {
          context.status = 404
          displayError(context, `La ressource ${context.arguments.oid} n’existe pas`)
        }
      })
    })
  })
}
