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
const uuid = require('an-uuid')

const tools = require('../tools')
const Ressource = require('../constructors/Ressource')
const {getBaseIdFromRid, getRidComponents} = require('sesatheque-client/dist/sesatheques')
const {getRidEnfants} = require('../tools/ressource')
const config = require('../config')
// idem config.component.ressource, mais le require permet une meilleure autocompletion
const configRessource = require('./config')
const myBaseId = config.application.baseId

module.exports = function (EntityRessource) {
  /**
   * Notre entité ressource, cf [Entity](lassi/Entity.html)
   * @entity EntityRessource
   * @param {Object} values Un objet ayant des propriétés d'une ressource
   * @extends Entity
   * @extends Ressource
   */
  EntityRessource.construct(function (values) {
    // on initialise avec les propriétés d'un objet Ressource correctement typé et initialisé
    Object.assign(this, new Ressource(values, myBaseId))

    // mais après on ne peut plus ajouter de propriété dans afterStore, pas trouvé pourquoi…
    // => TypeError: Cannot assign to read only property 'rid' of object '#<Entity>'
    if (!this.hasOwnProperty('rid')) Object.defineProperty(this, 'rid', {writable: true, enumerable: true, configurable: false})

    // on cast les dates avec notre tools.toDate() qui gère mieux les fuseaux,
    // plus pratique ici que dans le constructeur qui ne peut faire de require
    if (values) {
      if (values.dateCreation && !(values.dateCreation instanceof Date)) values.dateCreation = tools.toDate(values.dateCreation)
      if (values.dateMiseAJour && !(values.dateMiseAJour instanceof Date)) values.dateMiseAJour = tools.toDate(values.dateMiseAJour)
    }

    // ajoute les éventuelles propriétés supplémentaire de notre objet initial
    // _.each(values, function (value, key) {
    //  if (!entity.hasOwnProperty(key) && typeof value !== 'function') log.debug('la propriété ' +key +' a été ignorée dans le constructeur de Ressource')
    // })

    // la langue par défaut
    if (this.langue) {
      // on rectifie fre en fra
      if (this.langue === 'fre') this.langue = 'fra'
    } else {
      this.langue = configRessource.langueDefaut
    }
  })

  // on veut pas d'une table entity_ressource
  EntityRessource.table = 'ressource'

  EntityRessource
    .defineIndex('rid', 'string')
    // baseId n'est pas une propriété de Ressource mais ça nous intéresse de connaître la provenance
    .defineIndex('baseId', 'string', function () {
      if (this.rid) return getBaseIdFromRid(this.rid)
    })
    .defineIndex('cle', 'string') // pour loadByCle
    .defineIndex('aliasOf', 'string')
    .defineIndex('origine', 'string')
    .defineIndex('idOrigine', 'string')
    .defineIndex('type', 'string')
    .defineIndex('titre', 'string')
    .defineIndex('niveaux', 'string')
    .defineIndex('categories', 'integer')
    .defineIndex('typePedagogiques', 'integer')
    .defineIndex('typeDocumentaires', 'integer')
    // par défaut, la valeur de l'index est la valeur du champ, mais on peut fournir une callback qui la remplace
    // on retourne un tableau qui ne contient que les oid des éléments liés sans la nature de la relation
    // c'est une string car ça peut être 'alias/xxx' où xxx est l'oid de l'alias et pas l'oid d'une ressource
    // (pour gérer les relations avec des oid externes)
    .defineIndex('relations', 'string', function () {
      // on retourne pour chaque relation l'item lié, tant pis pour la nature de la relation
      return this.relations.map(relation => relation[1])
    })
    // pour les arbres, on indexe tous les enfants, c'est lourd en écriture d'index
    // mais indispensable si on veut retrouver tous les arbres qui contiennent un item donné
    // (pour mettre à jour titre & résumé par ex).
    .defineIndex('enfants', 'string', function () { return getRidEnfants(this) })
    .defineIndex('auteurs', 'string')
    .defineIndex('auteursParents', 'string')
    .defineIndex('contributeurs', 'string')
    .defineIndex('iPids', 'string', function () {
      return [].concat(this.auteurs, this.auteursParents, this.contributeurs).filter(pid => pid)
    })
    .defineIndex('groupes', 'string')
    .defineIndex('groupesAuteurs', 'string')
    .defineIndex('langue', 'string')
    .defineIndex('publie', 'boolean')
    .defineIndex('indexable', 'boolean')
    .defineIndex('restriction', 'integer')
    .defineIndex('dateCreation', 'date')
    .defineIndex('dateMiseAJour', 'date')

  // beforeStore était dans $ressourceRepository, pour des questions de cycle d'injection de dépendances
  // on le ramène ici pour vérifier l'intégrité "interne" de l'entity, en laissant là-bas un beforeSave
  // pour vérifier l'intégrité des relations

  EntityRessource.beforeStore(function (next) {
    try {
      // pour les messages d'erreur
      const id = this.oid ||
        this.rid ||
        (this.origine && this.idOrigine && `${this.origine}/${this.idOrigine}`) ||
        this.titre

      // check type
      if (!this.type) throw new Error('Ressource sans type, impossible à sauvegarder')
      // check origine et idOrigine
      if (this.origine) {
        if (this.origine === myBaseId) {
          // on vérifie la cohérence oid = idOrigine
          if (this.idOrigine && this.oid) {
            if (this.oid != this.idOrigine) { // eslint-disable-line eqeqeq
              throw new Error(`Ressource incohérente (oid ${this.oid} avec origine ${this.origine} et idOrigine ${this.idOrigine})`)
            }
            // sinon tout est normal
          } else if (this.oid) {
            this.idOrigine = this.oid
          } else if (this.idOrigine) {
            this.oid = this.idOrigine
          }
          // sinon ni l'un ni l'autre, faudra le mettre en afterStore
        } else if (this.idOrigine) {
          // on vérifie qu'on essaie pas d'enregistrer localement une ressource qui viendrait d'ailleurs
          if (this.oid && this.idOrigine === this.oid) throw new Error(`Cette ressource ${this.origine}/${this.idOrigine}) devrait être enregistrée sur ${this.origine}`)
        } else {
          return next(new Error(`origine sans idOrigine (${this.oid ? this.oid : 'creation'})`))
        }
      } else if (this.type !== 'error') {
        // on pourrait mettre d'office une origine myBaseId ici, mais c'est le boulot du contrôleur
        // ça pourrait masquer une vraie erreur d'aiguillage
        return next(new Error(`propriété origine obligatoire (${this.oid ? this.oid : 'creation'})`))
      }

      // check rid
      if (this.rid) {
        const [baseId, oid] = getRidComponents(this.rid)
        if (baseId === myBaseId) {
          // check oid
          if (!this.oid) this.oid = oid
          else if (this.oid != oid) throw new Error(`oid ${this.oid} et rid ${this.rid} incohérents`) // eslint-disable-line eqeqeq
          // si y'a pas d'origine on en met une
          if (!this.origine) this.origine = myBaseId
          // si on est l'origine on fixe idOrigine s'il n'y est pas
          if (this.origine === myBaseId) {
            if (!this.idOrigine) this.idOrigine = this.oid
            if (this.idOrigine != this.oid) throw new Error(`idOrigine ${this.idOrigine} et rid ${this.rid} incohérents`) // eslint-disable-line eqeqeq
          }
        } else {
          throw new Error(`Cette ressource ${this.oid || this.rid} doit être enregistrée sur ${baseId}`)
        }
      } else if (this.oid) {
        this.rid = myBaseId + '/' + this.oid
      }
      // check aliasOf
      if (this.aliasOf) {
        // peu importe la base, on veut juste un check
        getBaseIdFromRid(this.aliasOf)
      }
      // on vire un éventuel token
      if (this.token) delete this.token
      // on génère la clé si elle manque
      if (this.restriction && !this.cle) {
        this.cle = uuid()
      }
      // date de création
      if (!this.dateCreation) this.dateCreation = new Date()
      // date de mise à jour
      this.dateMiseAJour = new Date()
      // cohérence de la restriction
      if (this.restriction === configRessource.constantes.restriction.groupe && (!this.groupes || !this.groupes.length)) {
        log.dataError(`Ressource ${id} restreinte à ses groupes sans préciser lesquels, on la passe privée`)
        this.restriction = configRessource.constantes.restriction.prive
      }
      // check des relations dans beforeSave mais pas ici (pour permettre des batch qui sauvent
      // des paires liées par ex, la 1re a pas encore sa relation en base)

      next(null, this)
    } catch (error) {
      log.dataError(error, this)
      next(error)
    }
  })

  // met en idOrigine l'oid de la ressource si origine locale et que ça n'y était pas encore
  // idem pour rid
  EntityRessource.afterStore(function (next) {
    let needToStore = false
    // on ajoute notre id en idOrigine si on est l'origine
    if (this.origine === myBaseId && !this.idOrigine) {
      this.idOrigine = this.oid
      needToStore = true
    }
    // on complète rid si besoin
    if (!this.rid) {
      this.rid = myBaseId + '/' + this.oid
      needToStore = true
    }
    if (needToStore) {
      this.store(next)
    } else {
      next()
    }
  })
}
