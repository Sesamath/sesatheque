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

/**
 * Ce décorateur récupère les flashMessages en session s'il y en a et les envoie à son bloc
 * Attention, si une autre action qui passe après nous (un autre décorateur) lance une redirection ils seront perdus
 */
'use strict';

var _ = require('underscore')._

module.exports = lassi.Decorator('flash')
    .renderTo('flashBloc')
    .do(function(ctx, next) {
      if (ctx.session.flash) {
        // on effacera ces données juste avant le rendu
        // (comme ça s'il n'y a pas de rendu à cause d'une redirection ça ne sera pas perdu)
        ctx.application.transports.html.on('layout', function() {
          delete ctx.session.flash
        })
        // en attendant on passe ça à notre template
        var data = {messages:[]}
        _.each(ctx.session.flash, function(msg, level) {
          data.messages.push({value:msg, level:level})
        })
        next(data)
      } else next()
    });
