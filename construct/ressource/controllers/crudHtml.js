'use strict';

/**
 * Transforme une entité ressource en objet pour la vue describe
 * @param {Ressource} ressource
 * @param {Boolean} avecJointure passer true si on veut aussi les titres des ressources liées, les noms des auteurs, etc.
 * @returns {Object} La ressource, avec pour chaque champ les propriétés title et value
 */
function ressourceToDustPage(ressource, avecJointure) {
  var data = {};
  var buffer;
  // on boucle sur les propriétés que l'on veut afficher
  _.each(configRessource.labels, function (label, key) {
    var value = ressource[key];
    data[key] = {
      title: label
    };
    if (_.isArray(value)) {
      if (configRessource.listes[key]) {
        // faut remplacer des ids par des labels
        buffer = [];
        _.each(value, function(id) {
          if (configRessource.listes[key][id])  buffer.push(configRessource.listes[key][id])
          else log.error("La ressource " + ressource.oid + " a une valeur " + id +
              " pour la propriété " + key + " qui n'est pas dans la liste");
        });
      } else {
        buffer = value;
      }
      data[key].value = buffer.join(', ');


    } else if (_.isBoolean(value)) {
      data[key].value = value ? 'oui' : 'non';
    } else {
      data[key].value = value;
    }
  }); // fin each propriété

  return data;
}

/**
 * Transforme un objet ressource en qqchose que la vue pourra digérer
 *
 * On ajoute ici de la logique d'affichage avec des attributs html qui n'ont pas forcément
 * grand chose à faire dans un contrôleur (bien que pour required ou readonly ça se justifie, pour les attribut
 * name des input aussi) mais c'est plus simple et lisible en js qu'en dust.
 *
 * Un dust helper (transformer) aurait peut-être été plus propre, on verra plus tard si c'est faisable
 * @param ressource
 * @returns {Object} L'objet qui sera retourné à la vue, chaque propriété contient
 * id       : le nom de la propriété (pour attr html, le tpl dust ajoutera un préfixe)
 * label    : Le nom à afficher pour la propriété
 * value    : La valeur de l'input text ou textarea
 * name     : attr html (sauf choix multiple)
 * unique   : true ou absent (select à la place de checkboxes)
 * readonly : true ou absent
 * choices.name : si unique, pour le select
 * choices = [{
 *   name
 *   label
 *   value
 * }]
 *
 */
function ressourceToDustForm(ressource) {
  var data = {};
  // on boucle sur les propriétés déclarées dans config pour récupérer les labels
  _.each(configRessource.labels, function (label, key) {
    var value = ressource[key];
    var isUnique = configRessource.uniques[key];

    // pour tout le monde
    data[key] = {
      id   : key, // le template ajoutera un préfixe de son choix
      label: label
    };

    // c'est un tableau ou une valeur unique (donc prise dans une liste => select ou checkboxes)
    if (_.isArray(value) || configRessource.uniques[key]) {
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans configRessource.prop
      if (isUnique) {
        value = [value]; // arrayToDust veut un array
        // faut ça sur le select et pas les choices
        data[key].name = key;
      }
      data[key].choices = arrayToDust(key, value, isUnique);

    } else if (_.isBoolean(value)) {
      // checkbox tout seul (pas de label, c'est le parent qui le porte)
      data[key].choices = [{
        name: key,
        value: [value]
      }]

    } else {
      // propriété scalaire => input ou textarea
      data[key].name = key;
      if (_.isDate(value)) {
        value = moment(value).format(configRessource.formats.jour);
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
  // on boucle sur les éléments de la liste
  _.each(configRessource.listes[key], function (label, cbValue) {
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
  log.dev('dans postToRessource on récupère', data)
  //log.dev('ressource vide', ressource)
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
          buffer = moment(data[key], configRessource.formats.jour, true);
          if (buffer.isValid()) {
            ressource[key] = new Date(buffer); // pb car _.isDate(buffer) renvoie false !
            log.dev("type moment " + typeof buffer + _.isDate(buffer))
          } else {
            errors.push("Le champ " + configRessource.labels[key] +
                " n'est pas une date valide (" + configRessource.formats.jour +')');
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

  // if (errors !== []) { // ce truc est toujours vrai !
  if (!_.isEmpty(errors)) {
    log.dev('errors à la fin postToRessource', errors)
    throw new Error("Les erreurs de validation .\n" + errors.join("\n"));
  }

  return ressource;
}

/**
 * embed : Voir la ressource sans fioriture autour (pour insertion en iframe)
 * @todo à implémenter, dans un controleur séparé si trop compliqué de changer le template de base ici
 */
function getEmptyFormData() {
  var Ressource = lassi.entity.Ressource;
  var newRessource = Ressource.create();
  return ressourceToDustForm(newRessource);
}


var controller = lassi.Controller('ressource');
var configRessource = require('../config.js');
var moment = require('moment');
var flow = require('seq');

controller.respond('html');

/**
 * On ajoute nos 4 méthodes CRUD (Create, Read, Update, Delete), avec 2 méthodes read suivant que
 * l'on veut voir la ressource (display ou embed) ou sa description (describe)
 */

/**
 * describe : Voir les propriétés de la ressource
 */
controller
    .Action('describe/:id')
    .renderWith('describe')
    .do(function () {
      var id, ressource, compRessource;
      try {
        id = this.arguments.id;
        if (!id || parseInt(id) != id) throw new Error("Identifiant de ressource incorrect (" + id + ")");
        ressource = lassi.ressource.get(id);
        /* compRessource = lassi.ressource; // le Component, pas entity
        ressource = compRessource.get(oid); */
        if (!ressource) throw new Error("La ressource " + id + " n'existe pas");

        return ressourceToDustPage(ressource);

      } catch (e) {

        return {error: e.toString()}
      }
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
 * Create, le form de saisie
 */
controller
  .Action('add')
  .via('get', 'post')
  .renderWith('form')
// ajouter ici un meta pour ajouter le js client qui va conditionner les types à la catégorie
  .do(function () {
    var data, compRessource, context;
    if (this.method === 'get') {
      return getEmptyFormData();
    } else {
      // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
      // et rediriger vers le describe ou vers le form avec les erreurs
      log.dev('post dans add', this.post);
      compRessource = lassi.ressource; // le Component, pas entity
      try {
        data = postToRessource(this.post);
        context = this;
        flow()
            .seq(function() {
              var seqContext = this;
              // il validera avant d'enregistrer
              compRessource.add(data, function (error, ressource) {
                if (error) throw error;
                log.dev("Après le save on récupère l'id " + ressource.id);
                context.redirect(lassi.action.ressource.describe, {id: ressource.id});
                // ici on doit pas rendre la main ! (sinon il lance un rendu vide avant d'avoir reçu le redirect)
                seqContext();
              });
            });
      } catch (error) {
        log.dev("dans add (post html) on a l'erreur", error.toString());
        data = this.post;
        data = getEmptyFormData();
        data.errors = [error.toString()];
        return data;
      }
    }
    log.dev("fin du do add");
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
