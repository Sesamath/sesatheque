'use strict';

var controller = lassi.Controller('ressource');
var configRessource = require('../config.js');
var moment = require('moment');

/**
 * Transforme un objet ressource en qqchose que la vue pourra digérer
 *
 * On ajoute ici de la logique d'affichage avec des attributs html qui n'ont pas forcément
 * grand chose à faire dans un contrôleur (bien que pour required ou readonly ça se justifie, pour les attribut
 * name des input aussi) mais c'est plus simple et lisible en js qu'en dust.
 *
 * Un dust helper (transformer) aurait peut-être été plus propre, on verra plus tard si c'est faisable
 * @param ressource
 * @returns {Object} L'objet qui sera retourné à la vue
 */
function ressourceToDustForm(ressource) {
  var data = {};
  // on commence par récupérer toutes les propriétés scalaires telles quelles
  _.each(configRessource.labels, function (label, key) {
    var value = ressource[key];
    var isUnique;

    if (key === '_entity') return;
    data[key] = {
      id   : key, // le template ajoutera un préfixe de son choix
      label: label
    };
    // c'est un tableau ou une valeur unique (donc une liste)
    if (_.isArray(value) || configRessource.uniques[key]) {
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans configRessource.prop
      isUnique = configRessource.uniques[key];
      if (isUnique) value = [value]; // arrayToDust veut un array
      data[key].choices = arrayToDust(key, value, isUnique);
      if (isUnique) {
        // faut ça sur le select et pas les choices
        data[key].name = key;
      }
    } else if (_.isBoolean(value)) {
      // checkbox
      data[key].choices = {
        value: [value]
      }
    } else {
      // propriété scalaire (boolean compris) => input
      data[key].name = key;
      if (_.isDate(value)) {
        value = moment(value).format(configRessource.constantes.formats.jour);
      }
      data[key].value = value;
    }
  }); // fin each propriété
  // on ajoute nos cas particulier
  data.oid.readonly = true;
  data.version.readonly = true;
  data.categories.required = true;
  data.langue.unique = true;

  return data;
}

/**
 * Créé les infos pour une liste de choix dans dust
 * @param key le nom de la propriété de la ressource
 * @param {Array} selectedValues Les valeurs pour cette ressource
 * @param {boolean} isUnique Si c'est un select et pas des checkbox
 *                           (dans ce cas on ajoute pas de propriété name sur chaque choix)
 * @returns {Array}
 */
function arrayToDust(key, selectedValues, isUnique) {
  var choices = [];
  var i = 0;
  _.each(configRessource[key], function (label, cbValue) {
    var choice = {
      label: label,
      value: cbValue
    };
    if (!isUnique) {
      // faut du name sur chaque checkbox
      choice.name = key + '[' + i + ']';
      i++;
    }
    // et on ajoute les selected s'il y en a
    if (selectedValues) {
      // verif type
      if (!_.isArray(selectedValues)) {
        throw new Error("La propriété " + key + " de la ressource n'est pas un tableau");
      }
      if (selectedValues.indexOf(cbValue) > -1) {
        choice.selected = true;
      }
    }
    choices.push(choice);
  });

  return choices;
}

/**
 * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
 * @param data
 * @return {Ressource}
 */
function postToRessource(data) {
  var Ressource = lassi.entity.Ressource;
  var ressource = Ressource.create();
  var errors = [];
  var buffer;
  var msg;
  log.dev('dans postToRessource', data)
  if (_.isEmpty(data)) {
    errors.push("Ressource vide");
  } else {
    // vérif présence et type
    _.each(configRessource.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(data[key]) && configRessource.required.indexOf(key) > -1) {
        errors.push("Le champ " + configRessource.labels[key] + " est obligatoire");
      }
      // les cast
      if (data[key]) {
        if (typeVar === 'String') {
          if (_.isString(data[key])) {
            ressource[key] = data[key];
          } else {
            errors.push("Le champ " + configRessource.labels[key] + " n'est pas une chaine de caractères");
          }
        } else if (typeVar === 'Date') {
          buffer = moment(data[key], configRessource.constantes.formats.jour, true);
          if (buffer.isValid()) {
            ressource[key] = new Date(buffer); // pb car _.isDate(buffer) renvoie false !
            log.dev("type moment " + typeof buffer + _.isDate(buffer))
          } else {
            errors.push("Le champ " + configRessource.labels[key] +
                " n'est pas une date valide (" + configRessource.constantes.formats.jour +')');
          }
        } else if (typeVar === 'Number') {
          ressource[key] = parseInt(data[key], 10);
        } else if (typeVar === 'Boolean') {
          ressource[key] = !!data[key];
        } else if (typeVar === 'Array') {
          if (_.isArray(data[key])) {
            _.each(data[key], function (value) {
              // tous nos tableaux sont des tableaux d'entiers
              ressource[key].push(parseInt(value, 10));
            });
          } else {
            errors.push("Le champ " + configRessource.labels[key] + " n'est pas une liste");
          }
        } else if (typeVar === 'Object') {
          try {
            ressource[key] = JSON.parse(data[key]);
          } catch (e) {
            errors.push("Le champ " + configRessource.labels[key] + " n'est pas du json valide : " + e.toString());
          }
        } else {
          msg = "Le champ " + configRessource.labels[key] + " est d'un type non prévu (" +typeVar +')';
          errors.push(msg);
          log.error(msg);
        }
      }
    });
  }

log.dev('errors à la fin postToRessource', errors)
  if (!_.isEmpty(errors)) {
    throw new Error(errors.join("\n"));
  }
  return ressource;
}

/**
 * Idem, mais sans les ids ni tous les possibles, seulement les valeurs des champs selectionnés
 * @param ressource
 * @returns {Object} La ressource, avec pour chaque champ les propriétés title et value
 */
function ressourceToDustPage(ressource) {
  var data;
  // on commence par récupérer toutes les propriétés scalaires telles quelles
  _.each(ressource, function (value, key) {
    data[key] = {
      title: configRessource.labels[key]
    };
    if (_.isArray(value) && configRessource[key]) {
      data[key].value = [];
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans configRessource.prop
      // on remplace juste les id par leur valeur
      value.forEach(function (id) {
        if (configRessource[key][id]) {
          data[key].value.push(configRessource[key][id]);
        } else {
          // @todo gérer un app.error.log
          log.error("La ressource " + ressource.oid + " a une valeur " + val + " pour la propriété " + key + " qui n'est pas dans la liste autorisée.");
        }
      });
    } else if (_.isBoolean(value)) {
      data[key].value = value ? 'oui' : 'non';
    } else {
      data[key].value = value;
    }
  }); // fin each propriété

  return data;
}

/**
 * Récupère une ressource d'après son oid
 * @param {int} oid
 * @param {String} format form|page|...
 * @returns {Ressource} La ressource, préparée ou pas pour dust suivant format
 */
function getRessource(oid, format) {
  // oid est une fonction ???
  var data;
  var ressource = lassi.entity.Ressource.find({oid: oid});
  if (!ressource || ressource.oid !== oid) {
    data = {
      error: 'La ressource ' + oid + " n'existe pas."
    };
  } else {
    if (format === 'form') {
      data = ressourceToDustForm(ressource);
    } else if (format === 'page') {
      data = ressourceToDustPage(ressource);
    } else {
      data = ressource;
    }
  }

  return data;
}

controller.defineBaseAction().respond('html');

/**
 * On ajoute nos 4 méthodes CRUD (Create, Read, Update, Delete), avec 2 méthodes read suivant que
 * l'on veut voir la ressource (display ou embed) ou sa description (describe)
 */

/**
 * describe : Voir les propriétés de la ressource
 */
controller
  .Action('describe/:oid')
  .do(function (oid) {
    return getRessource(oid, 'page');
  });

/**
 * display : Voir la ressource
 */
controller
  .Action('display/:oid')
  .do(function (oid) {
    return getRessource(oid, 'page');
  });

/**
 * embed : Voir la ressource sans fioriture autour (pour insertion en iframe)
 * @todo à implémenter, dans un controleur séparé si trop compliqué de changer le template de base ici
 */
function getEmptyFormData() {
  var Ressource = lassi.entity.Ressource;
  var newRessource = Ressource.create();
  return ressourceToDustForm(newRessource);
}

/**
 * Create, le form de saisie
 */
controller
  .Action('add')
  .via('get', 'post')
  .useView('form')
// ajouter ici un meta pour ajouter le js client qui va conditionner les types à la catégorie
  .do(function () {
    var data, compRessource, oid;
    if (this.method === 'get') {
      return getEmptyFormData();
    } else {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      log.dev('post dans add', this.post);
      compRessource = lassi.ressource; // le Component, pas entity
      try {
        data = postToRessource(this.post);
        log.dev("après cast", data)
        oid = compRessource.add(data); // il valide avant d'enregistrer
        this.response.redirect('describe/' + oid);
      } catch (error) {
        log.dev("dans add (post html) on a l'erreur", error.toString());
        data = this.post;
        data = getEmptyFormData();
        data.errors = [error.toString()];
        return data;
      }
    }
  });

/**
 * Uptate, le form
 */
controller
  .Action('edit/:oid')
  .via('get')
  .do(function (oid) {
    return getRessource(oid, 'form');
  });

/**
 * Update, validation du form et insert
 */
controller
  .Action('update')
  .via('post')
  .do(function () {
    // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
    // et rediriger vers le describe
  });

module.exports = controller;
