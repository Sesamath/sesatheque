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

/**
 * Module de base pour les méthodes addCss, addElement, getElement, addError, hideTitle
 * et log (qui ne fait rien sauf si on appelle init avec options.verbose à true), log.error affiche toujours
 */
"use strict"

var log = require('./log')
var wd = window.document

/**
 * Notre module pour toutes nos fonctions génériques
 */
var dom = {}

/**
 * Ajoute une css dans le <head> de la page
 *
 * Déclaré par init (dès son chargement)
 * @param {string}  file Chemin du fichier css (mis dans href tel quel)
 */
dom.addCss = function (file) {
  var head = wd.getElementsByTagName("head")[0]
  var links = head.getElementsByTagName("link")
  var dejala = false
  for (var i = 0; i < links.length; i++) {
    if (links[i].href === file) {
      dejala = true
      break
    }
  }

  if (dejala) {
    log(file +" était déjà présent, on ne l'ajoute pas")
  } else {
    var elt = wd.createElement("link")
    elt.rel = "stylesheet"
    elt.type = "text/css"
    elt.href = file
    head.appendChild(elt)
  }
}

/**
 * Ajoute un élément html de type tag à parent
 * @param {Element} parent
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElement = function (parent, tag, attrs, content) {
  var elt = dom.getElement(tag, attrs, content)
  parent.appendChild(elt)

  return elt
}

/**
 * Ajoute un élément html juste après element
 * @param {Element} element
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElementAfter = function (element, tag, attrs, content) {
  var newElt = dom.getElement(tag, attrs, content)
  var parent = element.parentNode
  // pas de insertAfter, si nextSibling est null ça le mettra à la fin, cf https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
  if (parent) parent.insertBefore(newElt, element.nextSibling)
  else log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'ajouter l'élément"))

  return newElt
}

/**
 * Ajoute un élément html juste avant element
 * @param {Element} element
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElementBefore = function (element, tag, attrs, content) {
  var newElt = dom.getElement(tag, attrs, content)
  var parent = element.parentNode
  if (parent) parent.insertBefore(newElt, element)
  else log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'insérer l'élément"))

  return newElt
}

/**
 * Ajoute un élément html comme premier enfant de parent
 * @param {Element} parent
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElementFirstChild = function (parent, tag, attrs, content) {
  var newElt = dom.getElement(tag, attrs, content)
  parent.insertBefore(newElt, parent.firstChild)

  return newElt
}

/**
 * Ajoute un élément html comme frère aîné de elementRef
 * @param {Element} elementRef
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 * @returns {Element} L'élément ajouté
 */
dom.addElementFirstSibling = function (elementRef, tag, attrs, content) {
  var newElt = dom.getElement(tag, attrs, content)
  elementRef.parentNode.insertBefore(newElt, elementRef.parentNode.firstChild)

  return newElt
}

/**
 * Ajoute du texte dans un élément
 *
 * Déclaré par init (dès son chargement)
 * @param {Element} elt
 * @param {string} text
 */
dom.addText = function (elt, text) {
  elt.appendChild(wd.createTextNode(text))
}

/**
 * Vide un élément html de tous ses enfants
 *
 * Déclaré par init (dès son chargement)
 * @param {Element} element
 */
dom.empty = function (element) {
  if (element && element.firstChild) {
    while (element.firstChild) element.removeChild(element.firstChild)
  }
}

/**
 * Retourne un élément html de type tag (non inséré dans le dom)
 *
 * Déclaré par init (dès son chargement)
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} txtContent
 */
dom.getElement = function (tag, attrs, txtContent) {
  var elt = wd.createElement(tag)
  var attr
  try {
    if (attrs) for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        if (attr === 'class') elt.className = attrs.class
        else if (attr === 'style') dom.setStyles(elt, attrs.style)
        else elt.setAttribute(attr, attrs[attr])
      }
    }
  } catch (error) {
    log("plantage dans getElement " +tag +" avec les attributs ", attrs, error)
  }

  if (txtContent) dom.addText(elt, txtContent)

  return elt
}

/**
 * Retourne un id qui n'existe pas encore dans le dom (mais ne le créé pas)
 */
dom.getNewId = (function () {
  // une closure pour conserver la valeur de cette variable privée entre 2 appels
  var lastId = 0
  return function () {
    var id
    var found = false
    while (!found && lastId < 10000) { // au dela de 10000 id dans un dom y'a un pb !
      found = !wd.getElementById('sesa' + lastId)
      lastId++
    }
    if (found) id = 'sesa' + lastId

    return id
  }
})()

/**
 * Affecte des styles à un élément html (on peut pas affecter elt.style directement car read only, faut faire du elt.style.foo = bar)
 * sans planter en cas de pb (on le signale juste en console)
 *
 * Déclaré par init (dès son chargement)
 * @param {Element} elt
 * @param {string|object} styles
 */
dom.setStyles = function (elt, styles) {
  try {
    if (elt) {
      if (!elt.style) elt.style = {}
      if (typeof styles === 'string') {
        styles = styles.split(';')
        styles.forEach(function (paire) {
          paire = /([\w]+):(.+)/.exec(paire)
          if (paire && paire.length === 3) {
            var key = paire[1]
            elt.style[key] = paire[2]
          }
        })
      } else if (typeof styles === 'object') {
        for (var prop in styles) {
          if (styles.hasOwnProperty(prop)) {
            elt.style[prop] = styles[prop]
          }
        }
      }
    }
  } catch (error) {
    log.error(error)
  }
}

module.exports = dom
