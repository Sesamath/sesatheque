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
var origine = "labomepBIBS" // des ressources
var origineArbre = 'sesamath'
/** timeout en ms */
var timeout = 21000
/** Nb max de requetes http lancées vers l'api (qq get non pris en compte) */
var maxLaunched = 2 // les arbres sont gros et l'api doit retrouver tous les enfants...

/**
 * La liste des xml qui doivent être découpés
 * @param xmlName
 * @returns {boolean}
 */
function needToSplit(xmlName) {
  if (/^Manuel/.test(xmlName)) return true
  if (/^Cahier/.test(xmlName)) return true
  if (xmlName === 'exercices_interactifs') return true
  if (xmlName === 'animations_interactives') return true
  return false
}

/** pour loguer le processing (un point par ressource sinon) */
var logProcess = true
/** pour loguer les ressources dont le retour est ok */
var logOk = true

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
var port = serverConf.server && serverConf.server.port || 3000;

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

/** une liste d'arbre à envoyer après tous les autres */
var lastArbres = []

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
function deferAdd(ressource, noPopulate) {
  if (ressource && ressource.titre) {
    idsToSend.push(ressource.idOrigine);
    if (nbLaunched < maxLaunched) addRessource(ressource, checkEnd, noPopulate)
    else waitingRessource.push(ressource)
  } else {
    idsFailed.push(ressource.idOrigine)
    addError(ressource.idOrigine, "ressource sans titre ou invalide, non postée")
    log(ressource)
  }
}

/**
 * Parse un xml (et appelle parseArbre avec le résultat)
 * @param xmlFile
 */
function parseXml(xmlFile) {
  var xmlName = xmlFile.substr(0, xmlFile.length -4) // sans l'extension
  idsParsed.push(xmlName);
  if (logProcess) log('processing ' + xmlName)
  try {
    var xmlString = fs.readFileSync(__dirname +'/arbresXml/' +xmlFile).toString();
    var arbre = elementtree.parse(xmlString)
    if (!arbre._root) throw new Error("arbre sans racine")
    if (!arbre._root._children || !arbre._root._children.length) throw new Error("arbre vide")
    /* log(JSON.stringify(arbre, null, 2))
    process.exit() */
    // si l'arbre n'a qu'un fils qui est un tag d avec enfants c'est lui qu'on prend comme racine
    if (arbre._root._children.length === 1 && arbre._root._children[0].tag === 'd') {
      if (arbre._root._children[0]._children.length) {
        arbre = arbre._root._children[0]
        if (arbre.attrib.n) {
          arbre.titre = arbre.attrib.n
          delete arbre.attrib.n
        }
      } else throw new Error("arbre avec un seul dossier vide")
    } else {
      arbre = arbre._root
    }
    arbre.titre = xmlName.replace('_', ' ')

    splitOrNotToSplit(arbre, xmlName)

  } catch (error) {
    addError(xmlName, "le parsing du xml " +xmlFile +" a planté : " +error.toString())
  }
}

/**
 * Regarde s'il faut découper l'arbre en branches avant de passer à convert
 * @param arbre
 * @param xmlName
 */
function splitOrNotToSplit(arbre, xmlName) {
  if (needToSplit(xmlName)) {
    // faudra l'ajouter (sans populate),
    // mais une fois que ces enfants auront été enregistrés (pour que l'api nous donne les bons id)
    var root = {
      titre        : arbre.titre,
      typeTechnique: 'arbre',
      origine      : origineArbre,
      idOrigine    : xmlName,
      enfants      : [],
      // servira d'idOrigine pour récupérer l'id des children quand il auront été enregistrés
      branches     : []
    }
    var num = 0
    arbre._children.forEach(function (branche) {
      num++
      if (branche.tag !== 'd') return addError(xmlName, "doit être découpé mais on a trouvé un " + branche.tag +
          " à la racine")
      var file = xmlName +'.part' + num
      root.branches.push(file)
      if (branche.attrib.n) {
        branche.titre = branche.attrib.n
        delete branche.attrib.n
      } else {
        addError(file, 'sans titre')
        branche.titre = file
      }
      convert(branche, file)
    })
    lastArbres.push(root)
  } else {
    convert(arbre, xmlName)
  }
}

/**
 * Converti un arbre en ressource à poster (qu'on passe à deferAdd)
 * @param arbre
 * @param xmlName
 */
function convert(arbre, xmlName) {
  var ressource = {
    titre        : arbre.titre,
    typeTechnique: 'arbre',
    origine      : origineArbre,
    idOrigine    : xmlName,
    enfants      : getEnfants(arbre, xmlName)
  }
  deferAdd(ressource)
}

/**
 * Passe en revue l'objet issu du xml pour en faire une ressource
 * @param {Object} arbre
 * @param {string} Le xml (nom du fichier sans extension qui sera idOrigine, éventuellement avec un suffixe)
 */
function getEnfants(arbre, xmlName) {
  var enfants = []
  if (arbre._children) arbre._children.forEach(function(child) {
    var enfant = {}
    // un titre si on le trouve dans les attributs
    if (child.attrib.n) {
      enfant.titre = child.attrib.n
      delete child.attrib.n;
    }

    if (child.tag === 'd') {
      if (!enfant.titre) {
        addError(xmlName, "dossier sans titre, n° d'ordre " +child._id)
        enfant.titre = 'sans titre'
      }
      enfant.typeTechnique = 'arbre'
      enfant.contenu = child.attrib
      enfant.enfants = getEnfants(child)

    } else {
      if (child.attrib.i) {
        enfant.ref = child.attrib.i
        delete child.attrib.i
        if (!_.isEmpty(child.attrib)) enfant.contenu = child.attrib
        enfant.typeTechnique = child.tag
        enfant.refOrigine = origine
        // on vérifie qu'il a pas d'enfants
        if (child._children.length) addError(xmlName, "L'élément " +child.tag +" a des enfants, n° d'ordre " +child._id)
      } else {
        addError(xmlName, "élément " +child.tag +" sans id , n° d'ordre " +child._id)
        enfant = undefined
      }
    }

    if (enfant) enfants.push(enfant)
  })

  return enfants
}

/**
 * Récupère une ressource via l'api
 * @param origine
 * @param idOrigine
 * @param next appelé avec la ressource (ou rien en cas de pb, que l'on log ici)
 */
function getRessource(origine, idOrigine, next) {
  var idComb = origine +'-' +idOrigine
  var options = {
    url         : 'http://localhost:' +port +'/api/ressource/' + origine +'/' +idOrigine,
    json        : true,
    content_type: 'charset=UTF-8'
  }
  request.get(options, function (error, response, ressource) {
    if (error) {
      errors[idComb] = error.toString()
      next(null)
    } else if (ressource.error) {
      errors[idComb] = ressource.error
      next(null)
    } else if (ressource.origine !== origine || ressource.idOrigine !== idOrigine) {
      errors[idComb] = "ressource " +idComb +" incohérente : " +JSON.stringify(ressource)
      next(null)
    } else next(null, ressource)
  })
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param ressource
 * @param next
 */
function addRessource(ressource, next, noPopulate) {
  nbLaunched++
  idsSent.push(ressource.idOrigine)
  var options = {
    url : 'http://localhost:' +port +'/api/arbre' +(noPopulate ? '' : '?populate=1'),
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
        // on regarde les arbres qu'il fallait envoyer en dernier
        nextStep = this
        if (lastArbres.length) {
          lastArbres.forEach(function (root) {
            // faut récupérer les ids des idOrigine de chaque branche
            flow(root.branches)
                .seqEach(function (idOrigine) {
                  var nextSeq = this
                  // monstrueux de récupérer toute la ressource pour si peu, mais ça tourne pas souvent
                  getRessource(origineArbre, idOrigine, function (error, ressource) {
                    if (ressource && ressource.id)
                      root.enfants.push({
                        ref          : ressource.id,
                        titre        : ressource.titre,
                        typeTechnique: ressource.typeTechnique
                      })
                    else {
                      addError(idOrigine, 'info de la branche pas récupérée')
                      log('à la place de ' + idOrigine + ' on récupère', error ? error.stack : ressource)
                    }
                    nextSeq()
                  })
                })
                .seq(function () {
                  // tous les enfants ont été récupérés
                  delete root.branches
                  root.idOrigine = root.idOrigine.replace('.xml', '') // on vire le suffixe pour la racine de ces arbres
                  deferAdd(root, true)
                  this()
                })
                .catch(function (error) {
                  addError(root.idOrigine, 'seq a planté pendant la récup des ids des branches : '.error.toString())
                })
          })
        } else {
          nextStep()
        }
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

/* après l'import, pour passer en origine sesamath, et virer le suffixe .xml de idOrigine
 * un peu bourrin le xml de idOrigine qui précede typeTechnique mais ça passe
 UPDATE ressource r
 inner join ressource_index io using(oid)
 inner join ressource_index ii using(oid)
 SET
    io._string = 'sesamath',
    ii._string = replace(ii._string, '.xml', ''),
    r.data = replace(replace(r.data, 'origine":"sesamath"', 'origine":"sesamath"'), '.xml","typeTechnique":', '","typeTechnique":')
 WHERE io.name = 'origine'
   and io._string = 'labomepXml'
   and ii.name = 'idOrigine'
   and ii._string like '%.xml'

 */
