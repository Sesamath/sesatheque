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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

var tools = require('../tools')
var sTools = require('sesajstools')
var _ = require('lodash')
var flow = require('an-flow')
var moment = require('moment')
// pour les constantes et les listes, ça reste nettement plus pratique d'accéder directement à l'objet (plutôt que via $setting())
// car on a l'autocomplétion sur les noms de propriété
var config = require('./config')
var appConfig = require('../config')

module.exports = function (EntityRessource, $ressourceRepository, $personneRepository, $groupeRepository, $ressourceConverter, $accessControl, $routes, $page) {
  /**
   * Un service helper des contrôleurs html pour manipuler les datas avant de les envoyer aux vues
   * @service $ressourcePage
   * @requires EntityRessource
   * @requires $ressourceRepository Pour aller chercher des infos complémentaires d'une ressource (les ressources liées) pour certaines vues
   * @requires $personneRepository  Pour aller chercher des infos complémentaires d'une ressource (les auteurs) pour certaines vues
   * @requires $ressourceConverter
   * @requires $accessControl       Pour savoir quels liens de menu afficher
   * @requires $routes
   * @requires $settings
   */
  var $ressourcePage = {}

  /**
   * Ajoute les cases à cocher de groupes et l'input groupesSup au form
   * @private
   * @param {Context}       context
   * @param {object}        formData
   * @param {string[]}      values La liste des groupes existants
   * @param {errorCallback} next
   */
  function addGroupes (context, formData, values, next) {
    // on ajoute déjà nos groupes
    var myGroupes = $accessControl.getCurrentUserGroupes(context)
    var choices = myGroupes.map(function (nom, i) {
      return {
        name: 'groupes[' + i + ']',
        label: nom,
        value: nom
      }
    })
    // init à l'index suivant
    var i = myGroupes.length
    // faut cocher ce qui doit l'être et ajouter éventuellement les groupes déjà présents mais pas à nous, non modifiables
    flow(values).seqEach(function (groupeNom) {
      var suivant = this
      $groupeRepository.load(groupeNom, function (error, groupe) {
        if (error) {
          log.error(error)
          formData.errors.push(error.toString())
        } else if (groupe) {
          var myIndex = myGroupes.indexOf(groupe.nom)
          if (myIndex !== -1) {
            // on l'avait déjà, on le coche
            choices[myIndex].selected = true
          } else {
            // groupe existant sur cette ressource mais pas à nous
            choices.push({
              value: groupeNom,
              label: groupe.nom,
              isOpen: groupe.open,
              name: 'groupes[' + i++ + ']',
              selected: true,
              readonly: true
            })
          }
        } else {
          formData.errors.push('Le groupe ' + groupeNom + " n'existe pas")
        }
        suivant()
      })
    }).seq(function () {
      formData.groupes = {
        id: 'groupes',
        label: 'publié dans le(s) groupe(s)',
        choices: choices
      }
      // wrapper.dust gère le .new sur n'importe quel champ
      formData.groupes.new = {
        name: 'groupesSup',
        id: 'groupesSup',
        label: "Nouveau(x) groupe(s) à créer et ajouter à cette ressource (à séparer par des virgules s'il y en a plusieurs)",
        placeholder: 'nom du groupe'
      }
      log.debug('groupes dans addGroupes', formData.groupes, 'form', {max: 2000})
      next()
    }).catch(function (error) {
      next(error)
    })
  }

  /**
   * Ajoute les checkbox ou input hidden pour auteurs & contributeurs
   * @private
   * @param {Context}       context
   * @param {object}        formData Les datas pour le form dust
   * @param {string}        key
   * @param {Integer[]}     values
   * @param {errorCallback} next
   */
  function addPersonnes (context, formData, key, values, next) {
    if (!formData.errors) formData.errors = []
    log.debug('addPersonnes avec ' + key + ' qui vaut ' + values && values.join(','))
    // seuls les éditeurs peuvent modifier auteurs et contributeurs,
    if ($accessControl.hasPermission('updateAuteurs', context)) {
      formData[key].choices = []
      // if (!formData.errors || !(formData.errors instanceof Array)) {
      //  log('addPersonnes récupère un formData sans errors', formData)
      //  formData.errors = []
      // }
      var i = 0
      flow(values).seqEach(function (value) {
        log.debug('entrée seq addPersonnes, appel personne.load ' + value)
        var suivant = this
        $personneRepository.load(value, function (error, personne) {
          log.debug('formData dans cb load personne ' + value, formData, 'form', {max: 5000})
          log.debug('formData.errors dans cb load personne', formData.errors)
          if (error) {
            log.error('error load personne ' + value, error)
            formData.errors.push(error.toString())
          } else if (personne) {
            formData[key].choices.push({
              value: value,
              label: personne.prenom + ' ' + personne.nom,
              id: key + i,
              name: key + '[' + i + ']',
              selected: true
            })
          } else {
            formData.errors.push("Aucune personne d'identifiant " + value)
          }
          suivant()
        })
      }).seq(function () {
        log.debug('addPersonnes fin seq ' + key)
        formData[key].new = {
          name: key + 'Add',
          id: key + 'Add',
          label: 'Nouvelle personne à ajouter aux ' + config.labels[key],
          placeholder: 'oid de la personne'
        }
        next()
        this()
      }).catch(function (error) {
        next(error)
      })
    } else {
      formData[key].name = key
      formData[key].hidden = true
      formData[key].value = values.join(',')
      next()
    }
  }

  /**
   * Ajoute les vars js pour l'affichage des ressources par les plugins
   * @private
   * @param data
   * @param ressource
   */
  function addJsVars (data, ressource) {
    data.contentBloc.verbose = (appConfig.application.staging !== 'prod')
    data.contentBloc.isDev = (appConfig.application.staging !== 'prod')
    data.contentBloc.base = appConfig.application.baseUrl
    if (ressource) {
      // une string pour que dust le mette dans le source
      data.contentBloc.ressource = tools.stringify(ressource)
    }
  }

  /**
   * Créé les infos pour une liste de choix (connu en config) dans dust
   * @private
   * @param key le nom de la propriété de la ressource
   * @param {Array} selectedValues Les valeurs pour cette ressource
   * @param {boolean} isUnique Si c'est un select et pas des checkbox
   *                           (dans ce cas on ajoute pas de propriété name sur chaque choix)
   * @returns {Array}
   */
  function arrayToDust (key, selectedValues, isUnique) {
    /**
     * Ajoute un choix à la liste
     * @internal
     * @param label
     * @param cbValue
     */
    function addChoice (label, cbValue) {
      // cbValue est toujours une string (propriété de l'objet)
      var intValue = parseInt(cbValue, 10)
      if (intValue == cbValue) cbValue = intValue // eslint-disable-line eqeqeq
      var choice = {
        value: cbValue
      }
      if (label) choice.label = label
      if (!isUnique) {
        // faut du name sur chaque checkbox
        choice.name = key + '[' + i + ']'
      }
      // un id
      choice.id = key + i
      i++
      // et on ajoute les selected s'il y en a
      if (selectedValues && selectedValues.length && selectedValues.indexOf(cbValue) > -1) {
        choice.selected = true
      }
      choices.push(choice)
    }

    // log.debug('arrayToDust de ' +key, selectedValues)
    var i = 0
    var choices = []
    if (selectedValues && !_.isArray(selectedValues)) {
      log.error(new Error('La propriété ' + key + " de la ressource n'est pas un tableau"))
    } else if (config.listesOrdonnees[key]) {
      _.each(config.listesOrdonnees[key], function (cbValue) {
        addChoice(config.listes[key][cbValue], cbValue)
      })
    } else if (config.listes[key]) {
      // dans l'ordre où ça vient
      _.each(config.listes[key], function (label, cbValue) {
        addChoice(label, cbValue)
      })
      // log.debug('renvoie ', choices)
    } else {
      // auteurs ou contributeurs ou groupes
      _.each(selectedValues, function (value) {
        if (key === 'groupes') {
          $groupeRepository.load(value, function (error, groupe) {
            if (error) log.error(error)
            if (groupe) addChoice(groupe.nom, value)
          })
        } else {
          $personneRepository.load(value, function (error, personne) {
            if (error) log.error(error)
            if (personne) addChoice(personne.prenom + ' ' + personne.nom, value)
          })
        }
      }) // each
      // et on ajoute une case à cocher pour ajouter une personne / groupe
      choices.push({
        value: '',
        label: 'Ajouter',
        id: key + 'New',
        name: key + '[New]',
        selected: false
      })
    }

    return choices
  }

  /**
   * Ajoute des infos à la ressource sur ses relations (titre & co)
   * @private
   * @param ressource
   * @param next
   */
  function enhance (ressource, next) {
    // faut aller chercher en asynchrone les infos complémentaires pour la vue describe
    // (éventuels titres de ressources liées, auteurs ou groupes)
    var fluxComplements = flow()

    // étape relations
    ressource._relations = []
    fluxComplements.seq(function () {
      var nextComplement = this
      if (_.isEmpty(ressource.relations)) {
        nextComplement()
      } else {
        log.debug('faut ajouter des titres de relations', ressource.relations)
        var fluxRelations = flow(ressource.relations)
        fluxRelations.parEach(2, function (relation, index) {
          var nextSeq = this
          $ressourceRepository.load(relation[1], function (error, ressourceLiee) {
            if (error) {
              log.error(error)
              ressource._warnings.push(error)
            } else if (ressourceLiee) {
              // on ajoute le tag a et le type
              ressource._relations[index].push($routes.getTagA('describe', ressourceLiee))
              ressource._relations[index].push(ressourceLiee.type)
            } else {
              log.errorData(error)
              ressource._warnings.push('la ressource liée ' + relation[1] + " n'existe pas")
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

    // étape auteurs, on ajoute le champ _auteurs pour avoir des objets {nom, prenom} plutôt que des ids
    ressource._auteurs = []
    fluxComplements.seq(function () {
      var nextComplement = this
      if (_.isEmpty(ressource.auteurs)) {
        nextComplement()
      } else {
        var fluxAuteurs = flow(ressource.auteurs)
        fluxAuteurs.seqEach(function (auteurId) {
          var nextSeq = this
          $personneRepository.load(auteurId, function (error, personne) {
            if (error) log.error(error)
            else if (personne) ressource._auteurs.push({nom: personne.prenom + ' ' + personne.nom})
            else ressource._auteurs.push({nom: 'auteur ' + auteurId + ' inconnu'})
            nextSeq()
          })
        })
        fluxAuteurs.seq(function () {
          nextComplement()
        })
        fluxAuteurs.catch(function (error) {
          log.error('erreur dans le flux auteurs de la ressource ' + ressource.oid, error)
          nextComplement()
        })
      }
    })

    // étape contributeurs
    ressource._contributeurs = []
    fluxComplements.seq(function () {
      var nextComplement = this
      if (_.isEmpty(ressource.contributeurs)) {
        nextComplement()
      } else {
        var fluxContributeurs = flow(ressource.contributeurs)
        fluxContributeurs.parSeq(2, function (contributeurId, index) {
          var nextSeq = this
          $personneRepository.load(contributeurId, function (error, personne) {
            if (error) log.error(error)
            else if (personne) ressource._contributeurs.push({nom: personne.prenom + ' ' + personne.nom})
            else ressource._contributeurs.push({nom: 'contributeur ' + contributeurId + ' inconnu'})
            nextSeq()
          })
        })
        fluxContributeurs.seq(function () {
          nextComplement()
        })
        fluxContributeurs.catch(function (error) {
          log.error('erreur dans le flux contributeurs de la ressource ' + ressource.oid, error)
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
   * @param {Ressource} ressource
   */
  function getLabels (ressource) {
    var labels = tools.clone(config.labels)
    // avec pour les arbres la propriété parametres remplacée par enfants
    if (ressource && ressource.type === 'arbre') {
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
   * @param {Context}   context
   * @param {Error}     error
   * @param {Ressource} ressource Une ressource qui peut contenir des erreurs (si elle vient d'un post)
   * @param {function}  next appelée avec formData (data pour la vue dust du form, avec le token)
   */
  function getFormViewData (context, error, ressource, next) {
    var formData = {
      errors: ressource && ressource._errors || []
    }

    if (error) {
      log.error(error)
      formData.errors.push(error.toString())
    }

    // on s'assure que l'on a un objet, sinon on en créé un vide (ou si on nous le réclame avec new)
    if (!ressource || ressource.new) {
      // on en créé une vide, mais on regarde si on avait un token
      var token = ressource && ressource.token
      log.debug('dans getFormViewData on lance un create de ressource')
      ressource = EntityRessource.create(ressource)
      if (token) ressource.token = token
    }
    // log.debug('ressource traitée par sendFormData', ressource)

    // on boucle sur les propriétés déclarées dans config pour récupérer les labels
    var labels = getLabels(ressource)
    log.debug('labels de la ressource ' + ressource.oid, labels)
    log.debug('type ' + ressource.type)
    // faut un array pour seq
    var labelsArray = []
    _.each(labels, function (label, key) {
      labelsArray.push([key, label])
    })
    flow(labelsArray).seqEach(function (labelItem) {
      var key = labelItem[0]
      var label = labelItem[1]
      var value = ressource[key]
      var isUnique = config.uniques[key]
      var labelSuivant = this

      // pour tout le monde
      formData[key] = {
        id: key, // le template ajoutera un préfixe de son choix s'il veut
        label: label
      }
      // required ?
      if (config.required[key]) formData[key].required = true
      if (isUnique) formData[key].unique = true

      if (config.typesVar[key] === 'Array' || isUnique) {
        // c'est un tableau ou une valeur unique (donc select ou radios)
        // pour chaque liste, on a la liste des ids sélectionnés pour cette ressource dans ressource.prop,
        // et la liste des possibles dans config.liste[prop]
        if (isUnique) {
          value = [value] // arrayToDust veut un array
          // faut ça sur le select et pas ses choices
          formData[key].name = key
        }
        // les Array ne sont pas tous des tableaux d'ids connus, faut différencier
        if (config.listes[key]) {
          // c'est une liste d'id (ou de clés connues)
          formData[key].choices = arrayToDust(key, value, isUnique)
          labelSuivant()
        } else if (key === 'groupes') {
          addGroupes(context, formData, value, labelSuivant)
        } else if (key === 'auteurs' || key === 'contributeurs') {
          addPersonnes(context, formData, key, value, labelSuivant)
        } else {
          log.error(new Error('On tombe sur la clé inatendue ' + key))
          labelSuivant()
        }
      } else if (config.typesVar[key] === 'Boolean') {
        // checkbox tout seul (pas de label dans les choices, c'est le parent qui le porte)
        formData[key].choices = [{name: key, value: [true]}]
        if (value) formData[key].choices[0].selected = true
        labelSuivant()
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
            log.error('erreur lors du stringify sur le champ ' + key + ' de la ressource ' + ressource.oid)
            value = 'Erreur'
          }
        }
        formData[key].value = value
        labelSuivant()
      }
    }).seq(function () {
      log.debug('après labels type', ressource.type)
      // on a passé tous les labels, faut ajouter nos cas particulier
      formData.version.readonly = true

      // si modif
      if (ressource && ressource.oid) {
        formData.oid = {
          name: 'oid',
          value: ressource.oid,
          label: labels.oid,
          readonly: true
        }
        // c'est une modif, on ne peut plus changer le type, on remplace le select par un text
        formData.type = {
          name: 'type',
          value: ressource.type,
          label: labels.type,
          readonly: true
        }
        // origine & idOrigine en lecture seule pour modif mais pas création
        formData.origine.readonly = true
        if (formData.idOrigine) formData.idOrigine.readonly = true
        else delete formData.idOrigine // idOrigine pas obligatoire, si on l'a pas mis à l'insert on peut plus l'ajouter
        // le js d'édition est ajouté dans la vue dust si besoin, init (formEdit.js) est mis par getDefaultData
        formData.$view = 'formEdit'
      } else {
        if (ressource.search) {
          // getDefaultData a initialisé $view, on vire juste cette propriété désormais inutile
          delete ressource.search
        } else {
          formData.$view = 'formCreate'
          if (!$accessControl.hasPermission('createAll', context)) {
            // faut restreindre type
            var ttChoices = []
            formData.type.choices.forEach(function (choice) {
              if (config.typePerso[choice.value]) ttChoices.push(choice)
            })
            formData.type.choices = ttChoices
            // et imposer origine local
            formData.origine.value = 'local'
            formData.origine.hidden = true
            formData.idOrigine.hidden = true
            // publié par défaut
            formData.publie.choices[0].selected = true
          }
        }
      }

      // un token si y'en a un dans la ressource
      if (ressource.token) {
        formData.token = {
          name: 'token',
          value: ressource.token,
          hidden: true
        }
      }
      // idem pour la clé
      if (ressource.cle) {
        formData.cle = {
          name: 'cle',
          value: ressource.cle,
          hidden: true
        }
      }

      // un checkbox pour forcer malgré les warnings si y'en a (mais qu'il n'y a pas d'erreurs)
      if (ressource._warnings && ressource._warnings.length && !formData.errors.length) {
        formData.warnings = ressource._warnings
        formData.force = {
          id: 'force',
          label: config.labels.force,
          choices: [{
            label: "Cocher cette case pour forcer l'enregistrement malgré les avertissements",
            name: 'force',
            value: ['forced']
          }]
        }
        // if (ressource.force) formData.force.choices[0].selected = true
      }

      // on vire le champ si y'a pas d'erreurs
      if (!formData.errors.length) delete formData.errors
      log.debug('auteurs pour le form', formData.auteurs, 'htmlform', {max: 50000, indent: 2})
      log.debug('contributeurs pour le form', formData.contributeurs, 'htmlform', {max: 50000, indent: 2})
      next(formData)
    }).catch(function (error) {
      log.error('plantage dans getFormViewData', error)
      if (!formData.errors) formData.errors = []
      formData.errors.push(error.toString())
      next(formData)
    })
  }

  /**
   * Retourne un objet pour dust à partir d'une entité ressource
   * @private
   * @param {Error}     error     Erreur éventuelle (passer null ou undefined sinon)
   * @param {Ressource} ressource La ressource qui sort d'un load
   * @param {string}    [view=''] Le nom de la vue (en absolu ou relatif)
   * @returns {Object} L'objet à passser à la vue dust
   */
  function getViewData (error, ressource, view) {
    var viewData = {}
    var buffer
    if (error) {
      $page.addError(error, viewData)
    } else if (ressource) {
      // on boucle sur les propriétés que l'on veut afficher
      var labels = getLabels(ressource)
      log.debug('labels de ' + ressource.oid, labels)
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
                  predicat: config.listes.relations[relation[0]],
                  oid: relation[1],
                  lien: relation[2],
                  type: relation[3]
                })
              })
            } // sinon on l'ajoute pas, seul describe s'en sert
          } else if (config.listes[key]) {
            // c'est une liste d'id déclarés en conf, faut remplacer les ids par leur label
            buffer = []
            _.each(value, function (id) {
              if (config.listes[key][id]) buffer.push(config.listes[key][id])
              else log.error('La ressource ' + ressource.oid + ' a une valeur ' + id + ' pour la propriété ' + key + " qui n'est pas dans la liste prédéfinie dans la configuration")
            })
            viewData[key].value = buffer.join(', ')
          } else {
            // un tableau qui n'est pas une liste d'ids on regarde si on a la propriété préfixée par _ ou on laisse tel quel
            // (auteurs & co ou des propriétés supplémentaires)
            viewData[key].value = ressource['_' + key] || value
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
      if (ressource._warnings && ressource._warnings.length) viewData.warnings = ressource._warnings
      if (ressource._errors && ressource._errors.length) viewData.errors = ressource._errors
    } else {
      // pas d'erreur mais pas de ressource non plus
      $page.addError('Aucune ressource transmise pour affichage', viewData)
    }
    if (view) viewData.$view = view

    return viewData
  }

  /**
   * Retourne les valeurs par défaut pour une vue ressource
   * @memberOf $ressourcePage
   * @param {string} viewName Le nom de la vue (fichier dust dans views)
   * @returns {{$ressourcePage: string, $metas: {css: string[], js: string[]}, contentBloc: {}}}
   */
  $ressourcePage.getDefaultData = function (viewName) {
    var data = $page.getDefaultData()
    // css ajouté par le listener à la fin, suivant la valeur de context.layout,
    // on ajoute ici les js suivant la vue
    data.$metas.js = ['/page.bundle.js']
    if (viewName === 'display' || viewName === 'preview' || viewName === 'formEdit') {
      data.$metas.js.push('/display.bundle.js')
      if (viewName === 'formEdit') data.$metas.js.push('/edit.bundle.js')
    }
    // les erreurs sont pas dans le bloc contenu
    if (viewName === 'errors') data.errors = {$view: viewName}
    else data.contentBloc = {$view: viewName}

    return data
  }

  /**
   * Affiche une erreur en json ou html ou text, suivant accept, en laissant le status 200
   * @memberOf $ressourcePage
   * @param {Context} context
   * @param {Error}   [error]
   * @param {string}  [layout=page] Pour la sortie html, passer iframe si on veut pas des header/menu/footer
   */
  $ressourcePage.outputError = function (context, error, layout) {
    // on sait pas sous quelle forme l'utilisateur veut sa réponse, on privilégie json
    if (context.request.accept('json')) {
      log.error(error)
      context.json({success: false, error: error.toString()})
    } else if (context.request.accept('html')) {
      context.layout = layout || 'page'
      $ressourcePage.printError(context, error)
    } else {
      log.error(error)
      context.text(error.toString())
    }
  }

  /**
   * Prepare les data pour la vue dust et appelle html(data)
   * @memberOf $ressourcePage
   * @param {Context} context
   * @param error
   * @param ressource
   * @param {string} view le nom de la vue
   * @param options Objet de données qui sera mergé avec data avant envoi au rendu
   */
  $ressourcePage.prepareAndSend = function (context, error, ressource, view, options) {
    /**
     * envoie la ressource à la vue (en ajoutant menu si besoin
     * @private
     * @param error
     */
    function termine (error) {
      if (view === 'display' && context.layout === 'page' && !error && ressource && config.typeIframe[ressource.type]) {
        // simplement une iframe
        data.contentBloc = {
          $view: 'iframe',
          url: $routes.getAbs('display', ressource, context)
        }
        if (!data.jsBloc) data.jsBloc = {$view: 'js'}
        if (!data.jsBloc.jsCode) data.jsBloc.jsCode = ''
        data.jsBloc.jsCode += 'stpage.autosize("main", ["header", "footer"], null, {minHeight:500, minWidth:600});'
      } else {
        // et la ressource (ou erreur)
        data.contentBloc = getViewData(error, ressource, view)
        // pour display faut ajouter les variables js (preview l'utilise aussi, seul le layout change entre preview et display)
        if (view === 'display') {
          addJsVars(data, ressource)
          data.contentBloc.isFormateur = $accessControl.hasRole('acces_correction', context)
        } else if (view === 'describe' && ressource && ressource.type === 'arbre') {
          // on ajoute la liste des urls des enfants si on les a
          if (_.isArray(ressource.enfants) && ressource.enfants.length) { // en cas d'erreur json c'est une string
            var enfantsDescribe = []
            ressource.enfants.forEach(function (enfant) {
              if (enfant.ref) {
                enfantsDescribe.push({
                  oid: enfant.ref,
                  titre: enfant.titre,
                  url: $routes.getAbs('describe', enfant.ref)
                })
              }
            })
            data.contentBloc.enfantsDescribe = enfantsDescribe
          }
        }
        // pour les boutons d'actions ajoutés dans beforeTransport on ajoute la ressource à context
        if (context.layout === 'page' && ressource) context.ressource = ressource
        // le titre s'il n'est pas fourni en options
        if (!options || !options.$metas || !options.$metas.title) {
          if (ressource) {
            if (ressource.titre) data.$metas.title = ressource.titre
            else data.$metas.title = 'Ressource sans titre'
          } else {
            data.$metas.title = 'Pas de ressource à afficher'
          }
        }
        // éventuels overrides
        if (options) tools.merge(data, options)
      }
      context.html(data)
    } // termine

    if (error) {
      log.error(error)
      // on est appelé avec ce qui sort d'un load
      $ressourcePage.printError(context, "Problème d'accès à la base de données", 500)
    } else if (ressource) {
      log.debug('prepareAndSend pour la vue ' + view + ' avec la ressource', ressource, 'dust', {max: 1000})
      var data = $ressourcePage.getDefaultData(view)

      if (view === 'describe') {
        // faut ajouter des infos sur les relations
        enhance(ressource, termine)
      } else {
        termine()
      }
    } else {
      $ressourcePage.printError(context, "Cette ressource n'existe pas ou vous n'avez pas les droits suffisants pour y accéder", 404)
    }
  }

  /**
   * Affiche un message d'erreur
   * @memberOf $ressourcePage
   * @param {Context}      context
   * @param {string|Error} error
   * @param {number}       [status=200]
   * @param {Ressource}    [ressource] pour ajouter d'éventuels lien de menu contextuels à cette ressource
   */
  $ressourcePage.printError = function (context, error, status, ressource) {
    var data = $ressourcePage.getDefaultData('errors')
    if (!context.layout) context.layout = 'page'
    if (context.layout === 'page' && ressource) context.ressource = ressource
    $page.addError(error, data)
    context.status = status || 200
    context.html(data)
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @memberOf $ressourcePage
   * @param {Context} context
   * @param error
   * @param ressource
   * @param {object} [options] sera mergé dans data
   */
  $ressourcePage.printForm = function (context, error, ressource, options) {
    var data = $ressourcePage.getDefaultData('formEdit')
    if (ressource.token && context.session.tokens && !context.session.tokens[ressource.token]) {
      log.error('dans printForm on a le token ' + ressource.token + ' avec en session', context.session.tokens)
    }
    // on met la ressource en contexte
    if (context.layout === 'page' && ressource) context.ressource = ressource
    // les datas pour le form
    getFormViewData(context, error, ressource, function (formData) {
      tools.merge(data.contentBloc, formData)
      // le titre
      data.$metas.title = 'Modifier la ressource ' + ressource.titre
      // et d'éventuels overrides
      if (options) tools.merge(data, options)
      // pour les form, les js d'édition auront besoin de la ressource, on l'ajoute comme pour display (dans le source)
      addJsVars(data, ressource)
      // faut aussi ajouter ça pour les vues dust (data.contentBloc.type existe déjà mais c'est un select)
      data.contentBloc.editeur = ressource.type
      // avant d'envoyer
      // log.debug('on va envoyer au form ', data, 'form', {max:2000, indent:2})
      context.html(data)
    })
  }

  /**
   * Prepare les data pour le form dust et appelle html avec
   * @memberOf $ressourcePage
   * @param {Context}  context
   * @param {string[]} [errorMessages]
   */
  $ressourcePage.printSearchForm = function (context, errorMessages) {
    var data = $ressourcePage.getDefaultData('formSearch')
    if (errorMessages && errorMessages.length) {
      data.errors = errorMessages
    }
    // les datas pour le form
    var fakeRessource = EntityRessource.create(context.get)
    // on ajoute un flag pour getFormViewData (oui c'est crade)
    fakeRessource.search = true
    // log.debug("ressource d'après get', fakeRessource)
    getFormViewData(context, null, fakeRessource, function (formData) {
      tools.complete(data.contentBloc, formData)
      log.debug('formSearch démarre avec', data.contentBloc)
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
      log.debug('data search', fd, null, {max: 20000})
      // on ajoute un choix 'pas de choix' pour type et langue
      fd.type.choices.unshift({label: 'peu importe', value: ''})
      // pour la langue on vire le select actuel
      fd.langue.choices.forEach(function (choice) {
        if (choice.selected) choice.selected = false
      })
      fd.langue.choices.unshift({label: 'peu importe', value: ''})
      // pour le booléen publié, on transforme en select
      fd.publie = {
        id: 'publie',
        label: 'Publié',
        name: 'publie',
        choices: [
          {label: 'peu importe', value: ''},
          {label: 'oui', value: 'true'},
          {label: 'non', value: 'false'}
        ]
      }
      // on vire tous les required et on ajoute des valeurs si besoin
      for (var key in fd) {
        if (fd.hasOwnProperty(key)) {
          if (fd[key].required) delete fd[key].required
          if (context.get.modify && context.get[key]) {
            if (fd[key].hasOwnProperty('value')) {
              fd[key].value = context.get[key]
            } else if (fd[key].choices) {
              for (var i = 0; i < fd[key].choices.length; i++) {
                var choice = fd[key].choices[i]
                if (choice.value == context.get[key]) choice.selected = true // eslint-disable-line eqeqeq
              }
            }
          }
        }
      }
      // log.debug('search form data', fd)

      // titre de la page
      data.$metas.title = 'Recherche de ressources'

      context.html(data)
    })
  }

  return $ressourcePage
}
