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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * @fileOverview Définition de l'application
 * - chargement lassi
 * - déclaration d'un composant pour l'application avec nos autres composants en prérequis
 * - boot de l'appli
 */
console.log("Démarrage de l'application avec l'environnement", process.env)

/**
 * On ajoute un access.log avant d'appeler lassi
 * En dev on a un access.log avec le contenu des POST
 */
var fs = require('fs')
var _ = require('lodash')
var morgan = require('morgan')
var moment = require('moment')
var tools = require('./tools')
var settings = require('../config')

// appel du module lassi qui met en global une variable lassi
require('lassi')(__dirname +'/..')

/* attention, ici GLOBAL.lassi existe mais pas encore lassi !!!
if (typeof lassi === 'undefined') console.log("lassi n'existe pas encore")
else console.log('lassi existe dès le départ')
for (var i = 10; i < 1000; i +=100) {
  setTimeout(function () {
    if (typeof lassi === 'undefined') console.log("lassi n'existe pas encore")
  }, i)
}
/* */
// nos loggers (mais lassi n'est pas encore en global ici...)
GLOBAL.log = require('./tools/log.js')

GLOBAL.isProd = ((lassi.settings.application.staging === 'production'))

/**
 * Gestion des traces
 * Attention, ce module m'a déjà joué des tours avec une erreur qui plante node (reproductible, sur une 404)
 *   Uncaught Error: Can't set headers after they are sent.
 *   ...
 *   /sesamath/dev/projets_git/sesatheque/node_modules/long-stack-traces/lib/long-stack-traces.js:80
 *      throw ""; // TODO: throw the original error, or undefined?
 * le désactiver a réglé le problème
 *
 * Pour augmenter les traces, préférer les options node
 * --stack_trace_limit=100 --stack-size=2048
 */
/* if (!isProd) /* * / require('long-stack-traces') /* */

var moment = require('moment')
var staticTtl = 3600 * 24

// les déclarations de nos components
require('./static')
require('./ressource')
require('./personne')

//var _ = require('lodash');
var dependancies = ['static', 'personne', 'ressource']

// On lit notre config directement (sans passer par $settings) avant de lancer lassi.component
var privateConfig = require('../_private/config')
// des modules sup à charger
if (privateConfig.extraModules) {
  privateConfig.extraModules.forEach(function (module) {
    lassi.log('app', "ajout du module supplémentaire " + module)
    require(module)
  })
}
if (privateConfig.extraDependenciesFirst) {
  privateConfig.extraDependenciesFirst.forEach(function(dependency) {
    lassi.log('app', "ajout en premier de la dépendance supplémentaire " + dependency)
    dependancies.unshift(dependency)
  })
}
if (privateConfig.extraDependenciesLast) {
  privateConfig.extraDependenciesLast.forEach(function(dependency) {
    lassi.log('app', "ajout en dernier de la dépendance supplémentaire " + dependency)
    dependancies.push(dependency)
  })
}

// Notre appli en global (pour que chacun puisse y ajouter ses controleurs ou services)
var sesatheque = lassi.component('sesatheque', dependancies)

sesatheque.config(function($cache, $settings) {
  // on ajoute memcache si précisé dans les settings
  var memcache = $settings.get('memcache')
  if (memcache) {
    if (typeof memcache !== 'string') {
      throw new Error("L'application sesatheque ne peut pas tourner avec un cluster memcache" +
                      " car elle utilise memcache comme stockage commun aux différents workers nodejs (pour lastIdOrigine)")
    }
    $cache.addEngine('', 'memcache', memcache);
    lassi.log('app', 'Memcache ajouté sur ' +memcache)
  } else if (process.env.NODE_UNIQUE_ID) {
    // @see https://nodejs.org/api/cluster.html#cluster_cluster_ismaster
    throw new Error("Cluster nodejs sans memcache (memcache prérequis du mode cluster car il sert d'espace partagé entre les workers node)")
  }

  // le listener beforeTransport est ajouté dans le composant static qui défini $flashMessage

  // log("sesatheque en fin de config", sesatheque)
  lassi.log('app', "FIN config de l'application " +$settings.get('application.name') +" en mode " +$settings.get('application.staging'))
})

/**
 * On ajoute nos middleware (CORS, expires et access.log) après cookie
 * @param {Object} rail le rail express
 * @param {string} name Le nom du middleware qui vient d'être mis sur le rail
 */
lassi.on('afterRailUse', function (rail, name) {
  // on peut ajouter les arguments , settings, middleware puis log(middleware) pour voir le code de chaque middleware
  if (name === 'cookie') {
    /**
     * En dev, ajout des requetes http en console et dans le log de debug
     */
    if (!isProd) {
      rail.use('/', function(req, res, next) {
        // toutes les requetes en console
        log(req.method +' ' +req.originalUrl)
        // et on ajoute aussi les requetes non statiques en debug
        if (!isProd && !/\.(js|css|png|jpg|jpeg)/.exec(req.originalUrl)) log.debug(req.method +' ' +req.originalUrl)
        next()
      })
    }

    /**
     * Ajout du CORS
     */
    lassi.log('$rail', "app is adding", "cors".blue.underline, "middleware")
    rail.use('/', function(req, res, next) {
      var origin = req.header('Origin')
      if (origin) {
        var msg = 'cors avec ' + origin
        if (/https?:\/\/[^/]+\.(sesamath\.net|labomep\.net|devsesamath\.net|local)(:[0-9]+)?(\/|$)/.exec(origin)) {
          res.header('Access-Control-Allow-Origin', origin)
          res.header("Access-Control-Allow-Headers", "X-Requested-With")
          msg += ' accepté'
        } else if (origin.substr(0, 4) !== 'http') {
          // pour le moment on accepte les requete depuis du file:// pour autoriser editgraphe de j3p en local
          res.header('Access-Control-Allow-Origin', '*')
          res.header("Access-Control-Allow-Headers", "X-Requested-With")
          msg += ' toléré'
        } else {
          msg += ' refusé'
        }
        log(msg)
      }
      next()
    })

    /**
     * headers expires sur le statique ou le json public
     */
    lassi.log('$rail', "app is adding", "expires".blue.underline, "middleware")
    rail.use('/', function(req, res, next) {
      if (/\.(js|css|png|ico|jpg|jpeg|gif)(\?.*)?$/.exec(req.url) || /^\/api\/public\//.exec(req.url)) {
        // faut mettre ça au format de la RFC 1123
        res.header('Expires', moment().utc().add(staticTtl, 's').format('ddd, DD MMM YYYY hh:mm:ss') +' GMT')
        res.header('Cache-Control', 'public, max-age=' +staticTtl)
        // @todo regarder If-Modified-Since et répondre 304 Not Modified si c'est le cas
        // mais c'est vraiment pas très urgent si on a un varnish devant nous
      }
      next()
    })

    /**
     * access.log
     */
    var accessLog = settings.logs.dir +'/' +settings.logs.access
    try {
      var logAccessWriteStream = fs.createWriteStream(accessLog, {'flags': 'a'});
      lassi.log('$rail', "app is adding", "access.log".blue.underline, "middleware with " +accessLog)
      var format = ':moment :method :url :status :response-time ms - :res[content-length]'
      var options = {
        skip  : function (req) {
          var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
          var i = req.url.lastIndexOf('.')
          var suffix = (i > 0) ? req.url.substr(i + 1) : null // au moins un char avant le point
          return (suffix && excluded.indexOf(suffix) > -1)
        },
        stream: logAccessWriteStream
      }
      morgan.token('moment', function () {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
      })
      // en dev on ajoute les var postées
      if (settings.application.staging === 'dev') {
        morgan.token('post', function (req) {
          return (_.isEmpty(req.body)) ? '' : tools.stringify(req.body)
        })
        format += ' :post'
      }
      morgan(format, options)
      lassi.on('shutdown', function () {
        logAccessWriteStream.end()
      })
    } catch(error) {
      console.log(error.stack)
    }
  }
})

// et on lance le boot
sesatheque.bootstrap()
