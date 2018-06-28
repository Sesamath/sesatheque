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

const path = require('path')

module.exports = function mainComponentFactory (lassi) {
  /**
   * Component qui défini
   * - le layout et les vues pour le html
   * - les controleurs des pages statiques
   * - des controleurs de debug en dev
   */
  const mainComponent = lassi.component('main')

  /**
   * On ajoute un dust.helper à l'initialisation du framework
   * Cf https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   *
   * context contient les propriétés stack,global,blocks,templateName,
   *     on peut récupérer les paramètres passés à la vue avec context.get('param')
   * bodies contient block
   * params liste les attributs passé au helper avec {@helper attrName1=...}
   * @see https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   * this.application.templateEngines.dust existe plus /
   this.application.templateEngines.dust.helper('dump', function (chunk, context, bodies, params) {
  return chunk.write('<pre class='debug'>' + JSON.stringify(params, null, 2) + '</pre>');
}); /**/

  // pour le statique
  require('./controllerMain')(mainComponent)
  // pour /api/checkSesalab et /api/checkSesatheque
  require('./controllerApi')(mainComponent)

  require('./servicePage')(mainComponent)
  require('./serviceFlashMessages')(mainComponent)
  require('./serviceForm')(mainComponent)
  require('./serviceJson')(mainComponent)

  // pour la doc
  mainComponent.controller(function () {
    this.serve('doc', path.resolve(__dirname, '../../../documentation'))
  })

  /**
   * En dev on ajoute des routes de debug
   */
  if (!global.isProd) {
    require('./controllerDebug')(mainComponent)
  }

  // le listener beforeTransport est dans le composant ressource (il a besoin des services de ressurce)
}
