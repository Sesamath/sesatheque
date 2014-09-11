/**
 * Ressource calcul mental en flash (avec param en json, mais dans parametres.xml (sic)
 * qui permettent de générer un xml ici avec l'aléatoire paramétré)
 * ex 36162 36248 36404 40141 (pris au hasard dans les ressources persos de profs)
 */
/*global define, log, container, window, addElement */
'use strict';

var baseMental;
/** contient l'historique des réponses de chaque question */
var histoReponses = [];

/** module de chargement d'un swf */
var sesaswf

define(['sesaswf', 'underscore'], function (modSwf) {
  // on affecte notre var sesaswf avec le module chargé
  sesaswf = modSwf;
  /*global _*/
  // charger_options et enregistrer_score exportées dans le dom global par display

  return {
    display   : display,
    showResult: showResult
  }
});

// reste à définir nos méthodes

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
 * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
 *                              et éventuellement resultCallback)
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
function display(ressource, options, next) {
  var swfUrl;

  log('start ec2 display avec la ressource', ressource);

  try {
    //les params minimaux
    if (!ressource.id || !ressource.titre || !ressource.parametres || !ressource.parametres.xml) {
      throw new Error("Paramètres manquants");
    }
    // base et swf
    baseMental = options.baseUrl + '/cm/swf'
    swfUrl = baseMental + '/cm.swf';

    // les fcts exportées pour le swf
    if (options && options.resultCallback) window.com_mental_resultat = function (nbQuestions, numQuestion, reponse) {
      // reponse est de la forme o/n
      histoReponses.push([nbQuestions, reponse]);
      // labomep recevait aussi type_tag : 'mental', node_type: 'mental', idres : ressource.id, origine & seance_id,
      // l'appelant devra le mettre dans la callback qu'il nous donne
      options.resultCallback({
        reponse: histoReponses
      })
    } else window.com_mental_resultat = function () {};

    // On réinitialise le conteneur
    container.innerHTML = '';

    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    container.setAttribute("width", 735);
    // aj d'un div pour notre swf

    options = {
      largeur  : 735,
      hauteur  : 450,
      base     : baseMental,
      flashvars: {
        parametres_xml: getXmlParam(ressource.parametres.xml)
      }
    }

    sesaswf.load(container, swfUrl, options, next);
  } catch(error) {
    addElement(options.errorsContainer, 'p', {}, error.toString());
  }
}

/**
 * Affiche un résultat sauvegardé préalablement
 * @param {Object}      result Le résultat tel qu'il a été passé à saveResult au préalable
 * @param {HTMLElement} elt    L'élément html (https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
 */
function showResult(result, elt) {
  log('showResult', result)
  log("dans l'élément", elt)
}

function getXmlParam(params) {
  var isDelai = (params.isdelai === 'o');
  var isAlea = (params.alea === 'o');
  var delai = '';
  if (isDelai) delai = getNb(params.delai)
  var newSeries = [];
  if (_.isArray(params.series)) {
    params.series.forEach(function (serie) {
      var newSerie = {
        quantite : getNb(serie.ndcdcs),
        type     : serie.tdcdcs,
        aleatoire: (serie.posalea === 'alea'),
        isdelai  : (serie.isdelai === 'o'),
        delai    : (serie.delai || ''),
        nombres  : getNombresFromSerie(serie)
      };
      // on ajoute les signes, qui dépendent du type
      newSerie.signes = getSignesFromSerie(serie)

      newSeries.push(newSerie);
    }) // params.series.forEach
  } else {
    throw new Error("Aucune série à traiter");
  }
}

/**
 * Transforme une chaîne en nombre (vire les espaces éventuels et remplace , par .)
 * @param {string|number} nb
 * @returns {number}
 */
function getNb(nb) {
  if (_.isString(nb)) return Number(nb.replace(/,/g, '.').replace(/\s/g, ''));
  else return Number(nb);
}

/**
 * Retourne le tableaux nombres d'une série
 * @param serie
 * @returns {Array}
 */
function getNombresFromSerie(serie) {
  // le tableau que l'on va retourner
  var nombres = [];
  serie.nb.forEach(function (nb) {
    var newNb
    // nature du nombre
    switch (nb.cts) {
      case 1:
        newNb = {
          type: 'fixe',
          fixe: getNb(nb.cns)
        };
        break;

      case 2:
        newNb = {
          type   : 'liste',
          liste  : [],
          liaison: (nb.cls === 'o')
        };
        nb.cns.split('|').forEach(function (item) {
          newNb.liste.push(getNb(item));
        });
        break;

      case 3:
        newNb = {
          type: 'intervalle'
        };
        var bornes = nb.cns.split('|');
        newNb.debut = getNb(bornes[0]);
        newNb.fin = getNb(bornes[1]);
        break;

      case 4:
        newNb = { type: 'sans restriction'};
        break;

      default :
        throw new Error('type de nombre non géré');
    }

    // chiffres admissibles
    if (nb.cts > 2) { // intervalle ou sans restriction
      newNb.chiffres = [];
      for (var posChiffre = 0; posChiffre < 8; posChiffre++) {
        newNb.chiffres.push(nb.ccs.substr(posChiffre, 1) == 1);
      }
    }

    // couleur
    newNb.couleur = nb.ccns;
    // temps d'affichage du nombre
    newNb.idDelai = (nb.cdns !== 'permanent');
    if (newNb.isDelai) newNb.delai = parseInt(nb.cdns) // '20 s' => 20
    // fini pour ce nb
    nombres.push(newNb);
  }) // serie.nb.forEach

  return nombres;
}