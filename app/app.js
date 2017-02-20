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
const boot = require('./boot')
const sjt = require('sesajstools')
const config = require('./config')

function beforeBootsrap (lassi, mainComponent, allComponents) {
  // lassi est gonflant à ignorer la conf des logs qu'on veut lui filer…
  anLog.config(config.lassiLogger)
  // notre fct de log en global
  global.log = require('./tools/log.js')
  const appLog = anLog(config.application.name)

  /**
   * On ajoutera nos middleware après session
   * @param {Object} rail le rail express
   * @param {string} name Le nom du middleware qui vient d'être mis sur le rail
   */
  lassi.on('afterRailUse', function (rail, name) {
    // on peut ajouter les arguments , settings, middleware puis log(middleware) pour voir le code de chaque middleware
    if (name === 'session') require('./addMiddlewares')(rail)
  })

  // une fois les composants chargés on ajoutera memcache et nos listeners
  mainComponent.config(function ($cache, $settings, $accessControl, $routes, $flashMessages, $auth, $page) {
    // on ajoute memcache si précisé dans les settings
    var memcache = $settings.get('memcache', null)
    if (memcache) {
      if (typeof memcache !== 'object' || !memcache.host || !memcache.port) {
        throw new Error('Il faut indiquer pour memcache un objet {host:xxx,port:nn}. ' +
          " L'application sesatheque ne peut pas tourner avec un cluster memcache" +
          ' car elle utilise memcache comme stockage commun aux différents workers nodejs')
      }
      if (!memcache.prefix) log.error('Pas de propriété prefix pour memcache en configuration (préfixe de clé)')
      // le slot permet de préciser que cet engine ne gère que les clés qui commence par cette chaîne, '' prend donc tout
      $cache.addEngine('', 'memcache', memcache)
      appLog('Memcache ajouté avec ' + memcache.host + ':' + memcache.port)
    } else if (process.env.NODE_UNIQUE_ID) {
      // @see https://nodejs.org/api/cluster.html#cluster_cluster_ismaster
      throw new Error("Cluster nodejs sans memcache (memcache prérequis du mode cluster car il sert d'espace partagé entre les workers node)")
    }

    // on désactive toujours la compression dust (pas seulement en dev, ça crée trop de pbs en cas de js dans un template)
    // if (!isProd && lassi.transports.html.engine.disableWhiteSpaceCompression)
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

    // le listener beforeTransport
    lassi.on('beforeTransport', require('./beforeTransport')($accessControl, $routes, $flashMessages))

    // si $sesalabSsoClient existe, faut l'ajouter en client d'authentification
    // maintenant que les services sont dispos, on lui passe ceux dont il aura besoin
    if (allComponents.indexOf('sesalab-sso') !== -1) {
      var $sesalabSsoClient = lassi.service('$sesalabSsoClient')
      var authServerName = config.sesalabs && config.sesalabs[0] && config.sesalabs[0].name || 'Sesalab'
      require('./auth/authClientSesalabSso')(authServerName, $sesalabSsoClient, $auth, $accessControl, $page)
    }

    // log('sesatheque en fin de config', sesatheque)
    appLog("FIN config de l'application " + $settings.get('application.name', 'inconnue') +
      ' en mode ' + $settings.get('application.staging', 'inconnu'))
  })

  require('./sesalab-admin')
}

module.exports = function app (afterBootCallback) {
  try {
    anLog.config(config.lassiLogger)
    anLog(config.application.name)('Starting…')
    boot(beforeBootsrap, {afterBootCallback})
  } catch (error) {
    anLog(config.application.name).error(error)
  }
}

