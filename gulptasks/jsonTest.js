/**
 * Ce script passe en revue les ressources de Labomep,
 * soit la table PERSOS (origine = labomepPERSOS),
 * soit BIBS (origine = labomepBIBS)
 * l'origine est donc commune à toutes les ressources traitées par le script
 */
'use strict';

var uri = '/api/public/by'
var objToPost = {
  filters : [{
      index:'origine',
      values:['sesamath']
  }],
  orderBy : "idOrigine",
  order : "desc",
  nb:2,
  start:1,
  full:true
}

// var _ = require('underscore')._
var request = require('request')
var moment = require('moment')
var flow   = require('seq')

// conf de l'appli
var serverConf = require('../_private/config');
var port = serverConf.server && serverConf.server.port || 3000;

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
 * @param uri
 * @param obj
 */
function postJson(uri, obj, next) {
  var options = {
    url : 'http://localhost:' +port +uri,
    json: true,
    content_type: 'charset=UTF-8',
    form: obj
  }
  request.post(options, function (error, response, body) {
    if (error) log('Erreur ' +error)
    else log('La réponse ', body)
    next()
  })
}

module.exports = function () {
  // yapluka
  flow()
      .seq(function () {
        postJson(uri, objToPost, this)
      })
      .seq(function () {
        log('END')
        process.exit()
      })
}
