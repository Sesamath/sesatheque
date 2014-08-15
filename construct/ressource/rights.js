'use strict';

/**
 * Module de verification des droits
 * Lié à la liste de permissions du composant personne
 */

var _ = require('underscore')._

var rights = {}

/**
 * Redirige vers accessDenied si l'utilisateur courant n'a pas la permission demandée pour la ressource
 * (et appelle next avec la ressource sinon)
 * @param permission
 * @param {Context} ctx
 * @param {Ressource} ressource
 * @param {Function} next callback qui sera appelée si tout va bien (avec la ressource qu'on nous a donné)
 */
rights.checkPermission = function (permission, ctx, ressource, next) {
  var msg

  // pas la peine de continuer si c'est pour voir une ressource publique
  if (permission === 'read' && ressource.restriction === 0) {next(ressource); return }
  // ou si l'utilisateur a les droits génériques
  if (rights.hasGenericPermission(permission, ctx)) {next(ressource); return }

  if (!rights.isAuthenticated(ctx)) msg = "Authentification requise"
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
  if (msg) ctx.accessDenied(msg)
  else next(ressource)
}

/**
 * Retourne true si l'utilisateur courant a la permission demandée sur cette ressource
 * @param permission
 * @param ctx
 * @param ressource
 * @returns {boolean}
 */
rights.hasPermission = function (permission, ctx, ressource) {
  if (rights.hasGenericPermission(permission, ctx)) return true

  // read n'a pas forcément besoin de session
  if (permission === 'read') return rights.hasReadPermission(ctx, ressource)

  if (!rights.isAuthenticated(ctx)) return false
  else switch (permission) {
    case 'add'  : return (getAddDeniedMessage(ctx) === '')
    case 'del'  : return (getDelDeniedMessage(ctx, ressource) === '')
    case 'write': return (getWriteDeniedMessage(ctx, ressource) === '')
    default: return false
  }
}

/**
 * Retourne true si le user en session a la permission générique demandée
 * @param {Context} ctx
 * @param {string} permission
 * @returns {boolean}
 */
rights.hasGenericPermission = function (permission, ctx) {
  if (!rights.isAuthenticated(ctx)) return false
  return (ctx.session.user.permissions && ctx.session.user.permissions[permission])
}

/**
 * Renvoie true si cette ressource est visible par l'utilisateur courant
 * @param ctx
 * @param ressource
 * @returns {boolean}
 */
rights.hasReadPermission = function (ctx, ressource) {
  if (!ressource.restriction) return true
  if (!rights.isAuthenticated(ctx)) return false
  if (rights.hasGenericPermission('read', ctx)) return true
  return (getReadDeniedMessage(ctx, ressource) === '')
}

/**
 * Retourne true si on a un user en session
 * @param {Context} ctx
 * @returns {boolean}
 */
rights.isAuthenticated = function (ctx) {
  return (ctx.session.user && ctx.session.user.id)
}

module.exports = rights

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
      if (rights.hasGenericPermission('readProf', ctx)) return
      else return "Vous n'avez pas de droits suffisants pour consulter cette ressource"
      break //inutile mais évite à jshint de râler

    // privée
    case 2:
      if (_.contains(ressource.auteurs, ctx.session.user.id)) return
      else if (_.contains(ressource.contributeurs, ctx.session.user.id)) return
      else return "Ressource privée"
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
  if (ressource.auteurs.indexOf(ctx.session.user.id) > -1) return
  // un contributeur
  if (ressource.contributeurs.indexOf(ctx.session.user.id) > -1) return
  // pour le moment tout le reste est interdit
  return "Vous n'avez pas de droits suffisants pour modifier cette ressource"
}
