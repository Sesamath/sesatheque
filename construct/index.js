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

// appel du module lassi qui met en global une variable lassi
require('lassi')(__dirname +'/..')

// nos loggers
GLOBAL.log = require('./tools/log.js')

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
    log("ajout du module supplémentaire " + module)
    require(module)
  })
}
if (privateConfig.extraDependenciesFirst) {
  privateConfig.extraDependenciesFirst.forEach(function(dependency) {
    log("ajout en premier de la dépendance supplémentaire " + dependency)
    dependancies.unshift(dependency)
  })
}
if (privateConfig.extraDependenciesLast) {
  privateConfig.extraDependenciesLast.forEach(function(dependency) {
    log("ajout en dernier de la dépendance supplémentaire " + dependency)
    dependancies.push(dependency)
  })
}

// Notre appli en global (pour que chacun puisse y ajouter ses controleurs ou services)
var sesatheque = lassi.component('sesatheque', dependancies)

// on ajoute memcache si précisé dans les settings
sesatheque.config(function($cache, $settings) {
  var memcache = $settings.get('memcache')
  if (memcache) {
    $cache.addEngine('', 'memcache', memcache);
    log('Memcache ajouté sur ' +memcache)
  } else {
    log.error("Il manque memcache en config, on s'en passera mais il vaudrait mieux l'ajouter")
  }
  // log("sesatheque en fin de config", sesatheque)
  log("Boot de l'application " + sesatheque.name +" en mode " +$settings.get('application.staging'))
})


// on déclenchera ça quand le boot sera fini
lassi.on('bootstrap', function () {
  console.log("Boot de l'application " + sesatheque.name)
  log.dev('BOOT')
});

// pour les logs morgan, on ajoute nos tokens et le WriteStream ici
/* * /
lassi.on('beforeRailUse', function (name, settings) {
  console.log('dans construct, beforeRailUse de ' +name)
  if (name=='logger') {
    console.log('beforeRailUse logger')
    // sert à rien de modifier settings, pas pris en compte car asynchrone
    // on laisse tout ça là quand même pour le passer éventuellement dans une fct + tard
    // sinon faudrait utiliser seq pour ne pas sortir de la fct tant qu'on a pas notre stream
    return

    log.dev('settings morgan dans beforeRailUse', settings)
    // les settings pour morgan
    var fs = require('fs')
    var logAccess = sesatheque.settings.logs.access
    var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'})
    // les tokens
    var moment = require('moment')
    var morgan = lassi.require('morgan')
    morgan.token('post', function (req) {
      return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
    })
    morgan.token('moment', function () {
      return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
    })
    settings = {
      format: ':moment :method :url :status :response-time ms - :res[content-length] :post',
      options : {
        skip  : function (req) {
          var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
          var i = req.url.lastIndexOf('.')
          var suffix = (i > 0) ? req.url.substr(i + 1) : null // au moins un char avant le point
          return (suffix && excluded.indexOf(suffix) > -1)
        },
        stream: logAccessWriteStream
      }
    }
    log.dev('settings modifiés', settings)
  } // on pourrait préciser la limite d'upload ici (name === 'body-parser') mais elle est dans la conf
})

/* sesatheque.on('loaded', function (type, name, instance) {
  if (type === 'middleware' && name === 'logger') {
    console.log(instance.toString())
  }
}) */

/**
 * On ajoute le CORS après cookie
 * @param {Object} rail le rail express
 * @param {string} name Le nom du middleware qui vient d'être mis sur le rail
 */
lassi.on('afterRailUse', function (rail, name) {
  // on peut ajouter les arguments , settings, middleware puis log(middleware) pour voir le code de chaque middleware
  if (name === 'cookie') {
    if (lassi.settings.application.staging !== 'production') {
      // on ajoute les requetes http en console
      rail.use('/', function(req, res, next) {
        log(req.method +' ' +req.originalUrl)
        next()
      })
    }
    lassi.log('$rail', "adding", "cors".blue.underline, "middleware")
    rail.use('/', function(req, res, next) {
        var origin = req.header('Origin')
        var msg = 'cors avec ' +origin
        if (origin &&
            /https?:\/\/[^/]+\.(sesamath\.net|labomep\.net|devsesamath\.net|local)(:[0-9]+)?(\/|$)/.exec(origin))
        {
          res.header('Access-Control-Allow-Origin', origin)
          res.header("Access-Control-Allow-Headers", "X-Requested-With")
          msg += ' accepté'
        } else if (origin && origin.substr(0, 4) !== 'http') {
          // pour le moment on accepte les requete depuis du file:// pour autoriser editgraphe de j3p en local
          res.header('Access-Control-Allow-Origin', '*')
          res.header("Access-Control-Allow-Headers", "X-Requested-With")
          msg += ' toléré'
        } else {
          msg += ' refusé'
        }
      log(msg)
        next()
    })
  }
})
/* */

// et on lance le boot
sesatheque.bootstrap()
