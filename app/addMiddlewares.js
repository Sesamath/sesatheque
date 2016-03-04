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

var fs = require('fs')
var _ = require('lodash')
var morgan = require('morgan')
var moment = require('moment')

var tools = require('./tools')
var config = require('./config')
var applog = require('an-log')(config.application.name)

var staticTtl = 3600 * 24
var publicTtl = 3600 * 4 // 4h seulement pour les résultats de recherche ou les ressources

/**
 * Ajoute sur le rail les requetes en console (en dev), CORS, expires, access.log et perf.log
 * @param {Object} rail le rail express
 */
module.exports = function afterRailSession (rail) {
  /**
   * En dev, ajout des requetes http en console et dans le log de debug
   */
  if (!isProd) {
    applog('adding middleware', 'access log en console (car on est pas en prod)')
    rail.use('/', function (req, res, next) {
      // les requetes non statiques en console et debug
      if (!/\.(js|css|png|jpg|jpeg)/.exec(req.originalUrl)) {
        applog(req.method, req.originalUrl)
        log.debug(req.method + ' ' + req.originalUrl)
      }
      next()
    })
  }

  /**
   * Ajout du CORS
   */
  applog('adding middleware', 'CORS')
  rail.use('/', function (req, res, next) {
    var origin = req.header('Origin')
    if (origin) {
      // le public est mis en cache, on autorise pour tout le monde (sinon faut filtrer sur varnish)
      if (tools.isStatic(req.url) || tools.isPublic(req.url)) res.header('Access-Control-Allow-Origin', '*')
      else {
        // ça dépend de l'appelant
        if (/https?:\/\/[^/]+\.(sesamath\.net|labomep\.net|devsesamath\.net|local|localhost)(:[0-9]+)?(\/|$)/.exec(origin)) {
          res.header('Access-Control-Allow-Origin', origin)
          res.header('Access-Control-Allow-Credentials', 'true')

          // cf https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
          // If the server specifies an origin host rather than '*', then it must also include Origin in the Vary response header
          // to indicate to clients that server responses will differ based on the value of the Origin request header.
          res.header('Vary', 'Origin')

          // ça aide pour ff ? http://stackoverflow.com/a/17957579
          // res.header('Access-Control-Expose-Headers','Access-Control-Allow-Origin');

          /* Apparemmet pas utile
          if (req.headers['access-control-request-method']) {
            res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
          } else {
            res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
          } /* on laisse le classique */
          res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

          // sans cela sur l'options du preflight firefox refuse de faire le post (ça répond 'pas de connexion réseau' car xhr.status vaut 0)
          if (req.method === 'OPTIONS' && req.headers['access-control-request-headers']) {
            res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
          } /* */
        } else if (origin.substr(0, 4) !== 'http') {
          // pour le moment on accepte les requete depuis du file:// pour autoriser editgraphe de j3p en local
          res.header('Access-Control-Allow-Origin', origin)
          res.header('Access-Control-Allow-Credentials', 'true')
          res.header('Vary', 'Origin,Cookie')
        } else {
          log.debug('cors avec ' + origin + ' refusé')
        }
      }
    }
    next()
  })

  /**
   * headers expires sur le statique ou le json public
   * @todo le mettre aussi sur le html public (quand le source sera indépendant de la session)
   */
  applog('adding middleware', 'expires')
  rail.use('/', function (req, res, next) {
    var ttl
    if (tools.isStatic(req.url)) ttl = staticTtl
    else if (tools.isPublic(req.url)) ttl = publicTtl
    if (ttl) {
      // faut mettre ça au format de la RFC 1123
      res.header('Expires', moment().utc().add(ttl, 's').format('ddd, DD MMM YYYY HH:mm:ss') + ' GMT')
      res.header('Cache-Control', 'public, max-age=' + ttl)
      // @todo regarder If-Modified-Since et répondre 304 Not Modified si c'est le cas
      // mais c'est vraiment pas très urgent si on a un varnish devant nous il le gère
    }
    next()
  })

  /**
   * access.log (mis sur le rail relativement au début mais il utilise on-finished pour écrire à la fin)
   */
  var accessLog = config.logs.dir + '/' + config.logs.access
  try {
    var logAccessWriteStream = fs.createWriteStream(accessLog, {'flags': 'a'})
    if (logAccessWriteStream) {
      // et la fermeture du log
      lassi.on('shutdown', function () {
        logAccessWriteStream.end()
      })
      /** le format morgan */
      var format = ':moment :method :url :status :res[content-length] :response-time ms'
      // def de notre token moment
      morgan.token('moment', function () {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
      })
      /** Les options morgan */
      var options = {
        skip: function (req) {
          var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
          var i = req.url.lastIndexOf('.')
          var suffix = (i > 0) ? req.url.substr(i + 1) : null // au moins un char avant le point
          return (suffix && excluded.indexOf(suffix) > -1)
        },
        stream: logAccessWriteStream
      }
      // en dev on ajoute les var postées
      if (config.application.staging === 'dev') {
        morgan.token('post', function (req) {
          return (_.isEmpty(req.body)) ? '' : tools.stringify(req.body)
        })
        format += ' :post'
      }
      applog('adding middleware', 'access.log with ' + accessLog)
      rail.use('/', morgan(format, options))
    } else {
      log.error("Impossible d'ouvrir le log " + accessLog)
    }
  } catch (error) {
    console.log(error.stack)
  }

  /**
   * perf.log
   */
  if (log.perf.out) {
    // on veut logger les perfs, on ajoute response.perf, msg sera écrit dans le log après les contrôleurs
    applog('adding middleware', 'perf.log')
    rail.use('/', function (request, response, next) {
      response.perf = {
        // message stocké en context qui sera écrit dans le listener beforeTransport
        msg: request.method + ' ' + request.originalUrl,
        start: log.getElapsed(0)
      }
      // on est après body-parser (-2 pour le {} ajouté au stringify)
      // if (request.body) response.perf.msg += '\treceived: ' +(tools.stringify(request.body).length -2)
      var received = request.headers['content-length']
      if (received) response.perf.msg += '\treceived: ' + received
      // on peut pas mettre de middleware après les controlleur, car response.end() sera appelé et les middleware ignorés
      // on ajoute donc un listener sur finish (appelé sans arguments, et c'est le seul event de response)
      response.on('finish', function () {
        var cl = this.get('Content-Length')
        if (cl) response.perf.msg += '\tsent:' + cl
        log.perf.out(response)
      })
      next()
    })
  }
}
