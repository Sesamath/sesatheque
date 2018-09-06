// Ce js est compilé par webpack (cf ../webpack.entry.js) et mis dans /pluginMathgraphEditor.js
// qui exporte ce module dans une var globale stpluginMathgraphEditor

// au moment de l'externalisation en module séparé il faudra voir comment passer cette config
// probablement via une factory à qui on donnera la conf locale
// c'est la config filée par webpack, donc version client (chargée par notre config-loader)
const {application: {staging}} = require('server/config')
const {addElement, addJs} = require('sesajstools/dom')

const isProd = /prod/.test(staging) && !/\.(devsesamath.net|local)$/.test(window.location.hostname) && window.location.hostname !== 'localhost'

const mtgLoaderUrl = isProd
  ? 'https://www.mathgraph32.org/ftp/js/mtgloader/mtgLoader.min.js'
  : 'https://www.mathgraph32.org/ftp/js/mtgloader/max/mtgLoader.js'

module.exports = function addMtgLoader (ressource, fields) {
  function displayEditor () {
    /* global mtgLoader */
    const parametres = ressource.parametres

    // hauteur et largeur (copié de display.js, à maintenir sync)
    let width = parametres.width || document.body.clientWidth || 1024
    if (!Number.isInteger(width) || width < 300) width = 300
    let height = parametres.height || document.body.clientHeight
    if (!Number.isInteger(height) || height < 200) height = Math.round(width * 0.66)
    // qu'on met dans svgOptions
    const svgOptions = {
      width,
      height
    }

    // à remplacer par dès que l'update 38 sera passé
    // const mtgOptions = parametres.content || {}
    const mtgOptions = parametres.content || parametres

    // à la création on démarre avec une interface collège
    // (le prof pourra changer ensuite dans l'éditeur
    // et getParametres nous renverra la valeur modifiée)
    // le level sert pour ouvrir mathgraph avec une figure vierge, ou pour limiter les outils disponibles
    // il peut être mdifié dans l'interface mtg si mtgOptions.options === true
    // 0 : école
    // 1 : collège
    // 2 : lycée sans les nombres complexes
    // 3 : lycée avec les nombres complexes
    // Si la figure est fournie, en édition il faut fournir le level le plus élevé
    // pour que le prof puisse activer tous les outils qu'il voudrait ajouter
    if (!mtgOptions.hasOwnProperty('level')) mtgOptions.level = 1
    // à la création on démarre avec ça par défaut (sans repère, juste vecteur unité)
    if (!mtgOptions.fig) mtgOptions.fig = {type: 'unity', grad: 'simple', unity: 'deg'}
    // ce paramètre dys à true sert à afficher la figure avec des traits plus gros,
    // des lettres plus espacées, etc.
    // Il n'est pas contenu dans la figure
    mtgOptions.dys = Boolean(parametres.dys)
    // pour les exercices de construction c'est indispensable
    mtgOptions.edition = true
    // bouton pour ouvrir une figure, l'info est dans la figure mais on le force ici (édition)
    mtgOptions.open = true
    // idem pour nouvelle figure
    mtgOptions.newFig = true
    // options: pour autoriser à changer les options de la figure, true par défaut, toujours true en édition
    mtgOptions.options = true
    // on veut que l'outil permettant d'enregistrer une figure soit présent,
    // pour qu'il puisse enregistrer en local
    // si ça perturbe on mettra false...
    mtgOptions.save = true
    // onSaveCallback n'a de sens que si `figureOptions.save === true`,
    // ici on laisse le comportement par défaut sur le bouton enregistrement de mathgraph
    // (en fichier local et pas dans la sesatheque) car on récupère la figure au clic sur
    // enregistrer (dans la page html hors mathgraph)

    // quand mtg sera chargé on mettra nos listeners
    mtgOptions.callBackAfterReady = function () {
      // on vire le spinner
      const spinner = document.getElementById('spinner') || {}
      while (spinner.firstChild) spinner.removeChild(spinner.firstChild)
      // et on ajoute nos listeners pour passer les infos à redux-form
      window.addEventListener('blur', function () {
        const content = mtgApp.getResult()
        if (!content || typeof content !== 'object') throw new Error('mathgraph ne remonte aucune info')
        fields.parametres.content.input.onBlur(content)
      })
      window.addEventListener('click', function () {
        window.focus()
      })
      window.addEventListener('focus', function () {
        fields.parametres.content.input.onFocus()
      })
    } // callBackAfterReady

    const mtgApp = mtgLoader('main', mtgOptions.fig, svgOptions, mtgOptions)
  } // displayEditor

  if (typeof window === 'undefined') throw Error('Ce code ne peut s’exécuter que dans un navigateur')
  let errorsContainer = document.getElementById('errors')
  if (!errorsContainer) errorsContainer = addElement(document.body, 'div', {id: 'errors'})
  const showError = (error) => {
    console.error(error)
    const errorMessage = error.message || error
    errorsContainer.innerText = errorMessage
  }
  if (typeof mtgLoader === 'function') {
    displayEditor()
  } else {
    addJs(mtgLoaderUrl, () => {
      if (typeof mtgLoader === 'function') displayEditor()
      else showError(Error('Mathgraph n’est pas chargé correctement'))
    })
  }
}
