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
 * (celles liées à une url malformée doivent être interceptées avant nous)
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
          ctx.metas.title = ressource.titre
          sendPageData(error, ressource, ctx, next)
        } else {
          ctx.response.statusCode = 404;
          next(null, {error: "La ressource d'identifiant " + id + " n'existe pas"})
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
          ctx.metas.title = ressource.titre
          ctx.metas.permalink = ctx.url(lassi.action.ressource.describe, {id: ressource.id})
        }
        sendPageData(error, ressource, ctx, next)
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
        } else {
          ctx.metas.title = ressource.titre
          sendPageData(error, ressource, ctx, next)
        }
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
      var ressource
      //log.dev('action', lassi.action.ressource); next()
      if (this.method === 'get') {
        //sendFormData(null, lassi.entity.Ressource.create(), next)
        ctx.metas.title = 'Ajouter une ressource'
        sendFormData(null, null, next)
      } else {
        // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
        // et rediriger vers le describe ou vers le form avec les erreurs
        //log.dev('post dans add', this.post);
        ressource = lassi.ressource.getRessourceFromPost(ctx.post)
        // il validera avant d'enregistrer
        lassi.ressource.write(ressource, function (error, ressource) {
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

    if (this.isGet()) {
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
          ctx.metas.title = 'Modifier ' +ressource.titre
          sendFormData(error, ressource, next)
        }
      })

    } else if (this.isPost()) {
      // post => on enregistre ou on réaffiche le form si pb
      lassi.ressource.write(
          lassi.ressource.getRessourceFromPost(ctx.post),
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
    } else {
      throw new Error("methode non supportée " +this.method)
    }
  });

/**
 * Del
 */
controller
  .Action(routes.del +'/:id', 'ressource.del')
  .via('get', 'post')
  .renderWith('del')
  .do(function (ctx, next) {
      var id = this.arguments.id;
      if (this.method === 'get') {
        // on affiche et on demande confirmation
        lassi.ressource.load(id, function (error, ressource) {
          if (!ressource) {
            ctx.response.statusCode = 404;
            ressource = {
              error : "La ressource d'identifiant " + id + " n'existe pas"
            }
            next(null, ressource)
          } else {
            ctx.metas.title = 'Supprimer ' +ressource.titre
            sendPageData(error, ressource, ctx, next)
          }
        })
      } else {
        // post, on supprime
        lassi.ressource.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error})
          else if (nbObjects > 0) next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }
  });

controller
  .Action('by/:index/:value/:start/:nb')
  .renderWith('liste')
  .do(function (ctx, next) {
      var index = ctx.arguments.index
      var value = ctx.arguments.value
      var start = ctx.arguments.start
      var nb = ctx.arguments.nb
      var options = {
        filters : [{index:index, values:[value]}],
        orderBy:'id'
      }
      lassi.ressource.getListe(options, start, nb, function (error, ressources) {
        ctx.metas.title = 'Résultats de recherche'
        next(error, {ressources:ressources})
      })
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
function sendPageData(error, ressource, ctx, next) {
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
                lien : ctx.link(lassi.action.describe, relation[1], {id:relation[1]})
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
  log.dev('On envoie à la page', data)

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
  //log.dev('On envoie au form', data)

  next(null, data)
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
