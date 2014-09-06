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
'use strict';

var request = require('request')
var _ = require('underscore')._
var PersonneSso = require('../PersonneSso')
// faut aller chercher la conf car lassi.application est pas dispo dans le do
var appConfig = require('../../../config')

var urlAuth = '/sesamath/pages/identification.php'
var urlDeco = '/sesamath/pages/identification_deconnexion.php'
var urlWs = '/sesamath/pages/identification_webservice.php'
var hostAuth = 'https://ssl.sesamath.net'
if (appConfig && appConfig.application.staging !== lassi.Staging.production) hostAuth += ':8443'

module.exports = lassi.Decorator('auth')
    .renderTo('authBloc')
    .do(function(ctx, next) {
      if (ctx.responseFormat !== 'html') return // pas de connexion sur l'api
      var urlSso = hostAuth
      /**
       * Retour avec un ticket
       */
      if (ctx.get.hasOwnProperty('ticket')) {
        /**
         * Check d'un ticket (appel de sso et redirect ici sans le ticket)
         */
        if (lassi.personne.isAuthenticated(ctx)) {
          lassi.main.addFlashMessage(ctx, "Utilisateur déjà connecté, ticket passé en paramètre ignoré", 'warning')
          ctx.redirect(getMyUrl(ctx))
        } else {
          checkTicket(ctx, next)
        }

      /**
       * Demande de connexion
       */
      } else if (ctx.get.hasOwnProperty('connexion')) {
        /**
         * Connexion (via redirect vers sso)
         */
        if (lassi.personne.isAuthenticated(ctx)) {
          // on redirige vers la page courante sans ce param car on est déjà connecté
          lassi.main.addFlashMessage(ctx, "Utilisateur déjà connecté", "notice")
          ctx.redirect(getMyUrl(ctx))
        } else {
          // faut aller chercher un ticket
          urlSso += urlAuth +'?statut_requis=Prof_Valide' +
              '&motif=identification_requise' +
              '&url_application=' +getMyUrl(ctx, true) +
              '&url_deconnexion=' +
              encodeURIComponent('http://' + ctx.request.headers.host + ctx.url('personne.deconnexion'))
          ctx.redirect(urlSso)
        }

      /**
       * Demande de déconnexion
       */
      } else if (ctx.get.hasOwnProperty('deconnexion')) {
        /**
         * Connexion (via redirect vers sso)
         */
        delete ctx.session.user
        ctx.redirect(urlSso + urlDeco)

      /**
       * Pas de demande particulière, on alimente la variable dust authBloc du layout-page
       */
      } else {
        // attention, si on renvoie undefined ou un objet vide le bloc n'est pas rendu
        var data = getUserForDust(ctx.session.user)
        log.dev("décorateur auth renvoie", data)
        next(null, data)
      }
    }, {timeout:10000})

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

  return encoded ? encodeURIComponent(myUrl + queryString) : myUrl + queryString
}

/**
 * Récupère les propriétés id, nom, prénom de personne et les renvoient, un objet vide sinon
 * (mais pas undefined sinon le bloc n'est pas rendu)
 * @param personne
 */
function getUserForDust(personne) {
  var user = {}
  if (personne && personne.id) {
    user.id = personne.id
    user.nom = personne.nom
    user.prenom = personne.prenom
  } else {
    // faut renvoyer qqchose sinon le bloc n'est pas rendu
    user.none = true
  }

  return user
}

/**
 * Vérifie un ticket en appelant le serveur SSO, enregistre les infos retournées si ok et met le user en session
 * @param ctx
 * @param next
 */
function checkTicket(ctx, next) {
  if (!ctx.get.ticket) throw new Error("checkTicket appelé sans ticket dans l'url")

  var personneSso

  /**
   * Enregistre le user en sesion et redirige (ou appelle next en cas de pb)
   * @param {Error|null|undefined} error
   * @param {Personne} personne
   */
  function setSessionAndRedirect(error, personne) {
    log('appel setSessionAndRedirect')
    if (error) next(error)
    else if (personne) {
      // c'est normalement le seul endroit où on affecte cet objet (qui n'a pas de prototype) en session
      // hormis le controleur deconnexion qui affecte un objet vide
      ctx.session.user = personne
      log.dev('ticket OK, user enregistré localement et en session, ' +ctx.session.user.oid)
      // on redirige vers cette page sans le ticket en get
      ctx.redirect(getMyUrl(ctx))
    } else {
      log.dev('pb de personne', personne)
      error = new Error("Erreur interne, l'initialisation de l'utilisateur courant a échoué")
      log.error(error +' (id ' +personneSso.id +')')
      next(error)
    }
  }

  log.dev('On poste pour valider le ticket')
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
  // analyse du retour du serveur sso
  request.post(options, function (error, response, body) {
    try {
      if (error) throw error
      if (body.error) throw new Error(body.error)
      if (!body.SSO) throw new Error("Le serveur d'authentification n'a pas renvoyé la réponse attendue, " +
        "impossible de valider le ticket transmis")
      personneSso = new PersonneSso(body.SSO)
      if (!personneSso.id) throw new Error("Le serveur d'authentification n'a pas renvoyé d'identifiant" +
          " pour le ticket transmis")

      // on essaie de récupérer l'entity, car elle est probablement déjà en BdD
      lassi.personne.load(personneSso.id, function(error, personneBdd) {
        if (error) next(error)
        else {
          // on compare cette personne de la BdD avec newPersonne issue du sso
          personneSso.toPersonne(function (error, newPersonne) {
            var needToStore = true

            if (personneBdd) {
              // on l'avait déjà, on regarde si qqchose a changé, faut ajouter oid pour la comparaison
              newPersonne.oid = personneBdd.oid
              // comparaison directe toujours fausse à cause du prototype
              if (_.isEqual(personneBdd, newPersonne)) needToStore = false
            }
            if (needToStore) {
              log.dev('av store personne', newPersonne)
              newPersonne.store(setSessionAndRedirect)
              // le store rappelait pas la cb, ça semble réglé depuis noknex, on le faisait ici,
              // attention à virer ce 2e appel si le store marche, sinon
              // le redirect plantera avec TypeError: Object #<Context> has no method '_next'
              //setSessionAndRedirect(null, newPersonne)
            }
            else setSessionAndRedirect(null, personneBdd)
          })
        }
      })

    } catch (error) {
      // on affichera l'erreur sur la page (sans erreur 500)
      log.dev(error.stack)
      next(null, {error:error.toString()})
    }

  })
}
