'use strict'

import 'client-react/styles/display.scss'

export {default as type} from '../type'

export {display}

const {addCss, addElement} = require('sesajstools/dom')
const log = require('sesajstools/utils/log')

const {application: {staging}} = require('server/config')

const isProd = /prod/.test(staging)
const mtgLoaderUrl = isProd
  ? 'https://www.mathgraph32.org/ftp/js/mtgloader/mtgLoader.min.js'
  : 'https://www.mathgraph32.org/ftp/js/mtgloader/max/mtgLoader.js'

const page = require('../../../client/page/index')

/**
 * Affiche une ressource mathgraph, avec l'applet java ou le lecteur js (suivant paramétrage de la ressource)
 * On peut forcer le js en précisant ?js=1 dans l'url
 * @service plugins/mathgraph/display
 * @param {Ressource}      ressource  L'objet ressource (une ressource mathgraph a en parametres soit une propriété url
 *                                      avec l'url du xml soit une propriété xml avec la string xml)
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand l'mathgraph sera chargé (sans argument ou avec une erreur)
 */
function display (ressource, options, next) {
  // on ne vérifie que la figure et le score
  function isSameResultat (resultat) {
    if (!resultat) throw new Error('Erreur interne')
    if (!lastResultatSent) return false
    return resultat.score === lastResultatSent.score &&
      resultat.contenu && lastResultatSent.contenu &&
      resultat.contenu.fig === lastResultatSent.contenu.fig
  }

  let isLoaded = false
  let lastResultatSent
  const {container, resultatCallback} = options

  try {
    if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')

    log('start mathgraph display avec la ressource', ressource)
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres) throw new Error('Ressource incomplète')
    const {parametres} = ressource
    const {content} = parametres
    if (!content || !content.fig) throw new Error('Pas de figure mathgraph en paramètre')

    const dependencies = [
      'https://www.mathgraph32.org/js/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full.js',
      mtgLoaderUrl
    ]
    page.loadAsync(dependencies, function () {
      try {
        /* global MathJax, mtgLoader */
        if (typeof MathJax === 'undefined') throw new Error('Mathjax n’est pas chargé')
        if (typeof mtgLoader !== 'function') throw new Error('Mathgraph32 n’est pas chargé')
        addCss('https://www.mathgraph32.org/ftp/js/mtgloader/mtgLoader.css')

        // hauteur et largeur (si ça change, attention à modifier aussi dans mathgraph-editor.html)
        // la taille doit être fixée à l'avance (à cause de la gestion du svg),
        // on peut le faire en fonction de la taille d'affichage disponible (avec un minimum)
        let width = parametres.width || container.clientWidth || 1024
        if (!Number.isInteger(width) || width < 300) width = 300
        let height = parametres.height || container.clientHeight
        if (!Number.isInteger(height) || height < 200) height = Math.round(width * 0.66)

        // la consigne éventuelle (disparue dans les nouvelles versions de mathgraph, à mettre dans la figure)
        if (parametres.consigne) addElement(container, 'p', null, parametres.consigne)

        // init Mathjax
        MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [['$', '$'], ['\\(', '\\)']]
          },
          SVG: {mtextFontInherit: false},
          jax: ['input/TeX', 'output/SVG'],
          TeX: {extensions: ['color.js']},
          messageStyle: 'none'
        })
        MathJax.Hub.Queue(function () {
          // sauvegarde la figure courante
          function save (needDefer) {
            // on veut dys et level pour le display du bilan, mais on laisse getResult l'écraser s'il le souhaite
            const contenu = mtgApp.getResult()
            // on ajoute ça car la bibli va remplacer les scores undefined par 0 avant de les envoyer
            // (pour garantir un nombre entre 0 et 1) et on veut distinguer
            // les score 0 (exos de construction ratés)
            // des score undefined (figures sans score)
            contenu.isScored = typeof contenu.score === 'number'
            const resultat = {
              contenu,
              score: contenu.score
            }
            if (!isSameResultat(resultat)) {
              if (needDefer) resultat.deferSync = true
              resultatCallback(resultat)
              lastResultatSent = resultat
            }
          } // save

          /* glob mtgLoader */
          // pour le fonctionnement, cf le dépôt
          // git@src.sesamath.net:mathgraph_js
          // fichier src/mtgLoader.js
          // ou documentation/index.html
          const svgOptions = {
            width,
            height
          }
          const mtgOptions = {...content}
          if (!mtgOptions.hasOwnProperty('level')) mtgOptions.level = 1
          // en consultation on ne peut pas remplacer la figure par une nouvelle, sauf si c'est explicitement autorisé
          mtgOptions.newFig = Boolean(parametres.newFig)
          // idem pour en ouvrir une
          mtgOptions.open = Boolean(parametres.open)
          // options: pour autoriser à changer les options de la figure, true par défaut, jamais autorisé en consultation
          mtgOptions.options = false
          // en consultation on affiche toujours le bouton save, si y'a du resultatCallback ça lui filera
          // la figure, sinon on peut toujours sauvegarder localement la figure
          mtgOptions.save = true
          mtgOptions.callBackAfterReady = function () {
            isLoaded = true
            if (next) next()
          }

          // on ajoute une cb si qq veut le résultat
          if (resultatCallback) {
            // cb sur le bouton save
            mtgOptions.functionOnSave = save.bind(null, false)
            // + listener unload
            if (container.addEventListener) {
              container.addEventListener('unload', () => {
                if (isLoaded) save(true)
              })
            }
            // + notif
            page.showNotification('<p style="max-width: 300px">Clique sur le bouton de sauvegarde <img src="/plugins/mathgraph/outilSave.png" /> pour enregistrer ton résultat</p>')
          }

          // go
          const mtgApp = mtgLoader(container, mtgOptions.fig, svgOptions, mtgOptions)
        })
      } catch (error) {
        if (next) next(error)
        else page.addError(error)
      }
    })
  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}
