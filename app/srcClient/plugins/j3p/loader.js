/**
 * Ce fichier est appellé par l'application sesaheque (dans l'iframe qui affiche une ressource)
 * Il déclare des méthodes via un module commonjs (cf rev 6116 pour un module AMD avec http://requirejs.org/)
 *
 * Ce script permet donc de charger un graphe dans le dom courant, mais sur un domaine inconnu.
 * Il faut avoir chargé headjs séparément, si jQuery n'est pas chargé on prendra celui de j3p
 *
 * Il reprend j3p.html + outils/j3pchargementlabomep.js, mais
 * - chargementJ3p.graphe est un tableau de tableaux (pas une chaine), ou on a inséré un tableau vide en indice 0
 * - ne reprend pas ce qui ne concerne pas la bibli (chargement des sections)
 *   - pas de fct verschainegraphe
 *   - pas de XMLHttpRequest
 *   - on zappe tout le début pour démarrer directement à oncontinue1
 * - viré la création du div d'id Mepact, car on en a déjà déjà un (passé en param à new
 *     Parcours() à la fin), d'où le remplacement de ton oncontinue4 par mon oncontinue4bis
 * - mis les css de jquery-ui et asmselect avec les js dans mon oncontinue4bis
 * - remonté le chargement des outils qui n'était pas dans des if au début (pour les voir)
 * - viré toutes les ref à J3PEstDansLabomep
 * - mis j3p.config.arborescence.sections sur /sections/ et pas /sections/publiees/ (sinon il
 *     trouvait plus ses petits)
 * - en simplifiant car on ne charge ici que des graphes, pas des listes
 * - en faisant des appels jsonP (car on est pas sur le même nom de domaine donc
 *   les XMLHttpRequest sont plus compliqués)
 */
'use strict'

var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')

var page = require('../../page/index')

/**
 * L'url de base de j3p
 * @private
 */
var urlBaseJ3p
/** raccourci vers window */
var w = window
// Des variables globales que j3p utilise, on les défini si elles ne le sont pas déjà
/* La commande console n’existe pas sous IE */
if (typeof w.console === 'undefined') w.console = {}
if (!w.console.log) w.console.log = function () {}
if (!w.console.info) w.console.info = function () {}
if (!w.console.warn) w.console.warn = function () {}
if (!w.console.error) w.console.error = function () {}

/** variable globale utilisée dans la fonction globale alerte */
if (typeof w.j3pdebug === 'undefined') w.j3pdebug = false
if (typeof w.alerte === 'undefined') w.j3pdebug = false
/**
* Si j3pdebug, affiche un message via alert (n=1) ou dans la console (n=2), sinon ne fait rien
*/
if (typeof w.alerte === 'undefined') {
  w.alerte = function (n, ch) {
    log(ch)
  }
}

/** obj principal, initialisé dans init, window.j3p sera affecté dans oncontinue8 par une instance de Parcours */
w.j3p = {}

/**
* Le code qui suit est tiré de j3plabomep.html
* C'est privé (à ce fichier), sauf ce que l'on exporte dans le dom global avec window
*/

/**
* On utilise un constructeur plutôt qu'une variable pour utiliser ensuite des prototypes dessus
* Il doit être global car des js inclus lui ajoutent des prototypes
* Était dans j3plabomep.html avec l'instanciation de l'objet
*/
function ChargementJ3p () {
  this.sources = ''
  this.graphe = [] // le graphe (un tableau de tableaux)
  this.grapheTab = [] // le graphe (un tableau de tableaux)
  this.versionenligne = true
  this.listedessections = [] // liste des noms de sections présentes dans le graphe
  this.listedesoutils = [] // liste des noms d'outils présents dans le graphe
  this.adresses = {}
}

/**
* Regarde si ch est dans tab
* @param {String} ch
* @param {Array} tab
* @returns {Boolean}
*/
function estDans (ch, tab) {
  // estdans('toto',['toto','tata'] renvoie TRUE
  for (var k = 0; k < tab.length; k++) {
    if (tab[k] === ch) return true
  }
  return false
}

/**
* Ce qui suit est une adaptation de j3p:/outils/j3pchargementlabomep.js
* Cf les commentaires en début de fichier pour les différences
* @param {EntityReference} eltHtml
* @returns {undefined}
*/
ChargementJ3p.prototype.chargement = function (eltHtml) {
  /* global head, jQuery */
  function oncontinue1 () {
    // alert('pause')
    // On charge les CSS :
    dom.addCss(pathOutils + 'stylesactivite.css')
    // dom.addCss_2(pathOutils +'j3pcss/j3pbases.css')

    // on parcours toutes les sections du graphe (ATTENTION, faut sauter l'indice 0)
    for (var k = 1; k < that.graphe.length; k++) {
      // et on stocke son nom si c'est la 1re fois qu'il apparait
      if (
          estDans(that.graphe[k][1], that.listedessections) === false &&
          that.graphe[k][1] !== 'fin' &&
          that.graphe[k][1] !== 'Fin' &&
          that.graphe[k][1] !== 'FIN'
      ) {
        that.listedessections.push(that.graphe[k][1])
      }
    }
    oncontinue3()
  }

  function oncontinue3 () {
    // on charge adresses.js qui ajoute un gros objet chargementJ3p.adresses avec les correspondances
    // nomSection : chemin du js de la section
    head.js(w.j3p.config.arborescence.adresses + 'adresses.js', // intialisation de j3p.config
      function () {
        log('on a chargé adresses.js')
        oncontinue4bis()
      }
    )
  }

  // chargement de jquery, jquery-ui et asmselect
  // pas besoin du DIV Mepact avec la bibli
  function oncontinue4bis () {
    var piledappels = new Array(0)
    // ça existe probablement déjà, mais pas forcément
    if (typeof jQuery === 'undefined') {
      piledappels.push(pathOutilsExt + 'jquery-ui/js/jquery-1.6.2.min.js')
    } else {
      // faut vérifier que c'est une version compatible
      var chunks = jQuery.fn.jquery.split('.')
      // si c'est pas la bonne version on écrase l'existante, tant pis pour le parent…
      if (chunks[0] !== '1' || chunks[1] < 6) piledappels.push(pathOutilsExt + 'jquery-ui/js/jquery-1.6.2.min.js')
    }
    // pour jquery-ui, comme on va pas les tester un par un, j3p les écrasera s'ils y étaient
    piledappels.push(pathOutilsExt + 'jquery-ui/js/jquery-ui-1.8.16.custom.min.js')
    piledappels.push(pathOutilsExt + 'asmselect/jquery.asmselect.js')
    piledappels.push(oncontinue5)
    head.js.apply(head, piledappels)
    // et les css se chargeront en parallèle
    dom.addCss(pathOutilsExt + 'asmselect/jquery.asmselect.css')
    dom.addCss(pathOutilsExt + 'jquery-ui/css/redmond/jquery-ui-1.8.16.custom.css')
  }

  // chargement de methodesmodeles (classe Parcours) et de toutes les sections du graphe
  function oncontinue5 () {
    var piledappels = new Array(0)
    var k
    var nomSection
    var prefixechemin = ''
    piledappels.push(w.j3p.config.arborescence.outils + 'methodesmodele.js')
    for (k = 0; k < that.listedessections.length; k++) {
      nomSection = that.listedessections[k]
      if (typeof w.chargement_j3p.adresses[nomSection] !== 'undefined') prefixechemin = w.chargement_j3p.adresses[nomSection] + '/'
      piledappels.push(pathSections + prefixechemin + 'section' + nomSection + '.js')
    }
    log('On a trouvé les sections', that.listedessections, piledappels[1])
    piledappels.push(oncontinue6)
    head.js.apply(head, piledappels)
  }

  // Définition de la liste des outils nécessaires
  function oncontinue6 () {
    var name, outils
    that.listedesoutils = []
    // les outils ont été déclarées dans les sections, précédemment chargées
    for (var k = 0; k < that.listedessections.length; k++) {
      // pour chaque section, on va regarder l'objet qu'elle a créé dans le dom
      name = that.listedessections[k]
      if (w.j3p['Section' + name] && w.j3p['Section' + name].outils) {
        // elle a des outils
        outils = w.j3p['Section' + name].outils
        for (var j = 0; j < outils.length; j++) {
          // pour chaque outil, on le note si c'était pas encore fait
          if (estDans(outils[j], that.listedesoutils) === false) {
            that.listedesoutils.push(outils[j])
          }
        }
      } else {
        // bizarre, on lance pas d'erreur mais on log
        log.warn('La section ' + name + " n'a aucun outil déclaré")
        log(w.j3p)
      }
    } // fin boucle sur les sections
    oncontinue7()
  } // oncontinue6

  // chargement des outils
  function oncontinue7 () {
    log('On va charger les outils', that.listedesoutils)

    function J3PInclude2 (code, param) {
      try {
        var script = document.createElement('script')
        script.innerHTML = code
        script.type = param
        document.getElementsByTagName('head')[0].appendChild(script)
        return true
      } catch (e) {
        log.error(e)
        return false
      }
    }

    // les css qu'il faut toujours charger
    // dom.addCss(pathOutils +'stylesactivite.css')
    // Et on passe aux js
    var piledappels = new Array(0)
    // On charge toujours ceux-là
    piledappels.push(pathOutils + 'J3Poutils.js')
    piledappels.push(pathOutils + 'J3Poutils2.js')
    piledappels.push(pathOutils + 'fenetres/fenetres.js')

    // Et ceux là aussi (communs à certains suivants ?)
    piledappels.push(pathOutils + 'calculatrice/ValidationZones.js')
    piledappels.push(pathOutils + 'calculatrice/ValidationZonesjp.js')
    piledappels.push(pathOutils + 'calculatrice/Arbre.js')
    piledappels.push(pathOutils + 'calculatrice/calculatrice.js')
    piledappels.push(pathOutils + 'infobulle/j3pbulle.js')
    piledappels.push(pathOutilsExt + 'fractions/Ratio-0.4.0.js')
    // mg32 => mathgraph32
    if (estDans('mg32', that.listedesoutils)) {
      piledappels.push(pathOutils + 'calcul_mtg32/mtg32calc.min.js')
    }

    if (estDans('mtg32', that.listedesoutils)) {
      J3PInclude2("MathJax.Hub.Config({  tex2jax: { inlineMath: [['$','$'], ['\\\\(','\\\\)']]},        jax: ['input/TeX','output/SVG'],TeX: {extensions: ['color.js']},messageStyle:'none' });", 'text/x-mathjax-config')
      piledappels.push(pathOutils + 'mtg32/MathJax.js?config=TeX-AMS-MML_SVG-full.js')
      piledappels.push(pathOutils + 'mtg32/mtg32jsmax.js')
    }

    // maths => mathquill
    if (estDans('maths', that.listedesoutils)) {
      // alert('maths')
      dom.addCss(pathOutilsExt + 'mathquill/home.css')
      dom.addCss(pathOutilsExt + 'mathquill/mathquill_maj.css')
      piledappels.push(pathOutilsExt + 'mathquill/mathquill_maj.js')
    }
    // jsx
    if (estDans('jsx', that.listedesoutils)) {
      log('jsx chargé')
      dom.addCss(pathOutilsExt + 'jsxtep/distrib/jsxgraph.css')
      w.J3Pinclude(pathOutilsExt + 'jsx/jsxgraphcore.js')
    }
    // formel => xcas
    if (estDans('formel', that.listedesoutils)) {
      piledappels.push(pathOutils + 'xcas/base.js')
    }
    if (estDans('webxcas', that.listedesoutils)) {
      piledappels.push(pathOutilsExt + 'webxcas/webxcas.js')
    }

    if (estDans('swiffy', that.listedesoutils)) {
      piledappels.push(pathOutilsExt + 'runtime/runtime.js')
    }

    if (estDans('compteestbon', that.listedesoutils)) {
      piledappels.push(pathOutils + 'compteestbon/compteestbon.js')
    }

    if (estDans('algebria', that.listedesoutils)) {
      piledappels.push(pathOutils + 'algebria/swfobject.js')
      piledappels.push(pathOutils + 'algebria/json2.js')
      piledappels.push(pathOutils + 'algebria/services.js')
    }

    if (estDans('calculette', that.listedesoutils)) {
      piledappels.push(pathOutils + 'calculatrice/calculatrice_ecole.js')
    }

    if (estDans('boulier', that.listedesoutils)) {
      piledappels.push(pathOutils + 'boulier/boulier.js')
    }

    if (estDans('animation', that.listedesoutils)) {
      piledappels.push(pathOutilsExt + 'runtime/runtime.js')
    }

    if (estDans('droitegraduee', that.listedesoutils)) {
      piledappels.push(pathOutils + 'droitegraduee/droitegraduee.js')
    }

    if (estDans('sokoban', that.listedesoutils)) {
      piledappels.push(pathOutils + 'sokoban/sokoban.js')
    }
    that.ggbestpresent = estDans('geogebra', that.listedesoutils)

    if (estDans('geometrie', that.listedesoutils)) {
      piledappels.push(pathOutils + 'geometrie/geometrie.js')
    }
    if (estDans('3D', that.listedesoutils)) {
      piledappels.push(pathOutils + '3D/3D.js')
    }
    if (estDans('quadrillage', that.listedesoutils)) {
      piledappels.push(pathOutils + 'quadrillage/quadrillage.js')
    }
    if (estDans('tableauconversion', that.listedesoutils)) {
      piledappels.push(pathOutils + 'tableauconversion/tableauconversion.js')
    }

    if (estDans('tableur', that.listedesoutils)) {
      piledappels.push(pathOutils + 'tableur/fauxtableur.js')
    }

    if (estDans('psylvia', that.listedesoutils)) {
      piledappels.push(pathOutils + 'psylvia2/psylvia.js')
      dom.addCss(pathOutils + 'psylvia2/psylvia.css')
    }

    if (estDans('algo', that.listedesoutils)) {
      piledappels.push(pathOutils + 'algo/algo.js')
    }

    piledappels.push(
      function () {
        // var t=setTimeout(oncontinue8(),9000)
        if (estDans('mtg32', that.listedesoutils)) {
          log('etape 0')
          /* global mtg32 */
          w.mtg32App = new mtg32.mtg32App() // eslint-disable-line new-cap
        }
        oncontinue8()
      }
    )
    log('piledappels' + piledappels)
    // piledappels.push(oncontinue8)
    head.js.apply(head, piledappels)
  } // oncontinue7

  // lancement de j3p
  function oncontinue8 () {
    // on définit le démarrage au premier noeud
    w.chargement_j3p.noeudinitial = 1
    // la fonction EquivalentIndexVersNoeud doit être dispo donc on peut
    if (typeof w.chargement_j3p.numeronoeud !== 'undefined') {
      w.chargement_j3p.noeudinitial = w.j3p.EquivalentIndexVersNoeud(w.chargement_j3p.numeronoeud)
      log('On récupère le dernier noeud enregistré cad',
        w.chargement_j3p.numeronoeud,
        ' et son index dans le graphe est ',
        w.chargement_j3p.noeudinitial)
    }
    /* global Parcours */
    w.j3p = new Parcours(eltHtml.id, 'Mep', 'exemple', false, w.chargement_j3p.noeudinitial)
    log('fin du chargement, j3p est créé comme instance de Parcours', w.j3p)
  }

  log('appel chargement()')
  // raccourci (toujours un / de fin dedans)
  var pathOutils = w.j3p.config.arborescence.outils
  var pathOutilsExt = w.j3p.config.arborescence.outilsexternes
  var pathSections = w.j3p.config.arborescence.sections
  var that = this // ChargementJ3p pour nos fct incluses
  // On démarre le lancement
  oncontinue1()
// On rend la main tout de suite
} // chargement

/**
* Les méthodes exportées de ce module
*/
module.exports = {
  /**
   * Initialise des params
   * @param {object} options Doit contenir la propriété urlBaseJ3p (url absolue du site j3p),
   *                              et éventuellement une fct log
   * @returns {undefined}
   */
  init: function (options) {
    if (!options) throw new Error('Paramètres de chargement absents')
    urlBaseJ3p = options.urlBaseJ3p
    if (!urlBaseJ3p || (urlBaseJ3p.substr(0, 2) !== '//' && urlBaseJ3p.substr(0, 4) !== 'http')) {
      throw new Error('Il faut donner une url absolue pour le domaine j3p')
    }
    log = options.log
    if (!log) log = function () {}
    // init de l'objet j3p utililisé pendant le chargement
    w.j3p = {
      'config': { // l'objet config est l'objet décrit dans j3pconfig/configj3p.txt
        'arborescence': {
          'sections': urlBaseJ3p + '/sections/',
          'outils': urlBaseJ3p + '/outils/',
          'outilsexternes': urlBaseJ3p + '/outilsexternes/',
          'adresses': urlBaseJ3p + '/j3pbdd/'
        }
      }
    }
  },

  /**
   * Fonction qui sera appellée par la sesatheque quand ce fichier js sera chargé
   * (pour nous passer les params)
   * @param {EntityReference} eltHtml    L'élément html dans lequel on doit charger le graphe j3p
   * @param {Ressource}       ressource  La ressource à charger (le graphe est dans ressource.parametres.g)
   * @param {object} options  [optional] Peut contenir un nom de fct dans la propriété nomFctScore (pour récupérer le score),
   *      ou une fct dans loadCallback à rappeler à la fin, ou une propriété showTitle
   * @returns {undefined}
   */
  charge: function (eltHtml, ressource, options) {
    var graphe = ressource.parametres.g
    if (!urlBaseJ3p) throw new Error('Il faut appeler init avant de lancer le chargement')
    if (!eltHtml || !graphe || !options) throw new Error('paramètres manquants, chargement impossible')
    // on vérifie que le graphe est au moins un tableau
    if (!graphe.unshift) throw new Error('graphe invalide, chargement impossible')
    log('On va charger ce graphe dans cet elt', graphe, eltHtml, ' avec les options', options)
    // pas mal de monde utilise ces fcts à la racine du dom, on les mappe sur celle qu'on a déjà
    if (typeof w.J3PCSSinclude === 'undefined') w.J3PCSSinclude = dom.addCss
    // Chargement d'un fichier JavaScript
    if (typeof J3Pinclude === 'undefined') {
      w.J3Pinclude = dom.addJs
    }

    // des scripts qu'on charge s'en servent peut-être encore
    w.J3PEstDansLabomep = urlBaseJ3p

    // pour virer le dernier / car sinon on a des chemins du genre http://j3p.devsesamath.net//sections...
    if (urlBaseJ3p.substr(urlBaseJ3p.length) === '/') urlBaseJ3p = urlBaseJ3p.substring(0, urlBaseJ3p.length - 1)

    var chargementJ3p = new ChargementJ3p()
    // faut mettre chargementJ3p à la racine du dom car les autres scripts le cherchent là
    w.chargement_j3p = chargementJ3p
    // on affecte le graphe de la sesatheque
    chargementJ3p.graphe = graphe
    // ATTENTION, le modèle veut un indice 0 vide et la 1re section à l'indice 1, on ajoute un elt vide au début
    chargementJ3p.graphe.unshift([])
    // Récupération des infos sur l'état du parcours
    if (options) {
      log('les options que je rècupère :', options)
      if (options.resultatCallback) {
        chargementJ3p.resultatCallback = options.resultatCallback
      }
      if (ressource.parametres.editgraphes) {
        chargementJ3p.editgraphes = ressource.parametres.editgraphes
      }
      if (options.lastResultat) {
        chargementJ3p.lastResultat = options.lastResultat
        if (options.lastResultat.contenu && options.lastResultat.contenu.scores !== undefined) {
          chargementJ3p.numeronoeud = options.lastResultat.contenu.noeuds[options.lastResultat.contenu.length - 1]
        }
      }
    }

    // on lance analyse du graphe et chargement des outils puis lancement
    // mais faut forcer cet id qui est en dur un peu partout dans le code j3p, on créé un div pour ça
    var j3pConteneur = dom.addElement(eltHtml, 'div', {id: 'Mepact'})
    page.loadAsync(['head'], function () {
      chargementJ3p.chargement(j3pConteneur)
      // qqun veut être rappelé ?
      if (typeof options !== 'undefined' && typeof options.loadCallback === 'function') {
        options.loadCallback()
      }
    })
  } // charge
} // objet exporté
