/**
 * This file is part of SesaEditGraphe.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaEditGraphe is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaEditGraphe is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SesaQcm (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application SesaEditGraphe, créée par l'association Sésamath.
 *
 * SesaEditGraphe est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaEditGraphe est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

/**
 * Ajoute une erreur à la ressource (en créant le tableau $errors s'il n'existait pas)
 * @param {Ressource} ressource
 * @param {string} error
 */
function addError (ressource, error) {
  if (!ressource.$errors) ressource.$errors = []
  if (typeof error === 'string') ressource.$errors.push(error)
  else ressource.$errors.push(error.toString())
}

/**
 * Ajoute un warning à la ressource (en créant le tableau $warnings s'il n'existait pas)
 * @param {Ressource} ressource
 * @param {string} warning
 */
function addWarning (ressource, warning) {
  if (!ressource.$warnings) ressource.$warnings = []
  ressource.$warnings.push(warning)
}

/**
 * Retourne les rid de tous les enfants
 * @param arbre
 * @returns {Array}
 */
function getRidEnfants (ressource) {
  // on veut toutes les refs récursivement
  function addRids (enfants) {
    enfants.forEach(enfant => {
      if (enfant.aliasOf) rids.add(enfant.aliasOf)
      if (enfant.enfants && enfant.enfants.length) addRids(enfant.enfants)
    })
  }
  if (!ressource) throw new Error('getRidEnfants appelé sans ressource')
  if (!ressource.enfants || !ressource.enfants.length) return []
  // on peut chercher
  const rids = new Set()
  addRids(ressource.enfants)

  return Array.from(rids)
}

module.exports = {
  addError,
  addWarning,
  getRidEnfants
}
