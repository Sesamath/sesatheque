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


try {
  var client = require('../')
  require("./config.test")

  client.addSesatheques({global:sesaGlobal, commun:sesaCommun});

  client.getItem("global", "sesaxml/exercices_interactifs", function (error, data) {
    if (error) {
      logErrOnPage(error)
    } else {
      console.log("retour de getItem", error, data)

      client.getEnfants(data, function (error, enfants) {
        data.enfants = enfants
        logOnPage("enfants du getItem en console")
        console.log("les enfants du getItem", enfants)
        if (enfants instanceof Array && enfants.length) {
          var aine = enfants[0].titre
          console.log("on va chercher les enfants de " + aine) // tout support
          client.getEnfants(enfants[0], function (error, enfants) {
            if (error) console.error(error)
            console.log("les fils de " + aine, enfants) // aine undefined
            if (enfants instanceof Array && enfants.length) {
              var aine = enfants[0].titre
              console.log("on va chercher les enfants de " + aine, enfants[0]) // Ressources J3P
              client.getEnfants(enfants[0], function (error, enfants) {
                if (error) console.error(error)
                console.log("les fils de " + aine, enfants) // aine undefined
                if (enfants instanceof Array && enfants.length) {
                  var aine = enfants[0].titre + " "
                  console.log("on va chercher les enfants de " + aine) // Primaire
                  client.getEnfants(enfants[0], function (error, enfants) {
                    if (error) console.error(error)
                    console.log("les fils de " + aine, enfants) // aine OK
                  })
                }
              })
            }
          })
        }
      })
    }
  })

} catch(error) {
  console.error(error)
  logErrOnPage(error)
}