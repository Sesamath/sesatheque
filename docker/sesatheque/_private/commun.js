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
 *
 * CAS AVEC SESALAB
 *
 * @module
 */
// Les chemins sont relatifs au répertoire dans lequel ce fichier sera copié dans le container
// (/sesalab/_private)
const fs = require('fs')
const path = require('path')

// le _private du dossier racine local est exporté en _privateLocal par le docker-compose
// et ce dossier docker/sesatheque/_private copié dans le _private du docker

// init d'après _private si y'a un commun.js dedans (pas obligatoire)
let config
// mettre ../_privateLocal/commun.js marche pas avec fs, faut passer par path
const configFile = path.join(__dirname, '..', '_privateLocal', 'commun.js')
if (fs.existsSync(configFile)) {
  config = require('../_privateLocal/config')
} else {
  // _private/commun est pas obligatoire, on met ça à minima et laisse faire les surcharges qui suivent
  config = {
    application: {
      name: 'sesatheque commune',
      mail: 'dockerCommun@example.com'
    }
  }
}

config.$server = {
  host: 'commun.local',
  port: 3002
}
config.application.baseUrl = 'http://commun.local:3002/'
config.application.baseId = 'communlocal3002'
config.application.baseIdRegistrar = 'biblilocal3001'

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
const name = config.$entities.database.name || 'commun'
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

// sesatheque bibli
config.sesatheques = [{
  baseId: 'biblilocal3001',
  baseUrl: 'http://bibliotheque.local:3001/',
  // un token à utiliser pour son api
  apiToken: 'dockerCommunTokenForBibli'
}]

// sesalab
config.sesalabs = [ {
  name: 'dockerSesalab',
  baseId: 'sesalablocal3000',
  baseUrl: 'http://sesalab.local:3000/'
}]

// tokens
config.apiTokens = [
  // ne pas laisser ces exemples en dehors d'un usage de dev ou test local !
  'dockerSesalabTokenForCommun',
  'dockerCommunTokenForCommun'
]

// module pour le sso sesalab
if (!config.extraModules) config.extraModules = []
if (!config.extraModules.includes('sesalab-sso')) config.extraModules.push('sesalab-sso')
if (!config.extraDependenciesLast) config.extraDependenciesLast = []
if (!config.extraDependenciesLast.includes('sesalab-sso')) config.extraDependenciesLast.push('sesalab-sso')

module.exports = config
