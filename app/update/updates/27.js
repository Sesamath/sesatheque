/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
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
 * Sésathèque est un logiciel libre  vous pouvez le redistribuer ou le modifier suivant
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

const flow = require('an-flow')
const config = require('../../config')
const mysql = require('mysql2')
const _ = require('lodash')

const name = 'Migration MySQL vers MongoDb'
const description = ''

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)
const updateLogErr = updateLog.error
const logBoth = (message, obj) => {
  updateLogErr(message)
  log.dataError(message, obj)
}

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    /**
     * Juste un helper pour convertir les camelCase en underscore
     * @param String s la chaîne Camel à convertir
     * @return String la chaîne convertie en underscore
     */
    function toUnderscore (s) {
      return (s[0].toLowerCase() + s.substr(1)).replace(/([A-Z])/g, function ($1) {
        return '_' + $1.toLowerCase()
      })
    }

    /**
     * Convertit en string les oids d'un objet pour un chemin donné
     * Note: si le chemin contient la chaîne '[]', on itère sur tous les éléments du tableau
     * de l'attribut précédant '[]' pour modifier la suite du chemin (inutile si c'est le dernier)
     * @param {Object} object
     * @param {string} path
     */
    function convertOidValues (object, path) {
      var subPaths = path.split('[].')

      // On enlève la première partie du chemin et on recupère la valeur correspondante
      var firstSubPath = subPaths.shift()
      var value = _.get(object, firstSubPath)

      // Si pas de valeur à ce chemin, rien de plus à faire
      if (!value) return

      if (subPaths.length > 0) {
        // Si il faut chercher plus loin, on itère sur les éléments que l'on a trouvé
        // On "reconstitue" le chemin restant
        var remainingPath = subPaths.join('[].')

        // Normalement on a une valeur array à ce chemin (vu qu'il finissait par '[]'), mais autant vérifier
        if (_.isArray(value)) {
          _.forEach(value, (v) => convertOidValues(v, remainingPath))
        } else {
          updateLogErr(`on s’attendait à un array pour ${firstSubPath}`, value)
        }
      } else {
        // pas de tableau sur lequel faire une récursion, on convertit la valeur en string
        var convertedValue
        if (_.isArray(value)) {
          convertedValue = _.map(value, (v) => _.isInteger(v) ? v.toString() : v)
        } else if (_.isInteger(value)) {
          convertedValue = value.toString()
        }

        if (convertedValue) {
          _.set(object, firstSubPath, convertedValue)
        }
      }
    }

    /**
     * Migre une table d'entités, par paquets de ${limit}
     */
    function migrate (Entity, name, table, next) {
      let currentTotal = 0
      flow().seq(function () {
        // à priori, oid devrait être dans data, mais on a déjà trouvé des datas en base avec oid undefined…
        connection.query(`SELECT oid, data FROM ${table} ORDER BY oid LIMIT ${offset}, ${limit}`, this)
      }).seqEach(function (row) {
        currentTotal++
        // Je ne sais pas comment le cas d'une entity sans data s'est produit
        // mais dans le doute on ajoute un garde-fou et un warning
        if (!row.data) {
          updateLogErr(table + ' avec une ligne sans data')
          return this()
        }
        // Construction de l'entité
        const entityData = JSON.parse(row.data.toString())
        // oid toujours en string, on les conserve pour les existants (et les prochains seront des hash MongoDb
        entityData.oid = String(row.oid)
        // on s'assure quand même de ça
        if (entityData.oid === 'undefined') {
          logBoth('entité sans oid', row)
          return done(new Error('entité sans oid'))
        }
        if (convertIntToString[name]) {
          _.forEach(convertIntToString[name], (attributePath) => {
            convertOidValues(entityData, attributePath)
          })
        }
        // création de l'entité et stockage
        Entity.create(entityData).store(this)
      }).seq(function () {
        if (currentTotal === limit) {
          updateLog(`migration OK des entity ${name} de ${offset} à ${offset + currentTotal - 1} sur ${nbTotal}`)
          offset += limit
          process.nextTick(migrate, Entity, name, table, next)
        } else {
          updateLog(`migration OK des ${nbTotal} entity ${name}`)
          next()
        }
      }).catch(next)
    }

    /*
     * Attributs (valeur ou tableau) à convertir en String
     */
    const convertIntToString = {
      // nos entity ne référencent jamais d'oid (seulement des pid ou des rid, déjà des strings), sauf
      EntityArchive: [
        'archiveOid'
      ]
    }

    if (!config.databaseMysql) return done(new Error('"databaseMysql" doit être paramétré dans _private/config.js et doit indiquer les paramètres de l’ancienne base MySQL pour la migration'))
    // Initialisation de la connection mysql
    const connection = mysql.createConnection(config.databaseMysql)
    if (!connection) return done(new Error('config.databaseMysql ne permet pas de se connecter à mysql'))
    // Récupératon du service $entities
    const $entities = lassi.service('$entities')
    // Récupération des définitions d'entité.
    const definitions = _.values($entities.definitions())
    // variables globales à run utilisées dans migrate
    const limit = 100
    let offset = 0
    let nbTotal
    // Itération sur les définitions
    flow(definitions).seqEach(function (definition) {
      const name = definition.name
      // Récupération de l'entity par son nom en tant que service Lassi
      const Entity = lassi.service(name)
      // Calcul de la table associée à la définition. Seules les données nous
      // intéressent car les indexes seront de toute façon regénérés
      const table = definition.table || toUnderscore(definition.name)
      const nextEntity = this
      if (!table) return nextEntity(new Error(`L'entité ${name} n’a pas de table`))
      connection.query(`SELECT count(*) AS nb FROM ${table}`, function (error, results) {
        if (error) return nextEntity(error)
        if (results[0] && results[0].nb) {
          nbTotal = results[0].nb
          updateLog(`${nbTotal} entity ${name}`)
          offset = 0
          migrate(Entity, name, table, nextEntity)
        } else {
          logBoth(`Aucune entité ${name}`)
          nextEntity()
        }
      })
    }).done(done)
  }
}
