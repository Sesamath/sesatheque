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
 * Fichier principal de l'application (à passer en argument de node), avec
 * - chargement lassi
 * - déclaration d'un composant pour l'application avec nos autres composants en prérequis
 * - ajout d'éventuels composants en prérequi|postrequis définis dans la conf
 * - ajout de middleware sur le rail (CORS, Expire & co)
 * - boot de l'appli
 */

var fs = require('fs')
var _ = require('lodash')
var morgan = require('morgan')
var moment = require('moment')
var tools = require('./tools')
var config = require('./config')
require('an-log').config(config.lassiLogger)

// appel du module lassi qui met en global une variable lassi
require('lassi')(__dirname)
// sesalab-admin après mise en global de l'appli

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
log("Démarrage de l'application avec l'environnement " + lassi.settings.application.staging)

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

var staticTtl = 3600 * 24
var publicTtl = 3600 * 4 // 4h seulement pour les résultats de recherche ou les ressources

var tools = require('./tools')
//var _ = require('lodash');

// les déclarations de nos components
require('./static')
require('./personne')
require('./ressource')
require('./auth')
var dependancies = ['static', 'personne', 'ressource', 'auth']

// On lit notre config directement (sans passer par $settings) avant de lancer lassi.component
var privateConfig = require('./_private/config')
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
// pour sesalab-admin
// utile aussi pour d'autres modules npm qui voudrait ajouter du app.service('$newService', function () {…})
// ou app.controller('path', function () {this.get('path', function (context) {…} })
GLOBAL.app = sesatheque
require('./sesalab-admin');

sesatheque.config(function($cache, $settings) {
  // on ajoute memcache si précisé dans les settings
  var memcache = $settings.get('memcache')
  if (memcache) {
    if (typeof memcache !== 'object' || !memcache.host || !memcache.port) {
console.log(memcache)
      throw new Error("Il faut indiquer pour memcache un objet {host:xxx,port:nn}. L'application sesatheque ne peut pas tourner avec un cluster memcache" +
                      " car elle utilise memcache comme stockage commun aux différents workers nodejs")
    }
    $cache.addEngine('', 'memcache', memcache);
    log('Memcache ajouté sur ' +memcache)
  } else if (process.env.NODE_UNIQUE_ID) {
    // @see https://nodejs.org/api/cluster.html#cluster_cluster_ismaster
    throw new Error("Cluster nodejs sans memcache (memcache prérequis du mode cluster car il sert d'espace partagé entre les workers node)")
  }

  // le listener beforeTransport est ajouté dans le composant static

  // on ajoute nos filtres perso pour dust
  try {
    lassi.transports.html.engine.addFilter('js2', function (value) {
      return tools.stringify(value, 2)
    })
    lassi.transports.html.engine.addFilter('nl2br', function (value) {
      return value.replace('\n', '<br />\n')
    })
  } catch(error) {
    log.error("impossible d'ajouter nos filtres à dust", error)
  }

  // log("sesatheque en fin de config", sesatheque)
  log("FIN config de l'application " +$settings.get('application.name') +" en mode " +$settings.get('application.staging'))
})

/**
 * On ajoute nos middleware
 * @param {Object} rail le rail express
 * @param {string} name Le nom du middleware qui vient d'être mis sur le rail
 */
lassi.on('afterRailUse', function (rail, name) {
  // on peut ajouter les arguments , settings, middleware puis log(middleware) pour voir le code de chaque middleware
  if (name === 'session') afterRailSession(rail)
})

if (!isProd) {
  sesatheque.controller(function() {
    this.serve('doc', __dirname+'/../documentation');
  });
}

// et on lance le boot
sesatheque.bootstrap()

// le reste est la fct afterRailSession qui ajoute nos middlewares

/**
 * Ajoute sur le rail les requetes en console (en dev), CORS, expires, access.log et perf.log
 * @param {Object} rail le rail express
 */
function afterRailSession(rail) {
  /**
   * En dev, ajout des requetes http en console et dans le log de debug
   */
  if (!isProd) {
    log("app is adding request log middleware (dev only)")
    rail.use('/', function(req, res, next) {
      // les requetes non statiques en console et debug
      if (!isProd && !/\.(js|css|png|jpg|jpeg)/.exec(req.originalUrl)) {
        log(req.method +' ' +req.originalUrl)
        log.debug(req.method +' ' +req.originalUrl)
      }
      next()
    })
  }

  /**
   * Ajout du CORS
   */
  log("app is adding cors middleware")
  rail.use('/', function(req, res, next) {
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
          // If the server specifies an origin host rather than "*", then it must also include Origin in the Vary response header
          // to indicate to clients that server responses will differ based on the value of the Origin request header.
          res.header("Vary", "Origin")

          // ça aide pour ff ? http://stackoverflow.com/a/17957579
          //res.header("Access-Control-Expose-Headers","Access-Control-Allow-Origin");

          /* Apparemmet pas utile
          if (req.headers["access-control-request-method"]) {
            res.header("Access-Control-Allow-Methods", req.headers["access-control-request-method"])
          } else {
            res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
          } /* on laisse le classique */
          res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

          // sans cela sur l'options du preflight firefox refuse de faire le post (ça répond "pas de connexion réseau" car xhr.status vaut 0)
          if (req.method === 'OPTIONS' && req.headers["access-control-request-headers"]) {
            res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"])
          } /* */

        } else if (origin.substr(0, 4) !== 'http') {
          // pour le moment on accepte les requete depuis du file:// pour autoriser editgraphe de j3p en local
          res.header('Access-Control-Allow-Origin', origin)
          res.header('Access-Control-Allow-Credentials', 'true')
          res.header("Vary", "Origin,Cookie")
        } else {
          log.error('cors avec ' + origin +' refusé')
        }
      }
    }
    next()
  })

  /**
   * headers expires sur le statique ou le json public
   * @todo le mettre aussi sur le html public (quand le source sera indépendant de la session)
   */
  log("app is adding expires middleware")
  rail.use('/', function(req, res, next) {
    var ttl
    if (tools.isStatic(req.url)) ttl = staticTtl
    else if (tools.isPublic(req.url)) ttl = publicTtl
    if (ttl) {
      // faut mettre ça au format de la RFC 1123
      res.header('Expires', moment().utc().add(ttl, 's').format('ddd, DD MMM YYYY HH:mm:ss') +' GMT')
      res.header('Cache-Control', 'public, max-age=' +ttl)
      // @todo regarder If-Modified-Since et répondre 304 Not Modified si c'est le cas
      // mais c'est vraiment pas très urgent si on a un varnish devant nous il le gère
    }
    next()
  })

  /**
   * access.log (mis sur le rail relativement au début mais il utilise on-finished pour écrire à la fin)
   */
  var accessLog = config.logs.dir +'/' +config.logs.access
  try {
    var logAccessWriteStream = fs.createWriteStream(accessLog, {'flags': 'a'});
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
        skip  : function (req) {
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
      log("app is adding access.log middleware with " + accessLog)
      rail.use('/', morgan(format, options))
    } else {
      log.error("Impossible d'ouvrir le log " +accessLog)
    }
  } catch(error) {
    console.log(error.stack)
  }


  /**
   * perf.log
   */
  if (log.perf.out) {
    // on veut logger les perfs, on ajoute response.perf, msg sera écrit dans le log après les contrôleurs
    log("app is adding perf.log middleware")
    rail.use('/', function(request, response, next) {
      response.perf = {
        // message stocké en context qui sera écrit dans le listener beforeTransport
        msg  : request.method +' ' +request.originalUrl,
        start: log.getElapsed(0)
      }
      // on est après body-parser (-2 pour le {} ajouté au stringify)
      //if (request.body) response.perf.msg += '\treceived: ' +(tools.stringify(request.body).length -2)
      var received = request.headers['content-length']
      if (received) response.perf.msg += '\treceived: ' +received
      // on peut pas mettre de middleware après les controlleur, car response.end() sera appelé et les middleware ignorés
      // on ajoute donc un listener sur finish (appelé sans arguments, et c'est le seul event de response)
      response.on('finish', function () {
        var cl = this.get('Content-Length')
        if (cl) response.perf.msg += '\tsent:' +cl
        log.perf.out(response)
      })
      next()
    })
  }
}
