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

const config = require('./config')
const {toAscii} = require('sesajstools')
const excluded = ['a', 'd', 'dans', 'de', 'du', 'et', 'est', 'l', 'le', 'la', 'par', 'un', 'une']

/**
 * Service qui renvoie la liste des filters qui matchent un pattern
 * Ça compare le pattern avec toutes les valeurs définies en conf,
 * pour tous les champs à valeurs imposées
 * @service $ressourceAutocomplete
 */
module.exports = function (component) {
  component.service('$ressourceAutocomplete', function () {
    // passe en minuscule, désaccentue et remplace les char non lettre/chiffre/espace par une espace
    const sanitize = (value) => toAscii(value.toLowerCase()).replace(/[^a-z0-9 ]/g, ' ')

    // on construit un objet dont les props sont la liste des valeurs connues,
    // et leur valeur la liste des searchFilter possibles
    const knownValues = {}
    // on passe en revue tous les champs à valeurs controlées
    Object.entries(config.listes).forEach(([prop, liste]) => {
      Object.entries(liste).forEach(([key, value]) => {
        sanitize(value)
          // on découpe en mots
          .split(' ')
          // on vire les mots à exclure
          .filter(v => !excluded.includes(v))
          .forEach((valueToIndex) => {
            if (!valueToIndex) return
            if (!knownValues[valueToIndex]) knownValues[valueToIndex] = []
            // on ajoute sous la forme d'un filter de recherche
            knownValues[valueToIndex].push({index: prop, value: key})
          })
      })
    })

    // on liste toutes les entrées à partir de 2 caractères (ça fait un objet avec bcp d'entrées
    // mais toutes les valeurs sont des refs à un objet existant, pas si lourd en RAM),
    // ça permet de construire cet objet une seule fois au chargement du module
    const patternToFilters = {}
    Object.entries(knownValues).forEach(([value, filters]) => {
      patternToFilters[value] = filters
      if (value.length < 3) return // pas d'autre pattern que la valeur
      // sinon on enregistre aussi tous les patterns avec moins de lettres (3 min)
      let i = 2
      while (i++ < value.length) {
        const pattern = value.substr(0, i) // démarre à une longueur 3
        if (patternToFilters[pattern]) {
          // Évite les valeurs multiples avec un Set
          patternToFilters[pattern] = [...new Set([].concat(...[patternToFilters[pattern], filters]))]
        } else {
          patternToFilters[pattern] = filters
        }
      }
    })

    /**
     * @typedef searchFilter
     * @type Object
     * @property {string} index La propriété de Ressource sur laquelle filtrer
     * @property {string|number} value La valeur à filtrer
     */
    /**
     * Retourne les filtres de recherche qui peuvent correspondre à ce pattern
     * (on nettoie et ne prend que le premier mot)
     * @memberOf $ressourceAutocomplete
     * @param {string} pattern
     * @return {searchFilter[]}
     */
    const getFilters = (pattern) => patternToFilters[sanitize(pattern).replace(/ .*/, '')] || []

    return {
      getFilters
    }
  })
}
