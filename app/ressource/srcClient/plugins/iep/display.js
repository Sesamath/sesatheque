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

var page = require('../../page')
var dom = require('../../tools/dom')
var log = require('../../tools/log')

var isLoaded

/**
 * Affiche une ressource iep (animation instrumenpoche)
 * @service plugins/iep/display
 * @param {Ressource}      ressource  L'objet ressource (une ressource iep a en parametres soit une propriété url
 *                                      avec l'url du xml soit une propriété xml avec la string xml)
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand l'iep sera chargé (sans argument ou avec une erreur)
 */
module.exports = function display(ressource, options, next) {

  /**
   * Affiche le xml dans le conteneur passé en options
   * @private
   * @param xml
   */
  function affiche(xml) {
    //log("on va afficher le xml : " +xml)
    // On réinitialise le conteneur
    dom.empty(container)
    var error
    var width = ressource.parametres.width || container.offsetWidth || 800
    var height = ressource.parametres.height || width * 0.75 || 600
    // pour créer le svg, ceci marche pas (il reste à 0 de hauteur), faut passer par createElementNS
    //var svg = dom.addElement(container, 'svg', {id:'svg', width:"800px", height:"500px", xmlns:"http://www.w3.org/2000/svg"})
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttributeNS(null, "width", width)
    svg.setAttributeNS(null, "height", height)
    svg.style.display = "block"
    container.appendChild(svg)
    if (window.iep.iepApp) {
      var app = new window.iep.iepApp()
      app.addDoc(svg, xml)
    } else {
      error = new Error("Problème de chargement du moteur instrumenpoche (constructeur iepApp absent)")
    }
    if (next) next(error)
    else if (error) page.addError(error)
  }

  try {
    log('start iep display avec la ressource', ressource)
    var container = options.container
    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource")
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres) throw new Error("Paramètres manquants")
    if (!ressource.parametres.url && !ressource.parametres.xml) throw new Error("Pas de script instrumenpoche en paramètre")

    // on enverra un résultat seulement à la fermeture
    if (options.resultatCallback && container.addEventListener) {
      container.addEventListener('unload', function () {
        if (isLoaded) {
          options.resultatCallback({
            ressType: 'iep',
            ressOid: ressource.oid,
            score: 1
          })
        }
      })
    }
    var xml = ressource.parametres.xml
    var url = ressource.parametres.url
    var isExternal = url && !xml
    page.loadAsync(['mathjax', 'http://iep.sesamath.net/iepjsmin.js'], function () {
      /*global MathJax*/
      MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [["$", "$"], ["\\(", "\\)"]]
        },
        jax: ["input/TeX", "output/SVG"],
        TeX: {extensions: ["color.js"]},
        messageStyle: 'none'
      })
      MathJax.Hub.Queue(function () {
        if (isExternal) {
          // faut aller chercher la source
          var xhr = require('../../tools/xhr')
          var options = {}
          if (url.indexOf(".php?") > 0) options.withCredentials = true
          xhr.get(url, options, function (error, xml) {
            if (error) {
              log.error(error)
              page.addError("L'appel de " + url + " a échoué")
            } else {
              affiche(xml)
            }
          })
        } else {
          affiche(xml)
        }
      })
    })

  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}
