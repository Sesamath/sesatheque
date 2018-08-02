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
const configRessource = require('../ressource/config')

const defaultSearchLimit = 25
const maxSearchLimit = 100

// sanitizeSearch isolé dans ce module, dépendant de $accessControl
module.exports = function ($accessControl) {
  const {getCurrentUserGroupesMembre, getCurrentUserPid, hasGenericPermission} = $accessControl

  /**
   * retourne queryOptions d'après skip & limit passés en get
   * @private
   * @param {Context} context
   * @param {string[]} warnings pour en ajouter le cas échéant
   * @return {{limit: number, skip: number}}
   */
  const getQueryOptions = (context, warnings) => {
    const queryOptions = {
      limit: defaultSearchLimit,
      skip: 0
    }
    const wantedQuery = context.get

    if (wantedQuery.skip) {
      queryOptions.skip = Math.max(0, Math.round(wantedQuery.skip) || 0)
    }

    if (wantedQuery.limit) {
      const limit = Math.round(wantedQuery.limit)
      if (limit > 0 && limit <= maxSearchLimit) queryOptions.limit = limit
      else warnings.push(`Limite ${wantedQuery.limit} invalide, ramenée à ${defaultSearchLimit}`)
    }

    if (wantedQuery.orderBy) {
      // on controle rien, c'est vérifié dans le queryBuilder
      // et sans risque si ça contient n'importe quoi
      queryOptions.orderBy = wantedQuery.orderBy
    }

    return queryOptions
  }

  /**
   * Set query.groupes en filtrant les groupes demandés
   * @private
   * @param {Context} context
   * @param {object} query
   * @param {string[]} warnings pour en ajouter le cas échéant
   */
  const sanitizeSearchGroupes = (context, query, warnings) => {
    const myGroups = getCurrentUserGroupesMembre(context)
    const canReadAll = hasGenericPermission('read', context)

    const addGroups = (prop) => {
      const wantedGroupes = context.get[prop]
      if (!wantedGroupes) return
      const groupes = (Array.isArray(wantedGroupes)
        ? wantedGroupes
        : wantedGroupes.split(',')).map(groupe => groupe.trim())
      if (groupes.length) {
        if (canReadAll) {
          query[prop] = wantedGroupes
        } else {
          const groupes = wantedGroupes.filter(groupe => myGroups.includes(groupe))
          if (groupes.length < wantedGroupes.length) {
            const excluded = wantedGroupes.filter(g => !myGroups.includes(g))
            const message = (excluded.length > 1)
              ? `Vous n’êtes pas membre du groupe ${excluded[0]}, il a été exclu de la recherche`
              : `Vous n’êtes pas membre des groupes ${excluded.join(', ')}, ils ont été exclus de la recherche`
            warnings.push(message)
          }
          if (groupes.length) query[prop] = groupes
        }
      } else {
        warnings.push('Groupe(s) invalide(s), ignoré(s)')
      }
    }

    addGroups('groupes')
    addGroups('groupesAuteurs')
  }

  /**
   * Set query.publie
   * @private
   * @param {Context} context
   * @param {boolean} canGrabPrivate
   * @param {object} query
   * @param {string[]} warnings pour en ajouter le cas échéant
   */
  const sanitizeSearchPublie = (context, canGrabPrivate, query, warnings) => {
    const wantedPublie = context.get.publie
    if (canGrabPrivate) {
      if (wantedPublie) query.publie = [(wantedPublie === 'true')]
      // sinon on peut ne rien préciser
    } else {
      if (wantedPublie && wantedPublie !== 'true') {
        warnings.push('Vous ne pouvez pas chercher de ressources non publiées sans filtrer sur vos ressources (ou celles de vos groupes)')
      }
      query.publie = [true]
    }
  }

  /**
   * Set query.restriction
   * @private
   * @param {Context} context
   * @param {boolean} canGrabPrivate
   * @param {object} query
   * @param {string[]} warnings pour en ajouter le cas échéant
   */
  const sanitizeSearchRestriction = (context, canGrabPrivate, query, warnings) => {
    const canReadCorrection = hasGenericPermission('correction', context)
    // un raccourci d'écriture, obj prop => value (integer)
    const r = configRessource.constantes.restriction
    const defaultRestriction = canReadCorrection ? [r.aucune, r.correction] : [r.aucune]
    const setDefault = () => {
      if (!canGrabPrivate) query.restriction = defaultRestriction
    }

    /** @type string[] */
    let wantedRestrictions = context.get.restriction
    if (!wantedRestrictions) return setDefault()
    if (!Array.isArray(wantedRestrictions)) wantedRestrictions = [wantedRestrictions]
    if (!wantedRestrictions.length) return setDefault()

    // faut analyser, on passe par un set pour la déduplication
    const restrictions = new Set()
    wantedRestrictions.forEach(wantedRestriction => {
      switch (wantedRestriction) {
        case `${r.aucune}`:
          restrictions.add(r.aucune)
          break

        case `${r.correction}`:
          if (canReadCorrection) restrictions.add(r.correction)
          else warnings.push('Vous ne pouvez pas consulter les corrections')
          break

        case `${r.groupe}`:
          // si y'a déjà un filtre sur des groupes dont je fait partie canGrabPrivate est true
          if (canGrabPrivate) restrictions.add(r.groupe)
          else warnings.push('Vous ne pouvez pas consulter toutes les ressources de tous les groupes, vous devez restreindre aux votres')
          break

        case `${r.prive}`:
          if (canGrabPrivate) restrictions.add(r.prive)
          else warnings.push('Vous ne pouvez pas consulter de ressource privée autre que les votres (vous devez ajouter un critère pour restreindre à vos ressources)')
          break

        default:
          warnings.push(`Restriction ${wantedRestriction} inconnue`)
      }
    })
    if (restrictions.size) query.restriction = Array.from(restrictions)
    else setDefault() // la liste passée était foireuse, y'a déjà les warnings
  }

  /**
   * Retourne un objet avec query normalisée d'après les droits de l'utilisateur courant
   * Ça garanti que ce que remontera cette recherche sera lisible par l'utilisateur courant
   * @param {Context} context
   * @return {{query: searchQuery, queryOptions: {limit: number, skip: number}, warnings: string[]}}
   */
  const sanitizeSearch = (context) => {
    function getStringValues (prop) {
      let values = context.get[prop]
      if (!values) return
      if (Array.isArray(values)) return values
      // forcément une string (c'est du get), donc falsy => string vide
      return values.split(',').map(value => value.trim()).filter(v => v)
    }

    const warnings = []
    const query = {}
    const queryOptions = getQueryOptions(context, warnings)
    const wantedQuery = context.get

    // on regarde si c'est filtré sur ses propres ressources
    const canReadAll = hasGenericPermission('read', context)
    const myPid = getCurrentUserPid(context)
    // si y'a un filtre sur mes ressources
    const withinMine = myPid && (wantedQuery.auteurs === myPid || wantedQuery.contributeurs === myPid)

    sanitizeSearchGroupes(context, query, warnings)

    // si y'a un filtre sur les ressources publiées ou éditées par des groupes dont je suis membre
    const withinMyGroups = Boolean(query.groupes || query.groupesAuteurs)

    // le seul cas où on peut chercher du non publié, c'est sur ses propres ressources
    // (sauf si on a le droit de lecture sur tout)
    const canGrabPrivate = canReadAll || withinMine || withinMyGroups

    sanitizeSearchPublie(context, canGrabPrivate, query, warnings)
    sanitizeSearchRestriction(context, canGrabPrivate, query, warnings)

    // input string (à priori single value pour les premiers, multiple autorisé)
    ;['titre', 'oid', 'origine', 'idOrigine', 'type', 'langue', 'auteurs', 'contributeurs', 'niveaux'].forEach(prop => {
      const values = getStringValues(prop)
      if (!values) return
      query[prop] = values
    })
    // cast en number
    ;['categories', 'typePedagogiques', 'typeDocumentaires'].forEach(prop => {
      let values = getStringValues(prop)
      if (!values) return
      values = values.map(value => Number(value)).filter(value => Number.isInteger(value))
      if (values.length) query[prop] = values
    })

    return {query, queryOptions, warnings}
  }

  return sanitizeSearch
}
