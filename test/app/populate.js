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

import boot from '../boot'
import config from '../../app/config'

const myBaseId = config.application.baseId
// pour nos 1ers tests
const nbPersonnesDefault = 2
const nbRessourcesDefault = 20

const personnes = new Map()
const ressources = new Map()
const pOids = []
const rOids = []

/**
 * Retourne une des personnes générées au hasard
 * @param {boolean} [pidOnly] passer true pour ne récupérer que le pid
 * @param {string[]} [except] Passer une liste de pid que l'on ne veut pas
 * @return {Personne}
 */
export function getRandomPersonne (pidOnly, except) {
  if (!personnes.size) throw new Error('Les personnes n’ont pas encore été générées (il faut appeler populate)')
  const i = Math.floor(Math.random() * pOids.length)
  const oid = pOids[i]
  const pid = `${myBaseId}/${oid}`
  if (except && except.includes(pid)) return getRandomPersonne(pidOnly, except)
  if (pidOnly) return pid
  return personnes.get(oid)
}

/**
 * Retourne une des ressources générées au hasard
 * @param {boolean} [ridOnly] passer true pour ne récupérer que le rid
 * @param {string[]} [except] Passer une liste de rid que l'on ne veut pas
 * @return {Ressource}
 */
export function getRandomRessource (ridOnly, except) {
  // console.log(`getRandomRessource avec ${ressources.size}`)
  if (!ressources.size) throw new Error('Les ressources n’ont pas encore été générées (il faut appeler populate)')
  const i = Math.floor(Math.random() * rOids.length)
  const oid = rOids[i]
  const rid = `${myBaseId}/${oid}`
  if (except && except.includes(rid)) return getRandomRessource(ridOnly, except)
  if (ridOnly) return rid
  return ressources.get(oid)
}

/**
 * Retourne les 200 personnes générées
 * @return {Map} clé oid
 */
export const getPersonnes = () => Array.from(personnes.values())
/**
 * Retourne les 2000 ressources générées
 * @return {Map} clé oid
 */
export const getRessources = () => Array.from(ressources.values())

/**
 * Génère 200 personnes et 2000 ressources avec des données aléatoires mais cohérentes
 * @param {object} [options]
 * @param {number} [options.personnes] Nb de personnes à générer
 * @param {number} [options.ressources] Nb de ressources à générer
 * @param {errorCallback} [done]
 * @return {Promise|undefined} Promise si done n'est pas fourni
 */
export function populate (options, done) {
  // init avec nos valeurs par défaut
  if (typeof options === 'function') {
    done = options
    options = {
      personnes: nbPersonnesDefault,
      ressources: nbRessourcesDefault
    }
  }
  if (!done) {
    return new Promise((resolve, reject) => {
      populate(options, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
  // p'tet rien à faire
  if (!options.hasOwnProperty('personnes')) options.personnes = nbPersonnesDefault
  if (!options.hasOwnProperty('ressources')) options.ressources = nbRessourcesDefault
  if (options.personnes <= personnes.size && options.ressources <= ressources.size) return done()

  // faut récupérer lassi
  boot().then(({lassi}) => {
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    const nbPersonnes = options.personnes
    let i
    // console.log(`start populate`)
    flow(new Array(nbPersonnes)).seqEach(function () {
      const nextPersonne = this
      EntityPersonne.create(fakePersonne({nooid: true, nopid: true})).store((error, personne) => {
        if (error) return nextPersonne(error)
        personnes.set(personne.oid, personne)
        pOids.push(personne.oid)
        nextPersonne()
      })
    }).seq(function () {
      // console.log(`génération de ${personnes.size} personnes`)
      this(null, new Array(options.ressources))
    }).seqEach(function () {
      const nextRessource = this
      const options = {
        nooid: true,
        norid: true
      }
      let pid1
      if (nbPersonnes > 0) {
        // par défaut un auteur
        pid1 = getRandomPersonne(true)
        options.auteurs = [pid1]
        if (i % 10 === 1 && nbPersonnes > 1) {
          // dans 10% des cas un 2e auteur
          options.auteurs.push(getRandomPersonne(true, [pid1]))
        } else if (i % 10 === 2 && nbPersonnes > 1) {
          // dans 10% des cas un contributeur
          options.contributeurs = [getRandomPersonne(true, [pid1])]
        } else if (i % 10 === 3 && nbPersonnes > 2) {
          // dans 10% des cas deux contributeurs
          const pid2 = getRandomPersonne(true, [pid1])
          const pid3 = getRandomPersonne(true, [pid1, pid2])
          options.contributeurs = [pid2, pid3]
        } else if (i % 10 === 4 && nbPersonnes > 4) {
          // dans 10% des cas un 2e auteur et 3 contributeurs
          const pid2 = getRandomPersonne(true, [pid1])
          const pid3 = getRandomPersonne(true, [pid1, pid2])
          const pid4 = getRandomPersonne(true, [pid1, pid2, pid3])
          const pid5 = getRandomPersonne(true, [pid1, pid2, pid3, pid4])
          options.auteurs.push(pid2)
          options.contributeurs = [pid3, pid4, pid5]
        }
      }
      const ressource = fakeRessource(options)
      EntityRessource.create(ressource).store((error, ressourceDb) => {
        if (error) return nextRessource(error)
        ressources.set(ressourceDb.oid, ressourceDb)
        rOids.push(ressourceDb.oid)
        nextRessource()
      })
    }).seq(function () {
      // console.log(`génération de ${personnes.size} personnes et ${ressources.size} ressources`)
      done(null, {personnes, ressources})
    }).catch(done)
  }).catch(done)
}

/**
 * Efface toutes les ressources et personnes de la base
 * @param {errorCallback} [done]
 * @return {Promise|undefined} Promise si done n'est pas fourni
 */
export function purge (done) {
  if (typeof done !== 'function') {
    return new Promise((resolve, reject) => {
      purge((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
  boot().then(({lassi}) => {
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    EntityPersonne.match().purge((error) => {
      if (error) return done(error)
      EntityRessource.match().purge((error) => {
        if (error) return done(error)
        done()
      })
    })
  }).catch(done)
}
