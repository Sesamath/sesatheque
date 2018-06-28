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

// la route /debug est gérée par app/main/controllerDebug.js
/**
 * Controleur de la route /debug/ressource (existe seulement si on est pas en prod)
 * @Controller controlleurDebug
 * @requires {@link $ressourceRepository}
 */
module.exports = function (component) {
  component.controller('debug/ressource', function ($ressourceRepository, EntityRessource) {
    /**
     * Dump une ressource
     * @route GET /dump?oid=…
     * @param {Integer} oid              L'oid de la ressource dont on veut le dump
     * @param {Integer} [depth=null]     La profondeur
     * @param {boolean} [hidden=false]   Pour voir les propriétés cachées
     * @param {boolean} [terminal=false] Pour l'afficher en console plutôt que sur la page
     */
    this.get('dump', function (context) {
      var oid = context.get.oid
      var depth = Number(context.get.depth) || null
      var hidden = !!context.get.hidden
      var terminal = !!context.get.terminal
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) context.json({error: error.toString()})
        else {
          var util = require('util')
          var options = {showHidden: hidden, depth: depth, colors: terminal}
          var objStr = util.inspect(ressource, options)
          if (terminal) {
            console.log(objStr)
            context.json({msg: 'affiché en console'})
          } else {
            if (hidden) {
              // faut envoyer du texte (chrome râle quand même parce que ça ressemble à du json mais il n'est pas valide
              context.plain('la ressource avec ses champs cachés en texte\n' + objStr)
            } else {
              // on peut parser
              var objInspected
              try {
                // mais c'est pas du json, et eval est pas permis, on ruse
                var objectify = new Function('return ' + objStr) // eslint-disable-line no-new-func
                objInspected = objectify()
              } catch (error) {
                objInspected = {error: 'erreur de parsing de la ressource ' + oid}
                log(objInspected.error)
                log(objStr)
              }
              context.json(objInspected)
            }
          }
        }
      })
    })

    this.get('like', function (context) {
      var index = context.get.index
      var value = context.get.value
      var limit = context.limit || 10
      var skip = context.skip || 0
      if (index && value) {
        EntityRessource.match(index).like(value).grab({limit, skip}, function (error, ressources) {
          if (error) context.json({error: error.toString()})
          else context.json({ressources: ressources})
        })
      }
    })

    this.get('headers', function (context) {
      context.json({success: true, headers: context.request.headers})
    })
    this.post('headers', function (context) {
      context.json({success: true, headers: context.request.headers})
    })
  })
}
