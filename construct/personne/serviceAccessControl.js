/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict';

var _ = require('underscore')._

/**
 * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
 * à la jonction entre personne et ressource.
 * @namespace $accessControl
 */
var $accessControl = {}


/**
 * Retourne true si le user en session a la permission générique demandée
 * @param {Context} context
 * @param {string} permission
 * @returns {boolean}
 */
function hasGenericPermission(permission, context) {
  return context &&
      context.session &&
      context.session.user &&
      context.session.user.permissions &&
      context.session.user.permissions[permission]
}

/**
 * Retourne le message d'interdiction (s'il n'y en a pas c'est autorisé)
 * @param permission
 * @param context
 * @param ressource
 * @param next
 * @returns {string|undefined}
 */
function getDeniedMessage(permission, context, ressource, next) {
  var msg
  // pas la peine de continuer si c'est pour voir une ressource publique
  if (permission === 'read' && ressource.restriction === 0 ||
        // ni si c'est l'api appelée par un de nos serveurs
      isOurServerOnApi(context) ||
        // ni si l'utilisateur a les droits génériques
      hasGenericPermission(permission, context)
  ) {
    next(ressource)
    return
  }
  // on regarde donc ce user pour cette ressource
  if (!personneComponent.isAuthenticated(context)) msg = "Authentification requise" +connectLink
  // sinon on délègue suivant la permission
  else switch (permission) {
    case 'create':
      msg = getCreateDeniedMessage(context); break;
    case 'delete':
      msg = getDeleteDeniedMessage(context, ressource); break;
    case 'read':
      msg = getReadDeniedMessage(context, ressource); break;
    case 'update':
      msg = getUpdateDeniedMessage(context, ressource); break;
    default:
      msg = "Permission " + permission + " inconnue, refusée par défaut"
  }
  return msg
}

/**
 * Helper de getDeniedMessage pour la permission add
 * @param {Context}   context
 * @returns {string} Le message d'interdiction éventuel (undefined sinon)
 */
function getCreateDeniedMessage(context) {
  if (!context.session.user.permissions || ! context.session.user.permissions.add)
    return "Vous n'avez pas de droits suffisants pour créer une ressource"
}

/**
 * Helper de getDeniedMessage pour la permission del
 * @param {Context}   context
 * @param {Ressource} ressource
 * @returns {string} Le message d'interdiction éventuel (undefined sinon)
 */
function getDeleteDeniedMessage(context, ressource) {
  // on regarde si c'est l'auteur
  if (_.contains(ressource.auteurs, context.session.user.id)) {
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
 * @param {Context}   context
 * @param {Ressource} ressource
 * @returns {string|undefined} Le message d'interdiction éventuel (undefined sinon)
 */
function getReadDeniedMessage(context, ressource) {
  if (isOurServerOnApi(context)) return
  var restriction = lassi.settings.ressource.constantes.restriction
  switch (ressource.restriction) {
    // public
    case restriction.aucune: return

    // correction
    case restriction.correction:
      if (hasGenericPermission('correction', context)) return
      else return "Vous n'avez pas de droits suffisants pour consulter cette ressource"
      break //inutile mais évite à jshint de râler

    // réservée au groupe
    case restriction.groupe:
      if (_.contains(ressource.auteurs, context.session.user.id)) return
      if (_.contains(ressource.contributeurs, context.session.user.id)) return
      if (ressource.parametres.allow && ressource.parametres.allow.groupes &&
          !_.empty(_.intersection(ressource.parametres.allow.groupes, context.session.user.groupes))) return
      return "Ressource restreinte"
      break

    // privée
    case restriction.prive:
      if (_.contains(ressource.auteurs, context.session.user.id)) return
      if (_.contains(ressource.contributeurs, context.session.user.id)) return
      return "Ressource privée"
      break

    default: return "restriction non gérée"
  }
}

/**
 * Helper de getDeniedMessage pour la permission del
 * @param {Context}   context
 * @param {Ressource} ressource
 * @returns {string} Le message d'interdiction éventuel (undefined sinon)
 */
function getUpdateDeniedMessage(context, ressource) {
  // on regarde si c'est l'auteur
  if (_.contains(ressource.auteurs, context.session.user.id)) return
  // un contributeur
  if (_.contains(ressource.contributeurs, context.session.user.id)) return
  // pour le moment tout le reste est interdit
  return "Vous n'avez pas de droits suffisants pour modifier cette ressource"
}

/**
 * Renvoie true si c'est du json (api) appelé par une ip locale
 * @param context
 */
function isOurServerOnApi(context) {
  if (context.responseFormat && context.responseFormat === 'json' && context.request && context.request._remoteAddress) {
    var ip = context.request._remoteAddress
    return (ip === '127.0.0.1' || ip.indexOf('192.168') === 0)
  } else {
    return false
  }
}

/**
 * Redirige vers accessDenied si l'utilisateur courant n'a pas la permission demandée pour la ressource
 * (et appelle next avec la ressource sinon)
 * @param permission
 * @param {Context} context
 * @param {Ressource} ressource
 * @param {Function} next callback qui sera appelée si tout va bien (avec la ressource qu'on nous a donné)
 */
$accessControl.checkPermission = function (permission, context, ressource, next) {
  var msg = getDeniedMessage(permission, context, ressource, next)
  if (msg) context.accessDenied(msg)
  else next(ressource)
}


/**
 * Retourne true si l'utilisateur courant a la permission demandée sur cette ressource
 * (ou sur toutes les ressources si ressource n'est pas fournie)
 * @param {string} permission create|read|update|delete
 * @param {Context} context
 * @param {Ressource=} ressource
 * @returns {boolean}
 */
$accessControl.hasPermission = function (permission, context, ressource) {
  if (hasGenericPermission(permission, context)) return true
  if (isOurServerOnApi(context)) return true
  if (!ressource) return false

  // read n'a pas forcément besoin de session
  if (permission === 'read') return personneComponent.hasReadPermission(context, ressource)

  if (!personneComponent.isAuthenticated(context)) return false
  else switch (permission) {
    case 'create' : return (getCreateDeniedMessage(context) === '')
    case 'delete' : return (getDeleteDeniedMessage(context, ressource) === '')
    case 'update' : return (getUpdateDeniedMessage(context, ressource) === '')
    default: return false
  }
}

/**
 * Renvoie true si cette ressource est visible par l'utilisateur courant
 * (helper de hasPermission qui peut s'utiliser directement)
 * @param {Context} context
 * @param {Ressource} ressource
 * @returns {boolean}
 */
$accessControl.hasReadPermission = function (context, ressource) {
  if (!ressource.restriction) return true
  if (isOurServerOnApi(context)) return true
  if (!personneComponent.isAuthenticated(context)) return false
  if (hasGenericPermission('read', context)) return true
  return (getReadDeniedMessage(context, ressource) === '')
}

/**
 * Retourne true si on a un user en session
 * @param {Context} context
 * @returns {boolean}
 */
$accessControl.isAuthenticated = function (context) {
  return (context.session && context.session.user && context.session.user.id > 0) // id=-1 avec une ip locale
}

module.exports = $accessControl
