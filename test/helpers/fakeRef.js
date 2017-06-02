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

function getOne () {
  const fakeRef = {
    aliasOf: myBaseId + '/' + faker.random.uuid(),
    type: faker.random.arrayElement(['arbre', 'ato', 'em', 'j3p', 'url']),
    titre: faker.lorem.words(),
    resume: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(),
    commentaires: faker.lorem.paragraphs(),
    public: faker.random.arrayElement([true, true, true, false])
  }
  if (!fakeRef.public) fakeRef.cle = faker.random.uuid()

  // on ajoute des enfants pour les arbres et les series
  if (fakeRef.type === 'arbre' || fakeRef.type === 'serie') {
    fakeRef.enfants = []
    for (let i = 0; i < faker.random.number(6); i++) {
      fakeRef.enfants.push(getOne())
    }
  }

  return fakeRef
}

export default getOne
