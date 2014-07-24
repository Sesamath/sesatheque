'use strict';

var controller = lassi.Controller('ressource');
var moment = require('moment');
var _ = require('underscore')._;
var config = require('../config.js');
var routes = config.constantes.routes;

controller.respond('html');

/**
 * On ajoute nos 4 méthodes CRUD (Create, Read, Update, Delete), avec 2 méthodes read suivant que
 * l'on veut voir la ressource (display ou embed) ou sa description (describe)
 *
 * Les erreurs liées à un bug dans le code sont en anglais,
 * celles liées à une incohérence de data et destinés à l'utilisateur en français
 * (celles liées à une url malformée doivent être interceptées avant nous par les contrôleurs)
 */

/**
 * describe : Voir les propriétés de la ressource
 */
controller
    .Action(routes.describe + '/:id', 'ressource.describe')
    .renderWith('describe')
    .do(function (ctx, next) {
      var id = ctx.arguments.id
      lassi.ressource.load(id, function (error, ressource) {
        if (error) next(error)
        else if (ressource) {
          sendPageData(error, ressource, next)
        } else {
          ctx.response.statusCode = 404;
          next(null, {errors: ["La ressource d'identifiant " + id + " n'existe pas"]})
        }
      })
    });

/**
 * describe via origine : Voir les propriétés de la ressource, ici via origine/idOrigine
 */
controller
    .Action(routes.describe + '/:origine/:idOrigine', 'ressource.describeByOrigin')
    .renderWith('describe')
    .do(function (ctx, next) {
      var origine = ctx.arguments.origine
      var idOrigine = ctx.arguments.idOrigine
      lassi.ressource.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (!ressource) {
          ressource = {
              errors : ["La ressource d'identifiant " + idOrigine + " (origine " + origine +" n'existe pas"]
          }
          ctx.response.statusCode = 404;
        } else if (!error) {
          ctx.permalink = ctx.url(lassi.action.ressource.describe, {id: ressource.id})
        }
        sendPageData(error, ressource, next)
      })
    })

/**
 * display : Voir la ressource
 */
controller
  .Action(routes.display + '/:id', 'ressource.display')
  .do(function (ctx, next) {
      var id = ctx.arguments.id
      lassi.ressource.load(id, function (error, ressource) {
        if (!ressource) {
          ctx.response.statusCode = 404;
          ressource = {
            errors : ["La ressource d'identifiant " + id + " n'existe pas"]
          }
        }
        sendPageData(error, ressource, next)
      })
  });


/**
 * Create, le form de saisie
 */
controller
  .Action(routes.add, 'ressource.add')
  .via('get', 'post')
  .renderWith('form')
  .do(function (ctx, next) {
      // ajouter un meta ou un autre moyen pour mettre le js client
      // qui va conditionner les types à la catégorie dans la page
      var data, compRessource;
      //log.dev('action', lassi.action.ressource); next()
      if (this.method === 'get') {
        //sendFormData(null, lassi.entity.Ressource.create(), next)
        sendFormData(null, null, next)
      } else {
        // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
        // et rediriger vers le describe ou vers le form avec les erreurs
        //log.dev('post dans add', this.post);
        compRessource = lassi.ressource; // le Component, pas entity
        data = getRessourceFromPost(ctx.post)
        // il validera avant d'enregistrer
        compRessource.add(data, function (error, ressource) {
          if (error || !_.isEmpty(ressource.errors)) {
            // faut réafficher le form
            sendFormData(error, ressource, next)
          } else {
            log.dev("Après le save on récupère l'id " + ressource.id + ", on lance le redirect");
            ctx.redirect(lassi.action.ressource.describe, {id: ressource.id});
            // on appelle pas next, on attend le redirect
          }
        }) // compRessource.add
      }
      log.dev("fin do add");
  });

/**
 * Uptate
 */
controller
  .Action(routes.edit +'/:id', 'ressource.edit')
  .via('get', 'post')
  .renderWith('form')
  .do(function (ctx, next) {

    if (this.method === 'get') {
      // get => affichage du form
      var id = ctx.arguments.id
      lassi.ressource.load(id, function (error, ressource) {
        if (!ressource) {
          ctx.response.statusCode = 404;
          ressource = {
            errors: ["La ressource d'identifiant " + id + " n'existe pas"],
            noForm : true
          }
          next(null, ressource)
        } else {
          sendFormData(error, ressource, next)
        }
      })

    } else {
      // post => on enregistre ou on réaffiche le form si pb
      lassi.ressource.update(
          getRessourceFromPost(ctx.post),
          function(error, ressource) {
            if (error || !_.isEmpty(ressource.errors)) {
              // faut réafficher le form avec les erreurs
              sendFormData(error, ressource, next)
            } else {
              log.dev("update ok, on lance le redirect")
              ctx.redirect(lassi.action.ressource.describe, {id: ressource.id});
              // on appelle pas next, on attend le redirect
            }
          }
      )
    }
  });

/**
 * Del
 */
controller
  .Action(routes.del +'/:id', 'ressource.del')
  .via('get', 'post')
  .renderWith('del')
  .do(function (next) {
      var id = this.arguments.id;
      if (this.method === 'get') {
        // on affiche et on demande confirmation
        lassi.ressource.load(id, function (error, ressource) {
          if (!ressource) {
            ctx.response.statusCode = 404;
            ressource = {
              errors : ["La ressource d'identifiant " + id + " n'existe pas"]
            }
          }
          sendPageData(error, ressource, next)
        })
      } else {
        // post, on supprime
        try {
          lassi.ressource.del(id, function (error, nbRows) {
            log.dev("nbRows", nbRows)
            if (nbRows === 1) {
              if (error) next(null, {error: error, deletedId: id})
              else next(null, {deletedId: id})
            } else next(null, {error: "Aucune ressource d'identifiant " + id + ' retour ' + nbRows})
          });
        } catch (e) {
          // pas normal que cette requete plante, pb d'accès à la base ou table manquante
          log.error(e.stack)
          next(null, {error:"La suppression de la ressource " + id +" a échouée."});
        }
      }
  });

module.exports = controller;


/****************************************
 * déclarations de toutes nos fonctions *
 ***************************************/

/**
 * Transforme une entité ressource en objet pour la vue describe et la passe à next
 * @param {Error}     error     Erreur éventuelle (passer null ou undefined sinon)
 * @param {Ressource} ressource La ressource qui sort d'un load
 * @param {Function}  next      callback qui sera appelée avec (error, data), data pour une vue dust
 * @returns {undefined} La ressource, avec pour chaque champ les propriétés title et value
 */
function sendPageData(error, ressource, next) {
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
          if (config.listes[key]) {
            // faut remplacer des ids par des labels
            buffer = [];
            _.each(value, function (id) {
              if (config.listes[key][id])  buffer.push(config.listes[key][id])
              else log.error("La ressource " + ressource.id + " a une valeur " + id +
                  " pour la propriété " + key + " qui n'est pas dans la liste prédéfinie dans la configuration");
            });
          } else {
            buffer = value; // on garde l'array tel quel
          }
          data[key].value = buffer.join(', ');


        } else if (_.isDate(value)) {
          data[key].value = value ? moment(value).format(config.formats.jour) : 'inconnue';
        } else {
          data[key].value = value;
        }
      }); // fin each propriété
    } else {
      // pas d'erreur mais pas de ressource non plus
      data.error = "Aucune ressource";
    }
  }

  next(null, data);
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
function sendFormData(error, ressource, next) {
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

    // c'est un tableau ou une valeur unique (donc prise dans une liste => select ou checkboxes)
    if (_.isArray(value) || config.uniques[key]) {
      // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
      // et la liste des possibles dans config.prop
      if (isUnique) {
        value = [value]; // arrayToDust veut un array
        // faut ça sur le select et pas les choices
        data[key].name = key;
      }
      data[key].choices = arrayToDust(key, value, isUnique);

    } else if (_.isBoolean(value)) {
      // checkbox tout seul (pas de label, c'est le parent qui le porte)
      data[key].choices = [
        {
          name : key,
          value: [value]
        }
      ]

    } else {
      // propriété scalaire => input ou textarea
      data[key].name = key;
      if (_.isDate(value)) {
        value = moment(value).format(config.formats.jour);
      }
      data[key].value = value;
    }
  }); // fin each propriété

  // on ajoute nos cas particulier
  if (data.id) data.id.readonly = true;
  data.version.readonly = true;
  data.categories.required = true;
  data.langue.unique = true;
  // log.dev('On envoie au form', data)

  next(null, data);
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
  _.each(config.listes[key], function (label, cbValue) {
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
 * @throws {Error} En cas de données invalides
 */
function getRessourceFromPost(data) {
  var Ressource = lassi.entity.Ressource;
  var ressource = Ressource.create();
  var errors = [];
  var buffer;
  var msg;
  log.dev('dans getRessourceFromPost on récupère', data)
  //log.dev('ressource vide', ressource)
  if (_.isEmpty(data)) {
    errors.push("Ressource vide");
  } else {
    // vérif présence et type
    _.each(config.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(data[key]) && config.required.indexOf(key) > -1) {
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
  }

  // if (errors !== []) { // ce truc est toujours vrai !
  if (errors.length) {
    log.dev('errors à la fin getRessourceFromPost', errors)
    throw new Error("Les erreurs de validation .\n" + errors.join("\n"));
  }

  return ressource;
}
