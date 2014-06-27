'use strict';

var editController = lassi.Controller().namespace('ressource');

// console.log(lassi.application); // undefined
var configRessource = require('../config.js');

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
function ressourceToDust(ressource) {
  var data, isUnique;
  // on commence par récupérer toutes les propriétés scalaires telles quelles
  _.each(ressource, function (value, key) {
    data[key] = {
      id:key,
      titre:configRessource.labels[key]
    };
    if (_.isArray(value)) {
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans configRessource.prop
      isUnique = configRessource.uniques[key];
      data[key].choices = arrayToDust(key, value, isUnique);
      if (isUnique) {
        // faut ça sur le select et pas les choices
        data[key].name = key;
      }
    } else {
      // propriété scalaire (boolean aussi) => input
      data[key].name = key;
      data[key].value = value;
    }
  }); // fin each propriété

  // on ajoute nos cas particulier
  data.oid.readonly = true;
  data.categorie.required = true;
  data.langue.unique = true;

  return data;
}

/**
 * Créé les infos pour une liste de choix dans dust
 * @param key le nom de la propriété de la ressource
 * @param selectedValues Les valeurs pour cette ressource
 * @param {boolean} isUnique Si c'est un select et pas des checkbox
 *                           (dans ce cas on ajoute pas de propriété name sur chaque choix)
 * @returns {Array}
 */
function arrayToDust(key, selectedValues, isUnique) {
  var choices = [];

  _.each(configRessource[key], function (label, cbValue) {
    var choice = {
      label: label,
      value: cbValue
    };
    if (!isUnique) {
      choice.name = key + '[' + cbValue + ']';
    }
    // et on ajoute les selected s'il y en a
    if (selectedValues) {
      // verif type
      if (!_.isArray(selectedValues)) {
        throw new Error("La propriété " + key + " de la ressource n'est pas un tableau");
      }
      if (selectedValues.indexOf[cbValue] > -1) {
        choice.selected = true;
      }
    }
    choices.push(choice);
  });

  return choices;
}

editController.baseAction()
  .layout('page')
  .respond('html');

editController.action()
    .match('add')
    .view('edit')
    .do(function () {
      //configRessource = this.application.settings.ressource;
      var Ressource = lassi.entity.Ressource;
      var newRessource = Ressource.create();
      var data = ressourceToDust(newRessource);
      console.log(data);
      return data;
    });

editController.action()
    .match('edit/:id')
    .view('edit')
    .do(function (id) {
      // id est une fonction ???
      var data;
      var ressource = lassi.entity.Ressource.find({id: id});
      //configRessource = this.application.settings.ressource;
      if (!ressource || ressource.id !== id) {
        data = {
          error : 'La ressource ' + id + " n'existe pas."
        };
      } else {
        data = ressourceToDust(ressource);
      }

      return data;
    }); // do

module.exports = editController;