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
  // log.dev('on va valider ', ressource)
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

  if (!_.isEmpty(errors)) {
    throw new Error("Les erreurs à la validation : " + errors.join("\n"));
  }

  return true;
};

/**
 * Ajoute une ressource
 * @param ressource
 * @param {Function} next callback qui sera passé au store() et recevra les arguments (error, ressource)
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {string} L'id de la ressource insérée
 */
ressourceRepository.add = function(ressource, next) {
  var Ressource = lassi.entity.Ressource;
  var ress;

  function updateNewIndex(error, ressource) {
    log.dev('updateNewIndex')
    if (error) throw error;
    if (ressource && !ressource.id) {
      // pas le choix, faut une 2e requete d'update :-(
      ressource.id = 'bib' + ressource.oid;
      ressource.store(next)
    } else {
      next(error, ressource);
    }
  }

  ressourceRepository.valide(ressource);
  log.dev('validation OK dans le add')
  ress = Ressource.create(ressource);
  ress.store(updateNewIndex);
};

/**
 * Update une ressource
 * @param ressource
 * @param {Function} next callback qui sera passé au store() et recevra les arguments (error, ressource)
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {number} L'oid de la ressource insérée
 */
ressourceRepository.update = function(ressource, next) {
  var Ressource = lassi.entity.Ressource;
  ressourceRepository.valide(ressource);
  Ressource
      .create(ressource)
      .store(next)
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
ressourceRepository.get = function(id) {
  var Ressource = lassi.entity.Ressource;
  Ressource
      .find()
      .include({id:id})
      .execute(function (error, ressource) {
        if (error) {
          throw error;
        } else {
          return ressource;
        }
      });
};

module.exports = ressourceRepository;
