/**
 * Ce script passe en revue les ressources des xml de labomep et les converti en arbre qu'il envoie à sesatheque
 * Les infos des ressources viennent de la table BIBS (origine = labomepBIBS) sauf pour les tags em et am où c'est MEPS
 */
'use strict'

var fs = require('fs')
var _ = require('lodash')
var flow   = require('seq')

var common = require('./modules/common')
var log = common.log // jshint ignore:line
/** pour loguer le processing (un point par ressource sinon) */
var logProcess = true

common.setOptions({
  /** timeout en ms */
  timeout : 2000,
  maxLaunched : 1, // les arbres sont gros et faut appeller l'api pour retrouver tous les enfants...
  /** pour loguer les ressources dont le retour est ok */
  logApiCalls : true,
  logProcess : logProcess
})

/** origine par défaut (si on la précise pas via --origine), sauf em et am qui ont l'origine du même nom */
var defaultOrigine = "labomepBIBS" // des ressources
var origineArbre = 'sesaxml'

/**
 * La liste des xml qui doivent être découpés
 * @param xmlName
 * @returns {boolean}
 */
function needToSplit(xmlName) {
  var regexps = [
      // /^Manuel[^\.]+$/,
      // /^Cahier[^\.]+$/,
      // /^tous_les_manuels(\.part[0-9]+)?$/

      // lui a différents suffixes possibles
      /^animations_interactives([^\.]+)?$/,
      /^animations_interactives\.part[0-9]+$/,
      /^exercices_interactifs$/,
      /^exercices_non(\.part[0-9]+)?$/
  ]
  for (var i = 0; i < regexps.length; i++) {
    if (regexps[i].test(xmlName)) return true
  }
  return false
}

/**
 * Affecte certains titre et remplace _ par ' ' pour les autres
 * @param arbreXml
 * @param xmlName
 * @returns {*}
 */
function getTitre(arbreXml, xmlName) {
  var titre
  if (titre === 'exercices_non') titre = 'Tous les manuels et cahiers'
  else if (arbreXml.attrib && arbreXml.attrib.n) titre = arbreXml.attrib.n
  else titre = arbreXml.titre || xmlName.replace(/_/g, ' ')

  return titre
}

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

/** une liste d'arbre à envoyer après tous les autres, le 1er aura une ref vers chacun des autres */
var lastArbres = []
var allArbres = getArbreDefaultValues('labomep_all', 'Tous les arbres xml de Labomep')
//lastArbres.push(getArbreDefaultValues('tous_les_manuels', 'Manuels Sésamath'))

/**
 * Renvoie les valeurs par défaut pour un arbre
 * @param {string} idOrigine
 * @param {string} titre
 * @returns {{typeTechnique: string, origine: string, categories: *[], publie: boolean, restriction: number, enfants: Array}}
 */
function getArbreDefaultValues(idOrigine, titre) {
  return {
    titre        : titre,
    typeTechnique: 'arbre',
    origine      : origineArbre,
    idOrigine    : idOrigine,
    categories   : [arbreCateg],
    publie       : true,
    restriction  : 0,
    enfants      : []
  }
}

/**
 * Parse un xml (et appelle processArbreXml avec le résultat)
 * @param xmlFile
 * @param next
 */
function parseXml(xmlFile, next) {
  var file = __dirname +'/arbresXml/' +xmlFile
  var xmlName = xmlFile.substr(0, xmlFile.length -4) // sans l'extension

  if (logProcess) log('processing ' + xmlName)

  try {
    if (!fs.existsSync(file)) {
      console.log('Abandon, ' +file +" n'existe pas")
      process.exit()
    }
    var xmlString = fs.readFileSync(file).toString()
    var arbreXml = elementtree.parse(xmlString)
    if (!arbreXml._root) throw new Error("arbreXml sans racine")
    if (!arbreXml._root._children || !arbreXml._root._children.length) throw new Error("arbreXml vide")
    /* log(JSON.stringify(arbreXml, null, 2))
    process.exit() */
    // si l'arbreXml n'a qu'un fils qui est un tag d avec enfants c'est lui qu'on prend comme racine
    if (arbreXml._root._children.length === 1 && arbreXml._root._children[0].tag === 'd') {
      if (arbreXml._root._children[0]._children.length) {
        arbreXml = arbreXml._root._children[0]
      } else throw new Error("arbreXml avec un seul dossier vide")
    } else {
      arbreXml = arbreXml._root
    }
    processArbreXml(arbreXml, xmlName, next)

  } catch (error) {
    common.addError(xmlName, "le parsing du xml " +xmlFile +" a planté : " +error.toString())
  }
}

/**
 * Regarde s'il faut découper l'arbreXml en branches avant de passer à convertAndDefer
 * @param arbreXml objet en sortie de parseXml
 * @param xmlName
 * @param next
 */
function processArbreXml(arbreXml, xmlName, next) {
  // si manuel ou cahier on ajoute à lastArbres[1] (tous les manuels)
  //if (/^Manuel/.test(xmlName) || /^Cahier/.test(xmlName)) {
  //  lastArbres[1].push(getArbreDefaultValues(xmlName, arbreXml.titre))
  //}

  if (needToSplit(xmlName)) {
    if (logProcess) log("split " +xmlName)
    var arbre = getArbreDefaultValues(xmlName, getTitre(arbreXml, xmlName))
    arbre.idOrigine = xmlName
    // pour stocker les idOrigine des branches qui serviront à récupérer les oid quand elles auront été enregistrées
    arbre.idOrigineBranches = []

    var num = 1
    // on découpe en branches
    flow(arbreXml._children).seqEach(function (branche) {
      var nextBranche = this
      var brancheName = xmlName + '.part' + num
      num++
      log('découpage de ' +xmlName +', branche ' +brancheName)
      if (branche.tag === 'd') {
        arbre.idOrigineBranches.push(brancheName)
        processArbreXml(branche, brancheName, nextBranche)
      } else {
        common.addError(xmlName, "doit être découpé mais on a trouvé un " + branche.tag + " à la racine")
        nextBranche()
      }

    }).seq(function () {
      // on lance l'envoi de la pile de branches
      log('envoi des enfants de ' +xmlName)
      common.checkEnd(this)

    }).seq(function () {
      log('fin traitement des branches de ' +xmlName +', récup des ref')
      // remplace les idOrigineBranches
      getRefEnfants(arbre, this)

    }).seq(function () {
      // faut enregistrer l'arbre maintenant car on est peut-être en récursif
      if (logProcess) log("envoi de l'arbre complété " +xmlName)
      common.addRessource(arbre, this)

    }).seq(function () {
      if (logProcess) log('fin du traitement de ' +xmlName)
      next()

    }).catch(function (error) {
      log('erreur dans le traitement des branches de ' +xmlName +', il ne sera pas ajouté', error)
      next()
    })

  } else {
    if (logProcess) log("not split " +xmlName)
    convertAndDefer(arbreXml, xmlName, next)
  }
}

/**
 * Converti un arbreXml en ressource à poster (qu'on passe à common.pushRessource)
 * @param arbreXml
 * @param xmlName
 * @param next
 */
function convertAndDefer(arbreXml, xmlName, next) {
  function end () {
    common.deferRessource(arbre)
    next()
  }

  var arbre = getArbreDefaultValues(xmlName, getTitre(arbreXml, xmlName))
  arbre.typePedagogiques = ressConf.categoriesToTypes[arbreCateg].typePedagogiques
  arbre.typeDocumentaires =ressConf.categoriesToTypes[arbreCateg].typeDocumentaires
  getEnfants(arbreXml, xmlName, function (enfants) {
    arbre.enfants = enfants
    if (arbre.idOrigineBranches) getRefEnfants(arbre, end)
    else end()
  })
}

/**
 * Ajoute à arbre.enfants les ref que l'on récupère via l'api d'après arbres.idOrigineBranches
 * (que l'on efface à la fin des récup de ref)
 * @param arbre
 * @param next
 */
function getRefEnfants(arbre, next) {
  // faut récupérer les refs des idOrigine de chaque branche
  if (arbre.idOrigineBranches) {
    flow(arbre.idOrigineBranches).seqEach(function (idOrigine) {
      var nextEnfant = this
      common.getRef(origineArbre, idOrigine, function (ref) {
        if (ref) arbre.enfants.push(ref)
        else {
          arbre.enfants.push({
            titre        : "erreur, ressource inexistante au moment de l'import",
            origine      : origineArbre,
            idOrigine    : idOrigine
          })
        }
        nextEnfant()
      })

    }).seq(function () {
      // tous les enfants ont été récupérés
      log('fin conversion des idOrigineBranches de ' +arbre.idOrigine)
      delete arbre.idOrigineBranches
      next()

    }).catch(function (error) {
      common.addError(arbre.idOrigine, 'seq a planté pendant la récup des ref de ses branches : ' +error.toString())
      next()
    })
  } else {
    next()
  }
}

/**
 * Passe en revue l'objet issu du xml pour récupérer tous les enfants et les passer à next
 * @param {Object}   arbreXml
 * @param {string}   [xmlName] Le xml (nom du fichier sans extension qui sera idOrigine, éventuellement avec un suffixe partXX)
 * @param {Function} next callback appelée avec le tableau d'enfants ou un tableau vide
 */
function getEnfants(arbreXml, xmlName, next) {
  var enfants = []

  if (arbreXml._children) {
    flow(arbreXml._children).seqEach(function (child) {
      var nextSeq = this
      var enfant = {}
      // un titre si on le trouve dans les attributs
      if (child.attrib.n) {
        enfant.titre = child.attrib.n
        delete child.attrib.n
      }

      if (child.tag === 'd') {
        if (!enfant.titre) {
          common.addError(xmlName, "dossier sans titre, n° d'ordre " +child._id)
          enfant.titre = 'sans titre'
        }
        enfant.typeTechnique = 'arbre'
        enfant.attributes = child.attrib
        getEnfants(child, null, function (ptizenfants) {
          enfant.enfants = ptizenfants
          enfants.push(enfant)
          nextSeq()
        })

      } else {
        // une ref vers une ressource
        if (child.attrib.i) {
          var origine
          if (child.tag == 'em') origine = 'em'
          else if (child.tag == 'am') origine = 'am'
          else origine = defaultOrigine
          common.getRef(origine, child.attrib.i, function (ref) {
            if (ref) {
              enfant = ref
            } else {
              enfant = {
                typeTechnique: child.tag,
                origine      : origine,
                idOrigine    : child.attrib.i,
                titre        : "Erreur, n'existait pas dans la bibliothèque au moment de l'import" + ' (' + (enfant.titre || '') + ')'
              }
            }
            // on lui ajoute ses attributs éventuels
            delete child.attrib.i
            try {
              if (!_.isEmpty(child.attrib)) enfant.attributes = child.attrib
            } catch(error) {
              var msg = "L'affectation dans attributes de l'enfant " +(enfant.ref || enfant.idOrigine) +' a planté'
              log(msg, error)
              log.error(msg, error)
            }
            // on vérifie qu'il a pas d'enfants
            if (child._children.length) common.addError(xmlName, "L'élément " +child.tag +" a des enfants, n° d'ordre " +child._id)
            enfants.push(enfant)
            nextSeq()
          }) // getRef

        } else {
          common.addError(xmlName, "élément " +child.tag +" sans id , n° d'ordre " +child._id)
          nextSeq()
        }
      }

    }).seq(function () {
      if (logProcess && xmlName) log('fin du traitement des enfants de ' +xmlName)
      //log('enfants de ' +xmlName, enfants)
      next(enfants)
    }).catch(function (error) {
      log('plantage dans seq de getEnfants', error)
      common.addError(xmlName, 'plantage dans seq de getEnfants : ' +error)
      next(enfants)
    })
  }
}

// on vire node et ce fichier passé en 1er arg
var argv = process.argv.slice(2)
var xmls = []
var doCompil = false

log('task ' + __filename)

// on peut préciser un ou des nom(s) de fichier
if (argv[0] === '--xml') {
    xmls = argv[1].split(',')
    if (argv[2] === '--origine') defaultOrigine = argv[3]
} else {
  // on prend ceux du dossier arbresXml
  fs.readdirSync(__dirname +'/arbresXml').forEach(function (file) {
    if (file.substr(-4) === '.xml') {
      xmls.push(file)
    }
  })
  if (xmls.length) doCompil = true
}

log('On va parser les xml : ' +xmls.join(', '))

// en cas d'interruption on veut le résultat quand même
process.on('SIGTERM', common.displayResult)
process.on('SIGINT', common.displayResult)

// yapluka
flow().seq(function () {
  /**
   * Etape 1, parsing des xml et envoi des enfants
   * (split, récup des enfants, defer des branches, mise dans lastArbres des parents puis envoi des branches)
   */
  var nextSeq = this

  // boucle sur les xml
  flow(xmls).seqEach(function (xml) {
    parseXml(xml, this)

  }).seq(function () {
    log("fin de l'analyse des xmls, on envoie les arbres")
    common.checkEnd(this)

  }).seq(function () {
    log("fin de l'envoi des arbres issus des xmls")
    nextSeq()

  }).catch(function (error) {
    log('error dans la boucle seq sur les xml', error)
    nextSeq()
  })

}).seq(function () {
  /**
   * Etape 2, traitement de lastArbres
   */
  if (doCompil) {
    // on met en dernier le global
    lastArbres.push(allArbres)
    //lastArbres.push(lastArbres.shift())
  }
  if (lastArbres.length) {
    // on remplace par des ids
    log('On traite les ' +lastArbres.length +' ressources de lastArbres')

    flow(lastArbres).seqEach(function (arbre) {
      log("traitement de " +arbre.idOrigine)
      convertAndDefer(arbre, arbre.idOrigine, this)

    }).seq(function () {
      // fin seqEach lastArbres
      log("envoi des lastArbres peuplés")
      common.checkEnd(this)

    }).seq(function () {
      log('fin lastArbres')

    }).catch(function (error) {
      log('error dans la boucle lastArbres', error)
    })

  } else {
    log('Pas de lastArbres à traiter')
    this()
  }

}).seq(function () {
  common.displayResult()

}).catch(function (error) {
  log('Erreur dans le flow :', error)
  common.displayResult()
})

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
