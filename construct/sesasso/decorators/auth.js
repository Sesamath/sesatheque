/**
 * Ce décorateur est utilisé pour récupérer le ?connexion ou le ?deconnexion que l'on peut mettre sur toutes les urls
 *
 * principe de l'authentification Sésamath
 * redirect vers https://ssl.sesamath.net/pages/identification.php?
 *   statut_requis=<statut>
 *   &motif=identification_requise
 *   &url_application=<urlRetourIciAvecTicketQuiSeraAjoutéEnParam>
 *   &url_deconnexion=<urlRappelLogoutIci>
 *
 * Au retour du sso, pour valider le ticket dans l'url on appelle
 * POST https://ssl.sesamath.net/sesamath/pages/identification_webservice.php
 * avec
 *   action = tester|recuperer
 *   regenerer = 0|pas de param  // pour récupérer le ticket définitif
 *   ticket_client = <ticket>
 */
'use strict';

var _ = require('underscore')._

// on externalise tout ce qui est générique dans ce module
var sso = require('../sso')
var timeout = 10000

module.exports = lassi.Decorator('auth')
    .renderTo('authBloc')
    .do(function(ctx, next) {
      if (ctx.responseFormat !== 'html') return // pas de bloc de connexion sur l'api json
      var urlSso
      /**
       * Retour avec un ticket
       */
      if (ctx.get.hasOwnProperty('ticket')) {
        // Check d'un ticket (appel de sso pour vérif puis redirect sur la même url ici sans le ticket)
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
        // Connexion (via redirect vers sso)
        if (lassi.personne.isAuthenticated(ctx)) {
          // on redirige vers la page courante sans ce param car on est déjà connecté
          lassi.main.addFlashMessage(ctx, "Utilisateur déjà connecté", "notice")
          ctx.redirect(getMyUrl(ctx))
        } else {
          // faut aller chercher un ticket
          var urlApplication = getMyUrl(ctx, true)
          var urlDeconnexionLocale = encodeURIComponent('http://' + ctx.request.headers.host +
              ctx.url(lassi.action.sesasso.deconnexion))
          urlSso = sso.getUrlConnexion(urlApplication, urlDeconnexionLocale)
          ctx.redirect(urlSso)
        }

      /**
       * Demande de déconnexion
       */
      } else if (ctx.get.hasOwnProperty('deconnexion')) {
        // reset user en session
        ctx.session.user = {id:0}
        // redirect vers la déconnexion du sso
        urlSso = sso.getUrlDeconnexion()
        ctx.redirect(urlSso)

      /**
       * Pas de demande particulière, on alimente la variable dust authBloc du layout-page
       */
      } else {
        if (!ctx.session.user) ctx.session.user = {id:0}
        // attention, si on renvoie undefined ou un objet vide le bloc n'est pas rendu
        var data = {none:true}
        if (ctx.session.user.nom) { // -1 si ip locale sans connexion, pour l'api
          data.user = {
            id    : ctx.session.user.id,
            nom   : ctx.session.user.nom,
            prenom: ctx.session.user.prenom
          }
        }
        next(null, data)
      }
    }, {timeout:timeout})

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
 * Vérifie un ticket en appelant le serveur SSO, enregistre les infos retournées si ok et met le user en session
 * @param ctx
 * @param next
 */
function checkTicket(ctx, next) {
  if (!ctx.get.ticket) throw new Error("checkTicket appelé sans ticket dans l'url")

  /**
   * Enregistre le user en session et redirige (ou appelle next en cas de pb)
   * @param {Error|null|undefined} error
   * @param {Personne} personne
   */
  function setSessionAndRedirect(error, personne) {
    log.dev('appel setSessionAndRedirect')
    if (error) next(error)
    else if (personne) {
      // c'est normalement le seul endroit où on affecte cet objet (qui n'a pas de prototype) en session
      // hormis le controleur deconnexion qui affecte un objet vide
      ctx.session.user = personne
      // on veut pas des permissions dans l'entity pour pas les stocker en DB
      // les ajouter avec un defineProperty ne les met pas en session
      // donc on les met en session ici
      ctx.session.user.permissions = personne.getPermissions()
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

  log.dev('On poste pour valider le ticket ' +ctx.get.ticket)
  var options = {
    groupes:true,
    timeout:timeout
  }
  sso.validate(ctx.get.ticket, options, function (error, result) {
    try {
      if (error) throw error
      if (!result.id) throw new Error("Le serveur d'authentification n'a pas renvoyé d'identifiant" +
          " pour le ticket transmis")
      if (!result.roles) throw new Error("Le serveur d'authentification n'a pas renvoyé de roles")

      // on transforme les roles du sso en roles de l'appli bibliotheque
      var r = _.clone(result.roles);
      result.roles = {}
      if (r.sesamath_gestionnaire) result.roles.admin = true
      if (r.sesamath_salarie || r.sesamath_membre) result.roles.editeur = true
      if (r.sesamath_dezoneur) result.roles.indexateur = true

      log.dev('le resultat sso après modif des roles', result)

      // on essaie de récupérer l'entity, car elle est probablement déjà en BdD
      lassi.personne.load(result.id, function(error, personne) {
        if (error) next(error)
        else if (personne) {
          // on compare cette personne avec ce que l'on a récupéré
          var needToStore = false
          var keys = ['nom', 'prenom', 'email', 'roles', 'groupes']
          keys.forEach(function (key) {
            if (!_.isEqual(personne[key], result[key])) {
              personne[key] = result[key]
              needToStore = true
            }
          })

          if (needToStore) {
            log.dev('màj personne', personne)
            personne.store(setSessionAndRedirect)
          } else
            setSessionAndRedirect(null, personne)
        } else {
          lassi.entity.Personne
              .create(result)
              .store(setSessionAndRedirect)
        }
      })

    } catch (error) {
      // on affichera l'erreur sur la page (sans erreur 500)
      log.dev('dans le catch du retour de validate on a ' +error.toString(), error)
      next(null, {error:error.toString()})
    }

  })
}
