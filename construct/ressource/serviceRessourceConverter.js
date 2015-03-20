/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict';

var _ = require('underscore')._
var moment = require('moment')
var $routes

/**
 * Service qui regroupe les fonctions de transformation de données pour les vues
 * (objets vers vue ou résultat de post vers controller)
 * @namespace $ressourceConverter
 */
var $ressourceConverter = {}


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
  _.each(config.listes[key], function (label, cbValue) {
    // cbValue est une string (le nom de la propriété), on veut la valeur entière éventuelle
    //if (cbValue == parseInt(cbValue, 10)) cbValue = parseInt(cbValue, 10)
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
    if (!_.isEmpty(selectedValues)) {
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

/**
 * Renvoie un token aléatoire
 * pas aussi random que l'usage de crypto ou d'un module npm dédié mais suffisant pour notre besoin
 * @returns {string}
 */
function getToken() {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
}

/**
 * Retourne un objet pour dust à partir d'une entité ressource
 * @param {Error}     error     Erreur éventuelle (passer null ou undefined sinon)
 * @param {Ressource} ressource La ressource qui sort d'un load
 * @returns {object} L'objet à passser à la vue dust
 */
$ressourceConverter.getViewData = function (error, ressource) {
  var viewData = {}
  var buffer;
  if (error) viewData.error = error.toString();
  else if (ressource) {
    // on boucle sur les propriétés que l'on veut afficher
    _.each(config.labels, function (label, key) {
      var value = ressource[key];
      viewData[key] = {
        title: label
      };
      if (_.isArray(value)) {

        // cas particulier de tableau de tableaux
        if (key === 'relations' && value.length) {
          viewData.relations.value = []
          value.forEach(function (relation) {
            viewData.relations.value.push({
              predicat : config.listes.relations[relation[0]],
              lien : context.link(lassi.action.ressource.describe, relation[1], {id:relation[1]})
            })
          })
          log.dev('relations ajoutée pour ' +ressource.id, viewData.relations)

        } else if (config.listes[key]) {
          // faut remplacer des ids par des labels
          buffer = [];
          _.each(value, function (id) {
            if (config.listes[key][id])  buffer.push(config.listes[key][id])
            else log.error("La ressource " + ressource.id + " a une valeur " + id +
                " pour la propriété " + key + " qui n'est pas dans la liste prédéfinie dans la configuration");
          });
          viewData[key].value = buffer.join(', ');

        } else {
          viewData[key].value = value.join(', ')
        }


      } else if (_.isDate(value)) {
        viewData[key].value = value ? moment(value).format(config.formats.jour) : 'inconnue';

      } else if (_.isObject(value)) {
        try {
          viewData[key].value = lassi.tools.stringify(value)
        } catch (error) {
          viewData[key].value = error.toString()
        }

      } else {
        viewData[key].value = value;
      }
    }); // fin each propriété

    // on ajoute oid
    viewData.oid = ressource.oid
  } else {
    // pas d'erreur mais pas de ressource non plus
    viewData.error = "Aucune ressource";
  }

  return viewData
}

/**
 * Retourne l'objet pour la vue du formulaire à partir de la ressource
 *
 * On ajoute ici de la logique d'affichage
 *
 * Dans l'objet qui sera renvoyé, chaque propriété contient
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
 * @param error
 * @param ressource
 * @returns {object} Les data pour la vue dust, avec le token
 */
$ressourceConverter.getFormViewData = function (error, ressource) {
  var viewData = {errors:[]};
  if (ressource && ressource.errors) {
    viewData.errors = ressource.errors
  }

  if (error) {
    log.error(error)
    viewData.errors.push(error.toString())
  }

  // on s'assure que l'on a un objet, sinon on en créé un vide
  if (!ressource) {
    // on en créé une vide
    log.dev('dans sendFormData on lance un create')
    ressource = lassi.entity.Ressource.create()
  }
  //log.dev('ressource traitée par sendFormData', ressource)

  // on boucle sur les propriétés déclarées dans config pour récupérer les labels
  _.each(config.labels, function (label, key) {
    var value = ressource[key];
    var isUnique = config.uniques[key];

    // pour tout le monde
    viewData[key] = {
      id   : key, // le template ajoutera un préfixe de son choix
      label: label
    };
    // required ?
    if (config.required[key]) viewData[key].required = true
    if (isUnique) viewData[key].unique = true

    // c'est un tableau ou une valeur unique (donc prise dans une liste => select ou checkboxes)
    if (_.isArray(value) || config.uniques[key]) {
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans config.prop
      if (isUnique) {
        value = [value]; // arrayToDust veut un array
        // faut ça sur le select et pas les choices
        viewData[key].name = key
      }
      viewData[key].choices = arrayToDust(key, value, isUnique)

      // checkbox tout seul (pas de label, c'est le parent qui le porte)
    } else if (_.isBoolean(value)) {
      viewData[key].choices = [
        {
          name : key,
          value: [value]
        }
      ]
      if (value) viewData[key].choices[0].selected = true

      // propriété scalaire => input ou textarea
    } else {
      viewData[key].name = key
      if (_.isDate(value)) {
        value = moment(value).format(config.formats.jour)

      } else if (_.isObject(value)) {
        try {
          value = JSON.stringify(value)
        } catch (error) {
          value = error.toString()
        }
      }

      viewData[key].value = value
    }
  }); // fin each propriété

  // on ajoute nos cas particulier
  if (viewData.id) viewData.id.readonly = true
  viewData.version.readonly = true
  // et l'oid
  viewData.oid = {
    name : 'oid',
    value: ressource.oid,
    hidden:true
  }
  // et un token
  var token = getToken()
  viewData.token = {
    name:'token',
    value:token,
    hidden:true
  }

  return viewData
}

/**
 * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
 * @param data
 * @param {boolean=} partial Passer true pour ne pas générer d'erreur sur des champs requis manquants
 * @return {Ressource}
 * @throws {Error} En cas de données invalides
 */
$ressourceConverter.getRessourceFromPost = function (data, partial) {
  var ressource = lassi.entity.Ressource.create();
  var errors = [];
  var buffer;
  var msg;
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
      if (!partial && _.isEmpty(value) && config.required[key]) {
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

/**
 * Modifie le post d'un arbre pour en déléguer l'analyse à getRessourceFromPost
 * @param data
 * @param partial
 * @returns {Ressource}
 */
$ressourceConverter.getRessourceFromPostedArbre = function (data, partial) {
  // on transforme le post pour ressembler à un post de ressource
  var ressource = {}

  // on accepte deux forme de post
  if (!_.isEmpty(data)) {
    if (data.arbre) {
      // on nous envoie tout en json
      try {
        data = JSON.parse(data.arbre)
      } catch (e) {
        throw e // pas la peine d'insister
      }
      //log.dev("On nous a envoyé un arbre en json", data)
    }
  }

  // Déplace les propriétés de data vers ressource (si la propriété existe et que c'est une propriété de ressource)
  _.each(config.typesVar, function(value, prop) {
    if (data[prop]) {
      ressource[prop] = data[prop]
      delete data[prop]
    }
  })
  // ces propriétés sont imposées
  ressource.typeTechnique = 'arbre'
  ressource.categories = [config.constantes.categories.liste]
  // on ne gère pas de relations avec les enfants des arbres,
  // pour certaines ressources on en aurait des centaines
  // on verra si on passe une tâche de fond pour ajouter ces relations sur certains arbres
  var arbre = $ressourceConverter.getRessourceFromPost(ressource, partial)
  // faut ajouter les enfants qui passent pas le filtre getRessourceFromPost (car pas une propriété de l'entité
  if (data.enfants) arbre.enfants = data.enfants;
  return arbre
}

/**
 * Ajoute les propriétés urlXXX à chaque elt du tableau de ressource
 * @param {Array} ressources
 * @returns {Array} ressources
 */
$ressourceConverter.addUrlsToList = function (ressources) {
  if (ressources && ressources.length) ressources.forEach(function (ressource) {
    ressource.urlDescribe = $routes.getAbs('describe', ressource)
    ressource.urlPreview = $routes.getAbs('preview', ressource)
    ressource.urlDisplay = $routes.getAbs('display', ressource)
  })

  return ressources
}

module.exports = function (routesService) {
  $routes = routesService

  return $ressourceConverter
}
