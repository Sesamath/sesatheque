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
const updateLog = require('an-log')('update' + updateNum)

module.exports = {
  name: 'renomme Groupe.creationDate en dateCreation, pour harmoniser avec ressource & personne',
  description: '',
  run: function run (next) {
    const EntityGroupe = lassi.service('EntityGroupe')
    // on utilise le cli de lassi pour reindexAll
    const $entitiesCli = require('lassi/source/services/entities-cli')
    const reindexAll = $entitiesCli().commands().reindexAll

    // on renomme les propriétés en passant par du $set mongo, tant pis pour le cache
    // mais pas grave on a pas de requête sur les dates des groupes
    flow().seq(function () {
      // https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/
      // http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateMany
      const renameOption = {$rename: {'_data.creationDate': '_data.dateCreation'}}
      EntityGroupe.getCollection().updateMany({}, renameOption, {}, this)
    }).seq(function () {
      updateLog('Groupe.creationDate renommé en Groupe.dateCreation')

      updateLog('Réindexation des personnes (pour les groupes normalisés)')
      reindexAll('EntityPersonne', this)
    }).seq(function () {
      updateLog('fin réindexation')
      next()
    }).catch(next)
  } // run
}
