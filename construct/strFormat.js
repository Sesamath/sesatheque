/**
 * Des méthodes de formatage de string
 */
var util = require('util')
var _ = require('underscore')._

/**
 * Incorpore des arguments à un message, façon sprintf
 * pas très intéressant si n arguments, util.format fait la m
 * @param message
 * @param args Les arguments, en liste ou en tableau
 * @returns {*}
 */
module.exports = function strFormat(message, args) {
  var retour
  if (_.isArray(args)) {
    // faut ajouter message en 1er argument et le passer à util.format
    retour = util.format.apply(null, args.unshift(message));
  } else {
    // pas la peine de bosser pour rien
    if (arguments.length < 2) retour = message
    // on transmet tel quel
    else retour = util.format.apply(null, arguments);
  }

  return retour
}
