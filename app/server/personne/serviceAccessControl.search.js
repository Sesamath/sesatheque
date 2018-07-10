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

/**
 * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
 * à la jonction entre personne et ressource.
 * @service $accessControl
 */
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
      queryOptions.skip = Math.min(0, Math.round(wantedQuery.skip) || 0)
    }

    if (wantedQuery.limit) {
      const limit = Math.round(wantedQuery.limit)
      if (limit > 0 && limit <= maxSearchLimit) queryOptions.limit = limit
      else warnings.push(`Limite ${wantedQuery.limit} invalide, ramenée à ${defaultSearchLimit}`)
    }

    return queryOptions
  }

  /**
   * Set query.groupes
   * @private
   * @param {Context} context
   * @param {object} query
   * @param {string[]} warnings pour en ajouter le cas échéant
   */
  const sanitizeSearchGroupes = (context, query, warnings) => {
    const wantedGroupes = context.get.groupes
    const myGroups = getCurrentUserGroupesMembre(context)
    const canReadAll = hasGenericPermission('read', context)
    // on regarde si y'a un filtre sur des groupes
    if (wantedGroupes) {
      const groupes = (Array.isArray(wantedGroupes) ? wantedGroupes : wantedGroupes.split(','))
        .map(groupe => groupe.trim())
      if (groupes.length) {
        if (canReadAll) {
          query.groupes = wantedGroupes
        } else {
          const groupes = wantedGroupes.filter(groupe => myGroups.includes(groupe))
          if (groupes.length < wantedGroupes.length) {
            const excluded = wantedGroupes.filter(g => !myGroups.includes(g))
            const message = (excluded.length > 1)
              ? `Vous n’êtes pas membre du groupe ${excluded[0]}, il a été exclu de la recherche`
              : `Vous n’êtes pas membre des groupes ${excluded.join(', ')}, ils ont été exclus de la recherche`
            warnings.push(message)
          }
          if (groupes.length) query.groupes = groupes
        }
      } else {
        warnings.push('Groupe(s) invalide(s), ignoré(s)')
      }
    }
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
      if (wantedPublie) query.publie = (wantedPublie === 'true')
      // sinon on peut ne rien préciser
    } else if (wantedPublie === 'true') {
      query.publie = true
    } else {
      warnings.push('Vous ne pouvez pas chercher de ressources non publiées si vous n’en êtes ni auteur ni contributeur')
      query.publie = true
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
    const wantedRestriction = context.get.restriction
    const canReadCorrection = hasGenericPermission('correction', context)
    // un raccourci d'écriture, obj prop => value (integer)
    const r = configRessource.constantes.restriction
    const defaultRestriction = canGrabPrivate
      ? r.prive
      : canReadCorrection ? r.correction : r.aucune
    const setDefault = () => {
      if (!canGrabPrivate) query.restriction = defaultRestriction
    }

    switch (wantedRestriction) {
      case undefined:
      case '':
        setDefault()
        break

      case `${r.aucune}`:
        query.restriction = r.aucune
        break

      case `${r.correction}`:
        if (canReadCorrection) {
          query.restriction = r.correction
        } else {
          warnings.push('Vous ne pouvez pas consulter les corrections')
          query.restriction = r.aucune
        }
        break

      case `${r.groupe}`:
        if (canGrabPrivate) {
          query.restriction = r.groupe
        } else {
          warnings.push('Vous ne pouvez pas consulter toutes les ressources de tous les groupes, vous devez restreindre aux votres')
          query.restriction = defaultRestriction
        }
        break

      case `${r.prive}`:
        if (canGrabPrivate) {
          query.restriction = r.prive
        } else {
          warnings.push('Vous ne pouvez pas consulter de ressource privée autre que les votres (vous devez ajouter un critère pour restreindre à vos ressources)')
          query.restriction = defaultRestriction
        }
        break

      default:
        warnings.push(`Restriction ${wantedRestriction} inconnue`)
        setDefault()
    }
  }

  /**
   * Retourne un objet avec query normalisée d'après les droits de l'utilisateur courant
   * @param {Context} context
   * @return {{query, queryOptions: {limit: number, skip: number}, warnings: string[]}}
   */
  const sanitizeSearch = (context) => {
    const warnings = []
    const query = {}
    const queryOptions = getQueryOptions(context, warnings)
    const wantedQuery = context.get

    // on regarde si c'est filtré sur ses propres ressources
    const canReadAll = hasGenericPermission('read', context)
    const myPid = getCurrentUserPid(context)
    const withinMine = myPid && (wantedQuery.auteurs === myPid || wantedQuery.contributeurs === myPid)

    sanitizeSearchGroupes(context, query, warnings)

    const withinMyGroups = Boolean(query.groupes)
    // le seul cas où on peut chercher du non publié, c'est sur ses propres ressources
    // (sauf si on a le droit de lecture sur tout)
    const canGrabPrivate = canReadAll || withinMine || withinMyGroups

    sanitizeSearchPublie(context, canGrabPrivate, query, warnings)
    sanitizeSearchRestriction(context, canGrabPrivate, query, warnings)

    // auteurs et contributeurs
    ;['auteurs', 'contributeurs'].forEach(prop => {
      const wanted = context.get[prop]
      if (!wanted) return
      query[prop] = (Array.isArray(wanted) ? wanted : wanted.split(','))
        .map(pid => pid.trim())
    })
    // input single value (tous en string)
    ;['titre', 'oid', 'origine', 'idOrigine', 'type', 'langue'].forEach(prop => {
      const value = context.get[prop]
      if (value) query[prop] = value
    })
    // multi
    ;['categories', 'niveaux', 'typePedagogiques', 'typeDocumentaires'].forEach(prop => {
      let values = context.get[prop]
      if (!values) return
      if (!Array.isArray(values)) values = values.split(',').map(value => value.trim())
      // niveaux est le seul dont les valeurs sont des string
      if (prop !== 'niveaux') values = values.map(value => Number(value)).filter(value => Number.isInteger(value))
      if (values.length) query[prop] = values
    })

    return {query, queryOptions, warnings}
  }

  return sanitizeSearch
}
