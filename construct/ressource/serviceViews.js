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

var tools = require('../tools')
var _ = require('lodash')
var seq = require('an-flow')
var moment = require('moment')
// pour les constantes et les listes, ça reste nettement plus pratique d'accéder directement à l'objet (plutôt que via $setting())
// car on a l'autocomplétion sur les noms de propriété
var config = require('./config')
var appConfig = require("../../config")

module.exports = function (EntityRessource, $ressourceRepository, $personneRepository, $ressourceConverter, $accessControl, $routes) {
  /**
   * Un service helper des contrôleurs html pour manipuler les datas avant de les envoyer aux vues
   * @service $views
   * @requires EntityRessource
   * @requires $ressourceRepository Pour aller chercher des infos complémentaires d'une ressource (les ressources liées) pour certaines vues
   * @requires $personneRepository  Pour aller chercher des infos complémentaires d'une ressource (les auteurs) pour certaines vues
   * @requires $ressourceConverter
   * @requires $accessControl       Pour savoir quels liens de menu afficher
   * @requires $routes
   * @requires $settings
   */
  var $views = {}

  /**
   * Ajoute les vars js pour l'affichage des ressources par les plugins
   * @private
   * @param data
   * @param ressource
   */
  function addJsVars(data, ressource) {
    data.contentBloc.verbose         = (appConfig.application.staging !== 'prod')
    data.contentBloc.isDev           = (appConfig.application.staging !== 'prod')
    if (ressource) {
      // une string pour que dust le mette dans le source
      data.contentBloc.ressource     = tools.stringify(ressource)
    }
  }

  /**
   * Créé les infos pour une liste de choix dans dust
   * @private
   * @param key le nom de la propriété de la ressource
   * @param {Array} selectedValues Les valeurs pour cette ressource
   * @param {boolean} isUnique Si c'est un select et pas des checkbox
   *                           (dans ce cas on ajoute pas de propriété name sur chaque choix)
   * @returns {Array}
   */
  function arrayToDust(key, selectedValues, isUnique) {
    function addChoice(label, cbValue) {
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
    }

    //log.debug("arrayToDust de " +key, selectedValues)
    var choices = []
    var i = 0
    if (selectedValues && !_.isArray(selectedValues)) {
      log.error(new Error("La propriété " + key + " de la ressource n'est pas un tableau"))
    } else if (config.listesOrdonnees[key]) {
      _.each(config.listesOrdonnees [key], function (cbValue) {
        addChoice(config.listes[key][cbValue], cbValue)
      })
    } else {
      // dans l'ordre où ça vient
      _.each(config.listes[key], function (label, cbValue) {
        addChoice(label, cbValue)
      })
      //log.debug("renvoie ", choices)
    }

    return choices
  }

  /**
   * Ajoute des infos à la ressource sur ses relations (titre & co)
   * @private
   * @param ressource
   * @param next
   */
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
   * @private
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
   * @private
   * @param error
   * @param {Ressource} ressource Une ressource qui peut contenir des erreurs (si elle vient d'un post)
   * @returns {Object} Les data pour la vue dust, avec le token
   */
  function getFormViewData(error, ressource) {
    var formData = {
      errors: ressource && ressource.errors || []
    }

    if (error) {
      log.error(error)
      formData.errors.push(error.toString())
    }

    // on s'assure que l'on a un objet, sinon on en créé un vide (ou si on nous le réclame avec new)
    if (!ressource || ressource.new) {
      // on en créé une vide, mais on regarde si on avait un token
      var token = ressource && ressource.token
      log.debug('dans sendFormData on lance un create')
      ressource = EntityRessource.create()
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
        formData[key].choices = [{name : key, value: [true]}]
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

    // si modif
    if (ressource && ressource.oid) {
      formData.oid = {
        name  : 'oid',
        value : ressource.oid,
        label : labels.oid,
        readonly: true
      }
      // c'est une modif, on ne peut plus changer le typeTechnique, on remplace le select par un text
      formData.typeTechnique = {
        name : "typeTechnique",
        value : ressource.typeTechnique,
        label : labels.typeTechnique,
        readonly : true
      }
      // origine & idOrigine en lecture seule pour modif mais pas création
      formData.origine.readonly = true;
      formData.idOrigine.readonly = true;
      // le js d'édition est ajouté dans la vue dust si besoin, init (formEdit.js) est mis par getDefaultData
      formData.$view = __dirname +'/views/formEdit'
    } else {
      formData.$view = __dirname +'/views/formCreate'
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
   * @private
   * @param {Error}     error     Erreur éventuelle (passer null ou undefined sinon)
   * @param {Ressource} ressource La ressource qui sort d'un load
   * @param {string}    [view=''] Le nom de la vue (en absolu ou relatif)
   * @returns {Object} L'objet à passser à la vue dust
   */
  function getViewData(error, ressource, view) {
    var viewData = {}
    var buffer
    if (error) $views.addError(error, viewData)
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
      $views.addError("Aucune ressource transmise pour affichage", viewData)
    }
    if (view) viewData.$view = __dirname +"/views/" +view

    return viewData
  }

  /**
   * Ajoute une erreur à la liste qui sera envoyée à la vue
   * @memberOf $views
   * @param error
   * @param data
   */
  $views.addError = function (error, data) {
    if (!data.errors || !data.errors.errorMessages) data.errors = {
      $view : __dirname +'/../static/views/errors',
      errorMessages : []
    }
    var errorMsg = (typeof error === "string") ? error : error.toString()
    data.errors.errorMessages.push(errorMsg)
    log.error(error)
  }

  /**
   * Retourne les valeurs par défaut pour une vue ressource
   * @memberOf $views
   * @param {string} viewName Le nom de la vue (dans ressource/views)
   * @returns {{$views: string, $metas: {css: string[], js: string[]}, contentBloc: {}}}
   */
  $views.getDefaultData = function (viewName) {
    var data = {
      $views : __dirname + '/views',
      $metas : {
        // css ajouté par le listener d'après context.layout
        js : ['/vendors/requirejs/require.min.js']
      }
    }
    if (viewName.substr(0, 1) !== "/") viewName = __dirname +"/views/" +viewName
    // les erreurs sont pas dans le bloc contenu
    if (viewName === 'errors') data.errors = {$view:viewName}
    else data.contentBloc = {$view:viewName}
    // charge init et crée sesatheque.init en global
    if (viewName === 'formEdit') data.$metas.js.push('/formEdit.js')

    return data
  }

  /**
   * Affiche une erreur en json ou html ou text, suivant accept, en laissant le status 200
   * @memberOf $views
   * @param {Context} context
   * @param {Error}   error
   * @param {string}  [layout=page] Pour la sortie html, passer iframe si on veut pas des header/menu/footer
   */
  $views.outputError = function (context, error, layout) {
    // on sait pas sous quelle forme l'utilisateur veut sa réponse, on privilégie json
    if (context.request.accept("json")) {
      log.error(error)
      context.json({success:false, error:error.toString()})
    } else if (context.request.accept("html")) {
      context.layout = layout || "page"
      $views.printError(context, error)
    } else {
      log.error(error)
      context.text(error.toString())
    }
  }

  /**
   * Prepare les data pour la vue dust et appelle html(data)
   * @memberOf $views
   * @param {Context} context
   * @param error
   * @param ressource
   * @param {string} view le nom de la vue dans ressource/views/
   * @param options Objet de données qui sera mergé avec data avant envoi au rendu
   */
  $views.prepareAndSend = function (context, error, ressource, view, options) {
    /**
     * envoie la ressource à la vue (en ajoutant menu si besoin
     * @private
     * @param error
     */
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
      // pour le menu qui en aura besoin
      if (context.layout === 'page' && ressource) context.ressource = ressource
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
    } // termine

    if (error) {
      log.error(error)
      // on est appelé avec ce qui sort d'un load
      $views.printError(context, "Problème d'accès à la base de données", 500)
    } else if (ressource) {
      log.debug('prepareAndSend pour la vue ' + view +' avec la ressource', ressource, 'dust', {max: 1000})
      var data = $views.getDefaultData(view)

      if (view === 'describe') {
        // faut ajouter des infos sur les relations
        enhance(ressource, termine)
      } else {
        termine()
      }
    } else {
      $views.printError(context, "Cette ressource n'existe pas ou vous n'avez pas les droits suffisants pour y accéder)", 404)
    }
  }

  /**
   * Affiche un message d'erreur
   * @memberOf $views
   * @param {Context}      context
   * @param {string|Error} error
   * @param {number}       [status=200]
   * @param {Ressource}    [ressource] pour ajouter d'éventuels lien de menu contextuels à cette ressource
   */
  $views.printError = function (context, error, status, ressource) {
    var data = $views.getDefaultData('errors')
    if (!context.layout) context.layout = 'page'
    if (context.layout === 'page' && ressource) context.ressource = ressource
    $views.addError(error, data)
    context.status = status || 200
    context.html(data)
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @memberOf $views
   * @param {Context} context
   * @param error
   * @param ressource
   * @param options
   */
  $views.printForm = function (context, error, ressource, options) {
    var data = $views.getDefaultData('formEdit')
    if (context.layout === 'page' && ressource) context.ressource = ressource
    // les datas pour le form
    tools.merge(data.contentBloc, getFormViewData(error, ressource))
    // le titre
    data.$metas.title = 'Modifier la ressource ' +ressource.titre
    // et d'éventuels overrides
    if (options) tools.merge(data, options)
    // pour les form, les js d'édition auront besoin de la ressource, on l'ajoute comme pour display (dans le source, donc on passe ici du json)
    addJsVars(data, ressource)
    // faut aussi ajouter ça pour les vues dust (data.contentBloc.typeTechnique existe déjà mais c'est un select)
    data.contentBloc.editeur = ressource.typeTechnique
    // avant d'envoyer
    context.html(data)
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @memberOf $views
   * @param {Context}  context
   * @param {string[]} [errorMessages]
   */
  $views.printSearchForm = function (context, errorMessages) {
    var data = $views.getDefaultData('formSearch')
    if (errorMessages && errorMessages.length) {
      data.errors = errorMessages
    }
    // les datas pour le form
    var fakeRessource = EntityRessource.create(context.get)
    //log.debug("ressource d'après get", fakeRessource)
    tools.complete(data.contentBloc, getFormViewData(null, fakeRessource))
    // on vire ou modifie ce qui nous intéresse pour la recherche
    var fd = data.contentBloc // raccourci d'écriture (form data)
    delete fd.version
    // ces champs ne sont pas indexés, pas la peine de les chercher…
    delete fd.parametres
    delete fd.enfants
    delete fd.resume
    delete fd.description
    delete fd.commentaires
    // @todo ajouter ces critères, mais en gérant des fourchettes
    delete fd.dateCreation
    delete fd.dateMiseAJour
    if (!$accessControl.isAuthenticated(context)) {
      delete fd.restriction
    }
    // on ajoute un choix "pas de choix" pour typeTechnique et langue
    fd.typeTechnique.choices.unshift({label:'peu importe', value:''})
    // pour la langue on vire le select actuel
    fd.langue.choices.forEach(function (choice) {
      if (choice.selected) choice.selected = false
    })
    fd.langue.choices.unshift({label:'peu importe', value:''})
    // pour le booléen publié, on transforme en select
    fd.publie = {
      id:"publie",
      label:"Publié",
      name : "publie",
      choices : [
        {label:'peu importe', value:''},
        {label:'oui', value:'true'},
        {label:'non', value:'false'},
      ]
    }
    // titre de la page
    data.$metas.title = 'Recherche de ressources'

    context.html(data)
  }

  return $views
}
