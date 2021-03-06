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

const Personne = require('../../constructors/Personne')
const {isObjectPlain} = require('sesajstools')
const {truePropertiesList} = require('sesajstools/utils/object')
const {getNormalizedName} = require('../lib/normalize')

/**
 * Entity pour un user
 * @entity EntityPersonne
 * @typedef EntityPersonne
 * @extends Entity
 * @extends Personne
 */
module.exports = function (component) {
  component.entity('EntityPersonne', function ($cachePersonne) {
    const configRoles = lassi.settings.components.personne.roles
    const EntityPersonne = this

    /**
     * Calcule et affecte les permissions d'une personne en fonction de ses rôles
     * et des permissions données à chaque rôle en configuration
     * @param {Object} roles La liste des rôles avec {role1: true}
     * @returns {Object} avec les permissions en propriété (valeur true|false|undefined)
     */
    function getPermissions (roles) {
      var permissions = {}
      Object.keys(roles).forEach(role => {
        const hasRole = roles[role]
        // on ajoute les permissions définies pour ce role en config
        if (hasRole && configRoles[role]) {
          // faut pas faire de merge, on pourrait écraser avec false
          // une permission déjà accordée par un rôle précédent
          Object.keys(configRoles[role]).forEach(permission => {
            const hasPerm = configRoles[role][permission]
            if (hasPerm) permissions[permission] = true
          })
        }
      })
      return permissions
    }

    EntityPersonne.construct(function (values) {
      // on impose les permissions d'après les rôles définis en config
      // faut du shallow copy pour pas modifier values.permissions
      const data = {...values}
      if (values.roles) data.permissions = getPermissions(values.roles)
      // avant d'appeler le constructeur
      Personne.call(this, data)
    })

    EntityPersonne.validateJsonSchema({
      type: 'object',
      properties: {
        oid: {type: 'string'},
        pid: {type: 'string', pattern: '^[a-zA-Z0-9_-]+/[a-z0-9_-]+$'},
        nom: {type: 'string'},
        prenom: {type: 'string'},
        email: {type: 'string'},
        roles: {type: 'object'},
        permissions: {type: 'object'},
        groupesMembre: {type: 'array', items: {type: 'string'}, uniqueItems: true},
        groupesSuivis: {type: 'array', items: {type: 'string'}, uniqueItems: true},
        infos: {type: 'object'},
        dateCreation: {instanceof: 'Date'},
        // cette propriété n'est pas gérée ici, mais elle envoyé par sesalab-sso,
        // en attendant d'avoir un wrapper dans $auth pour gérer le login on l'accepte
        structures: {type: 'array'} // à priori des array de {oid: string, value: Object}
      },
      additionalProperties: false,
      required: [
        'nom',
        'pid'
      ]
    })

    EntityPersonne.beforeStore = function (next) {
      // recalculé d'après les roles à chaque create/load (dans le constructeur),
      // mais on le fait aussi ici pour le garantir avant persistance (pas grave) mais surtout mise en cache
      // le faire 2 fois garanti d'avoir un db ok (avec la conf au moment de la sauvegarde)
      // ET des permissions ok au runtime (au cas où la conf change)
      if (this.roles) this.permissions = getPermissions(this.roles)
      // @todo ajouter ici un checkAuthSource
      if (!this.pid) throw new Error('personne sans pid, impossible à sauvegarder')
      next()
    }

    EntityPersonne.afterStore(function (next) {
      // on met en cache, attention à mettre la session à jour si besoin (pas de contexte ici)
      $cachePersonne.set(this, function (error) {
        if (error) log.error(error)
      })
      // et on passe au suivant sans se préoccuper du retour de mise en cache
      next()
    })

    EntityPersonne
      .defineIndex('pid')
      .defineIndex('nom')
      .defineIndex('email')
      // par défaut, la valeur de l'index est la valeur du champ, mais on peut fournir
      // une callback qui renvoie la valeur (ou un tableau de valeurs)
      .defineIndex('roles', 'string', function () {
        if (!isObjectPlain(this.roles)) return null
        const roles = truePropertiesList(this.roles)
        if (!roles.length) return null
        return roles
      })
      .defineIndex('groupesMembre', {normalizer: getNormalizedName}, function () {
        if (!this.groupesMembre || !this.groupesMembre.length) return null
        return this.groupesMembre
      })
      .defineIndex('groupesSuivis', {normalizer: getNormalizedName}, function () {
        if (!this.groupesSuivis || !this.groupesSuivis.length) return null
        return this.groupesSuivis
      })
  })
}
