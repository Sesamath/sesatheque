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

/**
 * Afficheur générique pour l'affichage de toutes les ressources
 * appelé avant les plugins (c'est sa fct load qui chargera le bon)
 *
 * Son chargement déclenche celui de init qui ajoute en global nos méthodes utilitaires, cf {@link namespace:sesamath}
 */

/* global window, define, require, alert */

if (typeof define === 'undefined' || typeof require === 'undefined') {
  alert("requireJs doit être chargé avant ce fichier");
} else if (typeof window === 'undefined') {
  throw new Error("Ce module est un module requireJs prévu pour fonctionner dans un navigateur");
} else {

  // faut d'abord un module sans dépendance pour pouvoir la charger avec le bon chemin si besoin
  define(function () {
    "use strict";
    /**
     * Module d'une seule fonction pour afficher une ressource quelconque.
     * Il chargera le bon afficheur en lui passant les options attendues, en créant si besoin les contereurs dans le dom courant.
     * @service display
     * @param {Ressource}     ressource La ressource à afficher
     * @param {initOptions}   [options] Les options éventuelles (passer base si ce js est chargé sur un autre domaine)
     * @param {errorCallback} [next]    Fct appelée à la fin du chargement avec une erreur ou undefined
     */
    var display = function (ressource, options, next) {
      /**
       * Fait le chargement proprement dit après l'init
       * @param {Error} [error] Une erreur éventuelle à l'init
       */
      function load(error) {
        if (error) next(error);
        else {
          /**
           * Les options complétés par init
           * @name options
           * @type {displayOptions}
           */
          S.log('display avec la ressource', ressource);
          S.log('et les options après init', options);

          // ajoute de la css commune à toutes les ressources ici
          S.addCss(options.base + 'styles/ressourceDisplay.css');

          // tente de charger le plugin du type de ressource
          var name = ressource.type;
          var modules = [name];
          // pour envoyer les résultats, on regarde si on nous fourni une url ou une fct ou un nom de message
          var traiteResultat;
          if (options) {
            if (options.resultatCallback && S.isFunction(options.resultatCallback)) traiteResultat = "function";
            else if (options.urlResultatCallback && S.isString(options.urlResultatCallback) && options.urlResultatCallback.substr(0, 4) === 'http') traiteResultat = "ajax";
            else if (options && options.resultatMessageAction && S.isString(options.resultatMessageAction)) traiteResultat = "message";
          }
          // un cas particulier, le prof qui teste, on fourni une callback qui fait rien,
          // pour éviter des avertissements sur les ressources qui attendent une callback
          if (traiteResultat === "none") traiteResultat = function () {};
          if (traiteResultat) modules.push('Resultat');

          require(modules, function (plugin, Resultat) {
            try {
              if (typeof plugin === 'undefined') throw new Error('Le chargement du plugin ' + name + ' a échoué');
              if (typeof plugin.display !== 'function') throw new Error('Le plugin ' + name + " n'a pas de méthode display");
              S.log('plugin ' + name + ' chargé');
              if (options.container) S.empty(options.container);
              else throw new Error("L'initialisation a échoué, pas de conteneur pour la ressource");
              if (options.errorsContainer) options.errorsContainer.innerHTML = '';
              else throw new Error("L'initialisation a échoué, pas de conteneur pour afficher les erreurs");
              // On vire le titre si on nous le demande via les options ou un param dans l'url
              if (
                  (options.hasOwnProperty('showTitle') && !options.showTitle) ||
                  /\?.*showTitle=0/.test(wd.URL) ||
                  /\/apercevoir\//.test(wd.URL) ||
                  /\?(.+&)?layout=iframe/.test(wd.URL)
              ) {
                ST.hideTitle();
              }
              // on regarde s'il faut ajouter une fct de sauvegarde des résultats
              if (Resultat) addResultatCallback(options, traiteResultat, Resultat);
              // on lui ajoute toujours ça
              options.pluginBase = options.base +"plugins/" +name +"/";
              // on peut afficher
              plugin.display(ressource, options, function (error) {
                if (error) {
                  S.log("le display a terminé mais renvoyé l'erreur", error);
                  ST.addError(error);
                } else {
                  S.log("le display a terminé sans erreur");
                }
                if (next) next(error);
              });
            } catch (error) {
              if (ST.addError) ST.addError(error.toString());
              else if (console && console.error) {
                console.error("sesamath.sesatheque.addError n'existe pas");
                console.error(error);
              }
            }
          });
        }
      }

      /**
       * Ajoute une méthode resultatCallback aux options si besoin
       * @private
       * @param {Object}   options        L'objet sur lequel on ajoutera la methode resultatCallback
       * @param {string}   traiteResultat Le type de traitement (function|ajax|message)
       * @param {function} Resultat       Le constructeur Resultat
       */
      function addResultatCallback(options, traiteResultat, Resultat) {
        /*global XMLHttpRequest*/
        // Le conteneur du picto enregistrement
        var divFeedback = wd.getElementById('pictoFeedback');

        // Éteint le feedback */
        function feedbackOff() {
          if (divFeedback) divFeedback.className = 'feedbackOff';
        }

        // Allume le feedback OK pour 4s
        function feedbackOk() {
          if (divFeedback) {
            divFeedback.className = 'feedbackOk';
            setTimeout(feedbackOff, 4000);
          }
        }

        // Allume le feedback KO pour 4s
        function feedbackKo() {
          if (divFeedback) {
            divFeedback.className = 'feedbackKo';
            setTimeout(feedbackOff, 4000);
          }
        }

        if (traiteResultat) {
          /**
           * Envoi un résultat en ajax ou à la callback pour sauvegarde et appelle saveCallback avec le retour
           * @private
           * @param {Object}   result         Le résultat à envoyer (passera par le constructeur Resultat)
           * @param {function} [saveCallback] La fonction à rappeler avec le retour de l'appel ajax ou de la callback de sauvegarde
           */
          options.resultatCallback = function (result, saveCallback) {
            /**
             * Gère l'affichage du feedback puis appelle saveCallback avec le retour
             * @private
             * @param retour Le retour de l'envoi du score
             */
            function feedback(retour) {
              S.log('feedback', retour);
              if (retour && (retour.ok && retour.ok === true) || (retour.success && retour.success === true)) {
                feedbackOk();
              } else {
                if (retour && retour.error) ST.addError(retour.error);
                feedbackKo();
              }
              // et on appelle saveCallback si on nous l'a fourni
              if (saveCallback) saveCallback(retour);
            }

            /**
             * poste resultat en ajax vers traiteResultat puis appellera feedback avec le retour
             * @private
             * @param {Resultat} resultat
             */
            function sendAjax(resultat, deferSync) {
              // c'est une url, on gère l'envoi
              if (typeof XMLHttpRequest === "undefined") {
                // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
                throw new Error("Le navigateur ne supporte pas les appels ajax, impossible d'envoyer des résultats");
              }
              // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
              var xhr = new XMLHttpRequest();
              // pour que le navigateur envoie les cookies
              xhr.withCredentials = true;


              // les différentes callback
              xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 400) {
                  try {
                    var retour = JSON.parse(xhr.responseText);
                    feedback(retour);
                  } catch (error) {
                    feedback({error: "La réponse de l'enregistrement du résultat est invalide"});
                  }
                } else {
                  // On a une réponse mais c'est une erreur
                  feedback({
                    error: "La réponse de l'enregistrement du résultat est une erreur " +
                    xhr.status + ' : ' + xhr.responseText
                  });
                }
              };

              xhr.onerror = function () {
                // Pb de connexion au serveur
                feedback({error: "Impossible d'envoyer le résultat (à " + options.urlResultatCallback + ")"});
              };


              // et on envoie, mais sur le proxy si sync (car on est sur un event unload et l'envoi de la requete options est annulée en cross domain)
              var url;
              if (deferSync) {
                resultat.deferUrl = options.urlResultatCallback;
                url = options.base + 'api/deferPost';
                S.log("on passe en synchrone vers " + url);
              } else {
                // on pouvait pas mettre de timeout en synchrone
                url = options.urlResultatCallback;
                xhr.timeout = ajaxTimeout;
                xhr.ontimeout = function () {
                  feedback({
                    error: "Pas de réponse de l'enregistrement du résultat après " +
                    Math.floor(ajaxTimeout / 1000) + "s d'attente."
                  });
                };
              }
              xhr.open('POST', url, !deferSync);
              xhr.setRequestHeader('Content-type', 'application/json'); // text/plain évite le preflight mais le body parser interprête pas
              try {
                xhr.send(JSON.stringify(resultat));
              } catch (error) {
                feedback({error: "Impossible de convertir (donc d'envoyer) le résultat renvoyé par la ressource."});
              }
            }

            function sendMessage(resultat) {
              var chunks = options.resultatMessageAction.split('::');
              var action = options.resultatMessageAction;
              var resultatProp = chunks[1] || "resultat";
              var message = {
                action: action,
              };
              message[resultatProp] = resultat;
              // on envoie
              window.top.postMessage(message, "*");
            }


            // MAIN addResultatCallback
            S.log("resultatCallback display a reçu", result);
            var deferSync = result.deferSync;
            var resultat = new Resultat(result);
            // on regarde si on nous a demandé d'ajouter des paramètres utilisateur au résultat
            ["sesatheque", "userOrigine", "userId"].forEach(function (paramName) {
              var paramValue = S.getURLParameter(paramName) || options[paramName];
              if (paramValue) resultat[paramName] = paramValue;
            });
            // @todo ajouter des vérifs minimales

            // si on nous a passé une fct on lui envoie le résultat
            if (traiteResultat === "function") {
              S.log('on envoie ce résultat à la fct qui nous a été passé en param', resultat);
              options.resultatCallback(resultat);
            } else if (traiteResultat === "ajax") {
              S.log("on va poster ce résultat vers " + traiteResultat, resultat);
              sendAjax(resultat, deferSync);
            } else if (traiteResultat === "message") {
              if (options.resultatMessageAction === "none") {
                S.log("On a reçu ce résultat (que l'on ne fait pas suivre on est en test)", resultat);
              } else {
                S.log("postMessage de ce résultat vers " + traiteResultat, resultat);
                sendMessage(resultat);
              }
            }
          }; // fin définition options.resultatCallback
        }
      } // addResultatCallback

      /**
       * MAIN
       */
      try {
        // raccourcis
        var w = window;
        var wd = window.document;
        if (typeof w.sesamath === "undefined") w.sesamath = {};
        var S = window.sesamath;
        if (!S.sesatheque) S.sesatheque = {};
        var ST = S.sesatheque;
        /**
         * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
         * @private
         * @type {number}
         */
        var ajaxTimeout = 10000;

        // on appelle la conf de require, en cross domain si on est appelé avec base
        // ça devrait marcher (sinon ça risque pas), car on complète avec le chemin absolu du fichier js
        var base = options.base || "/";
        if (base.substr(-1) !== "/") base += "/";
        options.base = base;
        // tant que l'init a pas été fait require va chercher en relatif à la page courante, faut donc préciser en absolu
        var initFile = base + "init.js";
        require([initFile], function (init) {
          init(options, load);
        });
      } catch (error) {
        if (console && console.error) console.error(error);
        // pb de chargement probable, on explicite
        var err = new Error("Problème de chargement probable, en cross-domain il faut passer options.base (" +error.toString() +")");
        next(err);
      }
    };

    return display;
  });
}
