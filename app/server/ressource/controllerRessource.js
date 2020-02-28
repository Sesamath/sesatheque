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
const { baseId, baseUrl } = require('../config').application

module.exports = function (component) {
  component.controller('', function ($ressourceRepository, $accessControl) {
    /**
     * Controleur des pages html d'affichage de ressource (sur /public/ ou /ressource/)
     * @controller controllerHtml
     */
    const controller = this

    const isPublic = (ressource) => !ressource.restriction && ressource.publie

    // les redirections public/verbe/oid vers ressource/verbe/oid
    ;['modifier', 'apercevoir', 'decrire'].forEach(verbe => {
      controller.get(`public/${verbe}/:oid`, function (context) {
        context.redirect(context.request.originalUrl.replace('public/', 'ressource/'), 301)
      })
    })
    // la redirection ressource/decrire/:origine/:idOrigine => ressource/decrire/:oid
    controller.get('ressource/decrire/:origine/:idOrigine', function (context) {
      const {origine, idOrigine} = context.arguments
      if (origine === baseId) return context.redirect(context.request.originalUrl.replace(`${baseId}/`, ''), 301)
      const otherBaseUrl = getBaseUrl(origine, false)
      if (otherBaseUrl) return context.redirect(`${otherBaseUrl}ressource/decrire/${idOrigine}`, 301)
      // faut charger pour récupérer l'oid
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) return displayError(context, error, 500)
        if (!ressource) return displayError(context, `La ressource ${origine}/${idOrigine} n’existe pas`, 404)
        context.redirect(context.request.originalUrl.replace(`${origine}/${idOrigine}`, ressource.oid), 301)
      })
    })

    /**
     * Page display d'une ressource publique
     * (redirige vers /ressource si elle n'est pas publique)
     * @route GET /public/voir/:oid
     */
    controller.get('public/voir/:oid', function (context) {
      $ressourceRepository.load(context.arguments.oid, function (error, ressource) {
        if (error) return displayError(context, error, 500)
        if (!ressource) return displayError(context, `La ressource ${context.arguments.oid} n’existe pas`, 404)
        if (!isPublic(ressource)) return context.redirect(context.request.originalUrl.replace('public/', 'ressource/'), 302)
        // faut préciser les droits en lecture seule (on est sur /public/, donc pas de cookie)
        ressource._droits = 'R'
        displayRessource(context, ressource)
      })
    })

    /**
     * Page display d'une ressource publique d'après son origine
     * (redirige vers l'url avec oid, vers /ressource si elle n'est pas publique, ou l'affiche si c'est une ressource privée demandée avec cle/:cle)
     * @route GET /public/voir/:origine/:idOrigine
     */
    controller.get('public/voir/:origine/:idOrigine', function (context) {
      const {origine, idOrigine} = context.arguments
      // loadByOrigine gère le cas origine = 'cle' ou bien origine = myBaseId
      // mais on veut un redirect si origine est une baseId connue
      if (origine === baseId) return context.redirect(context.request.originalUrl.replace(`${baseId}/`, ''), 301)
      const otherBaseUrl = getBaseUrl(origine, false)
      if (otherBaseUrl) return context.redirect(`${otherBaseUrl}public/voir/${idOrigine}`, 302)
      // faut charger pour avoir l'oid
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) return displayError(context, error, 500)
        if (!ressource) return displayError(context, `La ressource ${origine}/${idOrigine} n’existe pas`, 404)
        // si public on redirige vers l'url avec oid
        if (isPublic(ressource)) return context.redirect(context.request.originalUrl.replace(`${origine}/${idOrigine}`, ressource.oid), 301)
        // si privé sans clé faut passer par l'authentification
        if (origine !== 'cle') return context.redirect(`${baseUrl}ressource/voir/${ressource.oid}`, 302)
        // privée avec clé, on l'affiche
        ressource._droits = 'R'
        displayRessource(context, ressource)
      })
    })

    /**
     * Page display (voir en pleine page, à priori pour mettre en iframe)
     * (redirige vers /public si elle est publique)
     * @route GET /ressource/voir/:oid
     */
    controller.get('ressource/voir/:oid', function (context) {
      const {oid} = context.arguments
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) return displayError(context, error, 500)
        if (!ressource) return displayError(context, `La ressource ${oid} n’existe pas`, 404)
        if (isPublic(ressource)) return context.redirect(context.request.originalUrl.replace('ressource/', 'public/'), 302)
        if (!$accessControl.isAuthenticated(context)) return displayError(context, 'Vous devez être authentifié pour visionner cette ressource', 401)
        if (!$accessControl.hasReadPermission(context, ressource)) return displayError(context, 'Vous n’avez pas de droits suffisants pour visionner cette ressource', 403)
        displayRessource(context, ressource)
      })
    })

    /**
     * Page display d'une ressource privée d'après son origine
     * (redirige vers /public si elle est publique, ou vers l'url avec oid)
     * @route GET /ressource/voir/:origine/:idOrigine
     */
    controller.get('ressource/voir/:origine/:idOrigine', function (context) {
      const {origine, idOrigine} = context.arguments
      // on redirige si c'est un rid
      const otherBaseUrl = getBaseUrl(origine, false)
      if (otherBaseUrl) return context.redirect(`${otherBaseUrl}ressource/voir/${idOrigine}`, 301)
      // on ne veut pas de cle/xxx sur /ressource (public only), c'est probablement une erreur en amont
      if (origine === 'cle') return displayError(context, 'Chemin /ressource/cle inconnu', 404)
      // on peut charger
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) return displayError(context, error, 500)
        if (!ressource) return displayError(context, `La ressource ${origine}/${idOrigine} n’existe pas`, 404)
        if (isPublic(ressource)) return context.redirect(`${baseUrl}public/voir/${ressource.oid}`, 302)
        context.redirect(context.request.originalUrl.replace(`${origine}/${idOrigine}`, ressource.oid), 301)
      })
    })
  })
}
