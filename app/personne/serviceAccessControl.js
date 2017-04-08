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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'
var dns = require('dns')
var _ = require('lodash')
var sjtObj = require('sesajstools/utils/object')

var config = require('../config')
var configRessource = require('../ressource/config')

module.exports = function (EntityPersonne, EntityGroupe, $settings, $personneRepository) {
  /**
   * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
   * à la jonction entre personne et ressource.
   * @service $accessControl
   */
  var $accessControl = {}

  /**
   * Helper de checkAccess pour la permission correction
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getCorrectionDeniedMessage (context, ressource) {
    var msg
    var user = $accessControl.getCurrentUser(context)
    if (!user.permissions.create) msg = "Vous n'avez pas de droits suffisants pour créer une ressource"
    else if (!configRessource.typePerso[ressource.type]) msg = "Vous n'avez pas de droits suffisants pour créer une ressource de type " + ressource.type

    return msg
  }

  /**
   * Helper de checkAccess pour la permission create (à n'utiliser qu'avec un user en session)
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getCreateDeniedMessage (context, ressource) {
    var msg
    var user = $accessControl.getCurrentUser(context)
    if (!user || !user.permissions) msg = 'Vous devez être authentifié pour créer une ressource'
    else if (!user.permissions.create) msg = 'Vous n’avez pas de droits suffisants pour créer une ressource'
    else if (!configRessource.typePerso[ressource.type]) msg = "Vous n'avez pas de droits suffisants pour créer une ressource de type " + ressource.type

    return msg
  }

  /**
   * Helper de checkAccess pour la permission createAll
   * @private
   * @param {Context}   context
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getCreateAllDeniedMessage (context) {
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
  function getDeleteDeniedMessage (context, ressource) {
    var msg
    if ($accessControl.isAuteur(context, ressource)) {
      // il est un auteur, faut aussi qu'il soit le seul et que sa ressource soit privée
      // (sinon d'autres peuvent s'en servir)
      if (ressource.auteurs.length > 1) {
        msg = "Vous êtes auteur de cette ressource mais n'êtes pas le seul, vous ne pouvez pas la supprimer"
      } else if (ressource.contributeurs.length) {
        msg = "Vous êtes l'auteur de cette ressource mais il y a d'autres contributeurs, vous ne pouvez plus la supprimer"
      }
      // @todo que fait-on pour les ressources publiques ? Difficile de savoir si qqun l'utilise...
      // else if (ressource.restriction != 2) msg = "Vous êtes l'auteur de cette ressource' +
      //    ' mais elle est partagée avec d'autres, vous ne pouvez plus la supprimer'
    } else {
      msg = "Vous n'avez pas de droits suffisants pour supprimer cette ressource"
    }
    if (msg) {
      log.debug("dans getDeleteDeniedMessage on a le message d'erreur " + msg + ' avec ' +
        (ressource.auteurs && ressource.auteurs.length) + ' auteurs :', ressource.auteurs)
    }

    return msg
  }

  function getDeleteVersionDeniedMessage (context, ressource) {
    // @todo implémenter getDeleteVersionDeniedMessage
    return 'Permission à implémenter'
  }

  function getIndexDeniedMessage (context, ressource) {
    // @todo implémenter getDeleteVersionDeniedMessage
    return 'Permission à implémenter'
  }

  function getPublishDeniedMessage (context, ressource) {
    // @todo implémenter getDeleteVersionDeniedMessage
    return 'Permission à implémenter'
  }

  /**
   * Retourne l'ip du client (la 1re dans la chaine de proxy,
   * ou celle des headers x-real-ip ou x-forwarded-for ou celle de la requete)
   * @private
   * @param context
   * @returns {*}
   */
  function getClientIp (context) {
    // on regarde si par hasard ce serait pas l'ip du proxy
    var ipClient = context.request.ip
    // à priori varnish ou nginx devrait renseigner ça
    if (context.request.headers['x-real-ip']) ipClient = context.request.headers['x-real-ip']
    // sinon on prend la 1re de x-forwarded-for, pas très safe car ça peut être forgé,
    // faudrait plutôt remonter de la fin et éliminer nos ip puis prendre la 1re qui reste
    // mais ça suppose de mettre les ips de nos proxy possible en conf
    else if (context.request.headers['x-forwarded-for']) ipClient = context.request.header('x-forwarded-for').split(',')[0]

    return ipClient
  }

  /**
   * Helper de checkAccess pour la permission read
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string|undefined} Le message d'interdiction éventuel (undefined sinon)
   */
  function getReadDeniedMessage (context, ressource) {
    if (!context) throw new Error('pas de contexte')
    if (!ressource) throw new Error('pas de ressource')
    // nos ips ont le droit de tout lire via l'api
    if (hasAllRights(context)) return

    var msg
    if (ressource.publie) {
      var restriction = $settings.get('components.ressource.constantes.restriction')
      if (ressource.restriction === restriction.aucune) return
      else if (!$accessControl.isAuthenticated(context)) msg = 'Vous devez être authentifié pour consulter cette ressource'
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
            if (ressource.groupes && !_.empty(_.intersection(ressource.groupes, user.groupesMembre))) return
            msg = 'Ressource restreinte'
            break

          // privée
          case restriction.prive:
            if ($accessControl.isAuteur(context, ressource)) return
            if ($accessControl.isContributeur(context, ressource)) return
            msg = 'Ressource privée'
            break

          default:
            msg = 'Restriction non gérée'
        }
      }
    } else {
      // pas publié, faut avoir les droits d'édition pour la voir
      msg = getUpdateDeniedMessage(context, ressource)
      // mais avec un message adapté
      if (msg) msg = 'Ressource non publiée'
    }

    return msg
  }

  /**
   * Helper de checkAccess pour la permission del|update (faut un user authentifié)
   * @private
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {string} Le message d'interdiction éventuel (undefined sinon)
   */
  function getUpdateDeniedMessage (context, ressource) {
    if ($accessControl.isAuteur(context, ressource)) return ''
    else if ($accessControl.isContributeur(context, ressource)) return ''
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
  function getUpdateAuteursDeniedMessage (context, ressource) {
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
  function getUpdateGroupesDeniedMessage (context, ressource) {
    // pour le moment idem update
    return getUpdateDeniedMessage(context, ressource)
  }

  /**
   * Retourne true si l'ip est locale
   * @private
   * @param ip
   * @returns {boolean}
   */
  function isOnLan (ip) {
    // avec pm2 on a du bind ipv6
    return (/^(::ffff:)?(127\.0|192\.168)/.test(ip) || /^::1/.test(ip))
  }

  // ######################
  // Méthodes publiques
  // ######################

  /**
   * Ajoute un token et des valeurs associées en session
   * @param {Context} context
   * @param {string}  [token]
   * @param {*} [value=true] Une ou des valeurs à mettre en session associées au token
   *                      (ne rien passer ici ni à checkToken permet juste de vérifier sa présence)
   * @returns {boolean|string} false si y'avait pas de user connecté, le token sinon
   */
  $accessControl.addToken = function addToken (context, token, value) {
    var retour = $accessControl.isAuthenticated(context)
    if (retour) {
      if (!value) value = true // avec undefined la property n'existe pas, mettre false n'a pas de sens, true parce qu'on veut juste vérifier sa présence
      if (!token) token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
      if (!context.session.tokens) context.session.tokens = {}
      context.session.tokens[token] = value
      retour = token
    }
    return retour
  }

  /**
   * Vérifie que le token en session correspond et le supprime
   * @param {Context} context
   * @param {string} token
   * @param {*} [value=true] La valeur qu'il doit avoir (celle qu'on avait passé à addToken précédemment)
   * @returns {boolean}
   */
  $accessControl.checkToken = function (context, token, value) {
    var retour
    if (!value) value = true
    if (context && token) {
      try {
        retour = sjtObj.isEqual(context.session.tokens[token], value)
        delete context.session.tokens[token]
      } catch (error) {
        retour = false
      }
    }

    return retour
  }

  /**
   * Vérifie la permission pour l'utilisateur courant et cette ressource
   * @param permission
   * @param {Context}       context
   * @param {Ressource}     ressource
   * @param {errorCallback} next (appelé avec un message d'erreur et pas une erreur)
   * @memberOf $accessControl
   */
  $accessControl.checkPermission = function (permission, context, ressource, next) {
    if (
        // pas la peine de continuer si c'est pour voir une ressource publique
        permission === 'read' && ressource.restriction === 0 ||
        // ni si c'est l'api appelée par un de nos serveurs ou qqun ayant tous les droits
        hasAllRights(context) ||
        // ni si l'utilisateur a les droits génériques
        hasGenericPermission(permission, context)
    ) {
      // rien à faire
      next(null, ressource)
    } else {
      var errorMsg
      if ($accessControl.isAuthenticated(context)) {
        // on regarde donc ce user pour cette ressource
        switch (permission) {
          // sinon on délègue suivant la permission
          case 'create':
            errorMsg = getCreateDeniedMessage(context)
            break
          case 'delete':
            errorMsg = getDeleteDeniedMessage(context, ressource, next)
            break
          case 'read':
            errorMsg = getReadDeniedMessage(context, ressource, next)
            break
          case 'update':
            errorMsg = getUpdateDeniedMessage(context, ressource, next)
            break
          default:
            errorMsg = 'Permission ' + permission + ' inconnue, refusée par défaut'
        }
      } else {
        errorMsg = 'Authentification requise'
      }
      next(errorMsg, ressource)
    }
  }

  /**
   * Retourne le pid du user courant ou undefined
   * @param {Context} context
   * @returns {Integer} L'oid
   * @memberOf $accessControl
   */
  $accessControl.getCurrentUserPid = function (context) {
    if (context.session.user) return context.session.user.pid
  }

  /**
   * Retourne le user courant ou undefined
   * @param {Context} context
   * @return {Personne|undefined} Le user
   * @memberOf $accessControl
   */
  $accessControl.getCurrentUser = function (context) {
    if (context.session.user && context.session.user.pid) return context.session.user
  }

  /**
   * Retourne les groupes (membre) du user courant ou undefined
   * @param {Context} context
   * @return {string[]} La liste des noms des groupes dont on est membre
   * @memberOf $accessControl
   */
  $accessControl.getCurrentUserGroupes = function (context) {
    var groupes = []
    if (context.session.user && context.session.user.groupesMembre) groupes = context.session.user.groupesMembre

    return groupes
  }

  /**
   * Retourne les groupes suivis par le user courant
   * @param {Context} context
   * @return {string[]} La liste des noms des groupes que l'on suit (tableau vide si aucun ou pas identifié)
   * @memberOf $accessControl
   */
  $accessControl.getCurrentUserGroupesSuivis = function (context) {
    var groupes = []
    if (context.session.user && context.session.user.groupesSuivis) groupes = context.session.user.groupesSuivis

    return groupes
  }

  /**
   * Retourne la valeur du token en session et le supprime (donc faut choisir entre getToken et checkToken)
   * @param {Context} context
   * @param {string} token
   * @returns {*} La valeur stockée ou undefined si le token n'était pas en session
   */
  $accessControl.getTokenValue = function getTokenValue (context, token) {
    var value
    if (context && token && context.session.tokens && context.session.tokens.hasOwnProperty(token)) {
      value = context.session.tokens[token]
      delete context.session.tokens[token]
    }

    return value
  }

  /**
   * Renvoie true si origine est listé dans les sesalabs en config
   * @param origine
   * @returns {boolean}
   */
  $accessControl.isSesalab = function (origine) {
    return config.sesalabs && config.sesalabs.length && config.sesalabs.some((sesalab) => sesalab.baseUrl === origine)
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
    if ($accessControl.hasRole('admin', context)) return true
    // sinon faut regarder un peu mieux le contexte
    var token = context.request.header('X-ApiToken')
    if (token && context.request.originalUrl.indexOf('/api/') === 0) {
      // on vérifie déjà le token
      if ($settings.get('apiTokens', []).indexOf(token) !== -1) {
        // log.debug('token api ok')
        // token ok donc retour ok si le client a une ip connue
        var ip = getClientIp(context)
        if (config.apiIpsAllowed && config.apiIpsAllowed.indexOf(ip) !== -1) return true
        // ou est local
        if ($accessControl.isLanClient(context)) return true
        log.error('token ok depuis une ip non autorisée ' + ip)
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
  function hasGenericPermission (permission, context) {
    return context &&
           context.session &&
           context.session.user &&
           context.session.user.permissions &&
           context.session.user.permissions[permission]
  }
  $accessControl.hasGenericPermission = hasGenericPermission

  /**
   *
   * @param role
   * @param context
   * @returns {*|data.roles|{}|settings.components.personne.roles|{admin, editeur, indexateur, formateur, acces_correction, eleve}|Object}
   */
  $accessControl.hasRole = function (role, context) {
    return context &&
           context.session &&
           context.session.user &&
           context.session.user.roles &&
           context.session.user.roles[role]
  }

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
        /* eslint-disable no-multi-spaces */
        case 'correction'    : return !getCorrectionDeniedMessage(context)
        case 'create'        : return !getCreateDeniedMessage(context, ressource)
        case 'createAll'     : return !getCreateAllDeniedMessage(context)
        case 'delete'        : return !getDeleteDeniedMessage(context, ressource)
        case 'deleteVersion' : return !getDeleteVersionDeniedMessage(context, ressource)
        case 'index'         : return !getIndexDeniedMessage(context)
        case 'publish'       : return !getPublishDeniedMessage(context)
        case 'read'          : return !getReadDeniedMessage(context)
        case 'update'        : return !getUpdateDeniedMessage(context, ressource)
        case 'updateAuteurs' : return !getUpdateAuteursDeniedMessage(context, ressource)
        case 'updateGroupes' : return !getUpdateGroupesDeniedMessage(context, ressource)
        default: return false
        /* eslint-enable */
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
    return !!(context && context.session && context.session.user && context.session.user.oid > 0) // id=-1 avec une ip locale et un token
  }

  /**
   * Retourne true si l'utilisateur courant est auteur de la ressource
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {boolean|undefined}
   */
  $accessControl.isAuteur = function (context, ressource) {
    const pid = $accessControl.getCurrentUserPid(context)
    return (ressource && ressource.auteurs && ressource.auteurs.indexOf(pid) > -1)
  }

  /**
   * Retourne true si l'utilisateur courant est contributeur de la ressource
   * @param {Context}   context
   * @param {Ressource} ressource
   * @returns {boolean|undefined}
   */
  $accessControl.isContributeur = function (context, ressource) {
    const pid = $accessControl.getCurrentUserPid(context)
    return (ressource && ressource.contributeurs && ressource.contributeurs.indexOf(pid) > -1)
  }

  /**
   * Retourne true si l'utilisateur est membre du groupe
   * @param {Context} context
   * @param {string}  groupeNom
   * @returns {boolean}
   */
  $accessControl.isInGroupe = function (context, groupeNom) {
    var user = $accessControl.getCurrentUser(context)
    return (user.groupesMembre.indexOf(groupeNom) > -1)
  }

  /**
   * Retourne true si le client a une ip locale ou privée
   * @param context
   * @returns {boolean}
   */
  $accessControl.isLanClient = function (context) {
    var ipClient = getClientIp(context)
    // log.debug("isLanClient analyse l'ip " + ipClient)
    return isOnLan(ipClient)
  }

  /**
   * Appelle next avec (error, isLocalOrSesamath), où isLocalOrSesamath vaut true si c'est un client
   * avec une ip locale ou dont le reverse est en (dev)sesamath.net
   * @param {Context} context
   * @param {function} next
   */
  $accessControl.isSesamathClient = function (context, next) {
    var isSesamathClient = $accessControl.isLanClient(context)
    if (isSesamathClient) {
      next(null, true)
    } else {
      var ipClient = getClientIp(context)
      dns.reverse(ipClient, function (error, hostnames) {
        if (error) {
          log.error(error)
          next(new Error('La recherche du reverse de ' + ipClient + ' a échoué'))
        } else {
          var isSesamath = false
          hostnames.forEach(function (hostname) {
            if (/^([^.]+\.)?(dev)?sesamath.net$/.test(hostname)) isSesamath = true
          })
          next(null, isSesamath)
        }
      })
    }
  }

  /**
   * Connecte un user externe (regarde s'il existe et s'il faut le mettre à jour et le met en session)
   * @param {Context}     context
   * @param {Personne}  personne
   * @param {personneCallback}  next
   * @memberOf $accessControl
   */
  $accessControl.login = function (context, personne, next) {
    function setSession (error, personne) {
      if (personne) {
        $personneRepository.setPermissions(personne)
        context.session.user = personne
      } else if (!error) {
        context.session.user = {
          oid: 0,
          _lastCheck: new Date()
        }
      }
      next(error, personne)
    }

    if (personne.origine && personne.idOrigine) $personneRepository.updateOrCreate(personne, setSession)
    else setSession() // on enregistre que l'on sait ne pas être authentifié sur le serveur sso
  }

  /**
   * Connecte un user sesalab (regarde s'il existe et s'il faut le mettre à jour et le met en session)
   * @param {Context} context
   * @param {object}  sesalabUser Le user sesalab à son format
   * @param {string}  domaine     Le domaine du sesalab concerné
   * @param {personneCallback}  next
   * @memberOf $accessControl
   */
  $accessControl.loginFromSesalab = function (context, sesalabUser, domaine, next) {
    function setSession (error, personne) {
      log.debug('setSession error', error)
      log.debug('setSession personne', personne)
      if (personne) {
        $personneRepository.setPermissions(personne)
        context.session.user = personne
      } else if (!error) {
        context.session.user = {
          oid: 0,
          _lastCheck: new Date()
        }
      }
      next(error, personne)
    }

    log.debug('loginFromSesalab avec le domaine ' + domaine + ' et le user', sesalabUser, 'sesasso', {max: 10000})
    if (domaine && sesalabUser.oid) {
      /**
       * @private
       * @type {Personne}
       */
      var personne = {
        nom: sesalabUser.nom,
        prenom: sesalabUser.prenom,
        email: sesalabUser.mail,
        roles: {},
        permissions: {}
      }
      if (sesalabUser.externalId && sesalabUser.externalMech) {
        personne.origine = sesalabUser.externalMech
        personne.idOrigine = sesalabUser.externalId
      } else {
        personne.origine = domaine
        personne.idOrigine = sesalabUser.oid
      }
      if (sesalabUser.type === 1) personne.roles.formateur = true
      if (personne.origine === 'sesasso') personne.roles.acces_correction = true
      // on attend le vrai client sso pour gérer les groupes
      $personneRepository.updateOrCreate(personne, setSession)
    } else {
      next(new Error('Impossible de connecter un utilisateur sesalab sans son domaine et oid (manquant dans la réponse de sesalab)'))
    }
  }

  /**
   * Déconnecte l'utilisateur courant
   * @param {Context} context
   * @memberOf $accessControl
   */
  $accessControl.logout = function (context) {
    log.debug('déconnexion')
    context.session.user = {}
  }

  /**
   * Met à jour le user en session
   * @param {Context} context
   * @param {Personne} personne
   * @return {Personne|undefined} Le user mis à jour (ou l'ancien si les oid correspondait pas)
   * @memberOf $accessControl
   */
  $accessControl.updateCurrentUser = function (context, personne) {
    var old = $accessControl.getCurrentUser(context)
    if (old && personne && old.oid === personne.oid) context.session.user = personne
    else log.error(new Error('updateCurrentUser appelé avec un user qui différent de celui en session'))

    return context.session.user
  }

  /**
   * Rafraîchi la session d'après les données en cache ou en base
   * @param {Context}          context
   * @param {personneCallback} next
   */
  $accessControl.refreshCurrentUser = function (context, next) {
    if (!$accessControl.isAuthenticated(context)) return next(new Error('refreshCurrentUser appelé sans session'))
    var pid = $accessControl.getCurrentUserPid(context)
    $personneRepository.load(pid, function (error, user) {
      if (error) {
        next(error)
      } else if (user) {
        context.session.user = user
        next(null, user)
      } else {
        error = new Error('L’utilisateur ' + pid + ' a été supprimé depuis l’ouverture de la session')
        log.error(error)
        next(error)
      }
    })
  }

  return $accessControl
}
