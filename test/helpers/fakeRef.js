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
 * Ce fichier fait partie de Sesatheque, créée par l'association Sésamath.
 *
 * Sesatheque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sesatheque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

import faker from 'faker/locale/fr'

import config from '../../app/server/config'

const myBaseId = config.application.baseId
const configRessource = config.components.ressource
const types = Object.keys(configRessource.listes.type)
const categoriesIds = Object.keys(configRessource.listes.categories)

function getFakeRef (options) {
  if (!options) options = {}
  const fakeRef = {
    aliasOf: options.aliasOf || myBaseId + '/' + faker.random.uuid(),
    type: options.type || faker.random.arrayElement(types),
    titre: options.titre || faker.lorem.words(),
    resume: options.resume || faker.lorem.sentence(),
    description: options.description || faker.lorem.paragraphs(),
    commentaires: options.commentaires || faker.lorem.paragraphs(),
    categories: options.categories || faker.random.arrayElement(types),
    public: options.public || faker.random.arrayElement([true, true, true, false]),
    inc: options.inc || faker.random.number() // renvoie un entier
  }
  // on prend les catégories imposées par le type, ou une au pif
  fakeRef.categories = config.components.ressource.typeToCategories[fakeRef.type] || [faker.random.arrayElement(categoriesIds)]
  // pour les ressources privées on génère une clé
  if (!fakeRef.public) fakeRef.cle = faker.random.uuid()

  return fakeRef
}

export default getFakeRef
