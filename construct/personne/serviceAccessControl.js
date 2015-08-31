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

'use strict'

module.exports = function (EntityPersonne, EntityGroupe, $settings, $personneRepository) {

  var _ = require('lodash')
  var tools = require('../tools')

  var configRessource = require("../ressource/config")

  /**
   * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
   * à la jonction entre personne et ressource.
   * @service $accessControl
   */
  var $accessControl = {}

  /**
   * Helper de checkAccess pour la permission create (à n'utiliser qu'avec un user en session)
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getCreateDeniedMessage(context, ressource) {
    var msg
    var user = $accessControl.getCurrentUser(context)
    if (!user.permissions.create) msg = "Vous n'avez pas de droits suffisants pour créer une ressource"
    else if (!configRessource.listes.typePerso[ressource.typeTechnique]) msg = "Vous n'avez pas de droits suffisants pour créer une ressource de type " +ressource.typeTechnique

    return msg
  }

  /**
   * Helper de checkAccess pour la permission createAll
   * @private
   * @param {Context}   context
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getCreateAllDeniedMessage(context) {
    var msg
    var user = $accessControl.getCurrentUser(context)
    if (!user.permissions.createAll) msg = "Vous n'avez pas de droits suffisants pour créer une ressource"

    return msg
  }

  /**
   * Helper de checkAccess pour la permission delete
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getDeleteDeniedMessage(context, ressource) {
    var msg
    var userOid = $accessControl.getCurrentUserOid(context)
    if (_.contains(ressource.auteurs, userOid)) {
      // il est un auteur, faut aussi qu'il soit le seul et que sa ressource soit privée
      // (sinon d'autres peuvent s'en servir)
      if (ressource.auteurs.length > 1)
          msg = "Vous êtes auteur de cette ressource mais n'êtes pas le seul, vous ne pouvez pas la supprimer"
      else if (ressource.contributeurs.length) msg = "Vous êtes l'auteur de cette ressource" +
          " mais il y a d'autres contributeurs, vous ne pouvez pas la supprimer"
      else if (ressource.restriction != 2) msg = "Vous êtes l'auteur de cette ressource" +
          " mais elle est partagée avec d'autres, vous ne pouvez plus la supprimer"
    } else {
      msg = "Vous n'avez pas de droits suffisants pour supprimer cette ressource"
    }

    return msg
  }

  /**
   * Helper de checkAccess pour la permission read
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string|undefined} Le message d'interdiction éventuel (undefined sinon)
   */
  function getReadDeniedMessage(context, ressource) {
    // nos ips ont le droit de tout lire via l'api
    if (hasAllRights(context)) return

    var msg
    if (ressource.publie) {
      var restriction = $settings.get('components.ressource.constantes.restriction')
      if (ressource.restriction === restriction.aucune) return
      else if (!$accessControl.isAuthenticated(context)) msg = "Vous devez être authentifié pour consulter cette ressource"
      else {
        var user = $accessControl.getCurrentUser(context)
        switch (ressource.restriction) {
          // public
          case restriction.aucune:
            return

          // correction
          case restriction.correction:
            if (hasGenericPermission('correction', context)) return
            else msg = "Vous n'avez pas de droits suffisants pour consulter cette ressource"
            break

          // réservée au groupe
          case restriction.groupe:
            if ($accessControl.isAuteur(context, ressource)) return
            if ($accessControl.isContributeur(context, ressource)) return
            if (ressource.groupes && !_.empty(_.intersection(ressource.groupes, user.groupes))) return
            msg = "Ressource restreinte"
            break

          // privée
          case restriction.prive:
            if ($accessControl.isAuteur(context, ressource)) return
            if ($accessControl.isContributeur(context, ressource)) return
            msg = "Ressource privée"
            break

          default:
            msg = "Restriction non gérée"
        }
      }
    } else {
      // pas publié, faut avoir les droits d'édition pour la voir
      msg = getUpdateDeniedMessage(context, ressource)
      // mais avec un message adapté
      if (msg) msg = "Ressource non publiée"
    }

    return msg
  }

  /**
   * Calcule et renvoie les permissions d'une personne en fonction de ses rôles
   * @private
   * @param {Personne} personne
   * @returns {Object} avec les permissions en propriété (valeur true|false|undefined)
   */
  function getPermissions(personne) {
    var permissions = {}
    var config = $settings.get('components.personne')
    _.each(personne.roles, function(hasRole, role) {
      // on ajoute les permissions définies pour ce role en config
      if (hasRole && config.roles[role]) tools.merge(permissions, config.roles[role])
    })

    return permissions
  }

  /**
   * Helper de checkAccess pour la permission del|update (faut un user authentifié)
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getUpdateDeniedMessage(context, ressource) {
    if ($accessControl.isAuteur(context, ressource)) return
    else if ($accessControl.isContributeur(context, ressource)) return
    // pour le moment tout le reste est interdit
    else return "Vous n'avez pas de droits suffisants pour modifier cette ressource"
  }

  /**
   * Helper de checkAccess pour la permission updateAuteurs
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getUpdateAuteursDeniedMessage(context, ressource) {
    var msg
    if (!$accessControl.isAuteur(context, ressource)) msg = "Vous ne pouvez pas modifier les auteurs ou contributeur si vous n'êtes pas auteur de la ressource"
    return msg
  }

  /**
   * Helper de checkAccess pour la permission updateGroupes
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getUpdateGroupesDeniedMessage(context, ressource) {
    // pour le moment idem update
    return getUpdateDeniedMessage(context, ressource)
  }

  /**
   * Retourne true si l'ip est locale
   * @private
   * @param ip
   * @returns {boolean}
   */
  function isOnLan(ip) {
    // avec pm2 on a du bind ipv6
    if (/^(::ffff:)?(127\.0|192\.168)/.exec(ip)) return true
    if (/^::1/.exec(ip)) return true
    return false
  }

  /**
   * Ajoute un groupe d'après son id à une personne (s'il existe)
   * @param {Personne} personne
   * @param {string} groupeNom
   * @param {personneCallback} next Avec la personne modifiée
   * @memberOf $accessControl
   */
  $accessControl.addGroupeById = function (personne, groupeNom, next) {
    if (!personne.groupes[groupeNom]) {
      $personneRepository.loadGroupe(groupeNom, function (error, groupe) {
        if (error) next(error)
        else {
          if (groupe) personne.groupes[groupeNom] = true
          else log.error("Aucun groupe d'id " +groupeNom)
          next(null, personne)
        }
      })
    }
  }

  /**
   * Ajoute un groupe à la personne (en le créant s'il n'existait pas)
   * @param {Personne} personne
   * @param {string} groupeNom Le nom
   * @param {groupeCallback} next
   * @memberOf $accessControl
   */
  $accessControl.addGroupeByName = function (personne, groupeNom, next) {
    $personneRepository.loadGroupeByNom(groupeNom, function (error, groupe) {
      if (error) {
        next(error, personne)
      } else if (groupe) {
        personne.groupes[groupe.oid] = true
        next(null, personne)
      } else {
        // on le créé au passage
        EntityGroupe.create({nom:groupeNom}).store(function (error, groupe) {
          log.debug('après store ', groupe)
          if (groupe) personne.groupes[groupe.oid] = true
          next(error, personne)
        })
      }
    })
  }

  /**
   * Vérifie la permission pour l'utilisateur courant et cette ressource
   * @param permission
   * @param {Context}       context
   * @param {Ressource}     ressource
   * @param {errorCallback} next
   * @memberOf $accessControl
   */
  $accessControl.checkPermission = function (permission, context, ressource, next) {
    var msg
    // pas la peine de continuer si c'est pour voir une ressource publique
    if (permission === 'read' && ressource.restriction === 0 ||
        // ni si c'est l'api appelée par un de nos serveurs ou qqun ayant tous les droits
        hasAllRights(context) ||
        // ni si l'utilisateur a les droits génériques
        hasGenericPermission(permission, context)
    ) {
      next(null, ressource)
    } else if (!$accessControl.isAuthenticated(context)) {
      next("Authentification requise")
    } else {
      // on regarde donc ce user pour cette ressource
      switch (permission) {
        // sinon on délègue suivant la permission
        case 'create':
          msg = getCreateDeniedMessage(context); break
        case 'delete':
          msg = getDeleteDeniedMessage(context, ressource, next); break
        case 'read':
          msg = getReadDeniedMessage(context, ressource, next); break
        case 'update':
          msg = getUpdateDeniedMessage(context, ressource, next); break
        default:
          msg = "Permission " + permission + " inconnue, refusée par défaut"
      }
      next(msg)
    }
  }

  /**
   * Retourne l'oid du user courant ou undefined
   * @param {Context} context
   * @returns {Integer} L'oid
   * @memberOf $accessControl
   */
  $accessControl.getCurrentUserOid = function(context) {
    var oid
    if (context.session.user && context.session.user.oid) oid = context.session.user.oid

    return oid
  }

  /**
   * Retourne le user courant ou undefined
   * @param {Context} context
   * @return {Personne|undefined} Le user
   * @memberOf $accessControl
   */
  $accessControl.getCurrentUser = function(context) {
    var personne
    if (context.session.user && context.session.user.oid) personne = context.session.user

    return personne
  }

  /**
   * Retourne la liste de ressources fournie expurgée de celles que l'on a pas le droit de voir
   * @param {Context} context
   * @param {Ressource[]} ressources Liste de ressources
   * @return {Ressource[]} Liste de ressources sur lesquelles on a les droits de lecture
   * @memberOf $accessControl
   */
  $accessControl.getListeLisible = function (context, ressources) {
    var liste = []
    if (ressources && ressources.length) {
      ressources.forEach(function (ressource) {
        if ($accessControl.hasReadPermission(context, ressource)) liste.push(ressource)
      })
    }

    return liste
  }

  /**
   * Renvoie true si c'est du json (api) appelé par une ip locale
   * @see http://expressjs.com/guide/behind-proxies.html
   * @see http://expressjs.com/api.html#req.ip
   * @param {Context} context
   * @memberOf $accessControl
   */
  $accessControl.hasAllRights = function (context) {
    var token = context.request.header('X-ApiToken')
    log("token " +token)
    if (token && context.request.originalUrl.indexOf('/api/') === 0) {
      // on vérifie déjà le token
      if ($settings.get('apiTokens', []).indexOf(token) > -1) {
        // token ok on vérifie l'ip
        var ip = context.request.ip
        log("token ok dans hasAllRights avec l'ip " + ip)
        if (isOnLan(ip)) {
          // on regarde si par hasard ce serait pas l'ip du proxy
          var ipClient = ip
          if (context.ips && context.ips.length) ipClient = context.ips[0]
          else if (context.request.headers['x-real-ip']) ipClient = context.request.headers['x-real-ip']
          else if (context.request.headers['x-forwarded-for'])
            ipClient = context.request.header('x-forwarded-for').split(',')[0]
          if (ipClient && ipClient !== ip) log.debug("L'appli est derrière un proxy mais trust proxy n'a pas été déclaré")

          return isOnLan(ipClient)
        }
      }

    }

    return false
  }
  // alias
  var hasAllRights = $accessControl.hasAllRights

  /**
   * Retourne true si le user en session a la permission générique demandée
   * @param {Context} context
   * @param {string} permission
   * @returns {boolean}
   * @memberOf $accessControl
   */
  $accessControl.hasGenericPermission = function(permission, context) {
    return context &&
           context.session &&
           context.session.user &&
           context.session.user.permissions &&
           context.session.user.permissions[permission]
  }
  var hasGenericPermission = $accessControl.hasGenericPermission

  /**
   * Retourne true si l'utilisateur courant a la permission demandée sur cette ressource
   * (ou sur toutes les ressources si ressource n'est pas fournie)
   * @param {string} permission create|read|update|delete
   * @param {Context}   context
   * @param {Ressource} [ressource]
   * @returns {boolean}
   * @memberOf $accessControl
   */
  $accessControl.hasPermission = function (permission, context, ressource) {
    if (hasGenericPermission(permission, context)) return true
    if (hasAllRights(context)) return true
    if (!ressource) return false

    // read n'a pas forcément besoin de session, ça dépend de la ressource
    if (permission === 'read') return $accessControl.hasReadPermission(context, ressource)

    if ($accessControl.isAuthenticated(context)) {
      switch (permission) {
        case 'createAll' : return (getCreateAllDeniedMessage(context) === '')
        case 'create' : return (getCreateDeniedMessage(context, ressource) === '')
        case 'delete' : return (getDeleteDeniedMessage(context, ressource) === '')
        case 'update' : return (getUpdateDeniedMessage(context, ressource) === '')
        case 'updateAuteurs' : return (getUpdateAuteursDeniedMessage(context, ressource) === '')
        case 'updateGroupes' : return (getUpdateGroupesDeniedMessage(context, ressource) === '')
        default: return false
      }
    } else {
      return false
    }
  }

  /**
   * Renvoie true si cette ressource est visible par l'utilisateur courant
   * (helper de hasPermission qui peut s'utiliser directement)
   * @param {Context} context
   * @param {Ressource} ressource
   * @returns {boolean}
   * @memberOf $accessControl
   */
  $accessControl.hasReadPermission = function (context, ressource) {
    if (!ressource.restriction) return true
    if (hasAllRights(context)) return true
    if (!$accessControl.isAuthenticated(context)) return false
    if (hasGenericPermission('read', context) && ressource.publie) return true
    return (!getReadDeniedMessage(context, ressource))
  }

  /**
   * Retourne true si on a un user en session
   * @param {Context} context
   * @returns {boolean}
   * @memberOf $accessControl
   */
  $accessControl.isAuthenticated = function (context) {
    return (context.session && context.session.user && context.session.user.oid > 0) // id=-1 avec une ip locale et un token
  }

  /**
   * Retourne true si l'utilisateur courant est auteur de la ressource
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {boolean|undefined}
   */
  $accessControl.isAuteur = function (context, ressource) {
    var userOid = $accessControl.getCurrentUserOid(context)
    return (ressource && ressource.auteurs && ressource.auteurs.indexOf(userOid) > -1)
  }

  /**
   * Retourne true si l'utilisateur courant est contributeur de la ressource
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {boolean|undefined}
   */
  $accessControl.isContributeur = function (context, ressource) {
    var userOid = $accessControl.getCurrentUserOid(context)
    return (ressource && ressource.contributeurs && ressource.contributeurs.indexOf(userOid) > -1)
  }

  /**
   * Retourne true si l'utilisateur est dans le groupe
   * @param {Context} context
   * @param {string}  groupeNom
   * @returns {boolean}
   */
  $accessControl.isInGroupe = function (context, groupeNom) {
    var user = $accessControl.getCurrentUser(context)
    return (user.groupes.indexOf(groupeNom) > -1)
  }

  /**
   * Connecte un user (regarde s'il existe et s'il faut le mettre à jour et le met en session)
   * @param {Context}     context
   * @param {Personne}  personne
   * @param {personneCallback}  next
   * @memberOf $accessControl
   */
  $accessControl.login = function (context, personne, next) {
    function setSession (error, personne) {
      if (personne) {
        personne.permissions = getPermissions(personne)
        context.session.user = personne;
      } else if (!error) {
        context.session.user = {
          oid:0,
          lastCheck : new Date()
        }
      }
      next(error, personne)
    }

    if (personne.origine && personne.idOrigine) $personneRepository.update(personne, setSession)
    else setSession(null, personne) // on enregistre que l'on sait ne pas être authentifié sur le serveur sso
  }

  /**
   * Connecte un user sesalab (regarde s'il existe et s'il faut le mettre à jour et le met en session)
   * @param {Context} context
   * @param {object}  sesalabUser
   * @param {string}  domaine     Le domaine du sesalab concerné
   * @param {personneCallback}  next
   * @memberOf $accessControl
   */
  $accessControl.loginFromSesalab = function (context, sesalabUser, domaine, next) {
    function setSession (error, personne) {
      log.debug("setSession error", error)
      log.debug("setSession personne", personne)
      if (personne) {
        personne.permissions = getPermissions(personne)
        context.session.user = personne;
      } else if (!error) {
        context.session.user = {
          oid:0,
          lastCheck : new Date()
        }
      }
      next(error, personne)
    }

    log.debug("loginFromSesalab avec le user", sesalabUser, "sesasso", {max:10000})
    if (domaine && sesalabUser.oid) {
      var data = {
        nom : sesalabUser.nom,
        prenom : sesalabUser.prenom,
        email : sesalabUser.mail,
        roles : {},
        permissions : {},
        groupes : {}
      }
      if (sesalabUser.externalId && sesalabUser.externalMech) {
        data.origine = sesalabUser.externalMech
        data.idOrigine = sesalabUser.externalId
      } else {
        data.origine = domaine
        data.idOrigine = sesalabUser.oid
      }
      if (sesalabUser.type === 1) data.roles.prof = true
      if (data.origine === "sesasso") data.roles.acces_correction = true
      if (sesalabUser.groupes) sesalabUser.groupes.forEach(function (groupe) {
        data.groupes[groupe] = true
      })
      var personne = EntityPersonne.create(data)
      personne.permissions = getPermissions(personne)
      $personneRepository.update(personne, setSession)
    } else {
      next(new Error("Impossible de connecter un utilisateur sesalab sans domaine et oid"))
    }
  }

  /**
   * Déconnecte l'utilisateur courant
   * @param {Context} context
   * @memberOf $accessControl
   */
  $accessControl.logout = function (context) {
    context.session.user = {}
  }

  return $accessControl
}
