/**
 * Ce script passe en revue les ressources de Labomep,
 * soit la table PERSOS (origine = labomepPERSOS),
 * soit BIBS (origine = labomepBIBS)
 * l'origine est donc commune à toutes les ressources traitées par le script
 */
'use strict';

/** le timestamp en ms du lancement de ce script */
var topDepart = (new Date()).getTime()
/** origine commune à toutes les ressources traitées ici, labomepPERSOS|labomepBIBS */
var origine = "labomepBIBS"
/** timeout en ms */
var timeout = 10000
/** Nb max de requetes http lancées vers l'api (qq get non pris en compte) */
var maxLaunched = 2

/** pour loguer le processing (un point par ressource sinon) */
var logProcess = true
/** pour loguer les ressources dont le retour est ok */
var logOk = false

var fs = require('fs')
var _ = require('underscore')._
var request = require('request')
var moment = require('moment')
var flow   = require('seq')
/*
xml2js ne conserve pas l'ordre des enfants, gênant pour une liste
cf https://github.com/Leonidas-from-XIV/node-xml2js/issues/31
var xml2js = require('xml2js')

htmlparser devrait marcher, mais il renvoie un objet un peu plus complexe que elementtree,
avec des trucs à éliminer comme
 {
 "raw": "\n        ",
 "data": "\n        ",
 "type": "text"
 },
var htmlparser = require('htmlparser')
*/
var elementtree = require('elementtree')

// conf de l'appli
var serverConf = require('../_private/config');
var config = require('../construct/ressource/config.js');
var port = serverConf.server && serverConf.server.port || 3000;

// constantes
var tdCode = config.constantes.typeDocumentaires;
var tpCode = config.constantes.typePedagogiques;
var catCode = config.constantes.categories;

/**
 * On pourrait se contenter d'incrémeter des nombres, mais on enregistre les listes d'id
 * pour les avoir sous la main pour éventuel debug
 */
/** ids des ressources traitées ici */
var idsParsed = [];
/** ids des ressources sur la pile d'envoi */
var idsToSend = [];
/** ids des ressources envoyées */
var idsSent = [];
/** ids des ressources avec une réponse de l'api */
var idsResp = []
/** ids des ressources enregistrées par l'api */
var idsOk = []
/** ids des ressources dont l'enregistrement a planté */
var idsFailed = [];

/** la liste des erreurs rencontrées (la clé est l'id, 0 pour les erreurs générées ici hors ressource) */
var errors = {}
/** La liste des relations à ajouter ensuite */
var pendingRelations = {};

// Les variables globales de checkEnd, pour chaque étape (pour décider de passer à la suivante)
var nbLaunched = 0
var waitingRessource = []
var nextStep
var timerId

/**
 * Retourne le nb de ms écoulées depuis start
 * @param {number} start Passer le top de départ (ou 0 pour récupérer un top de départ)
 */
function getElapsed(start) {
  return (new Date()).getTime() -start
}

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 */
function log(msg, objToDump) {
  var prefix = '[' +moment().format('HH:mm:ss.SSS') +'] '
  console.log(prefix + msg)
  if (objToDump) console.log(objToDump)
}

/**
 * Ajoute une erreur à la liste qui sera affichée à la fin
 * (et affiche la stack en console si c'est une erreur de notre code)
 * @param id
 * @param error
 */
function addError(id, error) {
  if (error instanceof Error) {
    log(error.stack)
    error = error.toString()
  }
  if (errors[id]) errors[id] += '\n'
  else errors[id] = ''
  errors[id] += error
  if (id) idsFailed.push(id)
}

/**
 * Lance l'étape suivante si toutes les ressources ont été traitées ou si on reste plus de timeout ms sans être rappelé
 */
function checkEnd() {
  // le timeout
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(function () {
    var msg = 'timeout, ' +Math.floor(timeout / 1000) +
        "s sans rien depuis le dernier retour de l'api, il restait " +nbLaunched +
        " ressources en attente de réponse de l'api et " +waitingRessource.length +" en attente d'envoi"
    addError(0, msg)
    log(msg)
    nextStep()
  }, timeout)

  // on regarde s'il en reste en attente et si c'est terminé
  if (waitingRessource.length) {
    while (nbLaunched < maxLaunched && waitingRessource.length) {
      addRessource(waitingRessource.shift(), checkEnd)
    }
  } else if (nbLaunched === 0) {
    log('toutes les ressources de cette étape ont été traitées')
    clearTimeout(timerId)
    nextStep()
  }
}

/**
 * Lance l'ajout d'une ressource via l'api si on est pas au max et la met en attente sinon
 * @param ressource
 */
function deferAdd(ressource) {
  if (ressource && ressource.titre) {
    idsToSend.push(ressource.idOrigine);
    if (nbLaunched < maxLaunched) addRessource(ressource, checkEnd)
    else waitingRessource.push(ressource)
  } else {
    idsFailed.push(ressource.idOrigine)
    addError(ressource.idOrigine, "ressource sans titre ou invalide, non postée")
    log(ressource)
  }
}

/**
 * Convertie un timestamp (en s ou ms) en objet Date
 * Retourne null si le timestamp est dans le futur (+2h) ou avant le 01/01/2004
 * @param ts
 * @returns {Date}
 */
function getDate(ts) {
  if (logProcess) log('getDate avec ' +ts)
  if (ts > 10001001001001) ts = Math.round(ts / 1000) // c'était des ms, on passe en s
  // 7260 en cas de décalage horaire (fuseau mal réglé)
  if (ts > 1072911600 && ts < (new Date()).getTime() / 1000 + 7260) {
    return new Date(ts * 1000);
  } else {
    return null;
  }
}

/**
 * Converti un timestamp (ms ou s) en string (JJ/DD/YYYY, suivant la conf)
 * @param ts le timestamp
 * @returns {String}
 */
function getJour(ts) {
  // log('getJour avec ' +ts)
  // si c'est des s, on passe en ms
  // 11001001001 est arbitraire, correspond à 1970 en ms et 2318 en s)
  if (ts < 11001001001) ts = ts * 1000

  return ts ? moment.utc(new Date(ts)).format(config.formats.jour) : null
}

/**
 * Vérifie qu'une chaine est une liste d'entiers séparés par des virgules
 * @param {String} ids
 */
function checkListOfInt (ids) {
  if (_.isString(ids)) {
    if (ids == parseInt(ids, 10)) return
    else {
      var a = ids.split(',')
      a.forEach(function (elt) {
        if (elt != parseInt(elt, 10)) throw new Error("L'élément " + elt + " n'est pas un entier")
      })
    }
  } else {
    throw new Error("La liste d'ids n'est pas une chaine")
  }
}

/**
 * Parse un xml (et appelle parseArbre avec le résultat)
 * @param xmlFile
 */
function parseXml(xmlFile) {
  idsParsed.push(xmlFile);
  var titre = xmlFile.substr(0, xmlFile.length -4) // sans l'extension
  if (logProcess) log('processing ' + xmlFile)
  else if (!origine) return addError(xmlFile, "origine de " +xmlFile +
      " inconnue, il faut la préciser avec --origine ou l'ajouter dans ce fichier " +__filename)
  try {
    var xmlString = fs.readFileSync(__dirname +'/arbresXml/' +xmlFile).toString();
    var arbre = elementtree.parse(xmlString)
    if (!arbre._root) throw new Error("arbre sans racine")
    if (!arbre._root._children) throw new Error("arbre vide")
    /* log(JSON.stringify(arbre, null, 2))
    process.exit() */
    var ressource = {
      titre : titre,
      typeTechnique : 'arbre',
      origine : 'labomepXml',
      idOrigine: xmlFile,
      categories : [config.constantes.categories.liste],
      typeDocumentaire : [config.constantes.typeDocumentaires.collection],
      publie : true,
      parametres:{
        enfants:getEnfants(arbre._root._children, xmlFile)
      }
    }
    deferAdd(ressource)
    origine = undefined // pour le prochain
  } catch (error) {
    addError(xmlFile, "le parsing du xml " +xmlFile +" a planté : " +error.toString())
  }

}

/**
 * Passe en revue l'objet issu du xml pour en faire une ressource
 * @param {Array} childrens
 */
function getEnfants(childrens, xmlFile) {
  var enfants = []
  childrens.forEach(function(child) {
    var enfant = {}

    if (child.tag === 'd') {
      if (child.attrib.n) {
        enfant.titre = child.attrib.n
        delete child.attrib.n;
      }
      if (!enfant.titre) {
        addError(xmlFile, "dossier sans titre, n° d'ordre " +child._id)
        enfant.titre = 'sans titre'
      }
      enfant.type = 'arbre'
      enfant.contenu = child.attrib
      enfant.enfants = getEnfants(child._children)

    } else {
      if (child.attrib.i) {
        enfant.ref = child.attrib.i
        delete child.attrib.i
        enfant.contenu = child.attrib
        enfant.type = child.tag
        enfant.refOrigine = origine
        // on vérifie qu'il a pas d'enfants
        if (child._children.length) addError(xmlFile, "L'élément " +child.tag +" a des enfants, n° d'ordre " +child._id)
      } else {
        addError(xmlFile, "élément " +child.tag +" sans id , n° d'ordre " +child._id)
        enfant = undefined
      }
    }

    if (enfant) enfants.push(enfant)
  })

  return enfants
}

function parseNode(node) {
  var retour = {}
  _.each(node, function(value, key) {
    if (key === 'd') {
      // c'est une branche
      if (value.attrs) {
        if (value.attrs.n) {
          retour.titre = value.attrs.n
          delete value.attrs.n
        }
        retour.contenu = value.attrs
      }
      if (!retour.titre) retour.titre = 'branche sans titre'
      retour.type = 'arbre'
      retour.enfants = parseNode(value)
    } else {
      retour.type = key
      if (value.attrs && value.attrs.n) retour.titre = value.attrs.n
    }
  })
}

/**
 * Initialise les propriété communes à toutes les ressources à partir du recordset, helper de parseRessource
 * @param {Object} row
 * @returns {Object}
 */
function initRessourceGenerique(row) {
  var ressource = {
    origine          : origine,
    idOrigine        : row.id,
    resume           : row.descriptif || '',
    description      : '',
    commentaires     : row.commentaire || '',
    parametres       : {xml:row.xml},
    langue           : 'fre',
    publie           : true,
    restriction      : 2
  }
  if (row.user_sslsesa_id) ressource.auteurs =  [row.user_sslsesa_id]

  return ressource
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param ressource
 * @param next
 */
function addRessource(ressource, next) {
  nbLaunched++
  idsSent.push(ressource.idOrigine)
  var options = {
    url : 'http://localhost:' +port +'/api/ressource',
    json: true,
    //body: JSON.stringify({ressource:ressource}),
    content_type: 'charset=UTF-8',
    form: ressource
  }
  request.post(options, function (error, response, body) {
    nbLaunched--
    idsResp.push(ressource.idOrigine)
    if (error) addError(ressource.idOrigine, error.toString())
    else {
      if (body.error) {
        addError(ressource.idOrigine, body.error)
      } else {
        if (body.id) { // on ne récupère que ça, c'est pas le idOrigine posté
          idsOk.push(ressource.idOrigine)
          if (logOk) log(ressource.idOrigine +' ok avec ' +ressource.idOrigine)
        } else {
          addError(ressource.idOrigine, "L'api renvoie " +JSON.stringify(body))
        }
      }
    }
    next()
  })
}

/**
 * Affiche la compilation des résultats
 * @param next
 */
function displayResult(next) {
  // attendues 4109 + 1613
  log(idsParsed.length +' ressources traitées')
  log(idsToSend.length +' ressources à poster')
  log(idsResp.length +" réponses de l'api")
  log(idsOk.length +' ressources enregistrées')
  if (idsFailed.length) {
    var logfile = __dirname + '/../logs/importLabomep.error.log'
    var writeStream = fs.createWriteStream(logfile, {'flags': 'a'})
    log('erreurs vers '+logfile)
    log(idsFailed.length +' ressources avec erreurs :' +idsFailed.join(','))
    writeStream.write("Erreurs d'importation de " +moment().format('YYYY-MM-DD HH:mm:ss'))
    idsFailed.forEach(function (idOrigine) {
      log(idOrigine +' : ' +errors[idOrigine])
      writeStream.write(idOrigine +' : ' +errors[idOrigine])
    })
    writeStream.write("Fin des erreurs d'importation, " +moment().format('YYYY-MM-DD HH:mm:ss'))
    writeStream.end();
  } else log('Aucune erreur rencontrée')
  log('Durée : ' +getElapsed(topDepart)/1000 +'s')
  if (next) next()
}

module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, nomDeLaTache
  var argv = process.argv.slice(3)
  var xmls = []

  log('task ' + __filename);

  // on peut préciser un ou des nom(s) de fichier
  if (argv[0] === '--xml') {
      xmls = argv.slice(1)[0].split(',')
      if (argv[2] === '--origine') origine = argv.slice(2)[0]
  } else {
    // on prend ceux du dossier arbresXml
    fs.readdirSync(__dirname +'/arbresXml').forEach(function (file) {
      if (file.substr(-4) === '.xml') {
        xmls.push(file)
      }
    })
  }
  log('On va parser les xml', xmls)

  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', displayResult);
  process.on('SIGINT', displayResult);

  // yapluka
  flow()
      .seq(function () {
        nextStep = this
        xmls.forEach(parseXml)
      })
      .seq(function () {
        displayResult(this)
      })
      .seq(function () {
        log('END')
        process.exit() // gulp sort pas tout seul s'il reste qq callback dans le vent
      })
      .catch(function (error) {
        log('Erreur dans le flow :', error);
      })
}
