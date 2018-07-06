/**
 * This file is part of SesaXXX.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaXXX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaXXX is distributed in the hope that it will be useful,
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
 * SesaXXX est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaXXX est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

const uuid = require('an-uuid')

/**
 * Surcharge des données du _private (qui sert hors docker),
 * copié dans l'instance docker dans _privateLocal par le Dockerfile,
 * avec nos sésathèques, ainsi que la surcharge des hosts mongo & redis pour coller aux noms
 * du docker-compose
 * @module
 */
// Les chemins sont relatifs au répertoire dans lequel ce fichier sera copié dans le container
// (/sesalab/_private)
const fs = require('fs')
const path = require('path')

// le _private du dossier racine local est exporté en _privateLocal par le docker-compose
// et ce dossier docker/sesatheque/_private copié dans le _private du docker

let config
// mettre ../_privateLocal/config.js marche pas avec fs, faut passer par path
const configFile = path.join(__dirname, '..', '_privateLocal', 'config.js')
if (fs.existsSync(configFile)) {
  config = require('../_privateLocal/config')
} else {
  throw new Error('_private/config.js n’existe pas (même pour lancer l’application avec docker il faut un dossier _private à la racine, cf _private.example)')
}

try {
  // on doit avoir le bon port
  if (!config.$server) config.$server = {}
  config.$server.port = 3001
  // aussi dans baseUrl
  config.application.baseUrl = 'http://localhost:3001/'
  // avec un baseId qui colle
  config.application.baseId = 'localhost3001'

  // les noms des hosts imposés par le docker-compose
  // c'est pas obligatoire de déclarer ça en _private, on vérifie
  // redis
  if (!config.$cache) config.$cache = {}
  config.$cache.redis = {
    host: 'redis',
    port: 6379,
    prefix: 'sesatheque'
  }
  // mongo
  if (!config.$entities) config.$entities = {}
  if (!config.$entities.database) config.$entities.database = {}
  // on veut conserver le nom de la base s'il existe mais rien d'autre
  // on veut conserver le nom de la base s'il existe mais rien d'autre
  const name = config.$entities.database.name || 'sesatheque'
  config.$entities.database = {
    host: 'mongo',
    port: 27017,
    name
  }
  // clés pour session et cookie
  if (!config.$rail) config.$rail = {}
  if (!config.$rail.cookie) config.$rail.cookie = {}
  if (!config.$rail.cookie.key) config.$rail.key = uuid()
  if (!config.$rail.session) config.$rail.session = {}
  if (!config.$rail.session.secret) config.$rail.session.secret = uuid()
  // avec docker faut passer 0.0.0.0 comme host à devServer
  config.devServer = {
    host: '0.0.0.0'
  }
} catch (error) {
  error.message = `_private/config.js incomplet (${error.message})`
  throw error
}

module.exports = config
