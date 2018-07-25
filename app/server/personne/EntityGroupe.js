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

const Groupe = require('../../constructors/Groupe')
const {getNormalizedName} = require('../lib/normalize')

/**
 * Callback de normalisation de l'index du nom d'un groupe
 * @param {string} nom
 * @return {string} Le nom sans caractères autres que [a-z0-9]
 */
const normalizer = (nom) => {
  if (!nom) throw Error('nom est obligatoire pour un groupe')
  if (typeof nom !== 'string') throw Error('nom invalide')
  const _nom = getNormalizedName(nom)
  if (!_nom) throw Error('nom invalide', nom)
  return _nom
}

module.exports = function (component) {
  component.entity('EntityGroupe', function ($cacheGroupe) {
    const EntityGroupe = this

    EntityGroupe.validateJsonSchema({
      type: 'object',
      properties: {
        oid: {type: 'string'},
        nom: {type: 'string'},
        description: {type: 'string'},
        ouvert: {type: 'boolean'},
        public: {type: 'boolean'},
        gestionnaires: {
          type: 'array',
          items: {type: 'string'}
        },
        creationDate: {instanceof: 'Date'}
      },
      additionalProperties: false,
      required: [
        'nom',
        'ouvert',
        'public',
        'gestionnaires'
      ]
    })

    EntityGroupe.defineMethod('getNormalizedName', function () {
      return normalizer(this.nom)
    })

    /**
     * L'entité groupe
     * @entity EntityGroupe
     * @extends Entity
     * @extends Groupe
     */
    EntityGroupe.construct(function (values) {
      Object.assign(this, new Groupe(values))
    })

    EntityGroupe.beforeStore(function (next) {
      if (!this.creationDate) this.creationDate = new Date()
      if (!this.gestionnaires || !this.gestionnaires.length) return next(new Error(`Impossible de sauvegarder un groupe sans gestionnaires (${this.nom})`))
      next()
    })

    EntityGroupe.afterStore(function (next) {
      // on met en cache
      $cacheGroupe.set(this, function (error) { if (error) log.error(error) })
      // et on passe au suivant sans se préoccuper du retour de mise en cache
      next()
    })

    EntityGroupe
      .defineIndex('nom', {normalizer, unique: true})
      .defineIndex('ouvert', 'boolean')
      .defineIndex('public', 'boolean')
      .defineIndex('gestionnaires', 'string')
  })
}
