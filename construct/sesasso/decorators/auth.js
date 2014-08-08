/**
 * Ce décorateur est utilisé pour récupérer le ?connexion ou le ?deconnexion
 *
 * principe de l'authentification Sésamath
 * redirect vers https://ssl.sesamath.net/pages/identification.php?
 *   statut_requis=<statut>
 *   &motif=identification_requise
 *   &url_application=<urlRetourIciAvecTicket>
 *   &url_deconnexion=<urlRappelLogoutIci>
 *
 * Au retour, pour valider le ticket dans l'url on appelle
 * POST https://ssl.sesamath.net/sesamath/pages/identification_webservice.php
 * avec
 * action = tester|recuperer
 regenerer = 0|pas de param  // pour récupérer le ticket définitif
 ticket_client = <ticket>
 */
'use strict'

var request = require('request')
var _ = require('underscore')._
var PersonneSso = require('../PersonneSso')
// faut aller chercher la conf car lassi.application est pas dispo dans le do
var appConfig = require('../../../config')

var urlAuth = '/sesamath/pages/identification.php'
var urlDeco = '/sesamath/pages/identification_deconnexion.php'
var urlWs = '/sesamath/pages/identification_webservice.php'
var hostAuth = 'https://ssl.sesamath.net'
if (appConfig.application.staging !== lassi.Staging.production) hostAuth += ':8443'

module.exports = lassi.Decorator('auth')
    .renderTo('authBloc')
    .do(function(ctx, next) {
      var urlSso = hostAuth

      // log.dev('request', ctx.request)

      if (ctx.get.hasOwnProperty('ticket')) {
        if (ctx.session.user && ctx.session.user.id) {
          if (!ctx.session.flash) ctx.session.flash = {}
          if (!ctx.session.flash.warnings) ctx.session.flash.warnings = []
          ctx.session.flash.warnings.push("Utilisateur déjà connecté, ticket passé en paramètre ignoré")
          ctx.redirect(getMyUrl(ctx))
        } else {
          checkTicket(ctx, next)
        }

      } else if (ctx.get.hasOwnProperty('connexion')) {
        // connexion
        if (!ctx.session.user || !ctx.session.user.id) {
          // faut aller chercher un ticket
          urlSso += urlAuth +'?statut_requis=Prof_Valide' +
              '&motif=identification_requise' +
              '&url_application=' +getMyUrl(ctx, true) +
              '&url_deconnexion=' +
                encodeURIComponent('http://' +ctx.request.headers.host +ctx.url('personne.deconnexion'))
          ctx.redirect(urlSso)
        } else {
          // sinon on redirige vers la page courante sans ce param car on est déjà connecté
          ctx.redirect(getMyUrl(ctx))
        }

      } else if (ctx.get.hasOwnProperty('deconnexion')) {
        // deconnexion, on renvoie vers le host sso
        ctx.redirect(urlSso + urlDeco)

      } else {
        // on fait notre boulot de décorateur std pour alimenter le bloc user
        next(null, {user:ctx.session.user});
      }
    });

/**
 * Renvoie l'url courante, débarassée de ses arguments non voulus
 * @param {Context} ctx     Le contexte
 * @param {boolean} encoded [optional] passer true pour récupérer la chaine après encodeURIComponent
 */
function getMyUrl(ctx, encoded) {
  var myUrl = 'http://' +ctx.request.headers.host
  var queryString = ''
  myUrl += ctx.request.url.replace(/\?.*/, '') // sans la queryString
  // on laisse tomber l'application de 3 RegExp pour une boucle sur les éventuels arguments hors ceux à enlever
  // myUrl += ctx.request.url.replace(/connexion(=[^&]*)?\&?/, '')...
  // on ajoute la suite en enlevant les éventuels params  connexion, ticket et deconnexion
  _.each(ctx.get, function(value, key) {
    if (key !== 'connexion' && key !== 'deconnexion' && key !== 'ticket')
        queryString += (queryString === '' ? '?' : '&') +key +'=' +value
  })
  log.dev(ctx.request.url, myUrl + queryString)

  return encoded ? encodeURIComponent(myUrl + queryString) : myUrl + queryString
}

/**
 * Vérifie un ticket en appelant le serveur SSO, enregistre les infos retournées si ok et met le user en session
 * @param ctx
 * @param next
 */
function checkTicket(ctx, next) {
  if (!ctx.get.ticket) return
  var options = {
    url : hostAuth + urlWs,
    json: true,
    //body: JSON.stringify({ressource:ressource}),
    content_type: 'charset=UTF-8',
    form: {
      action:'recuperer',
      json:1,
      ticket_client:ctx.get.ticket
    }
  }
  log.dev('On poste pour valider le ticket')
  request.post(options, function (error, response, body) {
    var personneSso
    //log.dev('On récupère', body)
    try {
      if (error) throw error
      if (body.error) throw new Error(body.error)
      if (!body.SSO) throw new Error("Le serveur d'authentification n'a pas renvoyé la réponse attendue, " +
        "impossible de valider le ticket transmis")
      personneSso = new PersonneSso(body.SSO)
      if (!personneSso.id) throw new Error("Le serveur d'authentification n'a pas renvoyé d'identifiant" +
          " pour le ticket transmis")
    } catch (error) {
      log.dev(error.stack)
      next(null, {error:error.toString()})
    }

    personneSso.toPersonne(function(error, personne) {
      if (error) next(error)
      else if (personne && personne.oid) {
        ctx.session.user = personne.toObject()
        log.dev('ticket OK, user enregistré localement et en session', ctx.session.user)
        // on redirige vers cette page sans le ticket en get
        ctx.redirect(getMyUrl(ctx))
      } else {
        log.dev('pb de personne', personne)
        error = new Error("Erreur interne, l'initialisation de l'utilisateur courant a échoué")
        log.error(error +' (id ' +personneSso.id +')')
        next(error)
      }
    })
  })
}