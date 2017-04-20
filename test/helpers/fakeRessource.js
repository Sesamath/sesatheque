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
import fakeRef from './fakeRef'
import config from '../../app/config'
import ressourceConfig from '../../app/ressource/config'
const myBaseId = config.application.baseId

/**
 * Retourne une ressource avec du contenu aléatoire (avec publié, restriction à 0 et sans auteurs ni contributeur si on les impose pas)
 * @param {object} options ajouter des propriétés imposées, noOid, noRid, noOrigin, noIdOrigin
 * @return {Ressource}
 */
function getFakeRessource (options) {
  if (typeof options !== 'object') options = {}
  /**
   * Un plain object avec les valeurs d'une ressource
   * @type {Ressource}
   */
  const fakeRessource = {}
  if (!options.nooid) fakeRessource.oid = options.oid || faker.random.uuid()
  if (!options.norid) fakeRessource.rid = options.rid || myBaseId + '/' + fakeRessource.oid
  if (!options.notype) fakeRessource.type = options.type || faker.random.arrayElement(['arbre', 'ato', 'em', 'j3p', 'url'])
  if (!options.noorigine) fakeRessource.origine = options.origine || faker.lorem.word()
  if (!options.noidOrigine) fakeRessource.idOrigine = options.idOrigine || faker.lorem.word()
  if (!options.notitre) fakeRessource.titre = options.titre || faker.lorem.words()
  if (!options.noresume) fakeRessource.resume = options.resume || faker.lorem.sentence()
  if (!options.nodescription) fakeRessource.description = options.description || faker.lorem.paragraphs(2, '\n')
  if (!options.nocommentaires) fakeRessource.commentaires = options.commentaires || faker.lorem.paragraphs(2, '\n')
  if (!options.nopublie) fakeRessource.publie = options.publie || true
  if (!options.norestriction) fakeRessource.restriction = options.restriction || 0
  if (!options.nolangue) fakeRessource.langue = options.langue || 'fra'

  // niveaux
  if (options.niveaux) {
    fakeRessource.niveaux = options.niveaux
  } else if (!options.noniveaux) {
    const niv1 = faker.random.arrayElement(ressourceConfig.listesOrdonnees.niveaux)
    let niv2 = niv1
    while (niv2 === niv1) niv2 = faker.random.arrayElement(ressourceConfig.listesOrdonnees.niveaux)
    fakeRessource.niveaux = [niv1, niv2]
  }
  // catégories
  if (options.categories) {
    fakeRessource.categories = options.categories
  } else if (!options.nocategories) {
    // on ajoute deux catégories au pif
    // Object.keys(ressourceConfig.listes.categories) renvoie {string[]} et on veut du number,
    // faut aller dans constantes.categories
    const catList = Object.assign({}, ressourceConfig.constantes.categories)
    // on veut pas attribuer "aucune"
    delete catList.aucune
    const cat1 = faker.random.objectElement(catList)
    let cat2 = cat1
    while (cat2 === cat1) cat2 = faker.random.objectElement(catList)
    fakeRessource.categories = [ cat1, cat2 ]
  }
  // on ajoute des enfants pour les arbres et des parametres pour les autres
  if (fakeRessource.type === 'arbre') {
    if (options.enfants) {
      fakeRessource.enfants = options.enfants
    } else {
      fakeRessource.enfants = []
      for (let i = 0; i < faker.random.number(6); i++) {
        fakeRessource.enfants.push(fakeRef())
      }
    }
  } else {
    if (options.parametres) {
      fakeRessource.parametres = options.parametres
    } else if (!options.noparametres) {
      fakeRessource.parametres = {
        boolean: faker.random.boolean(),
        date: faker.date.past().toString(), // avec le passage par http ça deviendra une string
        number: faker.random.number(),
        string: faker.lorem.sentence(),
        uuid: faker.random.uuid(),
        word: faker.random.word()
      }
    }
  }

  // les autres propriétés peuvent être passées en options, mais on ne les met pas par défaut
  ;[
    'aliasOf',
    'cle',
    'typePedagogiques',
    'typeDocumentaires',
    'relations',
    'auteurs',
    'auteursParents',
    'contributeurs',
    'groupes',
    'groupesAuteurs',
    'dateCreation',
    'dateMiseAJour',
    'version',
    'indexable',
    'archiveOid',
    '$warnings',
    '$errors'
  ].forEach(p => { if (options[p]) fakeRessource[p] = options[p] })

  return fakeRessource
}

export default getFakeRessource
