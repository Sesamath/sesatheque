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
/*global alert*/
'use strict'

// jsoneditor a une dépendance à jquery
var $ = window.jQuery
var dom = require('tools/dom')
var log = require('tools/log')
var page = require('page')

/**
 * Ajoute les liens pour changer d'éditeur
 * @private
 * @param {object} config avec les propriétés facultatives optionsName (pour mettre des boutons radio au lieu de liens) et editor (pour cocher l'actuel)
 */
function addLinks(config) {
  /**
   * Ajoute un lien ou un bouton radio suivant config.optionsName
   * @internal
   * @param container
   * @param editorName
   * @returns {Element}
   */
  function addLink(container, editorName) {
    var elt
    var args = {onclick:function () {setEditor(editorName);}}
    if (config.optionsName) {
      var id = editorName +"Option"
      args.id = id
      args.name = config.optionsName
      args.type = "radio"
      args.editorName = editorName
      args.style = {"line-height":"1.3em","vertical-align":"middle"}
      if (config.editor === editorName) args.checked = "checked"
      elt = dom.addElement(container, 'input', args)
      dom.addElement(container, 'label', {htmlFor:id, style:{"line-height":"1.3em","vertical-align":"middle", margin:"0 1em 0 0.2em"}}, editors[editorName].label)
    } else {
      args.style = {padding:"0.3em"}
      elt = dom.addElement(container, 'a', args, editors[editorName].label)
      // on ajoute un objet jqLink qui sert pour savoir s'il faut modifier des css au changement ou pas
      editors[editorName].jqLink = $(elt)
    }

    return elt
  }

  var divChoices = dom.getElement('div')
  dom.addText(divChoices, "Utiliser l'éditeur : ")
  var first = true
  for (var editorName in editors) {
    if (editors.hasOwnProperty(editorName)) {
      if (first) first = false
      else dom.addText(divChoices, " - ")
      addLink(divChoices, editorName)
    }
  }
  $textarea.before(divChoices)
}

/**
 * Charge et initialise jsoneditor si cela n'avait pas été fait (rien sinon)
 * @private
 * @param {errorCallback} next
 */
function initJsonEditor(next) {
  try {
    if (typeof isJseLoaded === "undefined") {
      isJseLoaded = false; // en cours
      System.import('/vendor/jsoneditor').then(JSONEditor => {
        if (!JSONEditor) throw new Error('Problème de chargement de jsoneditor')
        dom.addCss('/vendors/jsoneditor/dist/jsoneditor.min.css')
        jsonEditor = new JSONEditor(jsonEditorDiv)
        isJseLoaded = true
        next()
      }).catch(error => {
        log.error(error)
        throw new Error('Problème de chargement de jsoneditor')
      })
    } else if (isJseLoaded === false) {
      alert("Le chargement de jsoneditor est déjà en cours")
    } else {
      // load déjà fait
      next()
    }
  } catch (error) {
    next(error)
  }
} // initJsonEditor

/**
 * Renvoie true si la chaine est du json valide
 * @private
 * @param {string} json
 * @returns {boolean}
 */
function isJsonValide(json) {
  var retour = false
  try {
    JSON.parse(json)
    retour = true
  } catch (error) {
    dom.log("json invalide", json)
  }

  return retour
}

/**
 * Change l'éditeur courant (affecte la variable current, modifie le highligth des liens
 * et appelle la callback éventuelle de modif de l'éditeur)
 * @private
 * @param editorName
 */
function setEditor(editorName) {
  // réalise la bascule visuelle
  function toggle() {
    if (editors[editorName].jqLink) {
      // css sur les liens
      editors[current].jqLink.css("background-color", "")
      editors[editorName].jqLink.css("background-color", "#fe7")
    } // sinon on a pas initialisé les liens donc rien à faire
    editors[current].jq.hide()
    editors[editorName].jq.show()
  }
  // affecte le nouveau avec du json valide
  function setNew(obj) {
    editors[editorName].set(obj)
    toggle()
    current = editorName
    if (changeCallback) changeCallback(editorName)
    dom.log("On est passé à l'éditeur " +editorName)
  }

  try {
    if (!editors[editorName]) throw new Error("éditeur " +editorName +" non géré")
    if (editorName !== current) {
      if (current === "simple") {
        var json = $textarea.val()
        if (isJsonValide(json)) setNew(json)
        else throw new Error("Le json est invalide")
      } else {
        setSimple(setNew)
      }
    } else {
      dom.log.error(new Error("On était déjà sur l'éditeur " +editorName))
    }
  } catch (error) {
    page.addError(error.toString(), 5)
  }
} // setEditor

/**
 * Récupère le json de l'éditeur courant, s'il est valide l'affecte dans le textarea indenté
 * et appelle next avec l'objet, sinon affiche une erreur
 * @private
 * @param {function} next sera appelé avec l'objet correspondant au json mis dans le textarea s'il était valide
 */
function setSimple(next) {
  editors[current].getJson(function (jsonString) {
    // on teste que c'est du json valide en récupérant l'objet au passage
    try {
      var obj = JSON.parse(jsonString)
      // et on l'affecte indenté
      $textarea.val(JSON.stringify(obj, null, 2))
      next(obj)
    } catch (error) {
      page.addError("Le json est invalide " +jsonString, 3000)
      dom.log.error(error)
    }
  })
}

/**
 * Service pour insérer jsoneditor et basculer avec un textarea classique
 * @service jsonMulti
 */
var jsonMulti = {}

/**
 * Charge jsonEditor si ça n'a jamais été fait et l'initialise avec l'objet de l'éditeur courant
 * (ou affiche une erreur)
 */
try {
  var isInitDone = false
  var isJseLoaded
  var changeCallback, current, jsonEditor, jsonEditorDiv, $textarea

  var editors = {
    simple : {
      label : "simple",
      getJson:function (next) {
        next($textarea.val())
      }
      // set inutile, initialisé au chargement puis affecté par setSimple
    },
    jsoneditor : {
      label : "avancé",
      getJson:function (next) {
        if (jsonEditor) {
          var obj = jsonEditor.get()
          dom.log("On récupère l'objet", obj)
          var json = JSON.stringify(obj)
          next(json)
        } else {
          page.addError("jsonEditor n'est pas encore initialisé", 5)
        }
      },
      set: function (obj) {
        initJsonEditor(function (error) {
          if (error) page.addError(error.toString(), 5)
          else if (jsonEditor) jsonEditor.set(obj)
          else page.addError("jsonEditor n'a pas été correctement initialisé mais l'initialisation n'a pas renvoyé d'erreur")
        })
      }
    }
  }

  /**
   * Initialise jsonMulti (ajoute les liens / radio pour changer d'éditeur et les comportements)
   * @memberOf jsonMulti
   * @param {Element}        textarea  Un textarea vers lequel mettre le code LaTeX à la fermeture (on le cachera)
   * @param {object}         config    Objet avec les propriétés (facultatives entre crochets
   *                                   - changeCallback : sera appelé avec le nom du nouvel éditeur à chaque changement
   *                                   - editorIni : le nom de l'éditeur à afficher au load
   *                                   - editorsSup : un tableau d'objets {
   *                                       container : le div qui sera masqué / affiché lors des changements
   *                                       get:fonction appelée avec une callback à laquelle il faudra fournir le contenu à mettre dans le textarea
   *                                       label:texte affiché pour le lien de bascule,
   *                                       name : le nom de l'éditeur (sera la valeur du bouton radio)
   *                                       set:callback pour lancer l'éditeur, appelée avec la string json (valide)
   *                                     }
   *                                   - optionsName : un nom pour mettre des boutons radio à la place des liens simples (pour insérer le choix dans le form)
   * @param {displayOptions} [options] Options (pas utilisé pour le moment, pour rester homogène avec multiEditor)
   * @param {errorCallback}  [next]
   */
  jsonMulti.init = function (textarea, config, options, next) {
    dom.log("jsonMulti.init avec config et options", config, options)
    try {
      $(function () {
        if (!textarea) throw new Error("Il faut fournir un textarea pour jsonMulti")
        if (textarea.nodeName !== "TEXTAREA") throw new Error("Il faut fournir un textarea pour jsonMulti")
        $textarea = $(textarea)
        editors.simple.jq = $textarea
        if (!config) config = {}
        // on ajoute les boutons
        addLinks(config)
        current = "simple"
        if (editors.simple.jqLink) editors.simple.jqLink.css("background-color", "#fe7")
        // on affecte ça si ça existe
        if (config.changeCallback) changeCallback = options.changeCallback
        if (config.editorsSup) {
          try {
            config.editorsSup.forEach(function (editor) {
              if (!editor.name) throw new Error("editeur sup sans name")
              var editorName = editor.name
              delete editor.name
              if (!editor.container) throw new Error("editeur sup sans container")
              editor.jq = $(editor.container)
              delete editor.container
              editors[editorName] = editor
            })
            dom.log("on a ajouté les éditeurs sup pour arriver à", editors)
          } catch (error) {
            dom.log.error("La config passée a une propriété editorsSup invalide", error)
          }
        }
        // on crée un div pour jsonEditor
        jsonEditorDiv = dom.getElement("div", {id:"jsonEditor"})
        $textarea.before(jsonEditorDiv)
        editors.jsoneditor.jq = $(jsonEditorDiv)
        if (options && options.editorIni) setEditor(options.editorIni)
        isInitDone = true
        if (next) next()
      })
    } catch (error) {
      if (next) next(error)
      else throw error
    }
  }

} catch (error) {
  page.addError(error)
}

module.exports = jsonMulti
