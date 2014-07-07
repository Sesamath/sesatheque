/**
 * Les méthodes génériques de notre composant, utilisées par les différents contrôleurs
 */

var ressourceRepository = {};
var configRessource = require('../config.js');

/**
 * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
 * @param {Ressource}
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return true sinon
 */
ressourceRepository.valide = function(ressource) {
  log.dev('on va valider ', ressource)
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
      if (ressource[key] && ! _['is' + typeVar](ressource[key])) {
        errors.push("Le champ " + configRessource.labels[key] + " ne contient pas le type attendu");
        log.dev("à la validation on a reçu pour " + key + ' : ' + JSON.stringify(ressource[key]))
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

  return true;
};

/**
 * Ajoute une ressource
 * @param ressource
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {number} L'oid de la ressource insérée
 */
ressourceRepository.add = function(ressource) {
  var Ressource = lassi.entity.Ressource;
  ressourceRepository.valide(ressource);
  log.dev('validation OK')
  Ressource
      .create(ressource)
      .store(function (error, ressource) {
        if (error) throw error;
        return ressource.oid;
      })
};

/**
 * Update une ressource
 * @param ressource
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {number} L'oid de la ressource insérée
 */
ressourceRepository.update = function(ressource) {
  var Ressource = lassi.entity.Ressource;
  ressourceRepository.valide(ressource);
  Ressource
      .initialize(ressource)
      .store(function (error, ressource) {
        if (error) throw error;
        return true;
      })
};

/**
 * Efface une ressource
 * @param ressource
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {number} L'oid de la ressource insérée
 */
ressourceRepository.delete = function(oid) {
  var Ressource = lassi.entity.Ressource;
  ressourceRepository.valide(ressource);
  Ressource
      .create(ressource)
      .store(function (error, ressource) {
        if (error) throw error;
        return ressource.oid;
      })
};

/**
 * Retourne une ressource
 * @param oid
 * @throws {Error} Si la récupération (le find de l'entity) en a trouvé une
 * @returns {Ressource}
 */
ressourceRepository.get = function(oid) {
  var Ressource = lassi.entity.Ressource;
  Ressource
      .find({oid:oid})
      .execute(function (error, ressource) {
        if (error) {
          throw error;
        } else {
          return ressource;
        }
      });
};

module.exports = ressourceRepository;
