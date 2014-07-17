'use strict';

/**
 * Passe en revue les propriétés de l'objet passé en argument, si la propriété existe dans ressource
 * recopie sa valeur dans l'objet qui sera retourné (avec le bon type)
 * @param {Object} postParams
 * @returns {Ressource}
 */
function convertPostToRessource(postParams) {
  var ressource = {};
  _.each(configRessource.types, function (type, propName) {
    if (postParams.hasOwnProperty(propName)) {
      if (type === 'String') {
        ressource[propName] = postParams[propName];
      } else if (type === 'Date') {
        ressource[propName] = new Date(postParams[propName]);
      } else if (type === 'Boolean') {
        ressource[propName] = !!postParams[propName]; // cast boolean
      } else {
        try {
          ressource[propName] = JSON.parse(postParams[propName]);
        } catch(error) {
          ressource[propName] = null;
          // on le note
          log.error("La ressource " +postParams.oid + " passée en post a une propriété invalide : " +
              propName +"=\n" +postParams[propName]);
        }
      }
    }
  }); // each

  return ressource;
}

var controller = lassi.Controller('api/ressource');
var configRessource = require('../config.js');
controller.respond('json');

/**
 * Create
 */
controller
    .Action('add')
    .via('post')
    .do(function(next) {
      var ressourcePosted, ressourcePlausible, Ressource;
      try {
        lassi.component.ressource.toto()
        log.dev('le post', this.post)
        // @todo vérif droits
        // on accepte un seul param data qui contient la ressource en json
        // mais aussi chaque champ séparément
        if (_.isEmpty(this.post)) {
          throw new Error("Ressource vide");
        }
        if (this.post.data) {
          try {
            ressourcePosted = JSON.parse(this.post.data);
          } catch (error) {
            throw new Error("Ressource invalide");
          }
        } else {
          ressourcePosted = convertPostToRessource(this.post);
        }
        // on vérifie l'intégrité
        ressourcePlausible = valideRessource(ressourcePosted);
        // si on est toujours là on peut instancier une entité
        Ressource = lassi.entity.Ressource;
        Ressource
            .create(ressourcePlausible)
            .store(function (error, ressource) {
              if (error) throw error;
              return {result: 'ok', oid: ressource.oid};
            })
      } catch (error) {
        return {error: error.toString()};
      }
    }); // do

/**
 * Read (get)
 */
controller
    .Action('get/:oid')
    .do(function(next) {
      // on récupère la ressource
      var Ressource = this.application.entity('Ressource');
      Ressource
          .query()
          .include('oid', oid, '=')
          .execute(function (error, ressource) {
            if (error) next(error)
            else {
              // @todo vérif droits et restriction
              next(null, ressource);
            }
        })
    });

/**
 * Update
 */
controller
    .Action('update').via('post')
    .do(function(next) {
      // @todo vérif droits
      var ressourcePosted, ressourcePlausible, ressource, context = this;
      // on accepte un seul param data qui contient la ressource en json
      // mais aussi chaque champ séparément
      if (this.request.query.param.data) {
        try {
          ressourcePosted = JSON.parse(this.request.query.param.data);
        } catch(error) {
          ressourcePosted = null;
        }
      } else {
        ressourcePosted = convertPostToRessource(this.request.query.param);
      }
      ressourcePlausible = valideRessource(ressourcePosted);
      if (ressourcePlausible.error) {
        this.response.send({error: ressourcePlausible.error});
      } else {
        ressource = this.application.entity('Ressource');
        // @todo vérif d'intégrité
        ressource
            .onInitialize(ressourcePlausible)
            .store(function (error, ressource) {
              if (error) {
                context.response.send({error: error.toString()});
              } else {
                context.response.send({result: 'ok', oid: ressource.oid});
              }
            })
      }
    }); // do

/**
 * Delete
 */
controller.Action('delete/:oid')
  .do(function(next) {
    // @todo vérif droits
    var Ressource = this.application.entity('Ressource');
    Ressource.delete({oid:oid});
  });

module.exports = controller;
