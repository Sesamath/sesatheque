'use strict';
/**
 * Component personne
 */

//var _ = require('underscore')._

/** Notre configuration des droits, qui sera accessible sous lassi.personne.settings */
var settings = {
  roles:{
    // en attendant de gérer modIndexation, modParametres et publish on utilise juste mod
    admin:['delVersion', 'del', 'mod', 'modIndexation', 'modParametres', 'publish', 'readProf'],
    editor:['mod', 'modIndexation', 'modParametres', 'publish', 'readProf'],
    indexator:['modIndexation', 'readProf'],
    prof:['readProf']
  }
}

/**
 * Component de gestion des types de contenu "personne".
 * @extends {lassi.Component}
 * @constructor
 */
var personneComponent = lassi.Component('personne');

personneComponent.initialize = function(next) {
  // les roles et permissions en conf
  this.application.settings.personne = settings
  next();
}

/**
 * Récupère une personne (en cache ou en bdd)
 * @param id
 * @param next
 */
personneComponent.load = function(id, next) {
  log.dev('load ' +id)
  var personneCached = lassi.cache.get('personne_' + id)
  if (personneCached) next(null, personneCached)
  else {
    log.dev('personne ' +id +' pas en cache')
    lassi.entity.Personne.match('id').equals(id).grabOne(function (error, personne) {
      log.dev('remonte ', personne)
      if (error) next(error)
      else if (personne) {
        lassi.cache.set('personne_' + id, personne)
        next(null, personne)
      } else {
        next(null, undefined)
      }
    })
  }
}

personneComponent.isAuthenticated = function(context) {
  return context.session.user && context.session.user.id
}

// et on l'exporte
module.exports = personneComponent;
