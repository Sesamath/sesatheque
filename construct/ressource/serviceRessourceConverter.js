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

module.exports = function (Ressource, $routes, $ressourceControl) {
  var _ = require('lodash')
  var moment = require('moment')
  // pour les constantes et les listes, ça reste nettement plus pratique d'accéder directement à l'objet
  // car on a l'autocomplétion sur les noms de propriété
  var config = require('./config')
  var tools = require('../tools')

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
   * @param {string}    [view=''] Le nom de la vue (pour ajouter les relations sur describe seulement)
   * @returns {object} L'objet à passser à la vue dust
   * @memberOf $ressourceConverter
   */
  $ressourceConverter.getViewData = function (error, ressource, view) {
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
            if (view === 'describe') {
              viewData.relations.value = []
              value.forEach(function (relation) {
                viewData.relations.value.push({
                  predicat     : config.listes.relations[relation[0]],
                  oid          : relation[1],
                  lien         : relation[2],
                  typeTechnique: relation[3]
                })
              })
            } // sinon on l'ajoute pas

          } else if (config.listes[key]) {
            // faut remplacer des ids par des labels
            buffer = [];
            _.each(value, function (id) {
              if (config.listes[key][id])  buffer.push(config.listes[key][id])
              else log.error("La ressource " + ressource.oid + " a une valeur " + id +
                  " pour la propriété " + key + " qui n'est pas dans la liste prédéfinie dans la configuration");
            });
            viewData[key].value = buffer.join(', ');

          } else {
            // une clé inconnue, on laisse tel quel (une ressource avec des propriétés supplémentaires)
            viewData[key].value = value
          }


        } else if (_.isDate(value)) {
          viewData[key].value = value ? moment(value).format(config.formats.jour) : 'inconnue';

        } else if (_.isObject(value)) {
            viewData[key].value = tools.stringify(value, 2)

        } else {
          // une clé inconnue, on laisse tel quel (une ressource avec des propriétés supplémentaires)
          viewData[key].value = value;
        }
      }); // fin each propriété

      // on ajoute oid
      if (ressource.oid) viewData.oid = ressource.oid
    } else {
      // pas d'erreur mais pas de ressource non plus
      viewData.error = "Aucune ressource";
    }
    if (view) viewData.$view = view

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
   * @memberOf $ressourceConverter
   */
  $ressourceConverter.getFormViewData = function (error, ressource) {
    var viewData = {warnings:[]};
    if (ressource && ressource.warnings) {
      viewData.warnings = ressource.warnings
    }

    if (error) {
      log.error(error)
      viewData.warnings.push(error.toString())
    }

    // on s'assure que l'on a un objet, sinon on en créé un vide
    if (!ressource) {
      // on en créé une vide
      log.debug('dans sendFormData on lance un create')
      ressource = Ressource.create()
    }
    //log.debug('ressource traitée par sendFormData', ressource)

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
    viewData.version.readonly = true
    // l'oid
    if (ressource && ressource.oid) {
      viewData.oid = {
        name  : 'oid',
        value : ressource.oid,
        readonly: true
      }
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
   * @memberOf $ressourceConverter
   */
  $ressourceConverter.valideRessourceFromPost = function (data, partial, next) {
    try {
      if (_.isEmpty(data)) throw new Error("Ressource vide")

      if (data.ressource) {
        // on nous envoie la ressource en json dans une string
        try {
          data = JSON.parse(data.ressource)
        } catch (e) {
          throw new Error("json invalide dans la propriété ressource postée")
        }
      }

      // on peut tenter une validation
      $ressourceControl.valide(data, !partial, function (error, ressource) {
        // en cas de pb de validation on renvoie aussi la ressource à l'origine du pb
        if (error) next(error, ressource)
        // si partiel, faut pas retourner un objet ressource complet
        else if (partial) next(null, ressource)
        // mais sinon on renvoie une vraie "Ressource"
        else next(null, Ressource.create(ressource))
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Modifie le post d'un arbre pour le faire ressembler à une ressource et le refiler à valideRessourceFromPost
   * @param data
   * @param partial
   * @param {Function} next
   * @memberOf $ressourceConverter
   */
  $ressourceConverter.valideRessourceFromPostedArbre = function (data, partial, next) {
    // on transforme le post pour ressembler à un post de ressource
    var ressource = {}

    // on accepte deux forme de post
    if (!_.isEmpty(data)) {
      if (data.arbre) {
        // on nous envoie tout le json dans une string
        try {
          data = JSON.parse(data.arbre)
        } catch (e) {
          throw e // pas la peine d'insister
        }
        //log.debug("On nous a envoyé un arbre en json", data)
      }
    }

    // Déplace les propriétés de data vers ressource (si la propriété existe et que c'est une propriété de ressource)
    _.each(config.typesVar, function(value, prop) {
      if (data[prop]) {
        ressource[prop] = data[prop]
        delete data[prop]
      }
    })
    // faut ajouter les enfants éventuels
    if (data.enfants) ressource.enfants = data.enfants;
    // ces propriétés sont imposées
    ressource.typeTechnique = 'arbre'
    ressource.categories = [config.constantes.categories.liste]

    // on ne gère pas de relations avec les enfants des arbres,
    // pour certaines ressources on en aurait des centaines
    // on verra si on passe une tâche de fond pour ajouter ces relations sur certains arbres

    $ressourceConverter.valideRessourceFromPost(ressource, partial, next)
  }

  /**
   * Ajoute les propriétés urlXXX à chaque elt du tableau de ressource
   * @param {Array} ressources
   * @returns {Array} ressources
   * @memberOf $ressourceConverter
   */
  $ressourceConverter.addUrlsToList = function (ressources) {
    if (ressources && ressources.length) ressources.forEach(function (ressource) {
      ressource.urlDescribe = $routes.getAbs('describe', ressource)
      ressource.urlPreview = $routes.getAbs('preview', ressource)
      ressource.urlDisplay = $routes.getAbs('display', ressource)
    })

    return ressources
  }

  /**
   * Transforme la ressource de type arbre en arbre (les parametres de la ressource où on ajoute titre et id)
   * @returns {Arbre|undefined} l'arbre (ou undefined si la ressource n'était pas de typeTechnique arbre)
   * @memberOf $ressourceConverter
   */
  $ressourceConverter.toArbre = function (ressource) {
    if (ressource.typeTechnique !== 'arbre') return undefined
    var clone = _.clone(ressource)

    return {
      oid : clone.oid,
      titre : clone.titre,
      typeTechnique : 'arbre',
      attributes : clone.parametres.attributes || {},
      enfants : clone.enfants || []
    }
  }

  return $ressourceConverter
}
