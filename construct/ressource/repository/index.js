/**
 * Les méthodes génériques de notre composant, utilisées par les différents contrôleurs
 */

var ressourceRepository = {};
var config = require('../config.js');

/**
 * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
 * @param {Ressource}
 * @param {Function} next Callback qui recevra les arguments (error, ressource)
 * @return {Boolean}
 */
ressourceRepository.valide = function(ressource, next) {
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
              ressource.id = 'bib' + ressource.oid;
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
        .store(next)
  })
};

/**
 * Efface l'entity par son oid (on peut passer un tableau)
 * @param {Number|Array} oid Le ou les oid à supprimer
 * @param {Function} La callback qui sera appelée en lui passant le nb de ligne effacées en argument
 * @throws {Error} Si la requete plante
 * @returns {undefined}
 */
ressourceRepository.delByOid = function(id, next) {
  //lassi.entity.Ressource.delWhere('dateCreation', 'IN', ['2014-07-10 00:00:00.001', '2014-07-10 00:00:00.002'], next)
  lassi.entity.Ressource.delByOid([id, 5, 6], next);
};

/**
 * Retourne une ressource
 * @param oid
 * @throws {Error} Si la récupération (le find de l'entity) a planté
 * @returns {Ressource}
 */
ressourceRepository.get = function(id, next) {
  var Ressource = lassi.entity.Ressource;
  Ressource
      .find()
      .byId(id)
      .execute(function (error, rows) {
        log.dev('rows', rows)
        if (!rows.length) next(new Error("La ressource " + id + " n'existe pas"))
        else {
          // on vérifie l'unicité et on log un doublon éventuel
          if (rows.length > 1) log.errorData("Il y a " + rows.length + " ressources d'id " + id);
          var ressource = rows[0];
          // faut transformer les dates en objets date
          ressource.dateCreation = new Date(ressource.dateCreation);
          ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
          next(error, ressource)
        }
      });
};

/**
 * Retourne une ressource
 * @param oid
 * @throws {Error} Si la récupération (le find de l'entity) a planté
 * @returns {Ressource}
 */
ressourceRepository.getBy = function(id, next) {
  var Ressource = lassi.entity.Ressource;
  Ressource
      .find()
      .include('id', id, '=')
      .execute(function (error, rows) {
        if (!rows.length) next(new Error("La ressource " + id + " n'existe pas"))
        else {
          // on vérifie l'unicité et on log un doublon éventuel
          if (rows.length > 1) log.errorData("Il y a " + rows.length + " ressources d'id " + id);
          var ressource = rows[0];
          // faut transformer les dates en objets date
          ressource.dateCreation = new Date(ressource.dateCreation);
          ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
          next(error, ressource)
        }
      });
};

module.exports = ressourceRepository;
