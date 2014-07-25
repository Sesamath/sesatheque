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
  //assert.nextOk(next);
  // log.dev('on va valider ', ressource)
  /** tableau d'erreurs qui sera concaténé et passé à next si non vide */
  var errors = [];
  if (_.isEmpty(ressource)) {
    errors.push("Ressource vide");
  } else {
    // vérif présence et type
    _.each(config.typesVar, function (typeVar, key) {
      // propriétés obligatoires
      if (_.isEmpty(ressource[key]) && config.required[key]) {
        errors.push("Le champ " + config.labels[key] + " est obligatoire")
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
    })
  }

  if (next) {
    if (errors.length) {
      // on passe les erreurs mais pas la ressource invalide
      next(new Error("Ressource invalide : \n" + errors.join("\n")))
    } else {
      next(null, ressource)
    }
  }

  return !errors.length;
}

/**
 * Ajoute une ressource
 * @param ressource
 * @param {Function} next Callback qui sera passé au store() et recevra les arguments (error, ressource)
 * @throws {Error} Si la ressource est invalide (avec la liste des anomalies relevées)
 * @return {string} L'id de la ressource insérée
 */
ressourceRepository.add = function(ressource, next) {
  log.dev("avant validation dans update", ressource)
  ressourceRepository.valide(ressource, function(error, ressource) {
    if (error) {
      log.error(error)
      next(error);
    } else {
      log.dev('la ressource passée à create puis store dans update', ressource)
      lassi.entity.Ressource
          .create(ressource)
          .store(function (error, ressource) {
            if (error) {
              log.dev(error.stack)
              next(error)
            } else if (ressource && !ressource.id) {
              // pas d'id, pas le choix faut une 2e requete d'update avec l'id qu'on génère ici :-(
              if (ressource.oid != parseInt(ressource.oid, 10)) {
                throw new Error("L'oid n'est plus entier, faut venir changer le code de ressourceRepository.add")
              } else {
                // on prend l'oid tant qu'il est entier
                ressource.id = ressource.oid;
                cacheSet(ressource)
                ressource.store(next)
              }
            } else {
              cacheSet(ressource)
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
  ressourceRepository.valide(ressource, function (error, ressourc) {
    lassi.entity.Ressource
        .create(ressource)
        .store(function(error, ressource) {
          cacheSet(ressource)
          next(error, ressource)
        })
  })
};

/**
 * Efface l'entity par son oid (on peut passer un tableau)
 * @param {Number|Array} id  Le ou les id à supprimer
 * @param {Function}     next La callback qui sera appelée en lui passant (error, nbObjects, nbIndexes)
 * @returns {undefined}
 */
ressourceRepository.del = function(id, next) {
  log.dev("La ressource " +id + " va être effacée")
  var query
  if (_.isArray(id)) query = lassi.entity.Ressource.match('id').in(id)
  else query = lassi.entity.Ressource.match('id').equals(id)
  query.delete(function(error, nbObjects, nbIndexes) {
    if (error) next(error, nbObjects, nbIndexes)
    else {
      if (_.isArray(id)) {
        id.forEach(function (idToDel) {
          cacheDel(idToDel)
        })
      } else cacheDel(id)
      next(error, nbObjects, nbIndexes)
    }
    log.dev("La ressource " +id + " a été effacée (" +nbObjects +" versions et " +nbIndexes +" index)")
  })
}

/**
 * Efface l'entity par son oid (on peut passer un tableau)
 * @param {Number|Array} oid  Le ou les oid à supprimer
 * @param {Function}     next La callback qui sera appelée en lui passant (error, nbObjects, nbIndexes)
 * @returns {undefined}
 */
ressourceRepository.delByOid = function(oid, next) {
  var query
  if (_.isArray(oid)) query = lassi.entity.Ressource.match('oid').in(oid)
  else query = lassi.entity.Ressource.match('oid').equals(oid)
  query.delete(function(error, nbObjects, nbIndexes) {
    if (error) next(error, nbObjects, nbIndexes)
    else {
      cacheDelByOid(oid)
      next(error, nbObjects, nbIndexes)
    }
    log.dev("La ressource d'oid " +oid + " a été effacée (avec ses " +nbIndexes +" index)")
  })
};

/**
 * Récupère une ressource et la passe à next (seulement une erreur si elle n'existe pas)
 * @param {Number|String} id  L'identifiant de la ressource
 * @param {Function}      next La callback qui sera appelée avec (error, ressource).
 * @returns {undefined}
 */
ressourceRepository.load = function(id, next) {
  var ressourceCached = cacheGet(id)
  if (ressourceCached) next(null, ressourceCached)
  else {
    lassi.entity.Ressource.match('id').equals(id).sort('version', 'desc').grabOne(function (error, ressource) {
      if (error) next(error)
      else if (ressource) {
        prepareAndSend(ressource, next)
      } else {
        next(null, null)
      }
    })
  }
};

/**
 * Récupère une ressource par son oid et la passe à next (seulement une erreur si elle n'existe pas)
 * @param {Number|String} oid  L'identifiant interne de la ressource
 * @param {Function}      next La callback qui sera appelée avec (error, ressource).
 * @returns {undefined}
 */
ressourceRepository.loadByOid = function(oid, next) {
  var ressourceCached = cacheGetByOid(oid)
  if (ressourceCached) next(null, ressourceCached)
  else {
    lassi.entity.Ressource.match('oid').equals(oid).grabOne(function (error, ressource) {
      if (error) next(error)
      else if (ressource) {
        prepareAndSend(ressource, next)
      } else {
        next(null, null)
      }
    })
  }
};

/**
 * Récupère une ressource d'après son idOrigine et la passe à next
 * @param {String}   origine
 * @param {String}   idOrigine
 * @param {Function} next     La callback qui sera appelée en lui passant le nb de ligne effacées en argument
 */
ressourceRepository.loadByOrigin = function(origine, idOrigine, next) {
  var ressourceCached = cacheGetByOrigine(origine, idOrigine)
  if (ressourceCached) next(null, ressourceCached)
  else {
    lassi.entity.Ressource
        .query()
        .whereEquals('origine', origine)
        .whereEquals('idOrigine', idOrigine)
        .execute(function (error, rows) {
          var ressource
          if (!error) {
            if (rows.length) {
              // on vérifie l'unicité et on log si on a un doublon
              if (rows.length > 1) log.errorData("Il y a " + rows.length + " ressources " + origine + '-' + idOrigine);
              ressource = rows[0];
              prepareAndSend(ressource, next)
            } else {
              ressource = {error: "La ressource " + origine + '-' + idOrigine + " n'existe pas"}
              next(null, ressource)
            }
          }
        })
  }
}

module.exports = ressourceRepository;

/********************
 * Nos fcts privées *
 *******************/

/**
 * Créé les objets date à partir des Strings, met en cache et fait suivre
 * @private
 * @param ressources ressource ou tableau de ressources
 * @param next
 * @throws {Error} Si ressources n'est pas une ressource ou un tableau de ressources
 */
function prepareAndSend(ressources, next) {
  /**
   * Helper qui process une ressource
   * @param ressource
   */
  function processOne(ressource) {
    if (!ressource.oid) throw new Error("Paramètre invalide (n'est pas une ressource)")
    // faut transformer les dates en objets date
    ressource.dateCreation = new Date(ressource.dateCreation);
    ressource.dateMiseAJour = new Date(ressource.dateMiseAJour);
    cacheSet(ressource)
  }

  if (_.isEmpty(ressources)) throw new Error("Paramètre invalide (n'est pas une ressource ni une liste)")
  if (_.isArray(ressources)) ressources.forEach(processOne)
  else processOne(ressources)
  next(null, ressources)
}

/**
 * Renvoie la ressource en cache (ou undefined si elle n'y est pas)
 * @param id
 * @returns {Ressource}
 */
function cacheGet(id) {
  return lassi.cache.get('ressource_' + id)
}

/**
 * Renvoie la ressource en cache d'après son oid (ou undefined si elle n'y est pas)
 * @param oid
 * @returns {Ressource}
 */
function cacheGetByOid(oid) {
  var id = lassi.cache.get('ressourceIdByOid_' +oid)
  return id ? lassi.cache.get('ressource_' + id) : undefined
}

/**
 * Renvoie la ressource en cache d'après son origine (ou undefined si elle n'y est pas)
 * @param origine
 * @param idOrigine
 * @returns {Ressource}
 */
function cacheGetByOrigine(origine, idOrigine) {
  var id = lassi.cache.get('ressourceIdByOrigine_' +origine +'_' +idOrigine)
  return id ? lassi.cache.get('ressource_' +id) : undefined
}

/**
 * Met en cache une ressource
 * @param ressource
 */
function cacheSet(ressource) {
  if (!ressource || !ressource.id) log.error(new Error('Impossible de mettre en cache une ressource inexistante'))
  else {
    lassi.cache.set('ressource_' +ressource.id, ressource)
    lassi.cache.set('ressourceIdByOid_' +ressource.oid, ressource.id)
    if (ressource.origine) {
      lassi.cache.set('ressourceIdByOrigine_' +ressource.origine +'_' +ressource.idOrigine, ressource.id)
    }
  }
}

/**
 * Efface une ressource du cache
 * @param id
 */
function cacheDel(id) {
  var ressource = lassi.cache.get('ressource_' +id)
  if (ressource) {
    lassi.cache.set('ressource_' +ressource.id, undefined)
    lassi.cache.set('ressourceIdByOid_' +ressource.oid, undefined)
    if (ressource.origine) lassi.cache.set('ressourceIdByOrigine_' +ressource.origine +'_' +ressource.idOrigine, undefined)
  }
}

/**
 * Efface une ressource du cache d'après son oid
 * @param oid
 */
function cacheDelByOid(oid) {
  var id = lassi.cache.get('ressourceIdByOid_' +oid)
  if (id) {
    cacheDel(id)
  }
}
