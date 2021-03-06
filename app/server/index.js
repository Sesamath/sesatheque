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

// Fichier principal de l'application, qui exporte une fonction à appeler pour booter l'appli.
// En cli on appelle directement cli.js sans passer par ce fichier.

// La fonction exportée fera
// - chargement lassi
// - déclaration d'un composant pour l'application avec nos autres composants en prérequis
// - ajout d'éventuels composants en prérequi|postrequis définis dans la conf
// - ajout de middleware sur le rail (CORS, Expire & co)
// - boot de l'appli

const anLog = require('an-log')
const sjt = require('sesajstools')
const {merge} = require('sesajstools/utils/object')
const log = require('sesajstools/utils/log')

const {addBodyParsers, addCorsAndLog} = require('./addMiddlewares')
const beforeTransport = require('./beforeTransport')
const boot = require('./boot')
const config = require('./config')
const {checkLocalOnRemote} = require('./checkConfig')

const getResolvedPromise = () => Promise.resolve()

let lassiInstance

/**
 * Ajoute nos middlewares et listeners, après déclaration des composants mais avant bootstrap
 * @param {Lassi} lassi L’instance de lassi de cette application
 * @param {Lassi#Component} mainComponent Le composant principal sur lequel sera lancé bootstrap() (après la fin de l'éxécution de cette fonction)
 * @param {Lassi#Component[]} allComponents La liste des composants en dépendances
 */
function beforeBootsrap (lassi, mainComponent, allComponents) {
  anLog.config(config.lassiLogger)

  // une fois les composants chargés on ajoutera nos listeners lassi
  mainComponent.config(function ($accessControl, $routes, $settings) {
    // on désactive toujours la compression dust (pas seulement en dev), car ça crée trop de
    // pbs dans le code js des templates dust
    lassi.transports.html.engine.disableWhiteSpaceCompression()

    // on ajoute nos filtres perso pour dust
    try {
      // un js dump
      lassi.transports.html.engine.addFilter('jsd', function (value) {
        return sjt.stringify(value, 2)
      })
      lassi.transports.html.engine.addFilter('nl2br', function (value) {
        return value.replace('\n', '<br />\n')
      })
    } catch (error) {
      log.error("impossible d'ajouter nos filtres à dust", error)
    }

    /**
     * On ajoutera nos middleware après session
     * (sauf content-type après compression, pour qu'il soit avant body-parser)
     * @param {Object} rail le rail express
     * @param {string} name Le nom du middleware qui vient d'être mis sur le rail
     */
    lassi.on('afterRailUse', function (rail, name) {
      // on peut ajouter les arguments , settings, middleware puis log(middleware) pour voir le code de chaque middleware
      if (name === 'cookie') addBodyParsers(rail)
      else if (name === 'session') addCorsAndLog(rail)
    })

    // le listener beforeTransport
    lassi.on('beforeTransport', beforeTransport)

    // si $sesalabSsoClient existe, faut l'ajouter en client d'authentification
    // on lui passe les infos dont il a besoin
    if (allComponents.indexOf('sesalab-sso') !== -1) {
      const authName = (config.sesalabs && config.sesalabs[0] && config.sesalabs[0].name) || 'Sesalab'
      const authBaseId = config.sesalabs && config.sesalabs[0] && config.sesalabs[0].baseId
      if (!authBaseId) throw new Error('sesalab sans baseId en configuration')
      require('./auth/authClientSesalabSso')(authName, authBaseId)
    }

    log(`FIN config de l'application ${config.application.name} en mode ${config.application.staging}`)
  })
}

/**
 * Démarre l'application Sesathèque
 * @param {object} [options]
 * @param {object} [options.settings] Éventuelles surcharges des settings
 * @param {boolean} [options.noCheckLocalOnRemote=false] Passer true pour ne pas vérifier la cohérence de notre configuration sur les sésathèques distantes (déclarées dans notre configuration)
 * @param {simpleCallback} [afterBootCallback]
 * @return {Promise<Lassi>}
 */
function app (options, afterBootCallback) {
  // after boot est facultatif, et on veut un message dans le log
  function afterBootCallbackWrapper () {
    if (afterBootCallback) afterBootCallback()
    log(`${config.application.name} started with staging ${config.application.staging}`)
  }

  if (lassiInstance) return Promise.resolve(lassiInstance)

  if (typeof options === 'function') {
    afterBootCallback = options
    options = {}
  } else if (!options) {
    options = {}
  }
  if (options.settings) merge(config, options.settings)
  anLog.config(config.lassiLogger)
  log(`Starting ${config.application.name}`)
  const bootOptions = {}
  if (options.settings) bootOptions.settings = options.settings
  // cette option noGlobalLassi n'est pas encore gérée correctement dans lassi
  if (options.noGlobalLassi) bootOptions.noGlobalLassi = options.noGlobalLassi

  // Rq : les callbacks beforeBoot et afterBoot sont sync, notre vérif async

  // le check sur les sesathèques distantes est plus simple avant de lancer le boot
  // mais si on en lance 2 en même temps chacune attend l'autre jusqu'au timeout
  // on le passe donc après, quitte à arrêter l'appli en cas de pb
  lassiInstance = boot(beforeBootsrap, bootOptions, afterBootCallbackWrapper)

  const check = options.noCheckLocalOnRemote ? getResolvedPromise : checkLocalOnRemote

  return check().then((result) => {
    // si c'est résolu avec des erreurs, on les affiche sans bloquer la suite
    if (result && result.errors) result.errors.forEach(log.error)
    // et on résoud avec l'instance lassi
    return Promise.resolve(lassiInstance)
  }).catch((error) => {
    log.error(error)
    log.error(`${config.application.name} ABORTING`)
    lassiInstance.shutdown()
    // on ne retourne rien le shutdown fera un process.exit
  })
}

module.exports = app
