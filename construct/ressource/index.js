'use strict';
/**
 * Component ressource
 */

var _ = require('underscore')._
var moment = require('moment')
var config = require('./config.js')

/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 * @constructor
 */
var ressourceComponent = lassi.Component();
ressourceComponent.initialize = function(next) {
  this.application.settings.ressource = require('./config.js');
  next();
}

// On ajoute toutes les methodes du repository à notre component
var ressourceRepository = require('./repository.js');
_.each(ressourceRepository, function(method, name) {
  // log.dev('ajoute au component ressource la méthode ' + name)
  ressourceComponent[name] = method;
});

/**
 * Parcours récursivement tab et remplace toutes les chaînes représentant des entiers en entiers
 * @param {Array} tab
 * @returns {Array} Le tableau modifié
 */
function integerify(tab) {
  tab.forEach(function (value) {
    var i
    if (_.isArray(value)) value = integerify(value)
    else {
      i = parseInt(value, 10)
      if (value == i) value = i
    }
  });

  return tab
}

// et ces méthodes communes à plusieurs contrôleurs

/**
 * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
 * @param data
 * @return {Ressource}
 * @throws {Error} En cas de données invalides
 */
ressourceComponent.getRessourceFromPost = function (data) {
  var ressource = lassi.entity.Ressource.create();
  var errors = [];
  var buffer;
  var msg;
  //log.dev('dans getRessourceFromPost on récupère', data)
  if (_.isEmpty(data)) {
    errors.push("Ressource vide");
  } else {
    if (data.ressource) {
      // on nous envoie tout en json
      try {
        data = JSON.parse(data.ressource)
      } catch (e) {
        throw e // pas la peine d'insister
      }
      log.dev("On nous a envoyé une ressource en json", data)
    }
    // si la ressource précédende avait des erreurs

    // vérif présence et type
    _.each(config.typesVar, function (typeVar, key) {
      var value = data[key]

      // propriétés obligatoires
      if (_.isEmpty(value) && config.required[key]) {
        errors.push("Le champ " + config.labels[key] + " est obligatoire");
      }

      // les cast
      if (value) {

        if (typeVar === 'String') {
          if (_.isString(value)) {
            ressource[key] = value;
          } else {
            errors.push("Le champ " + config.labels[key] + " n'est pas une chaine de caractères");
          }

        } else if (typeVar === 'Date') {
          if (value == parseInt(value, 10)) {
            // timestamp
            var ts = value
            if (ts < 11001001001) ts = ts * 1000 // c'était des s, on passe en ms
            // 11001001001 est arbitraire, correspond à 1970 en ms et 2318 en s)
            buffer = moment(new Date(ts), config.formats.jour, true);
          } else {
            // une string, on impose d'abord un parsing strict d'après notre format
            buffer = moment(value, config.formats.jour, true);
            // mais aussi un formatage ISO standart (pour l'api), http://momentjs.com/docs/#/parsing/string/
            if (!buffer.isValid) buffer = moment(value)
          }
          if (buffer.isValid()) {
            // faut repasser la sortie de moment au constructeur de date pour avoir une vraie date js
            ressource[key] = new Date(buffer); // pb car _.isDate(buffer) renvoie false !
          } else {
            // moment est censé faire ça pour les dates qu'il ne reconnait pas, mais dans ce cas isValid reste false
            // et on sait pas trop ce qu'il renvoie
            buffer = Date.parse(value)
            if (buffer > 0) ressource[key] = new Date(buffer);
            else errors.push("Le champ " + config.labels[key] +' vaut ' +value +
                " qui n'est pas une date valide (" + config.formats.jour +')');
            log.dev('buffer en dernier recours', buffer)
          }

        } else if (typeVar === 'Number') {
          ressource[key] = parseInt(value, 10);

        } else if (typeVar === 'Boolean') {
          ressource[key] = !!value;

        } else if (typeVar === 'Array') {
          // l'api peut nous envoyer une string "[1,2]"
          if (_.isString(value) && value.substr(0,1) === '[' && value.substr(-1) === ']') {
            try {
              buffer = JSON.parse(value)
              value = buffer // c'était du json valide
            } catch (e) { /* on laisse faire la suite sans modifier value */ }
          }

          if (_.isArray(value)) {
            ressource[key] = integerify(value)
          } else {
            errors.push("Le champ " + config.labels[key] + " n'est pas une liste");
          }

        } else if (typeVar === 'Object') {
            if (_.isString(value)) {
              try {
                ressource[key] = JSON.parse(value);
              } catch (e) {
                errors.push("Le champ " + config.labels[key] + " n'est pas du json valide : " + e.toString());
                log.dev('pb parsing', value)
              }
            }
            else
              if (_.isObject(value)) ressource[key] = value
              else errors.push("Le champ " + config.labels[key] + " est invalide : ");
        } else {
          msg = "Le champ " + config.labels[key] + " est d'un type non prévu (" +typeVar +')';
          errors.push(msg);
          log.error(msg);
        }
      } // cast

    });
    // faut ajouter l'oid s'il existe
    if (data.oid) ressource.oid = data.oid;
  }

  // if (errors !== []) { // ce truc est toujours vrai !
  if (errors.length) {
    log.dev('errors à la fin getRessourceFromPost', errors)
    ressource.errors = errors
  }

  return ressource;
}


// et on l'exporte
module.exports = ressourceComponent;
