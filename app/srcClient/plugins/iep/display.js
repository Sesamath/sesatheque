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

var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')

var page = require('../../page/index')

var isLoaded

/**
 * Affiche une ressource iep (animation instrumenpoche)
 * @service plugins/iep/display
 * @param {Ressource}      ressource  L'objet ressource (une ressource iep a en parametres soit une propriété url
 *                                      avec l'url du xml soit une propriété xml avec la string xml)
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand l'iep sera chargé (sans argument ou avec une erreur)
 */
module.exports = function display (ressource, options, next) {
  /**
   * Affiche le xml dans le conteneur passé en options
   * @private
   * @param xml
   */
  function affiche (xml) {
    function scale (ratio) {
      console.log('ratio ' + ratio, width * ratio, height * ratio)
      svg.setAttribute('style', 'display:inline-block;margin:0;padding:0;transform-origin:0px 0px 0px;' +
        'transform:scale(' + ratio + ');')
      // après avoir appliqué le transform en css, il faut aussi fixer la taille en css
      // pour que le reste autour s'adapte, changer les attributs width et height ne modifie pas le rendu
      // mais il faut fixer ça sur le parent, sinon ça déborde aussi
      // (le navigateur applique à la taille fixée la transformation)
      container.setAttribute('style', 'position:relative;margin:0;width:' + Math.round(width * ratio) + 'px;' +
        'height:' + Math.round(height * ratio) + 'px')
      // faut réaffecter les styles aux boutons, sinon on perd le z-index, pourquoi, ça…
      var styleButton = 'position:absolute;z-index:99;text-align:center;padding:0;width:1.8em;height:1.8em;left:0.1em;-moz-padding:-2px;'
      buttonZoomIn.setAttribute('style', styleButton + 'top:0.1em')
      buttonZoomOut.setAttribute('style', styleButton + 'top:2em')
    }
    // log('on va afficher le xml : ' +xml)
    // faut mettre du https partout si on est en https
    if (window.location.protocol === 'https:') {
      xml = xml.replace(/http:/g, 'https:')
    }
    var error
    var width = ressource.parametres.width || container.offsetWidth || 800
    var height = ressource.parametres.height || width * 0.75 || 600
    // On réinitialise le conteneur
    dom.empty(container)
    // que l'on positionne (pour que le absolute des enfants se fasse par rapport à lui), avec d'éventuelle scroll
    dom.setStyles(container, {position: 'relative'})
    // on ajoute nos boutons de zoom
    var buttonZoomIn = dom.addElement(container, 'button', {}, '+')
    var buttonZoomOut = dom.addElement(container, 'button', {}, '-')
    // pour créer le svg, ceci marche pas (il reste à 0 de hauteur), faut passer par createElementNS
    // var svg = dom.addElement(container, 'svg', {id:'svg', width:'800px', height:'500px', xmlns:'http://www.w3.org/2000/svg'})
    // et surtout pas mettre de https ici !
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)
    // var svgContainer = dom.addElement(container, 'div')
    container.appendChild(svg)

    // on passe au contrôle du zoom
    var ratio = 1
    buttonZoomOut.addEventListener('click', function () {
      ratio *= 0.9
      scale(ratio)
    }, false)
    buttonZoomIn.addEventListener('click', function () {
      ratio *= 1.1
      scale(ratio)
    }, false)
    // init des styles
    scale(ratio)

    if (window.iep.iepApp) {
      var app = new window.iep.iepApp() // eslint-disable-line new-cap
      app.addDoc(svg, xml)
    } else {
      error = new Error('Problème de chargement du moteur instrumenpoche (constructeur iepApp absent)')
    }
    if (next) next(error)
    else if (error) page.addError(error)
  }

  try {
    log('start iep display avec la ressource', ressource)
    var container = options.container
    if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres) throw new Error('Paramètres manquants')
    if (!ressource.parametres.url && !ressource.parametres.xml) throw new Error('Pas de script instrumenpoche en paramètre')

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
    log(window.location.protocol + ', on veut charger ' + url)
    var isExternal = url && !xml
    page.loadAsync(['mathjax', 'https://iep.sesamath.net/iepjsmin.js'], function () {
      /* global MathJax */
      MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [['$', '$'], ['\\(', '\\)']]
        },
        jax: ['input/TeX', 'output/SVG'],
        TeX: {extensions: ['color.js']},
        messageStyle: 'none'
      })
      MathJax.Hub.Queue(function () {
        if (isExternal) {
          // faut aller chercher la source
          var xhr = require('sesajstools/http/xhr')
          var options = {}
          if (url.indexOf('.php?') > 0) options.withCredentials = true
          if (window.location.protocol === 'https:' && url.substr(0, 5) === 'http:') url = url.replace('http://', 'https://')
          log(window.location.protocol + ', on charge ' + url)
          xhr.get(url, options, function (error, xml) {
            if (error) {
              log.error(error)
              page.addError("L'appel de ' + url + ' a échoué")
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
