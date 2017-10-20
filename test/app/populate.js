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

/**
 * Ce test crée une ressource puis la supprime, options possibles :
 * l'appeler directement en lui passant --prod ou --dev pour tester la sésathèque de prod ou dev,
 * (sinon c'est la bibli locale)
 * ou --token pour lui passer un token
 */

'use strict'
/* eslint-env mocha */
import fakeRessource from '../helpers/fakeRessource'
import fakePersonne from '../helpers/fakePersonne'
import flow from 'an-flow'
import config from '../../app/config'

const myBaseId = config.application.baseId
// pour nos 1ers tests
const nbPersonnes = 2
const nbRessources = 20

const personnes = new Map()
const ressources = new Map()
const pOids = []
const rOids = []

/**
 * Retourne une des personnes générées au hasard
 * @param {boolean} [pidOnly] passer true pour ne récupérer que le pid
 * @return {Personne}
 */
export function getRandomPersonne (pidOnly) {
  if (!personnes.length) throw new Error('Les personnes n’ont pas encore été générées')
  const i = Math.floor(Math.random() * pOids.length)
  const oid = pOids[i]
  if (pidOnly) return `${myBaseId}/${oid}`
  return personnes.get(oid)
}

/**
 * Retourne une des ressources générées au hasard
 * @param {boolean} [ridOnly] passer true pour ne récupérer que le rid
 * @return {Ressource}
 */
export function getRandomRessource (ridOnly) {
  if (!ressources.length) throw new Error('Les ressources n’ont pas encore été générées')
  const i = Math.floor(Math.random() * rOids.length)
  const oid = rOids[i]
  if (ridOnly) return `${myBaseId}/${oid}`
  return ressources.get(oid)
}

/**
 * Retourne les 200 personnes générées
 * @return {Map} clé oid
 */
export const getPersonnes = () => personnes
/**
 * Retourne les 2000 ressources générées
 * @return {Map} clé oid
 */
export const getRessources = () => ressources

/**
 * Génère 200 personnes et 2000 ressources avec des données aléatoires mais cohérentes
 * @param done
 */
export function populate (done) {
  const EntityPersonne = lassi.service('EntityPersonne')
  const EntityRessource = lassi.service('EntityRessource')
  let i
  flow(new Array(nbPersonnes)).seqEach(function () {
    const nextPersonne = this
    EntityPersonne.create(fakePersonne({nooid: true, nopid: true})).store((error, personne) => {
      if (error) return nextPersonne(error)
      personnes.set(personne.oid, personne)
      pOids.push(personne.oid)
    })
  }).seq(function () {
    this(null, new Array(nbRessources))
  }).seqEach(function () {
    const nextRessource = this
    const options = {
      auteurs: [getRandomPersonne(true)],
      nooid: true,
      norid: true
    }
    if (i % 10 === 1) options.auteurs.push(getRandomPersonne(true))
    if (i % 10 === 2) options.contributeurs = [getRandomPersonne(true)]
    if (i % 10 === 3) options.contributeurs = [getRandomPersonne(true), getRandomPersonne(true)]
    if (i % 10 === 4) {
      options.auteurs.push(getRandomPersonne(true))
      options.contributeurs = [getRandomPersonne(true), getRandomPersonne(true), getRandomPersonne(true)]
    }
    EntityRessource.create(fakeRessource(options)).store((error, ressource) => {
      if (error) return nextRessource(error)
      ressources.set(ressource.oid, ressource)
    })
  }).seq(function () {
    done(null, {personnes, ressources})
  }).catch(done)
}

export function purge (done) {
  const EntityPersonne = lassi.service('EntityPersonne')
  const EntityRessource = lassi.service('EntityRessource')
  flow().seq(function () {
    EntityPersonne.match().purge(this)
  }).seq(function () {
    EntityRessource.match().purge(this)
  }).catch(done)
}
