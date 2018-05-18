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
/**
 * Fichier principal de l'application (à passer en argument de node), avec
 * - chargement lassi
 * - déclaration d'un composant pour l'application avec nos autres composants en prérequis
 * - ajout d'éventuels composants en prérequi|postrequis définis dans la conf
 * - ajout de middleware sur le rail (CORS, Expire & co)
 * - boot de l'appli
 */

// pour utiliser babel avant node en gardant la possibilité d'utiliser pm2 en cluster,
// il faudra mettre ce code dans un start.js
// et ne laisser dans ce fichier que ces requires
// cf http://stackoverflow.com/questions/35436266/how-can-i-use-babel-6-with-pm2-1-0
// et https://babeljs.io/docs/usage/require/ qui indique qu'il faut ajouter babel-polyfill
// ça donnerait ici :
//
// require('babel-register')
// require('babel-polyfill')
// require('./start')

const anLog = require('an-log')
const sjt = require('sesajstools')
const {merge} = require('sesajstools/utils/object')
const addMiddlewares = require('./addMiddlewares')
const boot = require('./boot')
const config = require('./config')
const configCheck = require('./configCheck')

/**
 * Ajoute nos middlewares et listeners, après déclaration des composants mais avant bootstrap
 * @param {Lassi} lassi L’instance de lassi de cette application
 * @param {Lassi#Component} mainComponent Le composant principal sur lequel sera lancé bootstrap() (après la fin de l'éxécution de cette fonction)
 * @param {Lassi#Component[]} allComponents La liste des composants en dépendances
 */
function beforeBootsrap (lassi, mainComponent, allComponents) {
  anLog.config(config.lassiLogger)
  const appLog = anLog(config.application.name)

  // une fois les composants chargés on ajoutera nos listeners lassi
  mainComponent.config(function ($accessControl, $flashMessages, $routes, $settings) {
    // on désactive toujours la compression dust (pas seulement en dev, ça crée trop de pbs en cas de js dans un template)
    // if (!global.isProd && lassi.transports.html.engine.disableWhiteSpaceCompression)
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
      if (name === 'cookie') addMiddlewares.afterCookie(rail)
      else if (name === 'session') addMiddlewares.afterSession(rail)
    })

    // le listener beforeTransport
    lassi.on('beforeTransport', require('./beforeTransport')($accessControl, $routes, $flashMessages))

    // si $sesalabSsoClient existe, faut l'ajouter en client d'authentification
    // on lui passe les infos dont il a besoin
    if (allComponents.indexOf('sesalab-sso') !== -1) {
      const authName = (config.sesalabs && config.sesalabs[0] && config.sesalabs[0].name) || 'Sesalab'
      const authBaseId = config.sesalabs && config.sesalabs[0] && config.sesalabs[0].baseId
      if (!authBaseId) throw new Error('sesalab sans baseId en configuration')
      require('./auth/authClientSesalabSso')(authName, authBaseId)
    }

    // log('sesatheque en fin de config', sesatheque)
    appLog("FIN config de l'application " + $settings.get('application.name', 'inconnue') +
      ' en mode ' + $settings.get('application.staging', 'inconnu'))
  })
}

/**
 * Démarre l'application Sesathèque
 * @param {object} [options]
 * @param {simpleCallback} [afterBootCallback]
 * @return {Lassi}
 */
function app (options, afterBootCallback) {
  function afterBootCallbackWrapper () {
    // vérif de config au démarrage
    configCheck(config)
    anLog(config.application.name)('Started')
    if (afterBootCallback) afterBootCallback()
  }

  if (typeof options === 'function') {
    afterBootCallback = options
    options = {}
  } else if (!options) {
    options = {}
  }
  try {
    if (options.settings) merge(config, options.settings)
    anLog.config(config.lassiLogger)
    anLog(config.application.name)('Starting…')
    const bootOptions = {}
    if (options.settings) bootOptions.settings = options.settings
    // cette option noGlobalLassi n'est pas encore gérée correctement dans lassi
    if (options.noGlobalLassi) bootOptions.noGlobalLassi = options.noGlobalLassi
    return boot(beforeBootsrap, bootOptions, afterBootCallbackWrapper)
  } catch (error) {
    anLog(config.application.name).error(error)
  }
}

module.exports = app
