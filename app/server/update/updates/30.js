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

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(`update${updateNum}`)
const name = 'rectifie les anciens ec2'
const description = 'Change parametres.swf en parametres.fichier (on avait un mix des deux)'

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    /**
     * Récupère un paquet de ressources et les passe une par une à transformer
     * @private
     * @param transformer
     * @param next
     */
    function grab (transformer, next) {
      flow().seq(function () {
        EntityRessource.match('type').equals('ec2').grab({limit, skip}, this)
      }).seqEach(function (ressource) {
        transformer(ressource, this)
      }).seq(function (ressources) {
        updateLog(`Fin du traitement des ressources ec2 de ${skip} à ${nb}`)
        if (ressources.length === limit) {
          skip += limit
          process.nextTick(grab, transformer, next)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * Transforme une ressource
     * @param ressource
     * @param next
     */
    function transformer (ressource, next) {
      nb++
      if (ressource.parametres && ressource.parametres.swf) {
        nbModifs++
        ressource.parametres.fichier = ressource.parametres.swf
        // on n'efface pas ce paramètre car ça distingue peut-être une autre façon de fonctionner
        // c'était swf pour ec1 ?
        // delete ressource.parametres.swf
        ressource.store(next)
        // en tâche de fond
        $cacheRessource.delete(ressource.oid)
      } else {
        if (!ressource.parametres || !ressource.parametres.fichier) {
          log.dataError('ressource ec2 sans fichier swf', ressource)
        }
        next()
      }
    }

    /* @type EntityDefinition */
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')
    const limit = 100
    let skip = 0
    let nb = 0
    let nbModifs = 0

    updateLog(name)
    flow().seq(function () {
      grab(transformer, this)
    }).seq(function () {
      updateLog(`Traitement de ${nb} ressources ec2 terminé, ${nbModifs} modifications`)
      done()
    }).catch(done)
  } // run
}
