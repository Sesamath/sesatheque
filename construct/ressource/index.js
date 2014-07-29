'use strict';

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
  log.dev('dans getRessourceFromPost on récupère', data)
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

    // vérif présence et type
    _.each(config.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(data[key]) && config.required[key]) {
        errors.push("Le champ " + config.labels[key] + " est obligatoire");
      }
      // les cast
      if (data[key]) {
        if (typeVar === 'String') {
          if (_.isString(data[key])) {
            ressource[key] = data[key];
          } else {
            errors.push("Le champ " + config.labels[key] + " n'est pas une chaine de caractères");
          }
        } else if (typeVar === 'Date') {
          buffer = moment(data[key], config.formats.jour, true);
          if (buffer.isValid()) {
            ressource[key] = new Date(buffer); // pb car _.isDate(buffer) renvoie false !
            log.dev("type moment " + typeof buffer + _.isDate(buffer))
          } else {
            errors.push("Le champ " + config.labels[key] +
                " n'est pas une date valide (" + config.formats.jour +')');
          }
        } else if (typeVar === 'Number') {
          ressource[key] = parseInt(data[key], 10);
        } else if (typeVar === 'Boolean') {
          ressource[key] = !!data[key];
        } else if (typeVar === 'Array') {
          // l'api peut nous envoyer du "[1,2]"
          if (_.isString(data[key]) && data[key].substr(0,1) === '[' && data[key].substr(-1) === ']') {
            try {
              buffer = JSON.parse(data[key])
              data[key] = buffer // c'était du json valide
            } catch (e) { /* on laisse faire la suite sans modifier data[key] */ }
          }
          if (_.isArray(data[key])) {
            _.each(data[key], function (value) {
              // tous nos tableaux sont des tableaux d'entiers
              ressource[key].push(parseInt(value, 10));
            });
          } else {
            errors.push("Le champ " + config.labels[key] + " n'est pas une liste");
          }
        } else if (typeVar === 'Object') {
          try {
            ressource[key] = JSON.parse(data[key]);
          } catch (e) {
            errors.push("Le champ " + config.labels[key] + " n'est pas du json valide : " + e.toString());
          }
        } else {
          msg = "Le champ " + config.labels[key] + " est d'un type non prévu (" +typeVar +')';
          errors.push(msg);
          log.error(msg);
        }
      }
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
