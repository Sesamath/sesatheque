/**
 * Configuration de l'application
 */
console.log('lecture config appli')
var _ = require('underscore')._
var fs = require('fs');
var moment = require('moment')
var localConfig = require('../_private/config')
var ressourceConfig = require('../construct/ressource/config')

/** La racine du projet */
var root  = __dirname + '/..';

/**
 * L'environnement d'execution est récupéré par NODE_ENV
 * Il peut valoir production, integration ou development (les valeurs de lassi.Staging) et sera
 * mis à development par défaut
 */
var staging = process.env.NODE_ENV
// si pas fourni ou pas une valeur connue ce sera dev
if (!staging || !lassi.Staging[staging]) staging = lassi.Staging.development

/**
 * Ce serait mieux de mettre ça ailleurs pour ne garder que du déclaratif ici,
 * mais une fois le logger renvoyé (par son constructeur appelé par lassi)
 * on peut plus lui changer ses params, faut donc créer ce writeStream avant d'appeler lassi
 */
var logAccess = root + '/logs/' + staging + '.access.log';
var logAccessWriteStream = fs.createWriteStream(logAccess, {'flags': 'a'});
var morganSettings

/**
 * En dev on a un access.log avec le contenu des POST
 */
if (staging === lassi.Staging.development) {
  lassi.require('morgan').token('post', function (req, res) {
    return (_.isEmpty(req.body)) ? '': JSON.stringify(req.body)
  })
  lassi.require('morgan').token('moment', function () {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
  })
  morganSettings = {
    format: ':moment :method :url :status :response-time ms - :res[content-length] :post',
    skip  : function (req) {
      var excluded = ['css', 'js', 'ico', 'png', 'jpeg']
      var i = req.url.lastIndexOf('.')
      var suffix = (i > 0) ? req.url.substr(i + 1) : null // au moins un char avant le point
      return (suffix && excluded.indexOf(suffix) > -1)
    },
    stream: logAccessWriteStream
  }
} else {
    morganSettings = {format:'default', options : {stream : logAccessWriteStream}, buffer:true}
}

/** La config exportée */
var appConfig = {
  // dans localConf, sinon conf par défaut i.e. port 3000
  application : {
    name : "bibliotheque",
    mail : "tech@sesamath.net",
    staging: staging
  },
  /* dans localConf
  entities: {
    database: {
      client...
    }
  }, */
  renderer: {
    cache: false
  },
  layout  : {
    data : root + '/data',
    cache: root + '/data/cache'
  },
  rail    : {
    cors : {origin: '*'},
    favicon       : '/assets/images/favicon.ico',
    logger        : morganSettings, // passé tel quel à morgan()
    public        : true,
    //compression : {},
    cookie: {
      key: 'asqlSTsrl78lAsg'
    },
    bodyParser : {limit:'8mb'}, // la limite d'un post (100kb par défaut dans body-parser/index.js)
    session: {
      secret: 'asqlSTsrl78lAsg',
      saveUninitialized: true,
      resave: true
    },
    authentication: {}
  },
  components: {
    cache : {
      defaultTTL: 15*60,
      purgeDelay: 5*60
    },
    // Permissions (cumulatives) pour chacun des rôles
    personne : {
      roles: {
        // les droits sont dans l'absolu, mais il peut y avoir des modifications liées au contexte
        // (on a toujours le droit de modifier un contenu dont on serait le seul auteur,
        // pas de droits read sur les ressources privées sauf les siennes, etc.)
        admin      : {'create':true, 'read':true, 'update':true, 'delete':true, 'deleteVersion':true, 'index':true, 'publish':true, 'correction':true}, // jshint ignore:line
        editeur    : {'create':true, 'read':true, 'update':true, 'delete':true, 'deleteVersion':true, 'index':true, 'publish':true, 'correction':true}, // jshint ignore:line
        indexateur : {'index':true},
        prof       : {'create':true, 'read':true},
        acces_correction : {'correction':true},
        eleve      : {'read':true}
      },
      cacheTTL: 20*60
    },
    ressource : ressourceConfig
  },
  // le reste est spécifique à notre appli et ignoré par lassi

  // les différents logs
  logs : {
    access    : root + '/logs/' + staging + '.access.log',
    error     : root + '/logs/' + staging + '.error.log',
    errorData : root + '/logs/' + staging + '.errorData.log',
    dev       : root + '/logs/dev.log',
    // mettre à true pour ajouter dans dev.log toutes les entrées / sorties du cache
    cacheEntries : false
  }
}

// on ajoute nos params locaux (accès à la base et port)
if (localConfig) lassi.tools.update(appConfig, localConfig)

// on enlève le debug mysql si on nous précise prod dans l'environnement
if (process.env.NODE_ENV && process.env.NODE_ENV === 'production' && appConfig.entities.database.connection.debug)
  delete appConfig.entities.database.connection.debug

module.exports = appConfig  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
