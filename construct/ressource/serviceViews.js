/**
 * controller file is part of Sesatheque.
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

/**
 * Un service helper des contrôleurs html pour manipuler les datas avant de les envoyer aux vues
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $accessControl
 * @param $routes
 * @param $settings
 */
module.exports = function ($ressourceRepository, $personneRepository, $ressourceConverter, $accessControl, $routes, $settings) {
  var tools = require('../tools')
  var _ = require('lodash')
  var seq = require('seq')
  var basePath = $settings.get('basePath', '/')
  var ressourcePath = basePath + 'ressource/'

  var $views = {}

  /**
   * Ajoute les vars js pour l'affichage des ressources par les plugins
   * @param data
   * @param ressource
   */
  function addJsVars(data, ressource) {
    if (ressource) {
      data.contentBloc.pluginBaseUrl = '/plugins/' + ressource.typeTechnique
      data.contentBloc.vendorsBaseUrl= '/vendors'
      data.contentBloc.pluginName    = ressource.typeTechnique
      data.contentBloc.isDev         = ($settings.get('lassi.application.staging') !== 'production')
      // une string pour que dust le mette dans le source
      data.contentBloc.ressource     = tools.stringify(ressource)
    }
  }

  /**
   * Init des liens de menu
   * @param context
   * @param data
   * @param {Ressource} ressource
   */
  function addMenu(context, data, ressource) {
    var oid = ressource ? ressource.oid : null
    // les liens du menu
    var links = []
    // lien ajout
    if ($accessControl.hasPermission('create', context)) {
      links.push(tools.link(ressourcePath +$routes.get('add'), 'Ajouter une ressource'))
      log('path ' +ressourcePath +$routes.get('add'))
    }
    // si on est sur une ressource on ajoute les liens contextuels pour cette ressource (auxquels on a droit)
    if (oid) {
      if ($accessControl.hasPermission('update', context, oid))
        links.push(tools.link(ressourcePath +$routes.get('edit', oid), 'Modifier cette ressource'))
      if ($accessControl.hasPermission('delete', context))
        links.push(tools.link(ressourcePath +$routes.get('delete', oid), 'Supprimer cette ressource'))
      if ($accessControl.hasPermission('read', context, oid)) {
        links.push(tools.link($routes.getAbs('describe', ressource), 'Description de la ressource'))
        links.push(tools.link($routes.getAbs('preview', ressource), 'Voir la ressource'))
        links.push(tools.link($routes.getAbs('display', ressource), 'Voir la ressource (pleine page)'))
      }
    }
    data.menuBloc = {
      $view : 'menu',
      links : links
    }
  }

  /**
   * Retourne les valeurs par défaut pour une vue ressource
   * @param {string} [view=error]
   * @returns {{$views: string, $metas: {css: string[], js: string[]}, $layout: string, contentBloc: {}}}
   */
  $views.getDefaultData = function (view) {
    if (!view) view = 'error'
    return {
      $views : __dirname + '/views',
      $metas : {
        css: ['/styles/ressources.css'],
        js : ['/vendors/requirejs/require.2.1.js']
      },
      $layout: '../../static/views/layout-page',
      contentBloc : {$view:view}
    }
  }

  /**
   * Prepare les data pour la vue dust et appelle html(data)
   * @param error
   * @param ressource
   * @param context
   * @param view
   * @param options Objet de données qui sera mergé avec data avant envoi au rendu
   */
  $views.prepareAndSend = function (error, ressource, context, view, options) {
    log.debug('on prépare les datas pour dust ' +view, ressource, 'dust', {max:1000})
    var data = $views.getDefaultData(view)

    function termine() {
      // et la ressource (ou erreur)
      data.contentBloc = $ressourceConverter.getViewData(error, ressource, view)
      // pour display on ajoute les variables js (preview l'utilise aussi, seul le layout change entre preview et display)
      if (view === 'display') addJsVars(data, ressource)
      // et le menu si on en a besoin
      if (data.$layout === 'layout-page') addMenu(context, data, ressource)
      // le titre
      if (ressource) {
        if (ressource.titre) data.$metas.title = ressource.titre
        else data.$metas.title = "Ressource sans titre"
      } else data.$metas.title = "Ressource introuvable"
      // et d'éventuels overrides
      if (options) tools.merge(data, options)
      context.html(data)
    }

    if (!error && ressource && view === 'describe') {
      // faut aller chercher en asynchrone les infos complémentaires pour la vue describe
      // (éventuels titres de ressources liées, auteurs ou groupes)
      var fluxComplements = seq() 

      // étape relations
      fluxComplements.seq(function () {
        var nextComplement = this
        if (_.isEmpty(ressource.relations)) {
          nextComplement()
        } else {
          log.debug('faut ajouter des titres de relations', ressource.relations)
          var fluxRelations = seq(ressource.relations)
          fluxRelations.parEach(2, function (relation, index) {
            var nextSeq = this
            $ressourceRepository.load(relation[1], function (error, ressourceLiee) {
              if (error) {
                log.error(error)
                ressource.warnings.push(error)
              } else if (ressourceLiee) {
                // on ajoute le tag a et le type technique
                ressource.relations[index].push($routes.getTagA('describe', ressourceLiee))
                ressource.relations[index].push(ressourceLiee.typeTechnique)
              } else {
                log.errorData(error)
                ressource.warnings.push("la ressource liée " + relation[1] + " n'existe pas")
              }
              nextSeq()
            })
          })
          // on a tout chargé
          fluxRelations.seq(function () {
            log.debug('on a ajouté les titres des relations', ressource.relations)
            nextComplement()
          })
          fluxRelations.catch(function (e) {
            log.error(e)
            error = e
            nextComplement()
          })
        }
      })

      // étape auteurs, on remplace les ids par des objets
      var auteurs = []
      fluxComplements.seq(function () {
        var nextComplement = this
        if (_.isEmpty(ressource.auteurs)) {
          nextComplement()
        } else {
          var fluxAuteurs = seq(ressource.auteurs)
          fluxAuteurs.seqEach(function (auteurId) {
            var nextSeq = this
            $personneRepository.load(auteurId, function (error, personne) {
              if (error) log.error(error)
              else if (personne) auteurs.push({ nom: personne.prenom +' ' +personne.nom})
              else auteurs.push({nom: 'auteur ' +auteurId + " inconnu"})
              nextSeq()
            })
          })
          fluxAuteurs.seq(function () {
            if (auteurs.length) ressource.auteurs = auteurs
            nextComplement()
          })
          fluxAuteurs.catch(function (error) {
            log.error("erreur dans le flux auteurs de la ressource " +ressource.oid, error)
            nextComplement()
          })
        }
      })

      // étape contributeurs
      fluxComplements.seq(function () {
        var nextComplement = this
        if (_.isEmpty(ressource.contributeurs)) {
          nextComplement()
        } else {
          var fluxContributeurs = seq(ressource.contributeurs)
          fluxContributeurs.parSeq(2, function (contributeurId, index) {
            var nextSeq = this
            $personneRepository.load(contributeurId, function (error, personne) {
              if (error) log.error(error)
              else if (personne) ressource.contributeurs[index] = {nom: personne.prenom + ' ' + personne.nom}
              else ressource.contributeurs[index] = {nom: 'contributeur ' +contributeurId +' inconnu'}
              nextSeq()
            })
          })
          fluxContributeurs.seq(nextComplement)
          fluxContributeurs.catch(function (error) {
            log.error("erreur dans le flux contributeurs de la ressource " +ressource.oid, error)
            nextComplement()
          })
        }
      })

      // on a tout, on peut envoyer
      fluxComplements.seq(termine)
      // en cas d'erreur dans seq on envoie quand même
      fluxComplements.catch(function (error) {
        log.error("erreur dans la recherche de compléments d'une ressource", error)
        termine()
      })
    } else termine()
  }

  /**
   * Affiche un message d'erreur
   * @param context
   * @param errorMsg
   * @param {number} [status=200]
   */
  $views.printError = function (context, errorMsg, status) {
    var data = $views.getDefaultData()
    data.error = errorMsg
    context.status = status || 200
    context.html(data)
  }

  /**
   * Envoie la ressource à la vue
   * @param error
   * @param ressource
   * @param context
   * @param view
   * @param options
   */
  $views.printForRead = function (error, ressource, context, view, options) {
    log.debug('dans printForRead ' +view, ressource, 'dust', {max:1000})
    if (error) {
      $views.prepareAndSend(error, null, context, view, options)
    } else if (ressource) {
      $accessControl.checkPermission('read', context, ressource, function (ressource) {
        $views.prepareAndSend(error, ressource, context, view, options)
      })
    } else {
      context.status = 404
      error = new Error("Ressource introuvable")
      $views.prepareAndSend(error, null, context, view, options)
    }
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @param error
   * @param ressource
   * @param context
   * @param options
   */
  $views.printForm = function (error, ressource, context, options) {
    var data = $views.getDefaultData('form')
    // on ajoute le menu
    addMenu(context, data, ressource)
    // les datas pour le form
    tools.merge(data.contentBloc, $ressourceConverter.getFormViewData(error, ressource))
    // le titre
    data.$metas.title = 'Éditer une ressource'
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
    // on ajoute le token, en session, pour éviter des post multiples et ne pas vérifier les droits au post
    context.session.token = data.contentBloc.token.value
    // avant d'envoyer
    context.html(data)
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @param context
   */
  $views.printSearchForm = function (context) {
    var data = $views.getDefaultData('search')
    // on ajoute le menu
    addMenu(context, data, null)
    // les datas pour le form
    data.contentBloc = $ressourceConverter.getFormViewData(null, null)
    // on vire ou modifie ce qui nous intéresse pour la recherche
    var fd = data.contentBloc // raccourci d'écriture (form data)
    delete fd.oid
    delete fd.version.value
    delete fd.version.readonly
    delete fd.parametres
    delete fd.dateCreation
    delete fd.dateMiseAJour
    delete fd.oid

    fd.typeTechnique.choices.unshift({label:'peu importe', value:''})
    data.contentBloc.$view = 'form'
    // le titre
    data.$metas.title = 'Recherche de ressources'
    // on ajoute le token, en session, pour éviter des post multiples et ne pas vérifier les droits au post
    context.session.token = data.contentBloc.token.value
    // avant d'envoyer
    context.html(data)
  }

  return $views
}
