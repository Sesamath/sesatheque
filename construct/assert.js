/**
 * Nos fonctions de vérification d'intégrité.
 *
 * Toutes lancent une exception en cas de pb et ne renvoient rien sinon
 * (erreur en anglais car destiné au dev,le code pourra les intercepter pour les logger
 * et afficher des messages localisés)
 */
'use strict';

var _ = require('underscore')._;

/**
 * Vérifie que c'est bien une callback qui prend au moins 2 arguments
 * @param next
 * @throws {Error} sinon
 */
function nextOk(next) {
  if (!_.isFunction(next)) throw new Error('next must be a function');
  if (next.length < 2) throw new Error('next must have at least two arguments');
}

module.exports = {
  nextOk : nextOk
};
