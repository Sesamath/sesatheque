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
 * @param Ressource
 * @param $ressourceRepository Pour aller chercher des infos complémentaires d'une ressource (les ressources liées) pour certaines vues
 * @param $personneRepository  Pour aller chercher des infos complémentaires d'une ressource (les auteurs) pour certaines vues
 * @param $ressourceConverter
 * @param $accessControl       Pour savoir quels liens de menu afficher
 * @param $routes
 * @param $settings
 */
module.exports = function (Ressource, $ressourceRepository, $personneRepository, $ressourceConverter, $accessControl, $routes, $settings) {
  var tools = require('../tools')
  var _ = require('lodash')
  var seq = require('seq')
  var moment = require('moment')
  var basePath = $settings.get('basePath', '/')
  // pour les constantes et les listes, ça reste nettement plus pratique d'accéder directement à l'objet
  // car on a l'autocomplétion sur les noms de propriété
  var config = require('./config')
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
      data.contentBloc.isDev         = ($settings.get('lassi.application.staging') !== 'prod')
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
   * Créé les infos pour une liste de choix dans dust
   * @param key le nom de la propriété de la ressource
   * @param {Array} selectedValues Les valeurs pour cette ressource
   * @param {boolean} isUnique Si c'est un select et pas des checkbox
   *                           (dans ce cas on ajoute pas de propriété name sur chaque choix)
   * @returns {Array}
   */
  function arrayToDust(key, selectedValues, isUnique) {
    //log.debug("arrayToDust de " +key, selectedValues)
    var choices = []
    if (selectedValues && !_.isArray(selectedValues)) {
      log.error(new Error("La propriété " + key + " de la ressource n'est pas un tableau"))
    } else {
      var i = 0
      _.each(config.listes[key], function (label, cbValue) {
        // cbValue est toujours une string (propriété de l'objet)
        var intValue = parseInt(cbValue, 10)
        if (intValue == cbValue) cbValue = intValue
        var choice = {
          label: label,
          value: cbValue
        }
        if (!isUnique) {
          // faut du name sur chaque checkbox
          choice.name = key + '[' + i + ']'
          i++
        }
        // et on ajoute les selected s'il y en a
        if (selectedValues.length && selectedValues.indexOf(cbValue) > -1) {
          choice.selected = true
        }
        choices.push(choice)
      })
      //log.debug("renvoie ", choices)
    }

    return choices
  }

  function enhance(ressource, next) {

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
            else if (personne) auteurs.push({nom: personne.prenom + ' ' + personne.nom})
            else auteurs.push({nom: 'auteur ' + auteurId + " inconnu"})
            nextSeq()
          })
        })
        fluxAuteurs.seq(function () {
          if (auteurs.length) ressource.auteurs = auteurs
          nextComplement()
        })
        fluxAuteurs.catch(function (error) {
          log.error("erreur dans le flux auteurs de la ressource " + ressource.oid, error)
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
            else ressource.contributeurs[index] = {nom: 'contributeur ' + contributeurId + ' inconnu'}
            nextSeq()
          })
        })
        fluxContributeurs.seq(nextComplement)
        fluxContributeurs.catch(function (error) {
          log.error("erreur dans le flux contributeurs de la ressource " + ressource.oid, error)
          nextComplement()
        })
      }
    })
    // on a tout, on peut envoyer
    fluxComplements.seq(function () {
      next(null, ressource)
    })
    // en cas d'erreur dans seq on envoie quand même
    fluxComplements.catch(function (error) {
      log.error("erreur dans la recherche de compléments d'une ressource", error)
      next(error, ressource)
    })
  }

  /**
   * Retourne la série de labels (propriété => libellé) pour une ressource
   * (remplace parametres par enfants pour les arbres)
   * @param ressource
   */
  function getLabels(ressource) {
    var labels = tools.clone(config.labels)
    // avec pour les arbres la propriété parametres remplacée par enfants
    if (ressource && ressource.typeTechnique === 'arbre') {
      delete labels.parametres
    } else {
      delete labels.enfants
    }

    return labels
  }

  /**
   * Retourne l'objet pour la vue du formulaire à partir de la ressource
   *
   * On ajoute ici de la logique d'affichage
   *
   * Dans l'objet qui sera renvoyé, chaque propriété contient
   * id       : le nom de la propriété (pour attr html, le tpl dust ajoutera un préfixe)
   * label    : Le nom à afficher pour la propriété
   * value    : La valeur de l'input text ou textarea
   * name     : attr html (sauf choix multiple)
   * unique   : true ou absent (select à la place de checkboxes)
   * readonly : true ou absent
   * choices.name : si unique, pour le select
   * choices = [{
   *   name
   *   label
   *   value
   * }]
   *
   * @param error
   * @param {Ressource} ressource Une ressource qui peut contenir des erreurs (si elle vient d'un post)
   * @returns {object} Les data pour la vue dust, avec le token
   */
  function getFormViewData(error, ressource) {
    var formData = {
      errors: ressource.errors || []
    }

    if (error) {
      log.error(error)
      formData.errors.push(error.toString())
    }

    // on s'assure que l'on a un objet, sinon on en créé un vide (ou si on nous le réclame avec new)
    if (!ressource || ressource.new) {
      // on en créé une vide, mais on regarde si on avait un token
      var token = ressource.token
      log.debug('dans sendFormData on lance un create')
      ressource = Ressource.create()
      if (token) ressource.token = token
    }
    //log.debug('ressource traitée par sendFormData', ressource)

    // on boucle sur les propriétés déclarées dans config pour récupérer les labels
    var labels = getLabels(ressource)
    log.debug("labels de " +ressource.oid, labels)
    _.each(labels, function (label, key) {
      var value = ressource[key]
      var isUnique = config.uniques[key]

      // pour tout le monde
      formData[key] = {
        id   : key, // le template ajoutera un préfixe de son choix
        label: label
      }
      // required ?
      if (config.required[key]) formData[key].required = true
      if (isUnique) formData[key].unique = true

      // ajouter ici du if (key === 'xxx') le jour ou des Array ne sont plus tous des tableaux d'ids
      if (config.typesVar[key] === 'Array' || config.uniques[key]) {
        // c'est un tableau ou une valeur unique (donc select ou radios)
        // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
        // et la liste des possibles dans config.prop
        if (isUnique) {
          value = [value] // arrayToDust veut un array
          // faut ça sur le select et pas ses choices
          formData[key].name = key
        }
        formData[key].choices = arrayToDust(key, value, isUnique)

      } else if (config.typesVar[key] === 'Boolean') {
        // checkbox tout seul (pas de label dans les choices, c'est le parent qui le porte)
        formData[key].choices = [{name : key, value: [value]}]
        if (value) formData[key].choices[0].selected = true

      } else {
        // objet ou scalaire => input ou textarea
        // on formate en strings (date formatée ou objet en json)
        formData[key].name = key
        if (_.isDate(value)) {
          value = moment(value).format(config.formats.jour)

        } else if (_.isObject(value)) { // comprend ArrayOfObjects car un Array est aussi object
          try {
            value = JSON.stringify(value, undefined, 2)
          } catch (error) {
            // a priori si c'est un object on ne peut tomber là qu'en cas de référence circulaire
            log.error('erreur lors du stringify sur le champ ' +key +' de la ressource ' +ressource.oid)
            value = 'Erreur'
          }
        }
        formData[key].value = value
      }
    }) // fin each propriété

    // on ajoute nos cas particulier
    formData.version.readonly = true
    // l'oid
    if (ressource && ressource.oid) {
      formData.oid = {
        name  : 'oid',
        value : ressource.oid,
        readonly: true
      }
    }
    // origine & idOrigine en lecture seule pour modif mais pas création
    if (ressource.oid) {
      formData.origine.readonly = true;
      formData.idOrigine.readonly = true;
    }
    // un token si y'en a un dans la ressource
    if (ressource.token) {
      formData.token = {
        name  : 'token',
        value : ressource.token,
        hidden: true
      }
    }

    // un checkbox pour forcer malgré les warnings si y'en a (mais qu'il n'y a pas d'erreurs)
    if (ressource.warnings && ressource.warnings.length && !formData.errors.length) {
      formData.warnings = ressource.warnings
      formData.force = {
        id    : 'force',
        label : config.labels.force,
        choices : [{
          label: "Cocher cette case pour forcer l'enregistrement margré les avertissements",
          name : "force",
          value: ['forced']
        }]
      }
      //if (ressource.force) formData.force.choices[0].selected = true
    }
    // on vire le champ si y'a pas d'erreurs
    if (!formData.errors.length) delete formData.errors
    //log.debug('formData pour le form', formData.warnings, 'htmlform', {max:50000, indent:2})

    return formData
  }

  /**
   * Retourne un objet pour dust à partir d'une entité ressource
   * @param {Error}     error     Erreur éventuelle (passer null ou undefined sinon)
   * @param {Ressource} ressource La ressource qui sort d'un load
   * @param {string}    [view=''] Le nom de la vue (pour ajouter les relations sur describe seulement)
   * @returns {object} L'objet à passser à la vue dust
   */
  function getViewData(error, ressource, view) {
    var viewData = {}
    var buffer
    if (error) viewData.error = error.toString()
    else if (ressource) {
      // on boucle sur les propriétés que l'on veut afficher
      var labels = getLabels(ressource)
      log.debug("labels de " +ressource.oid, labels)
      _.each(labels, function (label, key) {
        var value = ressource[key]
        viewData[key] = {
          title: label
        }
        // on traite chaque type de contenu, Array|Date|le reste
        if (config.typesVar[key] === 'Array') {

          // cas particulier de relations qui est un tableau de tableaux que l'on remplace par un objet
          if (key === 'relations' && value.length) {
            if (view === 'describe') {
              viewData.relations.value = []
              value.forEach(function (relation) {
                viewData.relations.value.push({
                  predicat     : config.listes.relations[relation[0]],
                  oid          : relation[1],
                  lien         : relation[2],
                  typeTechnique: relation[3]
                })
              })
            } // sinon on l'ajoute pas, seul describe s'en sert

          } else if (config.listes[key]) {
            // c'est une liste d'id, faut remplacer les ids par des labels
            buffer = []
            _.each(value, function (id) {
              if (config.listes[key][id])  buffer.push(config.listes[key][id])
              else log.error("La ressource " + ressource.oid + " a une valeur " + id +
                             " pour la propriété " + key + " qui n'est pas dans la liste prédéfinie dans la configuration")
            })
            viewData[key].value = buffer.join(', ')

          } else {
            // un tableau qui n'est pas une liste d'ids on le laisse tel quel (auteurs & co ou des propriétés supplémentaires)
            viewData[key].value = value
          }


        } else if (config.typesVar[key] === 'Date') {
          viewData[key].value = value ? moment(value).format(config.formats.jour) : value

        } else {
          // Object ou string ou number ou boolean, on laisse tel quel
          viewData[key].value = value
        }
      }) // fin each propriété

      // on ajoute oid
      if (ressource.oid) viewData.oid = ressource.oid
      // warnings et errors éventuels
      if (ressource.warnings && ressource.warnings.length) viewData.warnings = ressource.warnings
      if (ressource.errors && ressource.errors.length) viewData.errors = ressource.errors
    } else {
      // pas d'erreur mais pas de ressource non plus
      viewData.error = "Aucune ressource transmise pour affichage"
    }
    if (view) viewData.$view = view

    return viewData
  }

  /**
   * Retourne les valeurs par défaut pour une vue ressource
   * @param {string} viewName Le nom de la vue (donc du fichier dust)
   * @returns {{$views: string, $metas: {css: string[], js: string[]}, $layout: string, contentBloc: {}}}
   */
  $views.getDefaultData = function (viewName) {
    if (!viewName) viewName = 'error'
    return {
      $views : __dirname + '/views',
      $metas : {
        css: ['/styles/ressources.css'],
        js : ['/vendors/requirejs/require.2.1.js']
      },
      $layout: '../../static/views/layout-page',
      contentBloc : {$view:viewName}
    }
  }

  /**
   * Prepare les data pour la vue dust et appelle html(data)
   * @param context
   * @param error
   * @param ressource
   * @param view
   * @param options Objet de données qui sera mergé avec data avant envoi au rendu
   */
  $views.prepareAndSend = function (context, error, ressource, view, options) {
    // envoie la ressource à la vue
    function termine(error) {
      // et la ressource (ou erreur)
      data.contentBloc = getViewData(error, ressource, view)
      // pour display faut ajouter les variables js (preview l'utilise aussi, seul le layout change entre preview et display)
      if (view === 'display') {
        addJsVars(data, ressource)
      } else if (view === 'describe' && ressource && ressource.typeTechnique === 'arbre') {
        // on ajoute la liste des urls des enfants si on les a
        if (_.isArray(ressource.enfants) && ressource.enfants.length) { // en cas d'erreur json c'est une string
          var enfantsDescribe = []
          ressource.enfants.forEach(function (enfant) {
            if (enfant.ref) {
              enfantsDescribe.push({
                oid  : enfant.ref,
                titre: enfant.titre,
                url  : $routes.getAbs('describe', enfant.ref)
              })
            }
          })
          data.contentBloc.enfantsDescribe = enfantsDescribe
        }
      }
      // et le menu si on en a besoin
      if (data.$layout.indexOf('layout-page') > -1) addMenu(context, data, ressource)
      // le titre s'il n'est pas fourni en options
      if (!options || !options.$metas || !options.$metas.title) {
        if (ressource) {
          if (ressource.titre) data.$metas.title = ressource.titre
          else data.$metas.title = "Ressource sans titre"
        } else {
          data.$metas.title = "Pas de ressource à afficher"
        }
      }
      // éventuels overrides
      if (options) tools.merge(data, options)
      //log.debug('envoi à ' + view, data, 'dust', {max: 10000, indent:2})
      context.html(data)
    }

    if (error) {
      log.error(error)
      // on est appelé avec ce qui sort d'un load
      $views.printError(context, "Problème d'accès à la base de données", 500)
    } else if (ressource) {
      log.debug('on prépare les datas pour dust ' + view, ressource, 'dust', {max: 1000})
      var data = $views.getDefaultData(view)

      if (view === 'describe') {
        enhance(ressource, termine)
      } else {
        termine()
      }
    } else {
      $views.printError(context, "Cette ressource n'existe pas (ou droits insuffisants)", 404)
    }
  }

  /**
   * Affiche un message d'erreur
   * @param {Context}      context
   * @param {string|Error} error
   * @param {number}       [status=200]
   * @param {Ressource}    [ressource] pour ajouter d'éventuels lien de menu contextuels à cette ressource
   */
  $views.printError = function (context, error, status, ressource) {
    var data = $views.getDefaultData()
    addMenu(context, data, ressource)
    data.$views = __dirname + '/../static/views'
    data.error = (typeof error === 'string') ? error : error.toString()
    context.status = status || 200
    context.html(data)
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @param context
   * @param error
   * @param ressource
   * @param options
   */
  $views.printForm = function (context, error, ressource, options) {
    var data = $views.getDefaultData('form')
    // on ajoute le menu
    addMenu(context, data, ressource)
    // les datas pour le form
    tools.merge(data.contentBloc, getFormViewData(error, ressource))
    // le titre
    data.$metas.title = 'Modifier la ressource ' +ressource.titre
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
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
    data.contentBloc = getFormViewData(null, null)
    // on vire ou modifie ce qui nous intéresse pour la recherche
    var fd = data.contentBloc // raccourci d'écriture (form data)
    delete fd.oid
    delete fd.version.value
    delete fd.version.readonly
    delete fd.parametres
    delete fd.dateCreation
    delete fd.dateMiseAJour
    delete fd.oid
    // on ajoute un choix "pas de choix"
    fd.typeTechnique.choices.unshift({label:'peu importe', value:''})
    data.contentBloc.$view = 'form'
    data.$metas.title = 'Recherche de ressources'
    context.html(data)
  }

  return $views
}
