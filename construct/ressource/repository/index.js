/**
 * Les méthodes génériques de notre composant, utilisées par les différents contrôleurs
 */

var _ = require('underscore')._;
var ressourceRepository = {};
var config = require('../config.js');

/**
 * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
 * @param {Ressource} ressource
 * @param {Function} next Callback qui recevra les arguments (error, ressource)
 * @return {Boolean}
 */
ressourceRepository.valide = function(ressource, next) {
  assert.nextOk(next);
  // log.dev('on va valider ', ressource)
  /** tableau d'erreurs qui sera concaténé et passé à next si non vide */
  var errors = [];
  if (_.isEmpty(ressource)) {
    errors.push("Ressource vide");
  } else {
    // vérif présence et type
    _.each(config.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(ressource[key]) && config.required.indexOf(key) > -1) {
        errors.push("Le champ " + config.labels[key] + " est obligatoire");
      }
      // le type
      if (ressource[key] && ! _['is' + typeVar](ressource[key])) {
        errors.push("Le champ " + config.labels[key] + " ne contient pas le type attendu");
        log.dev("à la validation on a reçu pour " + key + ' : ' + JSON.stringify(ressource[key]))
      } else if (typeVar === 'Number') {
        // on vérifie entier positif
        if (Math.floor(ressource[key]) !== ressource[key]) {
          errors.push("Le champ " + config.labels[key] + " ne contient pas un entier");
        }
        if (ressource[key] < 0) {
          errors.push("Le champ " + config.labels[key] + " ne contient pas un entier positif");
        }
      }
    });
  }

  if (errors.length && next) {
    // on passe les erreurs mais pas la ressource invalide
    next("Les erreurs à la validation : \n" + errors.join("\n"));
  } else {
    next && next(null, ressource);
  }

  return !errors.length;
};

/**
 * Ajoute une ressource
 * @param ressource
 * @param {Function} next Callback qui sera passé au store() et recevra les arguments (error, ressource)
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {string} L'id de la ressource insérée
 */
ressourceRepository.add = function(ressource, next) {
  ressourceRepository.valide(ressource, function(error, ressource) {
    if (error) {
      next(error);
    } else {
      lassi.entity.Ressource
          .create(ressource)
          .store(function (error, ressource) {
            if (error) {
              next(error)
            } else if (ressource && !ressource.id) {
              // pas d'id, donc on est l'origine
              // pas le choix faut une 2e requete d'update avec l'id qu'on génère ici :-(
              ressource.id = config.myOrigin + ressource.oid;
              ressource.store(next)
            } else {
              next(error, ressource);
            }
          });
    }
  });
};

/**
 * Update une ressource
 * @param ressource
 * @param {Function} next callback qui sera passé au store() et recevra les arguments (error, ressource)
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {number} L'oid de la ressource insérée
 */
ressourceRepository.update = function(ressource, next) {
  ressourceRepository.valide(ressource, function (error, ressource) {
    lassi.entity.Ressource
        .create(ressource)
        .store({}, next)
  })
};

/**
 * Efface l'entity par son oid (on peut passer un tableau)
 * @param {Number|Array} oid  Le ou les oid à supprimer
 * @param {Function}     next La callback qui sera appelée en lui passant le nb de ligne effacées en argument
 * @throws {Error} Si la requete plante
 * @returns {undefined}
 */
ressourceRepository.delByOid = function(oid, next) {
  lassi.entity.Ressource
      .query()
      .whereEquals('oid', oid)
      .delete(next)
};

/**
 * Récupère une ressource et la passe à next (seulement une erreur si elle n'existe pas)
 * @param {Number|String} oid  L'identifiant interne de la ressource
 * @param {Function}      next La callback qui sera appelée avec (error, ressource).
 * @returns {undefined}
 */
ressourceRepository.load = function(oid, next) {
  var Ressource = lassi.entity.Ressource
  Ressource
      .query()
      .whereEquals('oid', oid)
      .execute(function (error, rows) {
        var ressource;
        if (!error && rows.length) {
          ressource = rows[0];
          // faut transformer les dates en objets date
          ressource.dateCreation = new Date(ressource.dateCreation);
          ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
        }
        next(error, ressource);
      })
};

/**
 * Récupère une ressource d'après son idOrigine et la passe à next
 * @param {String}   origin
 * @param {String}   idOrigin
 * @param {Function} next     La callback qui sera appelée en lui passant le nb de ligne effacées en argument
 */
ressourceRepository.loadByOrigin = function(origin, idOrigin, next) {
  var Ressource = lassi.entity.Ressource;
  Ressource
      .query()
      .whereEquals('origin', origin)
      .whereEquals('idOrigin', idOrigin)
      .execute(function (error, rows) {
        var ressource
        if (!error) {
          if (rows.length) {
            // on vérifie l'unicité et on log si on a un doublon
            if (rows.length > 1) log.errorData("Il y a " + rows.length + " ressources " + origin + '-' + idOrigin);
            ressource = rows[0];
            // faut transformer les dates en objets date
            ressource.dateCreation = new Date(ressource.dateCreation);
            ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
          } else {
            ressource = {error: "La ressource " + origin + '-' + idOrigin + " n'existe pas"}
          }
        }
        next(null, ressource)
      })
}

module.exports = ressourceRepository;
