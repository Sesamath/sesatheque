/**
 * OBSOLETE
 * Ce script passe en revue les ressources j3p de l'ancienne bibli (symfony) qu'Alexis avait complété à la main
 * Il est remplacé par gulptasks/importJ3pViaXml.js qui parse le xml, récupère les infos de BIBS
 * et complète éventuellement avec oldbibli
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
var request = require('request')
var moment = require('moment')
var flow   = require('seq')

// conf des ressources
var config = require('../construct/ressource/config.js');

// constantes
var tdCode = config.constantes.typeDocumentaires;
var tpCode = config.constantes.typePedagogiques;
var catCode = config.constantes.categories;

// databases
var dbConfigOldBibli = require(__dirname + '/../_private/config/oldbibli');
// les connexions aux bases
var kOldBibli = knex(dbConfigOldBibli);

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
  var ressource = {
    titre            : row.titre,
    origine          : 'oldBibli',
    idOrigine        : row.id,
    typeTechnique    : 'j3p',
    resume           : row.resume || '',
    description      : row.description || '',
    commentaires     : row.commentaire || '',
    parametres       : row.options,
    langue           : 'fre',
    publie           : true,
    restriction      : 0
  }
  addCatExoInteractif(ressource)
  idsParsed.push(ressource.idOrigine);
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
    var fs = require('fs')
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
  log('task ' + __filename);
  var query

  // les 3 premiers args sont node, /path/2/gulp, nomDeLaTache
  var argv = process.argv.slice(3)
  if (argv[0] === '--purge') {
    log('On vire toutes les ressources j3p existantes')

    query = "DELETE ressource, ri2 FROM ressource_index ri INNER JOIN ressource USING(oid)" +
        " INNER JOIN ressource_index ri2 USING(oid)" +
        " WHERE ri.name = 'typeTechnique' AND ri._string = 'j3p'";
    var dbConfigBibli = require(__dirname + '/../_private/config');
    var kBibli = knex(dbConfigBibli.entities.database);
    flow()
      .seq(function () {
        var next = this
        kBibli
            .raw(query)
            .exec(function(error, rows) {
              if (error) throw error
              // la suite est jamais affichée :-/ (mais suffit de passer une fois la requete ci-dessus à la main)
              else {log('retour', rows); next() }
            })
      })
      .seq(function () {
        log('Ressources j3p purgées')
      })
      .catch(function (error) {
        log('Erreur dans la purge j3p :', error);
      })
    process.exit(0)
  }

  query = "SELECT id, titre, resume, description, commentaires, version, options FROM Ressource" +
      " WHERE typeTech_id = 'j3p'"

  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', displayResult);
  process.on('SIGINT', displayResult);

  // yapluka
  flow()
      .seq(function () {
        nextStep = this
        kOldBibli
            .raw(query)
            .exec(function(error, rows) {
              if (error) throw error
              if (rows[0]) rows[0].forEach(parseRessource)
              else log("Pas de ressources avec " +query)
            })
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
