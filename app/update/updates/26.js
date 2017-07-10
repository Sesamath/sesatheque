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
const settings = require('../../config')
const mysql = require('mysql')
const _ = require('lodash')

const name = 'Migration MySQL vers MongoDb'
const description = ''

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

    if (!settings.databaseMysql) {
      return done(
        new Error(`"databaseMysql" doit être paramétré dans la _private/config.js et doit indiquer les paramètres de  l'ancienne base MySQL pour la migration`)
      )
    }

    var connection = mysql.createConnection(settings.databaseMysql)

    /**
     * Initialisation de la connection mysql
     */
    connection.connect()

    /**
     * Récupératon du service $entities
     */
    var $entities = lassi.service('$entities')

    /**
     * Initialisation des stats.
     */
    var stats = {
      nbDefinitions: 0,
      nbEntities: 0
    }

    /*
     * Attributs (valeur ou tableau) à convertir en String
     */
    var convertIntToString = {
      // TODO: lister les champs contenant des oid entiers à caster en string
      //       ci-dessous un exemple issu de Sesalab
      // Groupe: [
      //   'utilisateurs',
      //   'structure',
      //   'owner'
      // ],
      // Utilisateur: [
      //   'structures',
      //   'groupes',
      //   'validators.account.validatedBy',
      //   'groupeFolders.folders[].groupes'
      //   // TODO: 'ressourcesFolders', 'sequenceFolders' ?
      // ],
      // Sequence: [
      //   'owner',
      //   'sousSequences[].eleves[].oid',
      //   'lastChange.modifier.oid'
      // ],
      // Seance: [
      //   'eleve',
      //   'sequence'
      // ],
      // Score: [
      //   'sequence',
      //   'participants'
      // ],
      // Structure: [],
      // PendingValidation: [
      //   'source',
      //   'target'
      // ]
    }

    // convertOidValues permet de convertir les oids d'un objet pour un chemin donné
    // Note: si le chemin contient la chaîne '[]', on itère sur tous les éléments du tableau de l'attribut précédant '[]'.
    function convertOidValues (object, path) {
      var subPaths = path.split('[].')

      // On enlève la première partie du chemin et on recupère la valeur correspondante
      var firstSubPath = subPaths.shift()
      var value = _.get(object, firstSubPath)

      // Si pas de valeur à ce chemin, rien de plus à faire
      if (!value) {
        return
      }

      if (subPaths.length > 0) {
        // Si il faut chercher plus loin, on itère sur les éléments que l'on a trouvé
        // On "reconstitue" le chemin restant
        var remainingPath = subPaths.join('[].')

        // Normalement on a une valeur array à ce chemin (vu qu'il finissait par '[]'), mais autant vérifier
        if (_.isArray(value)) {
          _.forEach(value, (v) => convertOidValues(v, remainingPath))
        }
      } else {
        // Sinon on convertir la valeur
        var convertedValue
        if (_.isArray(value)) {
          convertedValue = _.map(value, (v) => _.isInteger(v) ? v.toString() : v)
        }

        if (_.isInteger(value)) {
          convertedValue = value.toString()
        }

        if (convertedValue) {
          _.set(object, firstSubPath, convertedValue)
        }
      }
    }

    function convertEntityOidsToStrings (definitionName, entity) {
      // quelque soit l'entité, on convertir l'oid en string
      entity.oid = entity.oid.toString()

      if (convertIntToString[definitionName]) {
        _.forEach(convertIntToString[definitionName], (attributePath) => {
          convertOidValues(entity, attributePath)
        })
      }
    }

    // Récupération des définitions d'entité.
    var definitions = _.values($entities.definitions())

    // Itération sur les définitions
    flow(definitions)
    .seqEach(function (definition) {
      // Récupération de l'entity par son nom en tant que service Lassi
      var Entity = lassi.service(definition.name)

      // Calcul de la table associée à la définition. Seules les données nous
      // intéressent car les indexes seront de toute façon regénérés
      var table = definition.table || toUnderscore(definition.name)

      flow()

      // Lecture des data
      .seq(function () {
        connection.query('select * from ' + table, this)
      })

      // Conversion du row en entity
      .seqEach(function (row) {
        var entityIdentifier = definition.name + '#' + row.oid
        console.log('Migration de ' + entityIdentifier)

        // Je ne sais pas comment le cas d'une entity sans data s'est produit
        // mais dans le doute on ajoute un garde-fou et un warning
        if (!row.data) {
          console.log('WARNING - ' + entityIdentifier + ' ne contient pas de data')
          return this()
        }

        // Construction de l'entité
        var entity = JSON.parse(row.data.toString())
        entity.oid = row.oid // dans le cadre de la migration les ids sont conservés
                              // mais les prochains ids seront des hash MongoDb
        convertEntityOidsToStrings(definition.name, entity)
        var lassiEntity = Entity.create(entity)

        // Stockage (et donc indexation)
        lassiEntity.store(this)
      })
      .done(this)
    })
    .done(function (error) {
      if (error) {
        // TODO: pourquoi job.done ne donne pas d'info sur l'erreur ?
        console.error('Erreur dans la migration : ', error)
      }
      console.log(stats)
      done(error)
    })
  }
}
