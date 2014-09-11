'use strict';
/**
 * Component personne
 */

var _ = require('underscore')._

/** Durée de cache, 1h par défaut, sera écrasé par config.components.personne.cacheTTL s'il existe */
var cacheTTL = 3600

/** lien éventuel à ajouter au message accessDenied, initialisé d'après la conf s'il existe */
var connectLink = ''

/**
 * Component de gestion des types de contenu "personne".
 * @extends {lassi.Component}
 * @constructor
 */
var personneComponent = lassi.Component('personne');

personneComponent.initialize = function(next) {
  // l'export de notre config/index.js
  var config = this.application.settings
  if (config.components && config.components.personne && config.components.personne.connectLink)
    connectLink = config.components.personne.connectLink
  if (config.components && config.components.personne && config.components.personne.cacheTTL)
    cacheTTL = lassi.main.encadre(config.components.personne.cacheTTL, 60, 12*3600,
        'ttl de cache par défaut pour les entities personne')
  log('ttl du cache personne fixé à ' +cacheTTL)
  next();
}

/**
 * Récupère une personne (en cache ou en bdd)
 * @param id
 * @param next
 */
personneComponent.load = function(id, next) {
  log.dev('load ' +id)
  lassi.cache.get('personne_' + id, function(error, personneCached) {
    if (personneCached) next(null, personneCached)
    else {
      lassi.entity.Personne.match('id').equals(id).grabOne(function (error, personne) {
        //log.dev('personne load remonte ', personne)
        if (error) next(error)
        else if (personne) {
          lassi.cache.set('personne_' + id, personne, cacheTTL)
          next(null, personne)
        } else {
          next(null, undefined)
        }
      })
    }
  })
}

/**
 * Ce qui suit est lié à la gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
 * C'est à la jonction entre personne et ressource, et utilise le contexte
 */


/**
 * Redirige vers accessDenied si l'utilisateur courant n'a pas la permission demandée pour la ressource
 * (et appelle next avec la ressource sinon)
 * @param permission
 * @param {Context} ctx
 * @param {Ressource} ressource
 * @param {Function} next callback qui sera appelée si tout va bien (avec la ressource qu'on nous a donné)
 */
personneComponent.checkPermission = function (permission, ctx, ressource, next) {
  var msg = getDeniedMessage(permission, ctx, ressource, next)
  if (msg) ctx.accessDenied(msg)
  else next(ressource)
}


/**
 * Retourne true si l'utilisateur courant a la permission demandée sur cette ressource
 * (ou sur toutes les ressources si ressource n'est pas fournie)
 * @param {string} permission
 * @param {Context} ctx
 * @param {Ressource=} ressource
 * @returns {boolean}
 */
personneComponent.hasPermission = function (permission, ctx, ressource) {
  if (hasGenericPermission(permission, ctx)) return true
  if (!ressource) return false

  // read n'a pas forcément besoin de session
  if (permission === 'read') return personneComponent.hasReadPermission(ctx, ressource)

  if (!personneComponent.isAuthenticated(ctx)) return false
  else switch (permission) {
    case 'add'  : return (getAddDeniedMessage(ctx) === '')
    case 'del'  : return (getDelDeniedMessage(ctx, ressource) === '')
    case 'write': return (getWriteDeniedMessage(ctx, ressource) === '')
    default: return false
  }
}

/**
 * Renvoie true si cette ressource est visible par l'utilisateur courant
 * (helper de hasPermission qui peut s'utiliser directement)
 * @param {Context} ctx
 * @param {Ressource} ressource
 * @returns {boolean}
 */
personneComponent.hasReadPermission = function (ctx, ressource) {
  if (!ressource.restriction) return true
  if (!personneComponent.isAuthenticated(ctx)) return false
  if (hasGenericPermission('read', ctx)) return true
  return (getReadDeniedMessage(ctx, ressource) === '')
}

/**
 * Retourne true si on a un user en session
 * @param {Context} ctx
 * @returns {boolean}
 */
personneComponent.isAuthenticated = function (ctx) {
  return (ctx.session && ctx.session.user && ctx.session.user.id > 0) // id=-1 avec une ip locale
}


/**
 * Récupère un groupe d'après son nom
 * @param {string} groupeNom
 * @param {EntityInstance~StoreCallback} next
 */
personneComponent.loadGroupeByNom = function (groupeNom, next) {
  lassi.cache.get('groupeByNom_' +groupeNom, function (error, groupe) {
    if (groupe) return next(null, groupe)
    lassi.entity.Groupe.match('nom').equals(groupeNom).grabOne(function (error, groupe) {
      if (error) return next(error)
      if (groupe) {
        lassi.cache.set('groupe_' +groupe.id, groupe, cacheTTL)
        lassi.cache.set('groupeByNom_' +groupe.nom, groupe, cacheTTL)
        return next(null, groupe)
      }
      next(null, null)
    })
  })
}

/**
 * Récupère un groupe d'après son id (si erreur on la log)
 * @param {int} id
 * @param {EntityInstance~StoreCallback} next
 */
personneComponent.loadGroupe = function (groupeId, next) {
  if (parseInt(groupeId, 10) !== groupeId) return next(new Error("Type mismatch, groupe.id doit être entier"))
  lassi.cache.get('groupe_' +groupeId, function(error, groupe) {
    if (groupe) return next(null, groupe)
    lassi.entity.Groupe.match('id').equals(groupeId).grabOne(function (error, groupe) {
      if (error) log.error(error)
      if (groupe) {
        lassi.cache.set('groupe_' +groupeId, groupe, cacheTTL)
        lassi.cache.set('groupeByNom_' +groupe.nom, groupe, cacheTTL)
      }
      next(error, groupe)
    })
  })
}



module.exports = personneComponent

/**
 * Retourne true si le user en session a la permission générique demandée
 * @param {Context} ctx
 * @param {string} permission
 * @returns {boolean}
 */
function hasGenericPermission(permission, ctx) {
  givePermOursServers(ctx)
  return ctx &&
      ctx.session &&
      ctx.session.user &&
      ctx.session.user.permissions &&
      ctx.session.user.permissions[permission]
}

/**
 * Retourne le message d'interdiction (s'il n'y en a pas c'est autorisé)
 * @param permission
 * @param ctx
 * @param ressource
 * @param next
 * @returns {string|undefined}
 */
function getDeniedMessage(permission, ctx, ressource, next) {
  var msg
  // pas la peine de continuer si c'est pour voir une ressource publique
  if (permission === 'read' && ressource.restriction === 0) {next(ressource); return }
  // ou si l'utilisateur a les droits génériques
  if (hasGenericPermission(permission, ctx)) {next(ressource); return }

  if (!personneComponent.isAuthenticated(ctx)) msg = "Authentification requise" +connectLink
  // sinon on délègue suivant la permission
  else switch (permission) {
    case 'add':
      msg = getAddDeniedMessage(ctx); break;
    case 'del':
      msg = getDelDeniedMessage(ctx, ressource); break;
    case 'read':
      msg = getReadDeniedMessage(ctx, ressource); break;
    case 'write':
      msg = getWriteDeniedMessage(ctx, ressource); break;
    default:
      msg = "Permission " + permission + " inconnue, refusée par défaut"
  }
  return msg
}

/**
 * Helper de getDeniedMessage pour la permission add
 * @param {Context}   ctx
 * @returns {string} Le message d'interdiction éventuel (undefined sinon)
 */
function getAddDeniedMessage(ctx) {
  if (!ctx.session.user.permissions || ! ctx.session.user.permissions.add)
    return "Vous n'avez pas de droits suffisants pour créer une ressource"
}

/**
 * Helper de getDeniedMessage pour la permission del
 * @param {Context}   ctx
 * @param {Ressource} ressource
 * @returns {string} Le message d'interdiction éventuel (undefined sinon)
 */
function getDelDeniedMessage(ctx, ressource) {
  // on regarde si c'est l'auteur
  if (_.contains(ressource.auteurs, ctx.session.user.id)) {
    // il est un auteur, faut aussi qu'il soit le seul et que sa ressource soit privée
    // (sinon d'autres peuvent s'en servir)
    if (ressource.auteurs.length > 1) return "Vous êtes auteur de cette ressource mais n'êtes pas le seul," +
        " vous ne pouvez pas la supprimer"
    else if (ressource.contributeurs.length) return "Vous êtes l'auteur de cette ressource" +
        " mais il y a d'autres contributeurs, vous ne pouvez pas la supprimer"
    else if (ressource.restriction != 2) return "Vous êtes l'auteur de cette ressource" +
        " mais elle est partagée avec d'autres, vous ne pouvez plus la supprimer"
  } else {
    return "Vous n'avez pas de droits suffisants pour effacer cette ressource"
  }
}

/**
 * Helper de getDeniedMessage pour la permission read
 * @param {Context}   ctx
 * @param {Ressource} ressource
 * @returns {string|undefined} Le message d'interdiction éventuel (undefined sinon)
 */
function getReadDeniedMessage(ctx, ressource) {
  switch (ressource.restriction) {
    // public
    case 0: return

    // prof
    case 1:
      if (hasGenericPermission('readProf', ctx)) return
      else return "Vous n'avez pas de droits suffisants pour consulter cette ressource"
      break //inutile mais évite à jshint de râler

    // privée
    case 2:
      if (_.contains(ressource.auteurs, ctx.session.user.id)) return
      if (_.contains(ressource.contributeurs, ctx.session.user.id)) return
      return "Ressource privée"
      // @todo gérer les partages par groupes
      break //inutile mais évite à jshint de râler

    default: return "restriction non gérée"
  }
}

/**
 * Helper de getDeniedMessage pour la permission del
 * @param {Context}   ctx
 * @param {Ressource} ressource
 * @returns {string} Le message d'interdiction éventuel (undefined sinon)
 */
function getWriteDeniedMessage(ctx, ressource) {
  // on regarde si c'est l'auteur
  if (_.contains(ressource.auteurs, ctx.session.user.id)) return
  // un contributeur
  if (_.contains(ressource.contributeurs, ctx.session.user.id)) return
  // pour le moment tout le reste est interdit
  return "Vous n'avez pas de droits suffisants pour modifier cette ressource"
}

/**
 * Ajoute un user d'id -1 en session avec tout les droits si l'ip du client est locale
 * @param ctx
 */
function givePermOursServers(ctx) {
  if (!ctx || !ctx.session) throw new Error("Il faut une session")
  if (!ctx.session.user || !ctx.session.user.id) {
    // log.dev('req', ctx.request)
    var fake = {id:-1, permissions:{read:true, add:true, del:true, write:true}} // un user bidon pour nos serveurs
    if (ctx.request && ctx.request._remoteAddress) {
      var ip = ctx.request._remoteAddress
      if (ip === '127.0.0.1' || ip.indexOf('192.168') === 0) ctx.session.user = fake
    }
  }
}
