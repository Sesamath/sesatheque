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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

try {
  define(['swfobject'], function () {
    "use strict";
    // le require de swfobject a ajouté la variable swfobject dans l'espace de nom global et ne nous la renvoie pas
    /*global swfobject*/

    /**
     * Module pour afficher les ressource em (exercices mathenpoche, en flash)
     * @plugin em
     */
    var em = {};

    // nos vars globales
    var ressId;
    var ressType = 'em';
    var startDate;
    var lastResult;

    /**
     * Affiche la ressource dans l'élément html passé dans les options
     * @memberOf em
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
     */
    em.display = function (ressource, options, next) {
      var container = options.container;
      if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
      var errorsContainer = options.errorsContainer;
      if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");

      /** class utilisée dans notre css */
      var cssClass = 'mepRess';
      var params = ressource.parametres;
      var baseMepSwf, idSwf, swfUrl, largeur, hauteur, flashvars, swfParams, swfAttributes;
      // raccourcis, si ça plante le catch gère
      var S = window.sesamath;
      var ST = S.sesatheque;

      // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf
      var divId = 'mepRess' + (new Date()).getTime();
      ressId = ressource.oid;

      S.log('start display em avec la ressource (+options)', ressource, options);
      //les params minimaux
      if (!ressource.oid || !ressource.titre || !params) {
        throw new Error("Paramètres manquants");
      }

      // Ajout css
      if (options.baseUrl) S.addCss(options.baseUrl + 'mep.css'); // si on a pas tant pis pour le css
      container.className = cssClass;

      // le message en attendant le chargement
      S.addElement(container, "div", {id: divId}, "Chargement de la ressource " + ressource.oid + " en cours.");

      // notre base
      if (ressource.origine !== 'em' && ressource.baseUrl) baseMepSwf = ressource.baseUrl;
      else if (options.verbose) baseMepSwf = "http://mep-col.devsesamath.net/dev/swf";
      else baseMepSwf = "http://mep-col.sesamath.net/dev/swf";
      // id du swf
      idSwf = Number(params.swf_id ? params.swf_id : ressource.idOrigine);
      // url du swf
      swfUrl = baseMepSwf + '/exo' + idSwf + ".swf";
      /**
       * Lance le chargement avec swfobject
       */
      if (params.mep_modele === 'mep2lyc') {
        largeur = 959;
        hauteur = 618;
      } else {
        largeur = 735;
        hauteur = 450;
      }
      // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
      if (container.style) container.style.width = largeur + 'px';
      else container.setAttribute("width", largeur + 'px'); // marche pas avec chrome ou ff

      /** @see http://redmine.sesamath.net/projects/alibaba/wiki/ExosMep pour les flashvars à passer */
      flashvars = options.flashvars || {};
      // ces flashvars pour le swf sont obligatoires et on les impose ici
      flashvars.idMep = Number(ressource.idOrigine);
      flashvars.modeleMep = (params.mep_modele === "mep1") ? "1" : "2";
      flashvars.abreviationLangue = params.mep_langue_id;
      flashvars.idSwf = idSwf;
      // si n on a pas de chiffrement de la réponse qui sera une string au format "vrrp..."
      // (sinon c'est un nombre qui correspond à cette réponse chiffrée)
      // et la propriété score est ajoutée (un entier donnant le nb de bonnes réponses)
      flashvars.ch = options.ch || 'n';
      // ensuite le facultatif si présent
      if (params.aide_id)         flashvars.idAide = Number(params.aide_id);
      // pour les profs (passer les questions et voir l'aide)
      if (options.isFormateur) {
        S.log("affichage par un formateur, on désactive le score et regarde si on peut activer le bouton suite et l'aide (suivant ressource)");
        // à l'import on ne met pas ces valeurs si c'est o (valeur par défaut)
        if (params.suite_formateur) flashvars.isBoutonSuite = params.suite_formateur;
        else flashvars.isBoutonSuite = "o";
        if (params.aide_formateur)  flashvars.isBoutonAide = params.aide_formateur;
        else flashvars.isBoutonAide = "o";
      }
      // 0 ressources publiques en 2013-11, mais qq unes dans MEPS pas publiées
      if (params.nb_wnk)          flashvars.mep_nb_wnk = params.nb_wnk;

      // traitement du résultat éventuel
      if (options.resultatCallback && !options.isFormateur) {
        // faut une fonction qui va transformer le résultat au format attendu
        // et la pour rendre accessible au swf dans son dom
        window.resultatCallback = function (result) {
          S.log("resultatCallback em reçoit", result);
          var resultMod = {
            reponse: result.reponse,
            nbq: result.nbq || params.nbq_defaut,
            ressId: ressId,
            ressType: ressType,
            date: startDate,
            duree: Math.floor(((new Date()).getTime() - startDate.getTime()) / 1000),
            fin : (result.fin === "o"),
            original: result
          };
          // le score sera calculé d'après la réponse juste avant enregistrement en bdd
          // (après déchiffrement coté serveur), mais si c'est j3p qui charge il veut l'intercepter
          if (resultMod.nbq) {
            resultMod.score = result.score / resultMod.nbq;
          } else {
            resultMod.score = null;
          }
          lastResult = resultMod;

          options.resultatCallback(resultMod);
        };

        // on ajoute un envoi au unload si rien n'a été envoyé avant
        window.addEventListener('unload', function () {
          S.log("unload em");
          if (startDate && !lastResult) {
            lastResult = {
              reponse: "",
              nbq: params.nbq_defaut,
              ressId: ressId,
              ressType: ressType,
              date: startDate,
              duree: Math.floor(((new Date()).getTime() - startDate.getTime()) / 1000),
              original: null,
              fin:true,
              deferSync:true
            };
            options.resultatCallback(lastResult);
          }
          // sinon le swf n'a pas été chargé ou il a déjà envoyé une réponse et on envoie rien au unload
        });

        flashvars.nomFonctionCallback = 'resultatCallback';
      }

      // les params pour le player
      swfParams = {
        "base": baseMepSwf + "/",
        "menu": "false",
        "wmode": "window",
        "allowScriptAccess": "always" // important pour que le swf puisse communiquer avec le js de cette page
      };
      // et les attributs pour le loader swfobject.embedSWF
      swfAttributes = {
        id: divId,
        name: divId
      };
      // pour debug
      S.log('flashvars', flashvars);
      // swfobject.embedSWF (swfUrl, htmlId, largeur, hauteur, version_requise,
      //    expressInstallSwfurl, flashvars, params, attributes, callbackFn)
      swfobject.embedSWF(swfUrl, divId, largeur, hauteur, "8", null, flashvars, swfParams, swfAttributes, callbackFn);

      /**
       * Callback du chargement
       * @param e objet avec id,success,ref
       */
      function callbackFn(e) {
        var retour;
        if (e.success) {
          startDate = new Date();
          S.log("Chargement de " + swfUrl + " ok");
        } else {
          ST.addError("Javascript fonctionne mais votre navigateur ne supporte pas les éléments Adobe Flash, impossible d'afficher cette ressource.");
          retour = new Error('Le chargement de ' + swfUrl + ' a échoué');
        }
        if (next && typeof next === "function") {
          next(retour);
        }
      }
    };

    return em;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
