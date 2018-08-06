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
const {exists, getRidComponents} = require('sesatheque-client/src/sesatheques')
const {stringify} = require('sesajstools')

const tools = require('../lib/tools')
const {getNormalizedName} = require('../lib/normalize')
const {getRidEnfants} = require('../lib/ressource')

const Ressource = require('../../constructors/Ressource')
const config = require('../config')
// idem config.component.ressource, mais le require permet une meilleure autocompletion
const configRessource = require('./config')

const schema = require('./EntityRessource.schema')

const myBaseId = config.application.baseId

module.exports = function (component) {
  component.entity('EntityRessource', function () {
    const EntityRessource = this
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
      if (!this.hasOwnProperty('rid')) {
        Object.defineProperty(this, 'rid', {
          writable: true,
          enumerable: true,
          configurable: false
        })
      }

      // on cast les dates avec notre tools.toDate() qui gère mieux les fuseaux,
      // plus pratique ici que dans le constructeur qui ne peut pas faire de require
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

    EntityRessource.validateJsonSchema(schema)

    EntityRessource
      .defineIndex('rid', {unique: true, sparse: true}) // rid est obligatoire, mais on l'a pas encore à la création… => sparse
      .defineIndex('cle', {unique: true, sparse: true}) // pour loadByCle
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
      .defineIndex('relations', function () {
        // on retourne pour chaque relation l'item lié, tant pis pour la nature de la relation
        return this.relations.map(relation => relation[1])
      })
      // pour les arbres, on indexe tous les enfants, c'est lourd en écriture d'index
      // mais indispensable si on veut retrouver tous les arbres qui contiennent un item donné
      // (pour mettre à jour titre & résumé par ex).
      .defineIndex('enfants', 'string', function () {
        if (!this.enfants || !this.enfants.length) return
        return getRidEnfants(this)
      })
      .defineIndex('auteurs')
      .defineIndex('auteursParents')
      .defineIndex('contributeurs')
      .defineIndex('iPids', function () {
        return [].concat(this.auteurs, this.auteursParents, this.contributeurs).filter(pid => pid)
      })
      // les groupes chez qui la ressource est publiée
      .defineIndex('groupes', {normalizer: getNormalizedName})
      // les groupes qui ont un droit d'écriture sur la ressource
      .defineIndex('groupesAuteurs', {normalizer: getNormalizedName})
      .defineIndex('langue')
      .defineIndex('publie', 'boolean')
      .defineIndex('indexable', 'boolean')
      .defineIndex('restriction', 'integer')
      .defineIndex('dateCreation', 'date')
      .defineIndex('dateMiseAJour', 'date')

    // les champs à indexer pour le fulltext
    EntityRessource.defineTextSearchFields([
      ['titre', 5],
      ['resume', 2],
      // poid de 1 par défaut pour le reste
      'commentaires',
      'description',
      'groupes',
      'groupesAuteurs'
    ])

    // beforeStore était dans $ressourceRepository, pour des questions de cycle d'injection de dépendances
    // on le ramène ici pour vérifier l'intégrité "interne" de l'entity, en laissant là-bas un beforeSave
    // pour vérifier l'intégrité des relations

    EntityRessource.beforeStore(function (next) {
      const logAndNext = (errorMessage) => {
        const error = Error(errorMessage)
        log.error(error)
        next(error)
      }

      // un identifiant pour les messages d'erreur
      const id = this.oid ||
        this.rid ||
        (this.origine && this.idOrigine && `${this.origine}/${this.idOrigine}`) ||
        this.titre

      // type et titre obligatoire
      if (!this.type) return next(Error(`Ressource sans type, impossible à sauvegarder (${id})`))
      if (!this.titre) return next(Error(`Ressource sans titre, impossible à sauvegarder (${id})`))

      try {
        // on peut écraser une ressource en fournissant son rid (sans son oid),
        // on commence par vérifier ça
        if (this.rid) {
          const [baseId, oid] = getRidComponents(this.rid)
          if (baseId !== myBaseId) return logAndNext(`Ressource avec rid ${this.rid} qui correspond à une autre Sésathèque (${baseId})`)
          if (this.oid) {
            if (this.oid !== oid) return logAndNext(`Ressource avec rid ${this.rid} incohérent avec son oid ${this.oid}`)
          } else {
            this.oid = oid
          }
        } else if (this.oid) {
          this.rid = `${myBaseId}/${this.oid}`
        } // else rid sera fixé en afterStore d'après l'oid créé

        // check origine et idOrigine, qui peuvent être tous deux vides à ce stade
        if (this.origine === myBaseId) {
          // ressource créée ici, on vérifie la cohérence oid = idOrigine dans ce cas
          if (this.idOrigine && this.oid) {
            if (this.oid !== this.idOrigine) {
              return logAndNext(Error(`Ressource incohérente (oid ${this.oid} avec origine ${this.origine} et idOrigine ${this.idOrigine})`))
            } // sinon c'est cohérent et tout va bien
          } else if (this.oid) {
            // oid sans idOrigine, on fixe
            this.idOrigine = this.oid
          } else if (this.idOrigine) {
            // idOrigine sans oid (ni rid qui aurait fixé oid plus haut)
            // => c'est une ressource qui existe déjà dans la base,
            // pas normal de n'avoir donné ni rid ni oid => on jette
            return logAndNext(`ressource ${this.origine}/${this.idOrigine} existante fournie sans rid ni oid`)
          }
        } else if (this.origine) {
          // on vérifie qu'on essaie pas d'enregistrer ici une ressource d'une autre sésathèque
          // (à priori un pb de dump, ou un post vers l'api de la mauvaise sesathèque)
          if (exists(this.origine)) {
            return logAndNext(`Cette ressource ${this.origine}/${this.idOrigine}) devrait être enregistrée sur ${this.origine}`)
          } else if (!this.idOrigine) {
            return logAndNext(`origine sans idOrigine (${id})`)
          }
        } else if (this.type === 'error') {
          // le seul cas où on vérifie pas origine/idOrigine,
          // on note quand même dans le log qu'on enregistre une erreur
          log.dataError('store d’une ressource de type error', this)
        } else {
          // pas d'origine on pourrait mettre d'office une origine myBaseId ici, mais c'est le boulot
          // du contrôleur, le faire ici pourrait masquer une vraie erreur d'aiguillage
          return logAndNext(`propriété origine obligatoire (${id})`)
        }

        // check aliasOf
        if (this.aliasOf) {
          // y'a eu des 'undefined' enregistrés à une époque…
          // @todo virer ça après update34
          if (this.aliasOf === 'undefined' || this.aliasOf === '') {
            delete this.aliasOf
          } else {
            // on vérifie que ça pointe vers une base connue
            try {
              getRidComponents(this.aliasOf)
            } catch (error) {
              return logAndNext(`aliasOf ${this.aliasOf} invalide (ressource ${id})`)
            }
          }
        }

        // on génère la clé si elle manque, on la vire si elle n'est plus nécessaire
        if (this.publie && !this.restriction) {
          // public
          if (this.hasOwnProperty('cle')) delete this.cle
        } else {
          // prive
          if (!this.cle) this.cle = uuid()
        }

        // pas de parametres sur les arbres mais une propriété enfants obligatoire
        if (this.type === 'arbre') {
          // @todo remettre ça après passage de l'update 35
          // if (!Array.isArray(this.enfants)) return logAndNext(`arbre sans propriété enfants (${id})`)
          if (!Array.isArray(this.enfants)) this.enfants = []
        }

        // date de création
        if (!this.dateCreation) this.dateCreation = new Date()
        // date de mise à jour, sauf en cas de réindexation
        // (si c'est pas reindex c'est un autre batch qui indique ça)
        // @todo gérer dateMiseAJour dans le contrôleur
        if (!this.$byPassDuplicate) this.dateMiseAJour = new Date()

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

    // attention, c'est aussi déclenché sur un create avec oid
    EntityRessource.onLoad(function () {
      // on stocke la ressource telle qu'elle était au chargement, sérialisée pour ne pas avoir de shallow copy
      if (this.oid) this.$original = stringify(this)
    })
  })
}
