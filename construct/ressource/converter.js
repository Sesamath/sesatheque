'use strict';

var _ = require('underscore')._
var moment = require('moment')
var config = require('./config.js')

/**
 * Module qui regroupe les fonctions de transformation de données pour les vues
 * (objets vers vue ou résultat de post vers controller)
 */
var converter = {}

/**
 * Transforme une entité ressource en objet pour la vue describe et la passe à next
 * @param {Error}     error     Erreur éventuelle (passer null ou undefined sinon)
 * @param {Ressource} ressource La ressource qui sort d'un load
 * @param {Function}  next      callback qui sera appelée avec (error, data), data pour une vue dust
 * @returns {undefined} La ressource, avec pour chaque champ les propriétés title et value
 */
converter.sendPageData = function (error, ressource, ctx, next) {
  var data = {};
  var buffer;
  if (error) data.error = error.toString();
  else {
    if (ressource) {
      // on boucle sur les propriétés que l'on veut afficher
      _.each(config.labels, function (label, key) {
        var value = ressource[key];
        data[key] = {
          title: label
        };
        if (_.isArray(value)) {

          // cas particulier de tableau de tableaux
          if (key === 'relations' && value.length) {
            data.relations.value = []
            value.forEach(function (relation) {
              data.relations.value.push({
                predicat : config.listes.relations[relation[0]],
                lien : ctx.link(lassi.action.ressource.describe, relation[1], {id:relation[1]})
              })
            })
            log.dev('relations ajoutée pour ' +ressource.id, data.relations)

          } else if (config.listes[key]) {
            // faut remplacer des ids par des labels
            buffer = [];
            _.each(value, function (id) {
              if (config.listes[key][id])  buffer.push(config.listes[key][id])
              else log.error("La ressource " + ressource.id + " a une valeur " + id +
                  " pour la propriété " + key + " qui n'est pas dans la liste prédéfinie dans la configuration");
            });
            data[key].value = buffer.join(', ');

          } else {
            data[key].value = value.join(', ')
          }


        } else if (_.isDate(value)) {
          data[key].value = value ? moment(value).format(config.formats.jour) : 'inconnue';

        } else if (_.isObject(value)) {
          try {
            data[key].value = JSON.stringify(value)
          } catch (error) {
            data[key].value = error.toString()
          }

        } else {
          data[key].value = value;
        }
      }); // fin each propriété

      // on ajoute oid
      data.oid = ressource.oid
    } else {
      // pas d'erreur mais pas de ressource non plus
      data.error = "Aucune ressource";
    }
  }
  //log.dev('On envoie à la page', data)

  next(null, data);
}

/**
 * Transforme un objet ressource en qqchose que la vue pourra digérer
 *
 * On ajoute ici de la logique d'affichage
 *
 * Dans l'objet qui sera envoyé à next, chaque propriété contient
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
 */
/**
 *
 * @param error
 * @param ressource
 * @param next
 * @returns {string} Le token ajouté au form
 */
converter.sendFormData = function (error, ressource, next) {
  var data = {errors:[]};
  if (ressource && ressource.errors) {
    data.errors = ressource.errors
  }

  if (error) {
    log.error(error)
    data.errors.push(error.toString())
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
    data[key] = {
      id   : key, // le template ajoutera un préfixe de son choix
      label: label
    };
    // required ?
    if (config.required[key]) data[key].required = true
    if (isUnique) data[key].unique = true

    // c'est un tableau ou une valeur unique (donc prise dans une liste => select ou checkboxes)
    if (_.isArray(value) || config.uniques[key]) {
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans config.prop
      if (isUnique) {
        value = [value]; // arrayToDust veut un array
        // faut ça sur le select et pas les choices
        data[key].name = key
      }
      data[key].choices = arrayToDust(key, value, isUnique)

      // checkbox tout seul (pas de label, c'est le parent qui le porte)
    } else if (_.isBoolean(value)) {
      data[key].choices = [
        {
          name : key,
          value: [value]
        }
      ]
      if (value) data[key].choices[0].selected = true

      // propriété scalaire => input ou textarea
    } else {
      data[key].name = key
      if (_.isDate(value)) {
        value = moment(value).format(config.formats.jour)

      } else if (_.isObject(value)) {
        try {
          value = JSON.stringify(value)
        } catch (error) {
          value = error.toString()
        }
      }

      data[key].value = value
    }
  }); // fin each propriété

  // on ajoute nos cas particulier
  if (data.id) data.id.readonly = true
  data.version.readonly = true
  // et l'oid
  data.oid = {
    name : 'oid',
    value: ressource.oid,
    hidden:true
  }
  // et un token
  var token = getToken()
  data.token = {
    name:'token',
    value:token,
    hidden:true
  }
  //log.dev('On envoie au form', data)

  next(null, data)

  return token
}

/**
 * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
 * @param data
 * @param {boolean=} partial Passer true pour ne pas générer d'erreur sur des champs requis manquants
 * @return {Ressource}
 * @throws {Error} En cas de données invalides
 */
converter.getRessourceFromPost = function (data, partial) {
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
converter.getRessourceFromPostedArbre = function (data, partial) {
  // on transforme le post pour ressembler à un post de ressource
  var ressource
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
  if (data.id) ressource.id = data.id
  if (data.titre) ressource.titre = data.titre
  ressource.type = 'arbre'
  ressource.categories = [config.constantes.categories.liste]
  ressource.parametres = data;
  // @todo gérer les relations avec les enfants ? (ça va en faire bcp...)
  return converter.getRessourceFromPost(ressource, partial)
}

module.exports = converter

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
    if (cbValue == parseInt(cbValue, 10)) cbValue = parseInt(cbValue, 10)
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