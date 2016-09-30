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
var sjt = require('sesajstools')

var page = require('../../page/index')

function displayJava (ressource, options, next) {
  var params = ressource.parametres
  var container = options.container
  var width = params.width || container.offsetWidth || 800
  if (width > 1024) width = 1024
  if (width < 300) width = 300
  var height = params.height || Math.round(width * 0.75)
  if (height > 1024) height = 1024
  if (height < 200) height = 200
  var appletName = 'mtgApplet'
  // faut d'abord créer un élément html complet avant de le mettre dans le dom,
  // sinon il peut lancer le jar avant d'avoir tous les params
  var applet = dom.getElement(
    'applet',
    {
      id: appletName,
      // name: appletName +'name',
      code: 'mathgraph32.MtgFrame.class',
      archive: 'https://www.mathgraph32.org/ftp/webstart/MathGraph32Applet.jar',
      width: width,
      height: height,
      style: 'border:#000 solid 1px;'
    }
  )
  var allowFull = ['MenuBar', 'LeftToolbar', 'TopToolbar', 'RightToolbar', 'IndicationArea', 'ToolsChoice', 'FileMenu', 'OptionsMenu']
  var allowEleve = params.allowEleve || allowFull
  allowFull.forEach(function (allow) {
    dom.addElement(applet, 'param', {name: 'allow' + allow, value: (allowEleve.indexOf(allow) > -1) ? 'true' : 'false'})
  })
  dom.addElement(applet, 'param', {name: 'language', value: 'true'})
  dom.addElement(applet, 'param', {name: 'level', value: params.level})
  if (params.figure) dom.addElement(applet, 'param', {name: 'figureData', value: params.figure})
  else dom.addElement(applet, 'param', {name: 'initialFigure', value: 'orthonormalFrame'})
  dom.addText(applet, 'Ceci est une appliquette MathGraph32. Il semble que Java ne soit pas installé sur votre ordinateur. Aller sur ')
  dom.addElement(applet, 'a', {href: 'https://www.java.com'}, 'java.com')
  dom.addText(applet, ' pour installer java.')
  var p = dom.addElement(applet, 'p', {}, 'Sinon, visualiser cette page avec le ')
  dom.addElement(p, 'a', {href: '?js=1'}, 'lecteur javascript')
  dom.addText(p, " (mais l'enregistrement de la figure ne sera pas possible).")
  // on peut la mettre dans le dom
  dom.empty(container)
  container.appendChild(applet)

  if (options.resultatCallback && container.addEventListener) {
    // et on ajoute un bouton pour envoyer
    p = dom.addElement(container, 'p')
    var button = dom.addElement(p, 'button', {}, 'Envoyer la figure')
    button.addEventListener('click', function () {
      log('envoi de la figure')
      try {
        var newFigure = document[appletName].getScript()
        options.resultatCallback({
          ressType: 'mathgraph',
          ressOid: ressource.oid,
          score: 1,
          reponse: newFigure
        })
      } catch (error) {
        log.error(error)
        page.addError("Impossible de récupérer la figure de l'applet java")
      }
    })
  }

  // cb si présente
  if (next) next()
}

function displayJs (ressource, options, next) {
  var container = options.container

  // on enverra un résultat seulement à la fermeture
  if (options.resultatCallback && container.addEventListener) {
    container.addEventListener('unload', function () {
      if (isLoaded) {
        options.resultatCallback({
          ressType: 'mathgraph',
          ressOid: ressource.oid,
          score: 1
        })
      }
    })
  }

  // on affiche un avertissement si on force
  if (ressource.parametres.levelEleve > 0 && sjt.getURLParameter('js')) {
    dom.addElement(container, 'p', {'class': 'warning'}, "Vous avez imposé le lecteur javascript, l'envoi de la figure n'est pas possible")
  }

  var dependencies = [
    'https://www.mathgraph32.org/js/5.0.0/mtg32jsmin.js',
    'https://www.mathgraph32.org/js/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full.js'
  ]
  page.loadAsync(dependencies, function () {
    /* global MathJax, mtg32 */
    if (typeof MathJax === 'undefined') throw new Error("Mathjax n'est pas chargé")
    if (typeof mtg32 === 'undefined') throw new Error("Mathgraph32 n'est pas chargé")
    var width = ressource.parametres.width || container.offsetWidth || 800
    if (width > 1024) width = 1024
    if (width < 300) width = 300
    var height = ressource.parametres.height || Math.round(width * 0.75)
    if (height > 1024) height = 1024
    if (height < 200) height = 200
    var svgId = 'mtg32svg'
    // la consigne éventuelle
    if (ressource.parametres.consigne) dom.addElement(container, 'p', null, ressource.parametres.consigne)
    // pour créer le svg, ceci marche pas (il reste à 0 de hauteur), faut passer par createElementNS
    // var svg = dom.addElement(container, 'svg', {id:'svg', width:'800px', height:'500px', xmlns:'http://www.w3.org/2000/svg'})
    var svg = document.createElementNS('https://www.w3.org/2000/svg', 'svg')
    svg.setAttributeNS(null, 'id', svgId)
    svg.setAttributeNS(null, 'width', width)
    svg.setAttributeNS(null, 'height', height)
    svg.style.display = 'block'
    container.appendChild(svg)
    MathJax.Hub.Config({
      tex2jax: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
      },
      jax: ['input/TeX', 'output/SVG'],
      TeX: {extensions: ['color.js']},
      messageStyle: 'none'
    })
    MathJax.Hub.Queue(function () {
      var mtg32App = new mtg32.mtg32App() // eslint-disable-line new-cap
      mtg32App.addDoc(svgId, ressource.parametres.figure, true)
      mtg32App.calculateAndDisplayAll()
      isLoaded = true
      if (next) next()
    })
  })
}

var isLoaded

/**
 * Affiche une ressource mathgraph, avec l'applet java ou le lecteur js (suivant paramétrage de la ressource)
 * On peut forcer le js en précisant ?js=1 dans l'url
 * @service plugins/mathgraph/display
 * @param {Ressource}      ressource  L'objet ressource (une ressource mathgraph a en parametres soit une propriété url
 *                                      avec l'url du xml soit une propriété xml avec la string xml)
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand l'mathgraph sera chargé (sans argument ou avec une erreur)
 */
module.exports = function display (ressource, options, next) {
  try {
    var container = options.container
    if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')

    log('start mathgraph display avec la ressource', ressource)
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres) {
      throw new Error('Paramètres manquants')
    }
    if (!ressource.parametres.figure) {
      throw new Error('Pas de figure mathgraph en paramètre')
    }
    // on utilise java seulement si levelEleve est positif dans les paramètres (et que l'on impose pas js dans l'url)
    if (ressource.parametres.levelEleve > 0 && !sjt.getURLParameter('js')) displayJava(ressource, options, next)
    else displayJs(ressource, options, next)
  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}
