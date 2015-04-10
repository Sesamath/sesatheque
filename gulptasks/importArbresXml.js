/**
 * Ce script passe en revue les ressources des xml de labomep et les converti en arbre qu'il envoie à sesatheque
 * Les infos des ressources viennent de la table BIBS (origine = labomepBIBS) sauf pour les tags em et am où c'est MEPS
 */
'use strict';

var common = require('./modules/common')
var log = common.log // jshint ignore:line
common.setOptions({
  /** timeout en ms */
  timeout : 21000,
  maxLaunched : 1, // les arbres sont gros et l'api doit retrouver tous les enfants...
  /** pour loguer les ressources dont le retour est ok */
  logOk : true
})

/** le timestamp en ms du lancement de ce script */
var topDepart = (new Date()).getTime()
/** origine par défaut (si on la précise pas via --origine), sauf em et am qui ont l'origine du même nom */
var defaultOrigine = "labomepBIBS" // des ressources
var origineArbre = 'sesaxml'

/**
 * La liste des xml qui doivent être découpés
 * @param xmlName
 * @returns {boolean}
 */
function needToSplit(xmlName) {
  if (/^Manuel/.test(xmlName)) return true
  if (/^Cahier/.test(xmlName)) return true
  if (xmlName === 'animations_interactives') return true
  if (xmlName === 'exercices_interactifs') return true
  if (xmlName === 'exercices_non') return true
  if (xmlName === 'tous_les_manuels') return true
  return false
}

/** pour loguer le processing (un point par ressource sinon) */
var logProcess = true

var fs = require('fs')
var _ = require('lodash')
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

// url bibliotheque d'après conf de l'appli
var serverConf = require('../_private/config')
var urlApiBibli = 'http://'
urlApiBibli += serverConf.$server && serverConf.$server.hostname || 'localhost'
urlApiBibli += ':'
urlApiBibli += serverConf.$server && serverConf.$server.port || '3000'
urlApiBibli += '/api'

var ressConf = require('../construct/ressource/config')
var arbreCateg = ressConf.constantes.categories.liste

/**
 * On pourrait se contenter d'incrémeter des nombres, mais on enregistre les listes d'id
 * pour les avoir sous la static pour éventuel debug
 */
/** ids des ressources traitées ici */
var idsParsed = [];
/** ids des ressources sur la pile d'envoi */
//var idsToSend = [];
/** Liste des ressources en attentes qu'il faut appeler avec noPopulate */
var idsNoPopulate = {}
/** ids des ressources envoyées */
//var idsSent = [];
/** ids des ressources avec une réponse de l'api */
//var idsResp = []
/** ids des ressources enregistrées par l'api */
//var idsOk = []
/** ids des ressources dont l'enregistrement a planté */
var idsFailed = [];

/** la liste des erreurs rencontrées (la clé est l'id, 0 pour les erreurs générées ici hors ressource) */
var errors = {}

/** une liste d'arbre à envoyer après tous les autres, le 1er aura une ref vers chacun des autres */
var lastArbres = [
  { // 0 => sesamath_all
    titre        : 'Ressources Sésamath',
    typeTechnique: 'arbre',
    origine      : origineArbre,
    idOrigine    : 'labomep_all',
    publie       : true,
    restriction  : 0,
    enfants      : []
  },
  { // 1 => tous_les_manuels
    titre        : 'Manuels Sésamath',
    typeTechnique: 'arbre',
    origine      : origineArbre,
    idOrigine    : 'tous_les_manuels',
    publie       : true,
    restriction  : 0,
    enfants      : []
  }
]

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
 * Parse un xml (et appelle splitOrNotToSplit avec le résultat)
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
    arbre.titre = xmlName.replace(/_/g, ' ')

    splitOrNotToSplit(arbre, xmlName)

  } catch (error) {
    addError(xmlName, "le parsing du xml " +xmlFile +" a planté : " +error.toString())
  }
}

/**
 * Regarde s'il faut découper l'arbre en branches avant de passer à convertAndPush
 * @param arbre objet en sortie de parseXml
 * @param xmlName
 */
function splitOrNotToSplit(arbre, xmlName) {
  // on l'ajoute au lastArbres[0] (toutes les ressources sésamath)
  lastArbres[0].enfants.push({
    titre        : arbre.titre,
    typeTechnique: 'arbre',
    origine      : origineArbre,
    idOrigine    : xmlName
  })
  // si manuel ou cahier on ajoute à lastArbres[1] (tous les manuels)
  if (/^Manuel/.test(xmlName) || /^Cahier/.test(xmlName)) {
    lastArbres[1].enfants.push({
      titre        : arbre.titre,
      typeTechnique: 'arbre',
      origine      : origineArbre,
      idOrigine    : xmlName
    })
  }

  if (needToSplit(xmlName)) {
    log("split " +xmlName)
    // faudra l'ajouter (sans populate),
    idsNoPopulate[xmlName] = true
    // mais une fois que ces enfants auront été enregistrés (pour que l'api nous donne les bons id)
    var root = {
      titre        : arbre.titre,
      typeTechnique: 'arbre',
      origine      : origineArbre,
      idOrigine    : xmlName,
      enfants      : [],
      // pour stocker des idOrigine qui serviront à récupérer les oid des children quand il auront été enregistrés
      idOrigineEnfants     : []
    }
    var num = 0
    // on découpe en branches
    arbre._children.forEach(function (branche) {
      num++
      if (branche.tag !== 'd') return addError(xmlName, "doit être découpé mais on a trouvé un " + branche.tag +" à la racine")
      var file = xmlName +'.part' + num
      root.idOrigineEnfants.push(file)
      if (branche.attrib.n) {
        branche.titre = branche.attrib.n
        delete branche.attrib.n
      } else {
        addError(file, 'sans titre')
        branche.titre = file
      }
      // on envoie cette branche
      convertAndPush(branche, file)
    })
    // faudra l'enregistrer après ses enfants
    log('push ' +xmlName +' dans lastArbres')
    lastArbres.push(root)
  } else {
    convertAndPush(arbre, xmlName)
  }
}

/**
 * Converti un arbre en ressource à poster (qu'on passe à common.pushRessource)
 * @param arbre
 * @param xmlName
 */
function convertAndPush(arbre, xmlName) {
  //log("convertAndPush " +xmlName)
  
  var ressource = {
    origine      : origineArbre,
    idOrigine    : xmlName,
    titre        : arbre.titre,
    typeTechnique: 'arbre',
    categorie    : arbreCateg,
    typePedagogiques :ressConf.categoriesToTypes[arbreCateg].typePedagogiques,
    typeDocumentaires :ressConf.categoriesToTypes[arbreCateg].typeDocumentaires,
    publie       : true,
    restriction  : 0,
    enfants      : getEnfants(arbre, xmlName)
  }
  common.pushRessource(ressource)
}

function recupBranchesAndPush(arbre) {
  if (arbre.idOrigineEnfants && arbre.idOrigineEnfants.length) {

  }
}

/**
 * Passe en revue l'objet issu du xml pour en faire une ressource
 * @param {Object} arbre
 * @param {string} [xmlName] Le xml (nom du fichier sans extension qui sera idOrigine, éventuellement avec un suffixe)
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
      enfant.attributes = child.attrib
      enfant.enfants = getEnfants(child)

    } else {
      if (child.attrib.i) {
        enfant.ref = child.attrib.i
        delete child.attrib.i
        if (!_.isEmpty(child.attrib)) enfant.attributes = child.attrib
        enfant.typeTechnique = child.tag
        if (child.tag == 'em') enfant.refOrigine = 'em'
        else if (child.tag == 'am') enfant.refOrigine = 'am'
        else enfant.refOrigine = defaultOrigine
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
  log('Durée : ' +common.getElapsed(topDepart)/1000 +'s')
  if (next) next()
}

/**
 * gulp sort pas tout seul sur du ctrl+C
 */
function stop() {
  displayResult()
  process.exit()
}

module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, nomDeLaTache
  var argv = process.argv.slice(3)
  var xmls = []
  var doCompil = false

  log('task ' + __filename);

  // on peut préciser un ou des nom(s) de fichier
  if (argv[0] === '--xml') {
      xmls = argv.slice(1)[0].split(',')
      if (argv[2] === '--origine') defaultOrigine = argv.slice(2)[0]
  } else {
    // on prend ceux du dossier arbresXml
    fs.readdirSync(__dirname +'/arbresXml').forEach(function (file) {
      if (file.substr(-4) === '.xml') {
        xmls.push(file)
      }
    })
    if (xmls.length) doCompil = true
  }
  log('On va parser les xml', xmls)

  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  // yapluka
  flow().seq(function () {
        common.setAfterAllCb(this)
        // plusieurs fct, convertAndPush fera un push à la fin
        xmls.forEach(parseXml)
      }).seq(function () {
        common.setAfterAllCb(this)
        // on regarde les arbres qu'il fallait envoyer en dernier
        if (doCompil) {
          // on met en dernier les 2 premiers
          lastArbres.push(lastArbres.shift())
          lastArbres.push(lastArbres.shift())
        } else {
          // faut virer les 2 premiers
          lastArbres.shift()
          lastArbres.shift()
        }
        log('On traite les ' +lastArbres.length +' ressources de lastArbres')
        // on remplace par des ids
        if (lastArbres.length) {
          lastArbres.forEach(function (root) {
            log("traitement de " +root.idOrigine)
            // faut récupérer les ids des idOrigine de chaque branche
            flow(root.branches)
                .seqEach(function (idOrigine) {
                  var nextSeq = this
                  // c'est du gaspillage de bp de récupérer toute la ressource pour si peu, mais ce script tourne pas souvent
                  common.getRessource(origineArbre, idOrigine, function (error, ressource) {
                    if (ressource && ressource.oid) {
                      root.enfants.push({
                        ref          : ressource.oid,
                        titre        : ressource.titre,
                        typeTechnique: ressource.typeTechnique
                      })
                    } else {
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
                  common.pushRessource(root, true)
                  this()
                })
                .catch(function (error) {
                  addError(root.idOrigine, 'seq a planté pendant la récup des ids des branches : ' +error.toString())
                })
          })
        } else {
          this()
        }

      }).seq(function () {
        displayResult(this)

      }).seq(function () {
        log('END')
        process.exit() // gulp sort pas tout seul s'il reste qq callback dans le vent

      }).catch(function (error) {
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
