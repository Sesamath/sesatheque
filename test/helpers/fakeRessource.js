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
import ressourceConfig from '../../app/ressource/config'
const myBaseId = config.application.baseId

/**
 * Retourne une ressource avec du contenu aléatoire
 * @return {Ressource}
 */
function getOne () {
  /**
   * Un plain object avec les valeurs d'une ressource
   * @type {Ressource}
   */
  const fakeRessource = {
    oid: faker.random.uuid(),
    type: faker.random.arrayElement(['arbre', 'ato', 'em', 'j3p', 'url']),
    titre: faker.lorem.words(),
    origine: faker.lorem.word(),
    idOrigine: faker.lorem.word(),
    resume: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(2, '\n'),
    commentaires: faker.lorem.paragraphs(2, '\n'),
    niveaux: faker.random.arrayElement(ressourceConfig.listesOrdonnees.niveaux),
    restriction: faker.random.arrayElement([0, 0, 0, 0, 1, 2])
  }
  fakeRessource.rid = myBaseId + '/' + fakeRessource.oid
  // niveaux
  const niv1 = faker.random.arrayElement(ressourceConfig.listesOrdonnees.niveaux)
  let niv2 = niv1
  while (niv2 === niv1) niv2 = faker.random.arrayElement(ressourceConfig.listesOrdonnees.niveaux)
  fakeRessource.niveaux = [niv1, niv2]
  // catégories
  const cat1 = faker.random.objectElement(ressourceConfig.constantes.categories, 'key')
  let cat2 = cat1
  while (cat2 === cat1) cat2 = faker.random.objectElement(ressourceConfig.constantes.categories, 'key')
  fakeRessource.categories = [cat1, cat2]

  // on ajoute des enfants pour les arbres
  if (fakeRessource.type === 'arbre') {
    fakeRessource.enfants = []
    for (let i = 0; i < faker.random.number(6); i++) {
      fakeRessource.enfants.push(getOne())
    }
  } else {
    fakeRessource.parametres = {
      boolean: faker.random.boolean(),
      date: faker.date.past(),
      number: faker.random.number(),
      string: faker.lorem.sentence(),
      uuid: faker.random.uuid(),
      word: faker.random.word()
    }
  }

  return fakeRessource
}

export default getOne
