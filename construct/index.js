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

'use strict';
/*global lassi*/

/**
 * Définition de l'application
 */

/*
console.log("Démarrage de la bibliothèque : appel de " +__filename +" avec les arguments ")
console.log(process.argv)
/* console.log("et l'environnement")
console.log(process.env) */

var _ = require('underscore')._

// appel du module lassi qui met en global une variable lassi
require('lassi')(__dirname +'/..')

// nos loggers
GLOBAL.log = require('./tools/log.js') // jshint ignore:line
log("dump lassi", lassi)

// nos components
require('./main')
//require('./ressource')

// Notre appli en global (pour que chacun puisse y ajouter ses controleurs ou services)
var sesatheque = lassi.component('sesatheque', ['main'])

log("sesatheque dans construct", sesatheque)

// on ajoute memcache si précisé
if (lassi.settings.memcache) {
  sesatheque.config(function($cache) {
    $cache.addEngine('', 'memcache', lassi.settings.memcache);
    log('Memcache ajouté sur ' +lassi.settings.memcache)
  })
}

// on regarde si la conf réclame du chargement complémentaire
if (lassi.settings.afterInit) {
  //lassi.settings.afterInit()
}

// on déclenchera ça quand le boot sera fini
lassi.on('bootstrap', function () {
  console.log("Boot de l'application " + sesatheque.name)
  log.dev('BOOT')
  /* on a une tache gulp reset pour ça, on ne vide plus systématiquement les sessions au démarrage
  if (lassi.sessions && sesatheque.settings.staging !== lassi.Staging.production) {
    log.dev('Purge des sessions récupérées')
    lassi.sessions = {}
  } */
});

// pour les logs morgan, on ajoute nos tokens et le WriteStream ici
/* */
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
 */
lassi.on('afterRailUse', function (name, settings, middleware) {
  // console.log('afterRailUse ' +name, middleware) // affiche le code de chaque middleware
  if (name === 'cookie') {
    console.log("On ajoute CORS sur le rail")
    lassi.use('cors', function() {
      return function(req, res, next) {
        console.log('cors : ', req)
        res.header('Access-Control-Allow-Origin', '*');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
      }
    });
  }
})

// et on lance le boot
sesatheque.bootstrap()
