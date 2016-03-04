/**
 * Ce script passe en revue les ressources (dans la base) pour vérifier que les id sont uniques
 */
'use strict'

var fs = require('fs')
var moment = require('moment')
var flow = require('an-flow')
var tools = require('../app/tools')

var common = require('./modules/common')
var log = common.log // jshint ignore:line
var logfile = './logs/checkArbres.log'

/**
 * Log une erreur
 * @param msg
 */
function logError (msg) {
  msg = '[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] ' + msg + '\n'
  writeStream.write(msg)
  log(msg)
}

/**
 * Retourne une chaine qui résume l'arbre (oid, origine/idOrigine titre)
 * @param arbre
 * @return {string}
 */
function getResume (arbre) {
  return arbre.oid + ' ' + arbre.origine + '/' + arbre.idOrigine + ' ' + arbre.titre
}

/**
 * Vérifie que toutes les ref des enfants existent
 * @param arbre
 * @param next
 */
function checkArbre (arbre, next) {
  var idArbre = arbre.oid ? getResume(arbre) : lastArbre + ' > ' + arbre.titre
  if (arbre.enfants && arbre.enfants instanceof Array) {
    flow(arbre.enfants).seqEach(function (enfant) {
      var nextEnfant = this
      var ref = enfant.ref || enfant.oid
      if (ref) {
        common.getRessource(ref, function (ressource) {
          if (ressource) {
            if (ressource.oid === ref) log(ref + ' OK')
            else if (ref === ressource.origine + '/' + ressource.idOrigine === ref) log(ref + ' OK (combinée')
          } else {
            logError('KO ' + ref + " n'existe pas (était dans l'arbre " + idArbre + ') ' + tools.stringify(ressource))
          }
          nextEnfant()
        })
      } else if (enfant && enfant.enfants) {
        checkArbre(enfant, nextEnfant)
      } else {
        logError('KO, on a un enfant sans oid ni enfants : ' + tools.stringify(enfant))
        nextEnfant()
      }
    }).seq(function () {
      next()
    }).catch(function (error) {
      logError('KO, erreur dans le flux enfant', error)
    })
  } else {
    logError('KO, arbre sans enfants ' + idArbre)
    next()
  }
}

/**
 * Récupère nb arbres et appelle checkArbre sur chacun
 * @param start
 * @param next
 */
function getPaquet (start, next) {
  var qsOptions = {
    filters: [
      {index: 'type', values: ['arbre']}
    ],
    orderBy: 'oid',
    start: start,
    nb: nb
  }
  common.getListe(qsOptions, function (error, liste) {
    if (error) log(error)
    else {
      flow(liste).seqEach(function (arbre) {
        lastArbre = arbre.oid + ' ' + arbre.origine + '/' + arbre.idOrigine + ' ' + arbre.titre
        log("Analyse de l'arbre " + lastArbre)
        checkArbre(arbre, this)
      }).seq(function () {
        if (liste.length === nb) getPaquet(start + nb, this)
      }).seq(function () {
        next()
      }).catch(function (error) {
        logError('Erreur dans le flux arbres', error)
      })
    }
  })
}

/**
 * MAIN
 */
// on vire node et ce fichier passé en 1er arg
var argv = process.argv.slice(2)
// on peut préciser un ou des nom(s) de fichier
if (argv[0] === '--log') {
  logfile = argv[1]
}
var writeStream = fs.createWriteStream(logfile, {'flags': 'a'})

var nb = 25
var lastArbre

getPaquet(0, function () {
  log('FIN')
})
