'use strict';

/**
 * @file Module js commun aux applis qui utilisent le SSO Sésamath
 * Chaque appli aura son composant lassi qui utilisera ce module pour récupérer les urls du SSO et valider les tickets
 */

var request = require('request')
// la conf pour récupérer le staging
var appConfig = require('../../config')
// le host, on ajoute :8443 si on est en dev
var prodSso = 'https://ssl.sesamath.net'
var devSso  = prodSso + ':8443'
var hostSso = (appConfig && appConfig.application.staging !== lassi.Staging.production) ? devSso : prodSso

var urlAuth = '/sesamath/pages/identification.php'
var urlDeco = '/sesamath/pages/identification_deconnexion.php'
var urlWs = '/sesamath/pages/identification_webservice.php'

var defaultAction = 'getInfos'
var defaultTimeout = 10000 // 10s

/**
 * Vérifie un ticket en appelant le serveur SSO et passe le résultat à next
 * @param {string} ticket
 * @param {object} [options] Peut contenir les propriétés (0 ou 1)
 *   timeout : fixera le timeout (10s par defaut, 1s mini)
 *   envSso  : prod|dev pour forcer le sso de prod ou dev (sinon déterminé par le staging de l'appli)
 *   groupes : ramènera aussi les groupes
 *   structures : ramènera aussi les structures
 * @param {function} next appelé avec (error, result)
 * result sera de la forme
 *      id         : sesaUserId,
 *      nom        : "le nom",
 *      prenom     : "le prenom",
 *      email      : "email ou undefined",
 *      roles      : objet avec les rôles en propriétés (valeur booléenne)
 * avec éventuellement (si options.structures)
 *      structures : [
 *        {
 *          id         : sesaStructureId,
 *          type       : "(CLG, LGT, etc)",
 *          categorie  : "(ecole | college | lycee ou undefined",
 *          nom        : "nom etab",
 *          moisPurge  : "le mois pour la purge des infos élèves",
 *          commune    : "nom",
 *          latitude   : enDegre,
 *          longitude  : enDegre,
 *          departement: "nom",
 *          pays       : "nom"
 *        }
 *      ]
 * et aussi éventuellement (si options.groupes)
 *      groupes : [groupe1,groupe2,etc.]
 *      roles   : [role1,role2,etc.]
 *
 * groupes peut contenir
 *      wiki_interne_*             (cf user_acces_asso.sesamath_wiki_interne_groupes pour les valeurs de *)
 *      interface_collaborative_*  (cf user_acces_collabo.sesamath_interface_collaborative)
 *      wiki_externe_*             (cf user_acces_collabo.sesamath_wiki_externe_groupes)
 *      mathenpoche_developpeur_*  (cf user_acces_collabo.sesamath_mathenpoche_developpeur)
 * roles peut contenir
 *      eleve, prof, acces_correction
 * mais aussi (si options.groupes)
 *      sesamath_gestionnaire, sesamath_conseil_administration, sesamath_salarie, sesamath_membre, sesamath_dezoneur
 */
function validate(ticket, options, next) {
  var action = defaultAction
  var timeout = defaultTimeout
  var actionOptions = {}
  var host = hostSso
  if (arguments.length === 2) next = options
  else {
    // y'a des options
    // timeout
    if (options.timeout > 1000) timeout = options.timeout
    // quel sso ?
    if (options.envSso === 'dev') host = devSso
    else if (options.envSso === 'prod') host = prodSso
    // options pour l'action
    actionOptions.groupes = options.groupes || 0;
    actionOptions.structures  = options.structures || 0;
  }
  var postOptions = {
    url         : host + urlWs,
    json        : true,
    content_type: 'charset=UTF-8',
    timeout : timeout,
    form        : {
      action       : action,
      options      : actionOptions,
      ticket_client: ticket
    }
  }
  // analyse du retour du serveur sso
  request.post(postOptions, function (error, response, body) {
    if (error) next(error)
    else if (body.error) next(new Error(body.error))
    else if (!body.id) {
      log.error('réponse de sso sans id')
      log.dev('réponse de sso au validate', body)
      next(new Error("Le serveur d'authentification n'a pas renvoyé la réponse attendue, " +
          "impossible de valider le ticket transmis"))
    }
    else next(null, body)
  })
}

/**
 * Renvoie l'url du sso vers laquelle rediriger le navigateur pour le login
 * @param urlApplication
 * @param urlDeconnexion
 * @param statutRequis
 * @returns {string}
 */
function getUrlConnexion(urlApplication, urlDeconnexion, statutRequis) {
  if (!statutRequis) statutRequis = 'Prof_Valide'
  return hostSso + urlAuth + '?statut_requis=' +statutRequis +
    '&motif=identification_requise' +
    '&url_application=' +urlApplication +
    '&url_deconnexion=' +urlDeconnexion
}

/**
 * Renvoie l'url du sso vers laquelle rediriger le navigateur pour le logout
 * (après déconnexion locale, pour déconnecter du sso et des éventuelles autres applis)
 * @returns {string}
 */
function getUrlDeconnexion() {
  return hostSso + urlDeco
}

module.exports = {
  validate : validate,
  getUrlConnexion : getUrlConnexion,
  getUrlDeconnexion : getUrlDeconnexion
}