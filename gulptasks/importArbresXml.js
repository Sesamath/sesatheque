/**
 * Ce script passe en revue les ressources des xml de labomep et les converti en arbre qu'il envoie à sesatheque
 * Les infos des ressources viennent de la table BIBS (origine = labomepBIBS) sauf pour les tags em et am où c'est MEPS
 */
'use strict';

var common = require('./modules/common')
var log = common.log // jshint ignore:line
/** pour loguer le processing (un point par ressource sinon) */
var logProcess = true

common.setOptions({
  /** timeout en ms */
  timeout : 21000,
  maxLaunched : 1, // les arbres sont gros et l'api doit retrouver tous les enfants...
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
  if (/^Manuel/.test(xmlName)) return true
  if (/^Cahier/.test(xmlName)) return true
  if (xmlName === 'animations_interactives') return true
  if (xmlName === 'exercices_interactifs') return true
  if (xmlName === 'exercices_non') return true
  if (xmlName === 'tous_les_manuels') return true
  return false
}

/**
 * Affecte certains titre et remplace _ par ' ' pour les autres
 * @param xmlName
 * @returns {*}
 */
function getTitre(xmlName) {
  if (xmlName === 'exercices_non') return 'Tous les manuels et cahiers'
  return xmlName.replace(/_/g, ' ')
}


var fs = require('fs')
var _ = require('lodash')
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
/** Liste des ressources en attentes qu'il faudra appeler ensuite avec noPopulate */
var idsNoPopulate = {}


/** une liste d'arbre à envoyer après tous les autres, le 1er aura une ref vers chacun des autres */
var lastArbres = []
lastArbres.push(getArbreDefaultValues('labomep_all', 'Tous les arbres Labomep'))
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
 * Parse un xml (et appelle splitOrNotToSplit avec le résultat)
 * @param xmlFile
 */
function parseXml(xmlFile) {
  var xmlName = xmlFile.substr(0, xmlFile.length -4) // sans l'extension
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
    arbre.titre = getTitre(xmlName)

    splitOrNotToSplit(arbre, xmlName)

  } catch (error) {
    common.addError(xmlName, "le parsing du xml " +xmlFile +" a planté : " +error.toString())
  }
}

/**
 * Regarde s'il faut découper l'arbre en branches avant de passer à convertAndPush
 * @param arbre objet en sortie de parseXml
 * @param xmlName
 */
function splitOrNotToSplit(arbre, xmlName) {
  log('splitOrNotToSplit ' +xmlName)
  // on l'ajoute au lastArbres[0] (toutes les ressources sésamath)
  var def = getArbreDefaultValues(xmlName, arbre.titre)
  log(def)
  lastArbres[0].enfants.push(def)
  log('splitOrNotToSplit bis ' +xmlName)
  // si manuel ou cahier on ajoute à lastArbres[1] (tous les manuels)
  //if (/^Manuel/.test(xmlName) || /^Cahier/.test(xmlName)) {
  //  lastArbres[1].push(getArbreDefaultValues(xmlName, arbre.titre))
  //}

  if (needToSplit(xmlName)) {
    log("split " +xmlName)
    // faudra l'ajouter (sans populate),
    idsNoPopulate[xmlName] = true
    // mais une fois que ces enfants auront été enregistrés (pour que l'api nous donne les bons id)
    var root = getArbreDefaultValues(xmlName, arbre.titre)
    // pour stocker des idOrigine qui serviront à récupérer les oid des children quand il auront été enregistrés
    root.idOrigineEnfants = []

    var num = 0
    // on découpe en branches
    arbre._children.forEach(function (branche) {
      num++
      if (branche.tag !== 'd') return common.addError(xmlName, "doit être découpé mais on a trouvé un " + branche.tag +" à la racine")
      var file = xmlName +'.part' + num
      root.idOrigineEnfants.push(file)
      if (branche.attrib.n) {
        branche.titre = branche.attrib.n
        delete branche.attrib.n
      } else {
        common.addError(file, 'sans titre')
        branche.titre = file
      }
      // on envoie cette branche
      convertAndPush(branche, file)
    })
    // faudra l'enregistrer après ses enfants
    log('push ' +xmlName +' dans lastArbres')
    lastArbres.push(root)
  } else {
    log("not split " +xmlName)
    convertAndPush(arbre, xmlName)
  }
}

/**
 * Converti un arbre en ressource à poster (qu'on passe à common.pushRessource)
 * @param arbre
 * @param xmlName
 */
function convertAndPush(arbre, xmlName) {
  var ressource = getArbreDefaultValues(xmlName, arbre.titre)
  ressource.typePedagogiques = ressConf.categoriesToTypes[arbreCateg].typePedagogiques
  ressource.typeDocumentaires =ressConf.categoriesToTypes[arbreCateg].typeDocumentaires
  ressource.enfants = getEnfants(arbre, xmlName)
  common.pushRessource(ressource)
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
        common.addError(xmlName, "dossier sans titre, n° d'ordre " +child._id)
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
        if (child.tag == 'em') enfant.origine = 'em'
        else if (child.tag == 'am') enfant.origine = 'am'
        else enfant.origine = defaultOrigine
        // on vérifie qu'il a pas d'enfants
        if (child._children.length) common.addError(xmlName, "L'élément " +child.tag +" a des enfants, n° d'ordre " +child._id)
      } else {
        common.addError(xmlName, "élément " +child.tag +" sans id , n° d'ordre " +child._id)
        enfant = undefined
      }
    }

    if (enfant) enfants.push(enfant)
  })

  return enfants
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
  process.on('SIGTERM', common.displayResult);
  process.on('SIGINT', common.displayResult);

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
          //lastArbres.push(lastArbres.shift())
        } else {
          // faut virer les 2 premiers
          lastArbres.shift()
          //lastArbres.shift()
        }
        log('On traite les ' +lastArbres.length +' ressources de lastArbres')
        // on remplace par des ids
        if (lastArbres.length) {

          lastArbres.forEach(function (root) {
            log("traitement de " +root.idOrigine)
            // faut récupérer les ids des idOrigine de chaque branche
            flow(root.branches).seqEach(function (idOrigine) {
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
                  common.addError(idOrigine, 'info de la branche pas récupérée')
                  log('à la place de ' + idOrigine + ' on récupère', error ? error.stack : ressource)
                }
                nextSeq()
              })
            }).seq(function () {
              // tous les enfants ont été récupérés
              delete root.branches
              root.idOrigine = root.idOrigine.replace('.xml', '') // on vire le suffixe pour la racine de ces arbres
              common.setAfterAllCb(this)
              common.pushRessource(root, true)

            }).seq(function () {
              log("fin du traitement de " +root.idOrigine)
              this()

            }).catch(function (error) {
               common.addError(root.idOrigine, 'seq a planté pendant la récup des ids des branches : ' +error.toString())
            })
          }) // lastArbres.forEach

        } else {
          this()
        }

      }).seq(function () {
        common.displayResult()

      }).catch(function (error) {
        log('Erreur dans le flow :', error);
        common.displayResult()
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
