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
const dns = require('dns')
const ip = require('ip')
const { hasProp } = require('sesajstools')
const sjtObj = require('sesajstools/utils/object')

const config = require('../config')
const configRessource = require('../ressource/config')

const sanitizeSearchFactory = require('./serviceAccessControl.search')

module.exports = function (component) {
  component.service('$accessControl', function (EntityPersonne, EntityGroupe, $settings, $personneRepository) {
    // le service groupe que l'on ne peut pas mettre en dépendances (il dépend de nous)
    let $groupe

    // fonctions privées

    /**
     * Helper de checkAccess pour la permission correction
     * @private
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getCorrectionDeniedMessage (context, ressource) {
      const user = getCurrentUser(context)
      if (!user || !user.permissions) return 'Vous devez être authentifié pour visualiser une correction'
      if (!user.permissions.correction) return "Vous n'avez pas de droits suffisants pour visualiser cette correction"
      return ''
    }

    /**
     * Helper de checkAccess pour la permission create (à n'utiliser qu'avec un user en session)
     * @private
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getCreateDeniedMessage (context, ressource) {
      const user = getCurrentUser(context)
      if (!user || !user.permissions) return 'Vous devez être authentifié pour créer une ressource'
      if (!user.permissions.create) return 'Vous n’avez pas de droits suffisants pour créer une ressource'
      if (user.permissions.createAll) return ''
      if (configRessource.typePerso[ressource.type]) return ''
      return `Vous n'avez pas de droits suffisants pour créer une ressource de type ${ressource.type}`
    }

    /**
     * Helper de checkAccess pour la permission createAll
     * @private
     * @param {Context}   context
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getCreateAllDeniedMessage (context) {
      const user = getCurrentUser(context)
      if (!user.permissions.createAll) return 'Vous n’avez pas de droits suffisants pour créer une ressource'
      return ''
    }

    /**
     * Helper de checkAccess pour la permission delete
     * @private
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getDeleteDeniedMessage (context, ressource) {
      if (isAuteur(context, ressource)) {
        // si c'est un alias dont il est l'auteur il peut le virer
        if (ressource.rid && ressource.aliasOf) return ''
        // il est un auteur, faut aussi qu'il soit le seul et que sa ressource soit privée
        // (sinon d'autres peuvent s'en servir)
        if (ressource.auteurs.length > 1) return 'Vous êtes auteur de cette ressource mais n’êtes pas le seul, vous ne pouvez pas la supprimer'
        if (ressource.contributeurs.length) return 'Vous êtes l’auteur de cette ressource mais il y a d’autres contributeurs, vous ne pouvez plus la supprimer'
        // @todo que fait-on pour les ressources publiques ? Difficile de savoir si qqun l'utilise...
        // else if (ressource.restriction != 2) msg = "Vous êtes l'auteur de cette ressource' +
        //    ' mais elle est partagée avec d'autres, vous ne pouvez plus la supprimer'
      } else {
        return 'Vous n’avez pas de droits suffisants pour supprimer cette ressource'
      }
      return ''
    }

    function getDeleteVersionDeniedMessage (context, ressource) {
      // @todo implémenter getDeleteVersionDeniedMessage
      return 'Permission à implémenter'
    }

    /**
     * Helper de checkAccess pour la permission index
     * @private
     * @param {Context} context
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getIndexDeniedMessage (context, ressource) {
      const user = getCurrentUser(context)
      if (!user || !user.permissions) return 'Vous devez être authentifié pour indexer une ressource'
      if (user.permissions.index) return ''
      return 'Vous n’avez pas de droits suffisants pour indexer une ressource'
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
      let ipClient = context.request.ip
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
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string|undefined} Le message d'interdiction éventuel (string vide sinon)
     */
    function getReadDeniedMessage (context, ressource) {
      if (!context) throw new Error('pas de contexte')
      if (!ressource) throw new Error('pas de ressource')
      // nos ips ont le droit de tout lire via l'api
      if (hasAllRights(context)) return ''
      if (ressource.publie) {
        const restriction = $settings.get('components.ressource.constantes.restriction')
        if (ressource.restriction === restriction.aucune) return ''
        if (!isAuthenticated(context)) return 'Vous devez être authentifié pour consulter cette ressource'
        switch (ressource.restriction) {
          // public
          case restriction.aucune:
            return ''

          // correction
          case restriction.correction:
            if (hasGenericPermission('correction', context)) return ''
            return 'Vous n’avez pas de droits suffisants pour consulter cette ressource'

          // réservée au groupe
          case restriction.groupe:
            if (isAuteur(context, ressource)) return ''
            if (isContributeur(context, ressource)) return ''
            if (isInGroupes(context, ressource)) return ''
            if (isInGroupesAuteurs(context, ressource)) return ''
            return 'Ressource restreinte'

          // privée
          case restriction.prive:
            if (isAuteur(context, ressource)) return
            if (isContributeur(context, ressource)) return
            if (isInGroupesAuteurs(context, ressource)) return ''
            return 'Ressource privée'

          default:
            return 'Restriction non gérée'
        }
      } else {
        // pas publié, faut avoir les droits d'édition pour la voir
        // mais avec un message adapté
        if (getUpdateDeniedMessage(context, ressource)) return 'Ressource non publiée (il faut le droit d’édition pour la voir)'
      }

      return ''
    }

    /**
     * Helper de checkAccess pour la permission del|update (faut un user authentifié)
     * @private
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getUpdateDeniedMessage (context, ressource) {
      // même avec tous les droits, on ne peut pas éditer un alias
      // (ça le forkerait, faut pas le faire pour les types non éditables)
      if (ressource.aliasOf && !configRessource.editable[ressource.type]) return `Les alias de type ${ressource.type} ne sont pas modifiables`
      if (hasAllRights(context)) return
      if (isAuteur(context, ressource)) return ''
      if (isContributeur(context, ressource)) return ''
      if (isInGroupesAuteurs(context, ressource)) return ''
      // pour le moment tout le reste est interdit
      return 'Vous n’avez pas de droits suffisants pour modifier cette ressource'
    }

    /**
     * Helper de checkAccess pour la permission updateAuteurs
     * @private
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getUpdateAuteursDeniedMessage (context, ressource) {
      if (ressource.aliasOf) throw new Error('Modifier les groupes qui peuvent modifier un alias n’a pas de sens')
      if (isAuteur(context, ressource)) return ''
      if (isInGroupesAuteurs(context, ressource)) return ''
      return 'Vous ne pouvez pas modifier les auteurs ou contributeur si vous n’êtes pas auteur de la ressource'
    }

    /**
     * Helper de checkAccess pour la permission updateGroupes
     * @private
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     */
    function getUpdateGroupesDeniedMessage (context, ressource) {
      if (ressource.aliasOf) throw new Error('Modifier les groupes d’un alias n’a pas de sens')
      // pour le moment idem update
      return getUpdateDeniedMessage(context, ressource)
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
    function addToken (context, token, value) {
      let retour = isAuthenticated(context)
      if (retour) {
        if (!value) value = true // avec undefined la property n’existe pas, mettre false n'a pas de sens, true parce qu'on veut juste vérifier sa présence
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
    function checkToken (context, token, value) {
      let retour
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
     * @param {errorCallback} next appelé avec (error, ressource) où error est une string si y'a un pb de droit (rien sinon)
     * @memberOf $accessControl
     */
    function checkPermission (permission, context, ressource, next) {
      if (
        // pas la peine de continuer si c'est pour voir une ressource publique
        (permission === 'read' && ressource.restriction === 0) ||
        // ni si c'est l'api appelée par un de nos serveurs ou qqun ayant tous les droits
        hasAllRights(context) ||
        // ni si l'utilisateur a les droits génériques
        hasGenericPermission(permission, context)
      ) {
        // rien à faire
        next(null, ressource)
      } else {
        let errorMsg
        if (isAuthenticated(context)) {
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
     * Retourne le user courant ou undefined
     * @param {Context} context
     * @return {Personne|undefined} Le user
     * @memberOf $accessControl
     */
    function getCurrentUser (context) {
      if (context.session.user && context.session.user.pid) return context.session.user
    }

    /**
     * Retourne l'oid du user courant ou undefined
     * @param {Context} context
     * @returns {string} L'oid
     * @memberOf $accessControl
     */
    function getCurrentUserOid (context) {
      if (context.session.user) return context.session.user.oid
    }

    /**
     * Retourne le pid du user courant ou undefined
     * @param {Context} context
     * @returns {string} Le pid
     * @memberOf $accessControl
     */
    function getCurrentUserPid (context) {
      if (context.session.user) return context.session.user.pid
    }

    /**
     * Retourne les groupes (membre) du user courant ou undefined d'après la session
     * (à jour pour les modifs faites par l'utilisateur, mais pas celles faites par un externe,
     * peut donc contenir un groupe supprimé ou bien il peut manquer un groupe si son
     * admin a ajouté le user depuis le début de sa session
     * @todo remplacer ça par un $groupesByUser qui maintienne une liste toujours à jour
     * @param {Context} context
     * @return {string[]} La liste des noms des groupes dont on est membre
     * @memberOf $accessControl
     */
    function getCurrentUserGroupesMembre (context) {
      return (context.session.user && context.session.user.groupesMembre)
        ? context.session.user.groupesMembre
        : []
    }

    /**
     * Retourne les groupes suivis par le user courant
     * @param {Context} context
     * @return {string[]} La liste des noms des groupes que l'on suit (tableau vide si aucun ou pas identifié)
     * @memberOf $accessControl
     */
    function getCurrentUserGroupesSuivis (context) {
      return (context.session.user && context.session.user.groupesSuivis)
        ? context.session.user.groupesSuivis
        : []
    }

    /**
     * Retourne une chaîne vide si l'utilisateur courant a la permission demandée sur cette ressource
     * ou le message de rejet
     * @param {string} permission create|read|update|delete
     * @param {Context}   context
     * @param {Ressource} [ressource]
     * @returns {string} Le message d'interdiction éventuel (string vide sinon)
     * @memberOf $accessControl
     */
    function getDeniedMessage (permission, context, ressource) {
      // bypass sauf pour update d'alias
      if (permission !== 'update' || !ressource.aliasOf) {
        if (hasGenericPermission(permission, context)) return ''
        if (hasAllRights(context)) return ''
      }
      switch (permission) {
        /* eslint-disable no-multi-spaces */
        case 'correction'    :
          return getCorrectionDeniedMessage(context)
        case 'create'        :
          return getCreateDeniedMessage(context, ressource)
        case 'createAll'     :
          return getCreateAllDeniedMessage(context)
        case 'delete'        :
          return getDeleteDeniedMessage(context, ressource)
        case 'deleteVersion' :
          return getDeleteVersionDeniedMessage(context, ressource)
        case 'index'         :
          return getIndexDeniedMessage(context)
        case 'publish'       :
          return getPublishDeniedMessage(context)
        case 'read'          :
          return getReadDeniedMessage(context)
        case 'update'        :
          return getUpdateDeniedMessage(context, ressource)
        case 'updateAuteurs' :
          return getUpdateAuteursDeniedMessage(context, ressource)
        case 'updateGroupes' :
          return getUpdateGroupesDeniedMessage(context, ressource)
        /* eslint-enable */
        default:
          return `permission ${permission} non gérée`
      }
    }

    /**
     * Retourne la valeur du token en session et le supprime (donc faut choisir entre getToken et checkToken)
     * @param {Context} context
     * @param {string} token
     * @returns {*} La valeur stockée ou undefined si le token n'était pas en session
     */
    function getTokenValue (context, token) {
      let value
      if (context && token && context.session.tokens && hasProp(context.session.tokens, token)) {
        value = context.session.tokens[token]
        delete context.session.tokens[token]
      }

      return value
    }

    /**
     * Renvoie true si c'est du json (api) appelé par une ip locale
     * @see http://expressjs.com/guide/behind-proxies.html
     * @see http://expressjs.com/api.html#req.ip
     * @param {Context} context
     * @memberOf $accessControl
     */
    function hasAllRights (context) {
      if (hasRole('admin', context)) return true
      // sinon faut regarder un peu mieux le contexte
      const token = decodeURIComponent(context.request.header('X-ApiToken') || '')
      if (token && context.request.originalUrl.indexOf('/api/') === 0) {
        // on vérifie déjà le token
        if ($settings.get('apiTokens', []).includes(token)) {
          log.debug('token api ok')
          // token ok donc retour ok si le client a une ip connue
          const ip = getClientIp(context)
          if (config.apiIpsAllowed && config.apiIpsAllowed.indexOf(ip) !== -1) return true
          // ou est local
          if (isLanClient(context)) return true
          log.error('token ok depuis une ip non autorisée ' + ip)
        } else {
          log.error(`token ${token} non autorisé`)
        }
      }

      return false
    }

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

    /**
     * Retourne true si l'utilisateur courant a la permission demandée sur cette ressource
     * (ou sur toutes les ressources si ressource n'est pas fournie)
     * @param {string} permission create|read|update|delete
     * @param {Context}   context
     * @param {Ressource} [ressource]
     * @returns {boolean}
     * @memberOf $accessControl
     */
    function hasPermission (permission, context, ressource) {
      // cas particulier sur l'update d'un alias, faut pas de bypass
      if (permission === 'update' && ressource.aliasOf && isAuthenticated(context)) return !getDeniedMessage(permission, context, ressource)
      if (hasGenericPermission(permission, context)) return true
      if (hasAllRights(context)) return true
      if (!ressource) return false

      // read n'a pas forcément besoin de session, ça dépend de la ressource
      if (permission === 'read') return hasReadPermission(context, ressource)

      if (isAuthenticated(context)) return !getDeniedMessage(permission, context, ressource)
      return false
    }

    /**
     * Renvoie true si cette ressource est visible par l'utilisateur courant
     * (helper de hasPermission qui peut s'utiliser directement)
     * @param {Context} context
     * @param {Ressource} ressource
     * @returns {boolean}
     * @memberOf $accessControl
     */
    function hasReadPermission (context, ressource) {
      const needLog = ['59a05e8264b08a66b5c344ba', '696'].includes(ressource.oid)
      if (!ressource.restriction) return true
      if (hasAllRights(context)) return true
      if (!isAuthenticated(context)) return false
      if (hasGenericPermission('read', context) && ressource.publie) return true
      if (needLog) console.log(`hasReadPermission pour ${ressource.oid}`, getReadDeniedMessage(context, ressource))
      return (!getReadDeniedMessage(context, ressource))
    }

    /**
     *
     * @param role
     * @param context
     * @returns {*|data.roles|{}|settings.components.personne.roles|{admin, editeur, indexateur, formateur, acces_correction, eleve}|Object}
     */
    function hasRole (role, context) {
      return context &&
        context.session &&
        context.session.user &&
        context.session.user.roles &&
        context.session.user.roles[role]
    }

    /**
     * Retourne true si on a un user en session
     * @param {Context} context
     * @returns {boolean}
     * @memberOf $accessControl
     */
    function isAuthenticated (context) {
      return !!(context && context.session && context.session.user && context.session.user.oid && context.session.user.oid !== -1) // id=-1 avec une ip locale et un token
    }

    /**
     * Retourne true si l'utilisateur courant est auteur de la ressource
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {boolean|undefined}
     */
    function isAuteur (context, ressource) {
      const pid = getCurrentUserPid(context)
      return (ressource && ressource.auteurs && ressource.auteurs.includes(pid))
    }

    /**
     * Retourne true si l'utilisateur courant est contributeur de la ressource
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {boolean|undefined}
     */
    function isContributeur (context, ressource) {
      const pid = getCurrentUserPid(context)
      return (ressource && ressource.contributeurs && ressource.contributeurs.includes(pid))
    }

    /**
     * Retourne true si on est membre du groupe
     * @private
     * @param context
     * @param {string} groupeNom Le nom du groupe
     * @returns {boolean}
     */
    function isGroupeMembre (context, groupeNom) {
      if (!$groupe) $groupe = lassi.service('$groupe')
      return context.session.user &&
        context.session.user.groupesMembre &&
        context.session.user.groupesMembre.length &&
        context.session.user.groupesMembre.some(n => $groupe.areEquals(n, groupeNom))
    }

    /**
     * Retourne true si on suit ce groupe
     * @private
     * @param context
     * @param {string|Groupe} groupe Le groupe ou son nom
     * @returns {boolean}
     */
    function isGroupeSuivi (context, groupeNom) {
      if (!$groupe) $groupe = lassi.service('$groupe')
      return context.session.user &&
        context.session.user.groupesSuivis &&
        context.session.user.groupesSuivis.length &&
        context.session.user.groupesSuivis.some(n => $groupe.areEquals(n, groupeNom))
    }

    /**
     * Retourne true si l'utilisateur courant est membre d'un des groupes de la ressource
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {boolean}
     */
    function isInGroupes (context, ressource) {
      if (ressource && ressource.groupes && ressource.groupes.length) {
        return ressource.groupes.some(groupeNom => isGroupeMembre(context, groupeNom))
      }
      return false
    }

    /**
     * Retourne true si l'utilisateur courant est membre d'un des groupes auteurs de la ressource
     * @param {Context}   context
     * @param {Ressource} ressource
     * @returns {boolean}
     */
    function isInGroupesAuteurs (context, ressource) {
      if (ressource && ressource.groupesAuteurs && ressource.groupesAuteurs.length) {
        return ressource.groupesAuteurs.some(groupeNom => isGroupeMembre(context, groupeNom))
      }
      return false
    }

    /**
     * Retourne true si le client a une ip locale ou privée
     * @param context
     * @returns {boolean}
     */
    function isLanClient (context) {
      const ipClient = getClientIp(context)
      // log.debug("isLanClient analyse l'ip " + ipClient)
      return ip.isPrivate(ipClient)
    }

    /**
     * Retourne true si la ressource est publique
     * @param {Ressource|Ref} ressource
     * @returns {boolean}
     */
    function isPublic (ressource) {
      if (ressource.public) return true
      if (ressource.publie && !ressource.restriction) return true
      return false
    }

    /**
     * Appelle next avec (error, isLocalOrSesamath), où isLocalOrSesamath vaut true si c'est un client
     * avec une ip locale ou dont le reverse est en (dev)sesamath.net
     * @param {Context} context
     * @param {function} next
     */
    function isSesamathClient (context, next) {
      const isSesamathClient = isLanClient(context)
      if (isSesamathClient) {
        next(null, true)
      } else {
        const ipClient = getClientIp(context)
        dns.reverse(ipClient, function (error, hostnames) {
          if (error) {
            log.error(error)
            next(new Error('La recherche du reverse de ' + ipClient + ' a échoué'))
          } else {
            let isSesamath = false
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
    function login (context, personne, next) {
      function setSession (error, personne) {
        // met en session le user ou un objet {oid:0} pour mettre en session le fait qu'on est pas authentifié
        if (personne) context.session.user = personne
        else if (!error) context.session.user = {oid: 0, _lastCheck: new Date()}
        next(error, personne)
      }

      if (personne.pid) $personneRepository.updateOrCreate(personne, setSession)
      else setSession() // on enregistre que l'on sait ne pas être authentifié sur le serveur sso
    }

    /**
     * Connecte un user sesalab (regarde s'il existe et s'il faut le mettre à jour et le met en session)
     * @param {Context} context
     * @param {object}  sesalabUser Le user sesalab à son format
     * @param {string}  baseId      La baseId du sesalab concerné
     * @param {personneCallback}  next
     * @memberOf $accessControl
     */
    function loginFromSesalab (context, sesalabUser, baseId, next) {
      function setSession (error, personne) {
        log.debug('setSession error', error)
        log.debug('setSession personne', personne)
        if (error) return next(error)
        context.session.user = personne || {oid: 0, _lastCheck: new Date()}
        next(null, personne)
      }

      log.debug('loginFromSesalab avec baseId ' + baseId + ' et le user', sesalabUser, 'sesasso', {max: 10000})
      if (baseId && sesalabUser.oid) {
        /**
         * @private
         * @type {Personne}
         */
        const personne = {
          nom: sesalabUser.nom,
          prenom: sesalabUser.prenom,
          email: sesalabUser.mail,
          roles: {},
          permissions: {}
        }
        if (sesalabUser.externalId && sesalabUser.externalMech) {
          personne.pid = sesalabUser.externalMech + '/' + sesalabUser.externalId
        } else {
          personne.pid = baseId + '/' + sesalabUser.oid
        }
        if (sesalabUser.type === 1) personne.roles.formateur = true
        if (personne.origine === 'sesasso') personne.roles.acces_correction = true
        // on attend le vrai client sso pour gérer les groupes
        $personneRepository.updateOrCreate(personne, setSession)
      } else {
        next(new Error('Impossible de connecter un utilisateur sesalab sans baseId et oid (manquant dans la réponse de sesalab)'))
      }
    }

    /**
     * Déconnecte l'utilisateur courant
     * @param {Context} context
     * @memberOf $accessControl
     */
    function logout (context) {
      log.debug('déconnexion')
      context.session.user = {}
    }

    /**
     * Rafraîchi la session d'après les données en cache ou en base
     * @param {Context}          context
     * @param {personneCallback} next
     */
    function refreshCurrentUser (context, next) {
      if (!isAuthenticated(context)) return next(new Error('refreshCurrentUser appelé sans session'))
      const pid = getCurrentUserPid(context)
      $personneRepository.load(pid, function (error, user) {
        if (error) return next(error)
        if (!user) {
          error = new Error(`L’utilisateur ${pid} a été supprimé depuis l’ouverture de la session`)
          log.error(error)
          return next(error)
        }
        // on a bien le user
        context.session.user = user
        next(null, user)
      })
    }

    /**
     * Met à jour le user en session
     * @param {Context} context
     * @param {Personne} personne
     * @return {Personne|undefined} Le user mis à jour (ou l'ancien si les oid correspondait pas)
     * @memberOf $accessControl
     */
    function updateCurrentUser (context, personne) {
      const old = getCurrentUser(context)
      if (old && personne && old.oid === personne.oid) context.session.user = personne
      else log.error(new Error('updateCurrentUser appelé avec un user qui différent de celui en session'))

      return context.session.user
    }

    /**
     * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
     * à la jonction entre personne et ressource.
     * @service $accessControl
     */
    const $accessControl = {
      addToken,
      checkToken,
      checkPermission,
      getCurrentUser,
      getCurrentUserOid,
      getCurrentUserPid,
      getCurrentUserGroupesMembre,
      getCurrentUserGroupesSuivis,
      getDeniedMessage,
      getReadDeniedMessage,
      getTokenValue,
      hasAllRights,
      hasGenericPermission,
      hasPermission,
      hasReadPermission,
      hasRole,
      isAuthenticated,
      isAuteur,
      isContributeur,
      isGroupeMembre,
      isGroupeSuivi,
      isInGroupes,
      isInGroupesAuteurs,
      isLanClient,
      isPublic,
      isSesamathClient,
      login,
      loginFromSesalab,
      logout,
      refreshCurrentUser,
      updateCurrentUser
    }

    // on ajoute les méthodes isolées dans leur helper
    $accessControl.sanitizeSearch = sanitizeSearchFactory($accessControl)

    return $accessControl
  })
}
