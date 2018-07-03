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

/**
 * Le controleur html des routes /public/ (pages sans authentification)
 * qui traite aussi les /ressource/ si on est pas authentifié
 *
 * La session n'est pas utilisée ici (varnish a viré les cookies en amont pour mettre ces pages en cache)
 * @controller controllerPublic
 */
module.exports = function (component) {
  component.controller('public', function ($ressourceRepository, $ressourceConverter, $ressourcePage, $routes, $accessControl, $ressourceFetch) {
    /**
     * Charge une ressource publique (d'après context.arguments.oid) et l'envoie à la vue
     * @private
     * @param {Context} context
     * @param view
     * @param options
     */
    function affiche (context, view, options) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) return $ressourcePage.printError(context, error, 500)
        if (!ressource) return $ressourcePage.printError(context, 'Cette ressource n’existe pas', 404)
        if (!$accessControl.isPublic(ressource)) return $ressourcePage.printError(context, `La ressource ${ressource.oid} n’est pas publique`, 403)
        $ressourcePage.prepareAndSend(context, null, ressource, view, options)
      })
    }

    /**
     * Vérifie qu'une ressource est publique puis l'envoie à la vue
     * @private
     * @param {Context} context
     * @param error
     * @param ressource
     * @param view
     * @param options
     */
    function checkAndAffiche (context, error, ressource, view, options) {
      if (error) return $ressourcePage.printError(context, error)
      if (!ressource) return $ressourcePage.printError(context, 'Cette ressource n’existe pas', 404)
      if (!$accessControl.isPublic(ressource)) return $ressourcePage.printError(context, `La ressource ${ressource.oid} n’est pas publique`, 403)
      $ressourcePage.prepareAndSend(context, null, ressource, view, options)
    }

    const controller = this
    // pour le moment, on redirige simplement les routes /public vers /ressource pour react
    const reactRedirect = (context) => context.redirect(context.request.originalUrl.replace('/public/', '/ressource/'))

    /**
     * Page display (pleine page, prévu pour iframe)
     * @route GET /public/voir/:oid
     */
    controller.get($routes.get('display', ':oid'), function (context) {
      context.layout = 'iframe'
      affiche(context, 'display')
    })
    /**
     * Page display (pleine page, prévu pour iframe)
     * @route GET /public/voir/:origine/:idOrigine
     */
    controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
      context.layout = 'iframe'
      var origine = context.arguments.origine
      var idOrigine = context.arguments.idOrigine
      if (origine === 'cle') {
        $ressourceRepository.loadByCle(idOrigine, function (error, ressource) {
          // on fait sauter la restriction si c'est une ressource publiée dont on connait la clé
          if (!error && ressource && ressource.publie) ressource.restriction = 0
          checkAndAffiche(context, error, ressource, 'display')
        })
      } else {
        $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
          checkAndAffiche(context, error, ressource, 'display')
        })
      }
    })
    /**
     * Page preview (avec le layout du site)
     * @route GET /public/apercevoir/:oid
     */
    controller.get($routes.get('preview', ':oid'), reactRedirect)
    /**
     * Page preview (avec le layout du site)
     * @route GET /public/apercevoir/:origine/:idOrigine
     */
    controller.get($routes.get('preview', ':origine', ':idOrigine'), reactRedirect)
    /**
     * Formulaire de recherche et affichage des résultats
     * @route GET /public/recherche
     */
    controller.get($routes.get('search'), reactRedirect)

    /**
     * Un proxy pour les pages externes en http à partir d'un identifiant de ressource
     * @route GET /public/urlProxy/:oid
     */
    controller.get('urlProxy/:oid', function (context) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, (error, ressource) => {
        if (error) {
          log.error(error)
          context.plain(error.toString())
        } else if (ressource && ressource.type === 'url') {
          const url = ressource && ressource.parametres && ressource.parametres.adresse
          if (url && url.substr(0, 7) === 'http://') {
            $ressourceFetch.fetchURL(url, context)
          } else {
            const msg = 'La ressource ' + oid + ' n’a pas d’adresse en http://…'
            log.error(msg)
            context.plain(msg)
          }
        } else {
          context.plain('Il n’y a pas de ressource ' + oid + ' de type page externe')
        }
      })
    })
  })
}
