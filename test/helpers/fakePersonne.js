/**
 * This file is part of SesaReactComponent.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaReactComponent is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaReactComponent is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SesaReactComponent (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de SesaReactComponent, créée par l'association Sésamath.
 *
 * SesaReactComponent est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaReactComponent est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

import faker from 'faker/locale/fr'
import config from '../../app/config'
const myBaseId = config.application.baseId

/**
 * Retourne une ressource avec du contenu aléatoire (avec publié, restriction à 0 et sans auteurs ni contributeur si on les impose pas)
 * @param {object} options ajouter des propriétés imposées, noOid, noRid, noOrigin, noIdOrigin
 * @return {Ressource}
 */
function getFakePersonne (options) {
  if (typeof options !== 'object') options = {}
  /**
   * Un plain object avec les valeurs d'une personne
   * @type {Personne}
   */
  const fakePersonne = {}
  if (!options.nooid) fakePersonne.oid = options.oid || faker.random.uuid()
  if (!options.nopid) fakePersonne.pid = options.pid || myBaseId + '/' + fakePersonne.oid
  if (!options.notitre) fakePersonne.nom = options.nom || faker.name.lastName()
  if (!options.noresume) fakePersonne.prenom = options.prenom || faker.name.firstName()
  // cf app/config.js : faker.random.arrayElement(['formateur', 'admin', 'editeur', …])
  if (!options.nodescription) fakePersonne.roles = options.roles || 'formateur'
  if (!options.nocommentaires) fakePersonne.email = options.email || faker.internet.email()
  // @todo ajout groupesMembre et groupesSuivis

  return fakePersonne
}

export default getFakePersonne
