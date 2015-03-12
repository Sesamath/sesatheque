/**
 * Ce script passe en revue les ressources j3p du xml de labomep regarde dans BIBS les infos
 * si aussi dans oldbibli, on regarde les champs commentaires et description, si vide dans BIBS on prend sinon on ignore
 * (Alexis avait complété ces champs à la main dans l'ancienne bibli symfony)
 */
'use strict';

/** le timestamp en ms du lancement de ce script */
var topDepart = (new Date()).getTime()
/** origine commune à toutes les ressources traitées ici, labomepPERSOS|labomepBIBS */
/** timeout en ms */
var timeout = 10000
/** Nb max de requetes http lancées vers l'api (qq get non pris en compte) */
var maxLaunched = 10

/** pour loguer le processing (un point par ressource sinon) */
var logProcess = true
/** pour loguer les ressources dont le retour est ok */
var logOk = false

var knex = require('knex')
var _ = require('underscore')._
var fs = require('fs')
var request = require('request')
var moment = require('moment')
var flow   = require('seq')
var elementtree = require('elementtree')

// conf des ressources
var config = require('../construct/ressource/config.js')

// la moulinette d'Alexis
var graphe2Json = require('./j3p/convertGraphe2json')

// un log pour détailler les erreurs
var logfile = __filename.replace('gulptasks', 'logs').replace('.js', '.log')
var logStream = fs.createWriteStream(logfile, {'flags': 'a'})

// constantes
var tdCode = config.constantes.typeDocumentaires
var tpCode = config.constantes.typePedagogiques
var catCode = config.constantes.categories

// databases
var dbConfigOldBibli = require(__dirname + '/../_private/config/oldbibli')
var dbConfigLabomep = require(__dirname + '/../_private/config/labomep')
// les connexions aux bases
var kOldBibli = knex(dbConfigOldBibli)
var kLabomep = knex(dbConfigLabomep)

/**
 * On pourrait se contenter d'incrémeter des nombres, mais on enregistre les listes d'id
 * pour les avoir sous la static pour éventuel debug
 */
var idsFound = []
/** ids des ressources traitées ici */
var idsParsed = []
/** ids des ressources sur la pile d'envoi */
var idsToSend = []
/** ids des ressources envoyées */
var idsSent = []
/** ids des ressources avec une réponse de l'api */
var idsResp = []
/** ids des ressources enregistrées par l'api */
var idsOk = []
/** ids des ressources dont l'enregistrement a planté */
var idsFailed = []

/** la liste des erreurs rencontrées (la clé est l'id, 0 pour les erreurs générées ici hors ressource) */
var errors = {}

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
 * Ajoute un message à notre fichier de log, préfixé par le moment
 * @param msg Le message
 */
function log2file(msg) {
  logStream.write('[' +moment().format('YYYY-MM-DD HH:mm:ss') +'] ' +msg +"\n")
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
  }
}

/**
 * Ajoute à la ressource categories, typePedagogiques et typeDocumentaires pour un exo interactif
 * @param ressource
 */
function addCatExoInteractif(ressource) {
    ressource.categories       = [catCode.exerciceInteractif]
    ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation]
    ressource.typeDocumentaires= [tdCode.interactif]
}

/**
 * Convertit un recordset en objet Ressource que l'on pourra poster à l'api
 * @param row
 * @returns {Ressource}
 */
function parseRessource(row) {
  // if (idsParsed.length > 2) return
  //log('parseRessource de ', row)
  var ressource = {
    titre            : row.titre,
    origine          : 'labomepBIBS',
    idOrigine        : String(row.id),
    typeTechnique    : 'j3p',
    resume           : row.resume || '',
    description      : row.description || '',
    commentaires     : row.commentaire || '',
    parametres       : { },
    langue           : 'fre',
    publie           : true,
    restriction      : 0
  }
  idsParsed.push(ressource.idOrigine);
  // on ajoute le graphe qu'il faut transformer
  try {
    var json = graphe2Json(row.graphe);
    ressource.parametres.g = JSON.parse(json)
  } catch (error) {
    addError(ressource.idOrigine, 'graphe invalide : ' +error)
    log2file('graphe de ' +ressource.idOrigine +' invalide : \n' +row.graphe)
    return
  }
  addCatExoInteractif(ressource)
  //log('qui donne', ressource)
  if (logProcess) log('processing ' + ressource.idOrigine)
  deferAdd(ressource)
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
    url : 'http://localhost:3001/api/ressource',
    json: true,
    body: ressource
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
 * Parse un xml (et appelle splitOrNotToSplit avec le résultat)
 */
function parseJ3pXml() {
  var xmlName = 'exercices_interactifs' // sans l'extension
  if (logProcess) log('processing ' + xmlName)
  try {
    var xmlString = fs.readFileSync(__dirname +'/arbresXml/' +xmlName +'.xml').toString();
    var arbre = elementtree.parse(xmlString)
    if (!arbre._root) throw new Error("arbre sans racine")
    if (!arbre._root._children || !arbre._root._children.length) throw new Error("arbre vide")
    // si l'arbre n'a qu'un fils qui est un tag d avec enfants c'est lui qu'on prend comme racine
    if (arbre._root._children.length === 1 && arbre._root._children[0].tag === 'd') {
      if (arbre._root._children[0]._children.length) {
        arbre = arbre._root._children[0]
      } else throw new Error("arbre avec un seul dossier vide")
    } else {
      arbre = arbre._root
    }
    //log(JSON.stringify(arbre))

    return getJ3pIds(arbre)

  } catch (error) {
    addError(xmlName, "le parsing du xml " +xmlName +" a planté : " +error.toString())
  }
}

/**
 * Passe en revue l'objet elementtree issu du xml pour en extraire les ids des tags j3p (récursif)
 * @param {elementtree} arbre
 * @returns {array} Les ids trouvés
 */
function getJ3pIds(arbre) {
  if (arbre.n) {
    log("parsing de la branche xml " +arbre.n)
  }
  var j3pIds = []
  if (arbre._children) arbre._children.forEach(function(child) {
    if (child.tag === 'j3p') {
      if (child.attrib.i) {
        j3pIds.push(child.attrib.i)
      } else {
        addError("élément " +child.tag +" sans id , n° d'ordre " +child._id)
      }
    } else if (child.tag === 'd') {
      j3pIds = j3pIds.concat(getJ3pIds(child))
    }
  })

  return j3pIds
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
    log('erreurs vers '+logfile)
    log(idsFailed.length +' ressources avec erreurs :' +idsFailed.join(', '))
    log2file("Les erreurs d'importation :")
    idsFailed.forEach(function (idOrigine) {
      log(idOrigine +' : ' +errors[idOrigine])
      log2file(idOrigine +' : ' +errors[idOrigine])
    })
    log2file("Fin des erreurs d'importation")
  } else log('Aucune erreur rencontrée')
  log('Durée : ' +getElapsed(topDepart)/1000 +'s')
  if (next) next()
}

/**
 * Efface toutes les ressources j3p
 */
function purgeJ3pAndExit() {
  log('On vire toutes les ressources j3p existantes')

  var query = "DELETE ressource, ri2 FROM ressource_index ri INNER JOIN ressource USING(oid)" +
      " INNER JOIN ressource_index ri2 USING(oid)" +
      " WHERE ri.name = 'typeTechnique' AND ri._string = 'j3p'";
  var dbConfigBibli = require(__dirname + '/../_private/config');
  var kBibli = knex(dbConfigBibli.entities.database);
  flow()
      .seq(function () {
        log('on va lancer la requete de purge')
        var next = this
        kBibli
            .raw(query)
            .exec(function (error, rows) {
              if (error) throw error
              // la suite est jamais affichée :-/ (mais suffit de passer une fois la requete ci-dessus à la static)
              else {
                log('retour', rows);
                next()
              }
            })
      })
      .seq(function () {
        log('Ressources j3p purgées')
        process.exit(0)
      })
      .catch(function (error) {
        log('Erreur dans la purge j3p :', error)
      })
}

function exit(exitCode) {
  var code = exitCode || 0
  logStream.end()
  process.exit(code)
}

module.exports = function () {
  log('task ' + __filename);

  // les 3 premiers args sont node, /path/2/gulp, nomDeLaTache
  var argv = process.argv.slice(3)
  if (argv[0] === '--purge') {
    purgeJ3pAndExit()
  } else {
    // en cas d'interruption on veut le résultat quand même
    process.on('SIGTERM', function () {
      displayResult();
      exit()
    })
    process.on('SIGINT', function () {
      displayResult();
      exit()
    })

    if (argv[0] === '--id') {
      idsFound = argv[1].split(',');
    } else {
      // on parse le xml
      idsFound = parseJ3pXml()
    }
    if (idsFound) {
      idsFound.forEach(function (id) {
        flow()
            .seq(function () {
              var row,
                  query = "SELECT bib_id AS id, bib_titre AS titre, bib_descriptif AS descriptif," +
                      " bib_commentaire AS commentaire, bib_xml AS graphe FROM BIBS"
              nextStep = this
              kLabomep.raw(query +" WHERE bib_id = " + id).exec(function (error, rows) {
                if (error) throw error
                if (rows[0]) {
                  row = rows[0][0]
                  // faut voir si on complète avec les infos de oldBibli
                  if (!row.bib_descriptif || !row.bib_commentaire) {
                    kOldBibli.raw("SELECT description, commentaires FROM Ressource WHERE id = " + id).exec(function (error, rows) {
                      var result
                      if (error) throw error
                      if (rows[0]) {
                        result = rows[0][0]
                        if (result && !row.descriptif && result.description) row.descriptif = result.description
                        if (result && !row.commentaire && result.commentaires) row.commentaire = result.commentaires
                      }
                      else log("Pas de ressources avec " + query)
                    })
                  }
                  parseRessource(row)
                } else log("Pas de ressources dans BIBS d'id " + id)
              })
            })
            .seq(function () {
              displayResult(this)
            })
            .seq(function () {
              log('END')
              exit() // gulp sort pas tout seul s'il reste qq callback dans le vent
            })
            .catch(function (error) {
              log('Erreur dans le flow :', error);
            })
      })
    } else {
      log("Aucune ressource j3p trouvée dans le xml")
    }
  }
}
