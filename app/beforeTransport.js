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

/*
 * jsdoc tient absolument à mettre listeners dans un namespace controllerRessource mettre un tag class ou module (avec ou sans kind) ne change rien
 */

var _ = require('lodash')
//var tools = require('./tools')

/**
 * Listener beforeTransport, qui finalise les datas pour les vues
 * (toutes, pas seulement celles qui concernent les ressources, il est dans le composant ressource pour être chargé
 * après l'init des services qu'il utilise)
 * On aurait pu le mettre dans un controleur sur * mais avec un listener on est sûr de passer après tous les contrôleurs
 * @param $accessControl
 * @param $routes
 * @param $flashMessage
 * @returns {function}
 */
module.exports = function ($accessControl, $routes, $flashMessage) {
  /**
   * Ajoute les liens contextuels à une ressource dans data.actions, et refreshAuth.js si on est sur du /public/
   * @private
   * @param context
   * @param data
   */
  function addActions(context, data) {
    if (context.ressource && context.ressource.oid) {
      var links = []
      var ressource = context.ressource
      var oid = context.ressource.oid
      if ($accessControl.hasPermission('read', context, ressource)) {
        links.push({
          href: $routes.getAbs('describe', ressource, context),
          value: 'Description',
          icon: 'file-text-o', // material icons description
          selected: (context.tab === 'describe')
        })
        links.push({
          href: $routes.getAbs('preview', ressource, context),
          value: 'Aperçu',
          icon: 'eye-slash', // ma pageview
          selected: (context.tab === 'preview')
        })
        links.push({
          href: $routes.getAbs('display', ressource, context),
          value: 'Voir',
          icon: 'eye', // material icons open_in_new était pas terrible
          attributes : [
            {name:"target", value:"_blank"}
          ]
        })
        // pour tous les suivants, on met les liens mais on les cache si on a pas les droits,
        // c'est le js qui les affichera si on est dans /public/ donc sans session
        links.push({
          id : "buttonEdit",
          href: $routes.getAbs('edit', oid, context),
          value: 'Modifier',
          icon: "edit", // mode_edit pour material icons
          selected: (context.tab === 'edit'),
          hidden: !$accessControl.hasPermission('update', context, ressource)
        })
        links.push({
          id:"buttonDuplicate",
          href: $routes.getAbs('create') + '?clone=' + oid,
          value: 'Dupliquer',
          icon: 'copy', // ma call_split
          selected: (context.tab === 'create' && context.request.originalUrl.indexOf('clone=') > -1),
          hidden : !$accessControl.hasPermission('create', context)
        })
        links.push({
          id:"buttonDelete",
          href: $routes.getAbs('delete', oid, context),
          value: 'Supprimer',
          icon: 'trash', // ma delete
          selected: (context.tab === 'delete'),
          hidden : !$accessControl.hasPermission('delete', context, ressource)
        })

      } else {
        log.error(new Error("On a une ressource dans listeners::addActions sans les droits pour la lire"))
      }

      data.actions = {
        links: links
      }
      // le js est ajouté par addNavigation
    }
  } // addActions

  /**
   * Ajoute le menu (boutons dans le header) dans data.navigation
   * @private
   * @param context
   * @param data
   */
  function addNavigation(context, data) {
    var links = []
    // lien ajout
    if ($accessControl.hasPermission('create', context)) {
      /* @todo : voir si on peut superposer, mais ce code marche pas, pb de float, faudrait revoir les autres css
      links.push({
        href: $routes.getAbs('create'),
        value: 'Ajouter une ressource',
        iconStack: ["file-o fa-stack-2x", "plus fa-stack-1x"] // ma note_add
      })
      /* */
    }
    links.push({
      id: "buttonAdd",
      href: $routes.getAbs('create', null, context),
      value: 'Ajouter une ressource',
      icon: 'plus-circle',
      hidden: !$accessControl.hasPermission('create', context)
    })
    // un lien vers la recherche
    links.push({
      id:"buttonSearch",
      href: $routes.getAbs('search', null, context),
      value: 'Recherche',
      icon: 'search'
    })
    // un lien mes ressources
    var myOid = $accessControl.getCurrentUserOid(context) || ""
    links.push({
      id:"buttonMyRessources",
      href: $routes.getAbs('search', null, context) + "?auteurs=" + myOid,
      value: 'Mes ressources',
      icon: 'bookmark-o',
      hidden:!myOid
    })
    // mes groupes
    links.push({
      id:"buttonMyGroupes",
      href: '/groupe/perso',
      value: 'Mes groupes',
      icon: 'group',
      hidden:!myOid
    })
    // on peut tout ajouter
    data.navigation = {
      links: links
    }
    // et on ajoute notre js qui les gère si on est sur du /public/
    if (context.request.originalUrl.indexOf("/public/") > -1) {
      if (!data.jsBloc) data.jsBloc = {$view:'js'}
      if (!data.jsBloc.jsCode) data.jsBloc.jsCode = ""
      data.jsBloc.jsCode += 'require("page/refreshAuth")();'
    }
  }

  /**
   * Ajoute des infos dans debug.log
   * @private
   * @param context
   * @param data
   */
  function debug(context, data) {
    var reqHttp = getReqHttp(context)
    var isJson = getIsJson(context)
    var isHtml = getIsHtml(context)
    log.debug(
        'listener on beforeTransport sur '  +reqHttp +' (' +context.contentType +' status ' +context.status +') avec les data ',
        data,
        'beforeTransport',
        {max:1000}
    )
    if (isHtml) log.debug("html vide ? " +_.isEmpty(data.contentBloc))
    else if (isJson) log.debug("api vide ? " +_.isEmpty(data))
    else log.debug("statique")
  }

  /**
   * Gére les pages d'erreur, fixe le contentType (et $layout pour le html d'après context.layout)
   * et ajoute les messages flash éventuels
   * @private
   * @param {Context} context
   * @param data
   */
  function errorHandler(context, data) {
    var reqHttp = getReqHttp(context)
    var isJson = getIsJson(context)
    var isHtml = getIsHtml(context)

    if (context.method === "get" || context.method === "post") {
      // on fixe déjà le contentType s'il ne l'est pas
      if (context.contentType) {
        // on signale une incohérence sans changer le contentType
        if (isJson && context.contentType !== 'application/json')
          log.error(new Error("On a un appel " + reqHttp + " avec un contentType " + context.contentType))
        if (isHtml && context.contentType !== 'text/html')
          log.error(new Error("On a un layout html " + context.layout + " avec un contentType " + context.contentType))
      } else if (isHtml) {
        context.contentType = 'text/html'
      } else if (isJson) {
        context.contentType = 'application/json'
      }
      // ajout du layout, page si non précisé
      if (isHtml && !data.$layout) data.$layout = __dirname + '/views/layout-' + (context.layout || "page")
    }

    /**
     * Gestion des erreurs (lassi ne l'a pas encore fait)
     */
    if (context.error) {
      // erreurs 500 détectée par lassi qui l'a récupéré mais pas notre code
      // (qui manipule les data mais n'affecte pas context.error)
      log.error('lassi a récupéré une erreur 500 sur ' +reqHttp, context.error)
      context.status = 500
      // on façonne notre erreur 500
      var errorMsg = context.error.toString()
      // on évite le un message incompréhensible pour l'utilisateur (le dev ira dans les logs)
      if (errorMsg.indexOf("TypeError") === 0) errorMsg = "Erreur interne : problème de types incohérents"
      else errorMsg = "Erreur interne : " +errorMsg
      if (isJson) {
        if (data.error) data.error += "\n" + errorMsg
        else data.error = errorMsg
      } else if (isHtml) {
        prepareErrorHtmlData(data, 'Erreur interne', errorMsg)
      } else {
        data.content = errorMsg
      }
      delete context.error // on vient de le traiter, pas la peine que lassi le fasse aussi

    } else {
      // erreur 404 ?
      var isVide
      if (isHtml) isVide = _.isEmpty(data.contentBloc) && _.isEmpty(data.blocs)
      else if (isJson) isVide = _.isEmpty(data)
      else isVide = false
      log.debug("isVide " +isVide)
      if (!context.status && isVide && context.method !== 'options') {
        context.status = 404
        log.debug(reqHttp + ' : pas de status ni content => 404')
      }
      // et on gère ici les autres erreurs
      if (context.status && context.status > 400) {
        log.debug('erreur ' +context.status +(isJson ? ' api' : ' html'), data)
        var msg
        switch (context.status) {
          case 404:
            msg = "Cette page ou ce fichier n'existe pas"
            break
          case 401:
          case 403:
            // $accessControl pas dispo ici
            if (context.session && context.session.user && context.session.user.oid) msg = 'Droits insuffisants'
            else msg = "Authentification requise"
            break
          default:
            msg = "Ooops, une erreur " +context.status +' est survenue'
        }
        if (isHtml) {
          prepareErrorHtmlData(data, 'erreur ' +context.status, msg)
        } else if (isJson) {
          if (!data.error) data.error = msg // sinon on laisse celle qu'il y avait probablement plus explicite
        } else {
          data.content = msg
        }
      }
    }

    // messages flash, vérif des vues erreurs et warnings, ajout du titre en data
    if (isHtml) {
      // on ajoute d'éventuels messages flash si on est en html (erreur ou pas)
      var flashData = $flashMessage.getAndPurge(context)
      if (flashData) _.merge(data, flashData)
      // et impose une vue en absolu à errors et warnings
      if (!data.$metas) data.$metas = {}
      if (!data.$metas.css) data.$metas.css = []
      if (context.layout === 'iframe') data.$metas.css.push('/styles/iframe.css')
      else data.$metas.css.push('/styles/page.css')
      // s'il n'y est pas, on met le titre en data pour que le layout l'affiche aussi (l'appelant peut en mettre 2 ≠)
      if (data.$metas.title && !data.titre) {
        data.titre = data.$metas.title
      }
    }
  } // errorHandler

  /**
   * Retourne true si c'est du json (d'après contentType ou url qui démarre par /api/)
   * @private
   * @param context
   * @returns {boolean}
   */
  function getIsJson(context) {
    return context.contentType === 'application/json' || context.request.originalUrl.substr(0, 5) === '/api/'
  }

  /**
   * Retourne true si c'est une page html (pas de layout fixé et pas json)
   * @private
   * @param context
   * @returns {boolean}
   */
  function getIsHtml(context) {
    return !getIsJson(context) && !!context.layout
  }

  /**
   * Retourne la chaine de la requete http (ex : "GET /path/to/something?args")
   * @private
   * @param context
   * @returns {string}
   */
  function getReqHttp(context) {
    return context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
  }

  /**
   * Ajoute à data nos params par défaut s'il n'existent pas
   * @todo régler le doublon avec $page.addError
   * @private
   * @param data     Les données que l'on modifie
   * @param title    Le titre à mettre s'il n'y en avait pas
   * @param errorMsg Le message d'erreur à mettre s'il n'y en avait pas déjà un
   */
  function prepareErrorHtmlData(data, title, errorMsg) {
    if (!data.hasOwnProperty('$metas')) data.$metas = {}
    data.$metas.title = title
    if (!data.$views) data.$views = __dirname + '/views' // sinon lassi/classes/transport/html/Renderer.js plante avec " Wrong views path"
    if (!data.errors) data.errors = {
      $view : 'errors',
    }
    if (!data.errors.errorMessages) data.errors.errorMessages = [errorMsg.replace(/Error[\s]*:[\s]*/, '')]
    log.debug('on a généré des data pour une erreur', data, 'beforeTransport', {max:2000})
  } // prepareErrorHtmlData

  /**
   * Le listener de beforeTransport qui
   * - gère les erreurs en les formattant
   * - ajoute $layout d'après context.layout sur les pages html
   * - ajoute menu de navigation et menu contextuel d'une ressource sur le layout page
   * - ajoute des infos dans debug.log si on est pas en prod
   * @listens lassi#event:beforeTransport
   * @param {Context} context
   * @param {Object} data
   */
  function beforeTransport(context, data) {
    errorHandler(context, data)

    // sur les pages html on ajoute les menus
    if (context.layout === 'page') {
      addNavigation(context, data)
      addActions(context, data)
    } // context.layout

    // on envoie toutes les réponses dans le log de debug
    if (!isProd) debug(context, data)
  }

  return beforeTransport
}
