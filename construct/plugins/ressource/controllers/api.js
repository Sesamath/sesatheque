'use strict';

var apiController = lassi.Controller().namespace('api/ressource');

var configRessource = require('../config.js');

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
        }
      }
    }
  }); // each

  return ressource;
}

/**
 * Vérifie que les champs obligatoires existent et sont non vides
 * @param {ressource}
 */
function valideRessource(ressource) {
  var errors = [];
  if (_.isEmpty(ressource)) {
    errors.push("Ressource vide");
  } else {
    // vérif présence et type
    _.each(configRessource.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(ressource[key]) && configRessource.required.indexOf(key) > -1) {
        errors.push("Le champ " + configRessource.labels[key] + " est obligatoire");
      }
      // le type
      if (ressource.hasOwnProperty(key) && ! _['is' + typeVar](ressource[key])) {
        errors.push("Le champ " + configRessource.labels[key] + " ne contient pas le type attendu");
      } else if (typeVar === 'Number') {
        // on vérifie entier positif
        if (Math.floor(ressource[key]) !== ressource[key]) {
          errors.push("Le champ " + configRessource.labels[key] + " ne contient pas un entier");
        }
        if (ressource[key] < 0) {
          errors.push("Le champ " + configRessource.labels[key] + " ne contient pas un entier positif");
        }
      }
    });
  }

  if (errors !== []) {
    throw new Error(errors.join("\n"));
  }

  return ressource;
}

apiController.baseAction()
  .respond('json');

/**
 * Create
 */
apiController.action()
    .match('add')
    .via('post')
    .do(function() {
      var ressourcePosted, ressourcePlausible, Ressource;
      try {
        // @todo vérif droits
        // on accepte un seul param data qui contient la ressource en json
        // mais aussi chaque champ séparément
        if (this.request.query.param.data) {
          try {
            ressourcePosted = JSON.parse(this.request.query.param.data);
          } catch (error) {
            throw new Error("Ressource invalide");
          }
        } else {
          ressourcePosted = convertPostToRessource(this.request.query.param);
        }
        // on vérifie l'intégrité
        ressourcePlausible = valideRessource(ressourcePosted);
        // si on est toujours là on peut instancier une entité
        Ressource = this.application.entity('Ressource');
        Ressource
            .create(ressourcePlausible)
            .store(function (error, ressource) {
              if (error) throw error;
              this.response.send({result: 'ok', oid: ressource.oid});
            })
      } catch (error) {
        this.response.send({error: error.toString()});
      }
    }); // do

/**
 * Read (get)
 */
apiController.action()
    .match('get/:oid')
    .do(function(oid) {
      var Ressource = this.application.entity('Ressource');
      Ressource
          .find({oid:oid})
          .execute(function (error, ressource) {
            if (error) {
              this.response.send({error: error.toString()});
            } else {
              // @todo vérif droits et restriction
              this.response.send(ressource);
            }
        })
    });

/**
 * Update
 */
apiController.action()
    .match('update')
    .via('post')
    .do(function() {
      // @todo vérif droits
      var ressourcePosted, ressourcePlausible, ressource;
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
            .initialize(ressourcePlausible)
            .store(function (error, ressource) {
              if (error) {
                this.response.send({error: error.toString()});
              } else {
                this.response.send({result: 'ok', oid: ressource.oid});
              }
            })
      }
    }); // do

/**
 * Delete
 */
apiController.action()
    .match('delete/:oid')
    .do(function(oid) {
      // @todo vérif droits
      var Ressource = this.application.entity('Ressource');
      Ressource.delete({oid:oid});
    });

module.exports = apiController;
