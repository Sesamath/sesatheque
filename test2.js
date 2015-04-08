/**
 * Script de test pour tout et n'importe quoi
 */
'use strict';

//var flow = require('seq')
var flow = require('seq')
var moment = require('moment')

var tab1 = ['un', 'deux', 'trois']
var delay = 20

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 */
function log(msg) {
  var prefix = '[' +moment().format('HH:mm:ss.SSS') +'] '
  console.log(prefix + msg)
}

flow(tab1).seqEach(function (elt) {
  log('étape 1 avec ' +elt)
  var that = this
  setTimeout(function () {
    log('dans async avec ' +elt)
    that(elt +'-mod')
    log('toujours dans async ' +elt)
    // console.log(that) // c'est bien l'objet seq
  }, delay)
}).seq(function (result) {
  log('on récupère ' +JSON.stringify(result))
}).seq(function () {
  log('dernière étape')
}).catch(function (error) {
  log('Erreur dans le flow \n' +(error.stack || error))
})
log('on est sorti du flux')
