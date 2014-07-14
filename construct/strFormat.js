/**
 * Des méthodes de formatage de string
 */
var util = require('util')

/**
 * Incorpore des arguments à un message, façon sprintf
 * pas très intéressant si n arguments, util.format fait la m
 * @param message
 * @param args Les arguments, en liste ou en tableau
 * @returns {*}
 */
module.exports = function strFormat(message, args) {
  if (_.isArray(args)) {
    // faut ajouter message en 1er argument et le passer à util.format
    return util.format.apply(null, args.unshift(message));
  } else {
    // pas la peine de bosser pour rien
    if (arguments.length < 2) return message
    // on transmet tel quel
    return util.format.apply(null, arguments);
  }
}
