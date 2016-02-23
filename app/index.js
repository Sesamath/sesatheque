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

// pour passer en es6, en gardant la possibilité d'utiliser pm2 en cluster, il faudra mettre ce code dans un start.js
// et ne laisser dans ce fichier que ces requires
// cf http://stackoverflow.com/questions/35436266/how-can-i-use-babel-6-with-pm2-1-0
// et https://babeljs.io/docs/usage/require/ qui indique qu'il faut ajouter babel-polyfill
// ça donnerait ici :
//
// require('babel-register')
// require('babel-polyfill')
// require('./start')

try {
  /**
   * Fichier principal de l'application (à passer en argument de node), avec
   * - chargement lassi
   * - déclaration d'un composant pour l'application avec nos autres composants en prérequis
   * - ajout d'éventuels composants en prérequi|postrequis définis dans la conf
   * - ajout de middleware sur le rail (CORS, Expire & co)
   * - boot de l'appli
   */

  var tools = require('./tools')
  var config = require('./config')
  require('an-log').config(config.lassiLogger)
  var appLog = require('an-log')(config.application.name)

  // appel du module lassi qui met en global une variable lassi
  require('lassi')(__dirname)
  // sesalab-admin sera appelé après mise en global de l'appli

  /* attention, ici GLOBAL.lassi existe mais pas toujours lassi !!!
   if (typeof lassi === 'undefined') console.log("lassi n'existe pas encore")
   else console.log('lassi existe dès le départ')
   for (var i = 10; i < 1000; i +=100) {
   setTimeout(function () {
   if (typeof lassi === 'undefined') console.log("lassi n'existe pas encore")
   }, i)
   }
   /* */
  GLOBAL.isProd = ((lassi.settings.application.staging === 'prod'))

  // nos loggers
  GLOBAL.log = require('./tools/log.js')
  appLog("Démarrage de l'application avec l'environnement " + lassi.settings.application.staging)

  /**
   * Gestion des traces
   * Attention, le module long-stack-traces m'a déjà joué des tours avec une erreur qui plante node (reproductible, sur une 404)
   *   Uncaught Error: Can't set headers after they are sent.
   *   ...
   *   /sesamath/dev/projets_git/sesatheque/node_modules/long-stack-traces/lib/long-stack-traces.js:80
   *      throw ""; // TODO: throw the original error, or undefined?
   * le désactiver a réglé le problème
   *
   * Pour augmenter les traces, mieux vaut passer à node ces options
   * --stack_trace_limit=100 --stack-size=2048
   */
  /* if (!isProd) /* * / require('long-stack-traces') /* */

  var tools = require('./tools')
  //var _ = require('lodash');

  /**
   * On ajoutera nos middleware après session lorsque lassi mettra les siens
   * @param {Object} rail le rail express
   * @param {string} name Le nom du middleware qui vient d'être mis sur le rail
   */
  lassi.on('afterRailUse', function (rail, name) {
    // on peut ajouter les arguments , settings, middleware puis log(middleware) pour voir le code de chaque middleware
    if (name === 'session') require('./addMiddlewares')(rail)
  })

  // les déclarations de nos components
  require('./main')
  require('./personne')
  require('./ressource')
  require('./auth')
  var dependancies = ['main', 'personne', 'ressource', 'auth']

  // On lit notre config directement (sans passer par $settings) avant de lancer lassi.component
  var privateConfig = require('./_private/config')
  // des modules sup à charger
  if (privateConfig.extraModules) {
    privateConfig.extraModules.forEach(function (module) {
      appLog("ajout du module supplémentaire " + module)
      require(module)
    })
  }
  if (privateConfig.extraDependenciesFirst) {
    privateConfig.extraDependenciesFirst.forEach(function (dependency) {
      appLog("ajout en premier de la dépendance supplémentaire " + dependency)
      dependancies.unshift(dependency)
    })
  }
  if (privateConfig.extraDependenciesLast) {
    privateConfig.extraDependenciesLast.forEach(function (dependency) {
      appLog("ajout en dernier de la dépendance supplémentaire " + dependency)
      dependancies.push(dependency)
    })
  }

  // Notre appli qui sera mise en global (pour que chacun puisse y ajouter ses controleurs ou services)
  var sesatheque = lassi.component('sesatheque', dependancies)

  // une fois les composants chargés on ajoutera memcache et nos listeners
  sesatheque.config(function ($cache, $settings, $accessControl, $routes, $flashMessages) {
    // on ajoute memcache si précisé dans les settings
    var memcache = $settings.get('memcache')
    if (memcache) {
      if (typeof memcache !== 'object' || !memcache.host || !memcache.port) {
        throw new Error("Il faut indiquer pour memcache un objet {host:xxx,port:nn}. L'application sesatheque ne peut pas tourner avec un cluster memcache" +
            " car elle utilise memcache comme stockage commun aux différents workers nodejs")
      }
      $cache.addEngine('', 'memcache', memcache);
      appLog('Memcache ajouté avec ' + memcache.host +":" +memcache.port)
    } else if (process.env.NODE_UNIQUE_ID) {
      // @see https://nodejs.org/api/cluster.html#cluster_cluster_ismaster
      throw new Error("Cluster nodejs sans memcache (memcache prérequis du mode cluster car il sert d'espace partagé entre les workers node)")
    }

    // on désactive toujours la compression dust (pas seulement en dev, ça crée trop de pbs en cas de js dans un template)
    //if (!isProd && lassi.transports.html.engine.disableWhiteSpaceCompression)
    lassi.transports.html.engine.disableWhiteSpaceCompression()
    // on ajoute nos filtres perso pour dust
    try {
      lassi.transports.html.engine.addFilter('js2', function (value) {
        return tools.stringify(value, 2)
      })
      lassi.transports.html.engine.addFilter('nl2br', function (value) {
        return value.replace('\n', '<br />\n')
      })
    } catch (error) {
      log.error("impossible d'ajouter nos filtres à dust", error)
    }

    // le listener beforeTransport
    lassi.on('beforeTransport', require('./beforeTransport')($accessControl, $routes, $flashMessages))

    // log("sesatheque en fin de config", sesatheque)
    appLog("FIN config de l'application " + $settings.get('application.name') + " en mode " + $settings.get('application.staging'))
  })

  // pour sesalab-admin
  // utile aussi pour d'autres modules npm qui voudrait ajouter du app.service('$newService', function () {…})
  // ou app.controller('path', function () {this.get('path', function (context) {…} })
  GLOBAL.app = sesatheque
  require('./sesalab-admin');

  // et on lance le boot
  sesatheque.bootstrap()
} catch (error) {
  console.error(error)
}
