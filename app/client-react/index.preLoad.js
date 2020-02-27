/* Charge le client-react en version es5 ou module suivant le navigateur
 * ATTENTION, ce fichier doit rester en es5, car il ne passe pas par babel ni webpack
 * (même s'il est minifié par terser et copié par webpack.preRun.js à chaque compil webpack)
 */
/* eslint-env browser */

/**
 * Un "preLoader" qui chargera display en version es5 ou module es6 suivant les capacités du navigateur,
 * puis l'appellera quand il sera chargé
 */
(function clientReactPreLoad () {
  'use strict'
  // on ne veut pas faire de require / import pour récupérer la version, qui par ailleurs n'est pas forcément incrémentée à chaque build
  // (idiot d'ajouter tout le bootstrap wepack pour ça alors que ce fichier ne fait que qq octets)
  // c'est un bout de code dans webpack.preRun.js qui viendra modifier cette ligne
  var timestamp = '' // ne pas modifier cette ligne, le timestamp sera mis à la copie dans build/, cf webpack.preRun.js
  var baseUrl = '' // ne pas modifier cette ligne
  var script = document.createElement('script')
  script.crossOrigin = 'anonymous'
  var src = baseUrl + 'react.'
  if ('noModule' in document.createElement('script')) {
    // le navigateur gère les modules es6, pas sûr qu'il gère les imports dynamiques mais on en a pas
    // cf https://gist.github.com/ebidel/3201b36f59f26525eb606663f7b487d0
    // et https://stackoverflow.com/questions/60317251/how-to-feature-detect-whether-a-browser-supports-dynamic-es6-module-loading
    script.type = 'module'
    src += 'module'
  } else {
    script.type = 'application/javascript'
    src += 'es5'
  }
  src += '.js?' + timestamp
  script.src = src
  document.body.appendChild(script)
})()
