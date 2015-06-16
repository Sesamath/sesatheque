/**
 * Ce script envoie les profils/*.json vers la bibli et construit le labomep_all
 */
'use strict';

// var _ = require('lodash')
var request = require('request')
var moment = require('moment')
var fs = require('fs')
var flow = require('seq')

var common = require('./modules/common')
var log = common.log // jshint ignore:line

// conf de l'appli
var serverConf = require('../_private/config')
var urlBibli = 'http://'
urlBibli += serverConf.$server && serverConf.$server.hostname || 'localhost'
urlBibli += ':'
urlBibli += serverConf.$server && serverConf.$server.port || '3000'

/** Les enfants que l'on mettra dans sesamath-labomep_all.json */
var allEnfants = []
/** Les ids origine/idOrigine que l'on a déjà mis */
var allEnfantsIds = {}

// en cas d'interruption on veut le résultat quand même
process.on('SIGTERM', function () {
  common.displayResult()
})
process.on('SIGINT', function () {
  common.displayResult()
})

var jsonFiles = []
// on va chercher les json du dossier json
var jsonDir = __dirname +'/profils'

// on récupère tous les fichiers
fs.readdirSync(jsonDir).forEach(function (file) {
  // ça tombe bien, all sera le 1er de la liste alphabétique,
  // ça permet de gérer l'ordre d'affichage en le modifiant manuellement
  if (/sesamath-labomep_[a-z]+\.json/.exec(file)) {
    jsonFiles.push(file)
  }
})

var fluxFile = flow(jsonFiles)
common.setAfterAllCb(fluxFile)
fluxFile.seqEach(function (file) {
  var next = this
  log('analyse de ' + file)
  fs.readFile(jsonDir +'/' +file, function (error, jsonString) {
    try {
      if (error) throw error
      var arbre = JSON.parse(jsonString)
      arbre.enfants.forEach(function (enfant) {
        var id = enfant.origine + '/' + enfant.idOrigine
        if (!allEnfantsIds[id]) {
          allEnfants.push(enfant)
          allEnfantsIds[id] = true
        }
      })
      common.deferRessource(arbre)
      next()
    } catch (error) {
      log(file + " ne contient pas de json valide : " + error.toString())
      next()
    }
  })
}).seq(function () {
  common.checkEnd(this)
}).seq(function () {
  log('tout semble terminé, on peut poster labomep_all')
  var labomep_all = {
    "titre": "Ressources Sésamath",
    "resume": "Liste des arbres affichables dans le panneau « Ressources Sésamath » de Labomep",
    "typeTechnique": "arbre",
    "categorie": 8,
    "publie": true,
    "restriction": 0,
    "indexable": true,
    "origine": "sesamath",
    "idOrigine": "labomep_all",
    "enfants": allEnfants
  }
  // on écrit le fichier
  fs.writeFileSync(jsonDir +'/sesamath-labomep_all.json', JSON.stringify(labomep_all, undefined, 2))
  // on l'envoie
  common.addRessource(labomep_all, this)
}).seq(function () {
  log('fin')
  common.displayResult()
}).catch(function (error) {
  log('Erreur dans le flux :', error)
  common.displayResult()
})