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

// pour json et urlencode on prend celui inclut dans express,
// mais y'a pas text-plain, on prend body-parser
const bodyParser = require('body-parser')
const express = require('express')
const moment = require('moment')
const { hasProp } = require('sesajstools')

const tools = require('./lib/tools')
const config = require('./config')
const applog = require('an-log')(config.application.name)

const staticTtl = 3600 * 24
// const publicTtl = 3600 * 4 // 4h seulement pour les résultats de recherche ou les ressources

/**
 * Ajoute notre bodyParser après le middleware cookie
 * @param rail
 */
function addBodyParsers (rail) {
  if (config.$rail.noBodyParser) {
    const dateRegExp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
    const bodyParserSettings = config.$rail.bodyParser || {
      reviver: (key, value) => (typeof value === 'string' && dateRegExp.exec(value)) ? new Date(value) : value
    }
    if (!bodyParserSettings.limit) bodyParserSettings.limit = '10mb'
    // ça c'est juste pour urlencoded, à priori on devrait pouvoir avoir des tableaux avec false
    // mais ça plante par ex sur un post de form avec `categories[2]: true`
    if (!hasProp(bodyParserSettings, 'extended')) bodyParserSettings.extended = true
    const jsonMiddleware = express.json(bodyParserSettings)
    const urlencodedMiddleware = express.urlencoded(bodyParserSettings)
    const textMiddleware = bodyParser.text(bodyParserSettings)

    rail.use('/api', jsonMiddleware)
    rail.use(['/groupe', '/ressource'], urlencodedMiddleware)
    // lui doit aussi accepter du text/plain (envoyé par sendBeacon)
    rail.use('/api/deferPost', textMiddleware)
  } else {
    log.error('Il manque le settings $rail.noBodyParser pour mettre nos propres parsers')
  }
} // addBodyParsers

/**
 * Ajoute sur le rail les requetes en console (en dev), CORS, expires, access.log et perf.log
 * @param {Object} rail le rail express
 */
function addCorsAndLog (rail) {
  // ajout d'express en global sur lassi (utilisé dans les tests pour le passer à supertest)
  lassi.express = rail
  /**
   * Ajout du CORS (et timestamp dans res.locals.start)
   */
  applog('adding middleware', 'CORS')
  const knownOrigins = {}
  rail.use('/', function (req, res, next) {
    // un timestamp
    req.start = moment().format('HH:mm:ss.SSS')
    const origin = req.header('Origin')
    // le public est mis en cache, faut donc autoriser pour tout le monde (sinon faut filtrer sur varnish)
    if (tools.isStatic(req.url) || tools.isPublic(req.url)) {
      res.header('Access-Control-Allow-Origin', '*')
    } else if (origin) {
      // ça dépend de l'appelant, on regarde ceux que l'on a déjà autorisé
      let isKnown = knownOrigins[origin]
      // ceux-là sont toujours autorisés
      if (!isKnown) {
        isKnown = /https?:\/\/([^/]+\.)?(sesamath\.net|labomep\.net|devsesamath\.net|local|localhost)(:[0-9]+)?(\/|$)/.test(origin)
        // si pas trouvé, on autorise aussi les sesalab déclarés en configuration
        if (!isKnown && config.sesalabs && config.sesalabs.length) isKnown = config.sesalabs.some((sesalab) => sesalab.baseUrl && sesalab.baseUrl === origin + '/')
        // et on ajoute si trouvé pour pas chercher la prochaine fois
        if (isKnown) knownOrigins[origin] = true
      }
      if (isKnown) {
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
          // ici, on pourrait filtrer pour n'autoriser que certains header, mais on autorise le navigateur
          // à nous envoyer ce qu'il veut comme header, au pire on les ignore…
          res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
        } /* */
      } else if (origin.substr(0, 7) === 'file://') {
        // pour le moment on accepte les requete depuis du file:// pour autoriser editgraphe de j3p en local
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Credentials', 'true')
        res.header('Vary', 'Origin,Cookie')
      } else {
        log.debug('cors avec ' + origin + ' refusé')
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
    // pas de cache sur le display, car coté client élève dans sesalab y'a pas moyen de connaître ressource.inc
    // pour en déduire un $displayUrl fiable (le rid est enregistré dans la séquence)
    // idem pour l'api, on laisse express gérer le etag (ça fait du 304 not modified si y'a pas de changement)
    if (tools.isStatic(req.url)) {
      const ttl = staticTtl
      // faut mettre ça au format de la RFC 1123
      res.header('Expires', moment().utc().add(ttl, 's').format('ddd, DD MMM YYYY HH:mm:ss') + ' GMT')
      res.header('Cache-Control', 'public, max-age=' + ttl)
    }
    next()
  })

  // access.log géré par lassi

  /**
   * En dev, ajout des requetes http en console et dans le log de debug
   */
  if (!global.isProd) {
    applog('adding middleware', 'ajout access log en console (car on est pas en prod)')
    rail.use('/', function (req, res, next) {
      // les requetes non statiques en console et debug
      if (!/\.(js|css|png|jpg|jpeg)/.exec(req.originalUrl)) {
        applog(req.method, req.originalUrl)
        log.debug('requete ' + req.method + ' ' + req.originalUrl)
      }
      next()
    })
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
        start: Date.now()
      }
      // on est après body-parser (-2 pour le {} ajouté au stringify)
      // if (request.body) response.perf.msg += '\treceived: ' +(tools.stringify(request.body).length -2)
      const received = request.headers['content-length']
      if (received) response.perf.msg += '\treceived: ' + received
      // on peut pas mettre de middleware après les controlleur, car response.end() sera appelé et les middleware ignorés
      // on ajoute donc un listener sur finish (appelé sans arguments, et c'est le seul event de response)
      response.on('finish', function () {
        const cl = this.get('Content-Length')
        if (cl) response.perf.msg += '\tsent:' + cl
        log.perf.out(response)
      })
      next()
    })
  }
} // addCorsAndLog

/**
 * Hooks qui seront ajoutés sur le rail par app/server/index.js
 */
module.exports = {
  addBodyParsers,
  addCorsAndLog
}
