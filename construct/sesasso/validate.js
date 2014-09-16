'use strict';

var request = require('request')

var uri = '/sesamath/pages/identification_webservice.php'
var defaultHost = 'ssl.sesamath.net'
var defaultAction = 'getInfos'
var defaultTimeout = 10000 // 10s

/**
 * Vérifie un ticket en appelant le serveur SSO et passe le résultat à next
 * @param {string} ticket
 * @param {object} [options] Peut contenir les propriétés
 *   host : utilise le serveur de dev si 'dev'
 *   withGroups : si vrai ramènera aussi les groupes
 *   timeout : fixera le timeout (10s par defaut, 1s mini)
 * @param {function} next appelé avec (error, result)
 * result sera de la forme
 *      id         : sesaUserId,
 *      nom        : "le nom",
 *      prenom     : "le prenom",
 *      email      : "email ou undefined",
 *      profil     : "prof | eleve | undefined",
 *      permissions: "array avec 'corrections' ou vide",
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
 */
module.export = function (ticket, options, next) {
  var host = defaultHost
  var action = defaultAction
  var timeout = defaultTimeout
  if (arguments.length === 2) next = options
  else {
    if (options.host === 'dev') host += ':8443'
    if (options.withGroups) action = 'getInfosGroupes'
    if (options.timeout > 1000) timeout = options.timeout
  }
  var postOptions = {
    url         : 'https://' +host + uri,
    json        : true,
    content_type: 'charset=UTF-8',
    timeout : timeout,
    form        : {
      action       : action,
      ticket_client: ticket
    }
  }
  // analyse du retour du serveur sso
  request.post(postOptions, function (error, response, body) {
    if (error) next(error)
    else if (body.error) next(new Error(body.error))
    else if (!body.id) next(new Error("Le serveur d'authentification n'a pas renvoyé la réponse attendue, " +
        "impossible de valider le ticket transmis"))
    else next(body)
  })
}
