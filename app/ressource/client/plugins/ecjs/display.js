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

try {
  define(function () {
    'use strict'
    /*global head*/
    /**
     * Module pour afficher les ressources ecjs (exercices calculatice en javascript)
     * @plugin ecjs
     */
    var ecjs = {}
    // raccourcis, si ça plante le catch gère
    var S = window.sesamath

    /**
     * inspiré de http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript/api/
     * @memberOf ecjs
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Possibilité de passer ecjsBase pour modifier http://ressources.sesamath.net/replication_calculatice/javascript
     * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
     */
    ecjs.display = function (ressource, options, next) {
      // vérifs de base
      if (!options.container) throw new Error("Paramétrage manquant (conteneur)")
      if (!ressource.parametres.fichierjs) throw new Error("Paramétrage manquant (nom de l'exercice à lancer)")

      // pour utiliser le serveur de calculatice mettre http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript
      var ecjsBase = S.getURLParameter("ecjsBase") || options.ecjsBase || "http://ressources.sesamath.net/replication_calculatice/javascript"

      // d'après {ecjsBase}/api/clc-api.main.js
      // celui-là détruit notre style et semble ne rien apporter dans les exos
      //"http://calculatice.ac-lille.fr/calculatice/squelettes/css/clear.css",
      S.addCss(ecjsBase + "/lib-externes/jquery/css/start/jquery-ui-1.10.4.custom.min.css")
      S.addCss(ecjsBase + "/clc/css/clc.css")
      // si on prend pas le css original qui reset html et body, ça casse tout (le rectangle clc s'affiche pas),
      // mais en le laissant ça casse nos styles, faudrait le mettre toujours en iframe :-/
      require(["head_load"], function () {
        head.ready(function () {
          // on attend que tout soit fini pour virer require que Raphael et Big ne supportent pas
          // on espère que plus personne n'en aura besoin
          require = undefined
          define = undefined
          // Cf /home/sesamath/bin/fetchCalculatice.sh qui tourne sur le serveur web ressources.sesamath.net
          // pour la liste des js concaténés dans scripts.js
          head.load(ecjsBase + "/scripts.js", function () {
            // on vérifie que l'on a tous les objets globaux souhaités
            var glob = ["Modernizr", "$", "SVG", "Raphael", "Big", "createjs", "CLC"]
            var prop, i
            for (i = 0; i < glob.length; i++) {
              prop = glob[i]
              if (typeof window[prop] === "undefined") throw new Error("Problème de chargement, " +prop +" n'existe pas")
            }

            /*global CLC, $*/
            function envoyerScoreExoJs(event, data){
              S.log("résultats reçus du js calculatice", data)
              resultatSent = true; // même si ça plante, pas la peine de recommencer au unload
              var dataToSend = {
                fin : true
              }
              if (data.total > 0) {
                var score = parseInt(data.score, 10) || 0
                dataToSend.score = score / data.total
                dataToSend.reponse = score +" sur " +data.total
              } else {
                dataToSend.reponse = "score indéterminé"
              }
              if (options && options.resultatCallback) {
                options.resultatCallback(dataToSend)
              }
            }

            // On réinitialise le conteneur
            var container = options.container
            S.empty(container)
            var exoClc = S.addElement(container, 'div', {id:"exoclc", style:{margin:"0 auto", width:"735px"}})
            var footer = S.addElement(container, 'p', {style:{"text-align":"right", margin:"0 auto", width:"735px"}}, "Exercice original provenant du site ")
            S.addElement(footer, 'a', {href:"http://calculatice.ac-lille.fr/", target:"_blank"}, "Calcul@tice")
            var $exoClc = $(exoClc)
            // les options et le nom de l'exo
            var optionsClc = ressource.parametres.options || {}
            optionsClc.parametrable = !!options.isFormateur || options.optionsClcCallback
            var nomExo = ressource.parametres.fichierjs
            var cheminExo = ecjsBase + "/exercices/"
            var exoLoaded = false
            var isLoaded
            var resultatSent = false

            // si ça intéresse l'appelant et que le chargement est KO on finira par le dire après 10s
            if (next && typeof next === "function") {
              setTimeout(function () {
                if (!exoLoaded) next(new Error("Exercice calculatice toujours pas chargé après 10s"))
              }, 10000); // on laisse 10s avant d'envoyer une erreur de chargement
            }
            // on envoie un score vide au unload si rien n'a été envoyé avant
            if (options && options.resultatCallback) {
              // on ajoute un envoi au unload si rien n'a été envoyé avant
              window.addEventListener('unload', function () {
                S.log("unload ecjs")
                if (isLoaded && !resultatSent) {
                  envoyerScoreExoJs(null, {
                    score : 0,
                    reponse : "Aucune réponse",
                    fin : true
                  })
                }
              })
            }
            // cree un exo de maniere asynchrone
            var reqExo  = CLC.loadExo(cheminExo + nomExo, optionsClc)

            // quand l'exo est pret on le met dans son div
            reqExo.done(function(exercice){
              S.log("exo clc", exercice)
              $exoClc.html(exercice)
              isLoaded = true
              // le 2e arg se retrouve dans event.data (event 1er arg passé à la callback)
              // pour la liste des événements, chercher "publier" dans les sources calculatice
              // on a validationQuestion, validationOption, finExercice
              // l'evt est lancé sur
              // pour finExercice on récupère {idExo, numExo, score {int, nb de bonnes réponses}, total {int, nb total de questions}, duree {int, en secondes}}
              exercice.on("finExercice", null, envoyerScoreExoJs)
              if (next && typeof next === "function") {
                exoLoaded = true
                next()
              }
              // si l'utilisateur veut récupérer les paramètres, on les lui affiche directement
              if (typeof options.optionsClcCallback === "function") {
                exercice.on('validationOption', null, function (event, optionsClc) {
                  options.optionsClcCallback(optionsClc)
                })
                $exoClc.ready(function () {
                  // on a pas d'événement sur l'exo chargé, faut attendre que le js de calculatice ait complété le dom
                  var i=0
                  function delayOptions() {
                    if (i++ < 300) {
                      setTimeout(function () {
                        var $button = $('button.parametrer')
                        if ($button.length > 0) {
                          if ($button.length > 1) {
                            S.log.error("On a plusieurs boutons qui répondent au sélecteur 'button .bouton.parametrer'")
                            $button = $button.first()
                          }
                          S.log("on a trouvé le bouton après " +i*10 +"ms d'attente")
                          $button.click()
                          i = 0
                          delayOptionsValidate()
                        } else {
                          delayOptions()
                        }
                      }, 10)
                    } else {
                      S.log.error("Pas trouvé le bouton paramétrer après 5s", $exoClc.html())
                    }
                  }
                  function delayOptionsValidate() {
                    if (i++ < 300) {
                      setTimeout(function () {
                        var $button = $('button.tester-parametre')
                        if ($button.length > 0) {
                          if ($button.length > 1) {
                            S.log.error("On a plusieurs boutons qui répondent au sélecteur 'button.tester-parametre'")
                            $button = $button.first()
                          }
                          S.log("on a trouvé le bouton valider après " +i*10 +"ms d'attente")
                          $button.hide()
                        } else {
                          delayOptionsValidate()
                        }
                      }, 10)
                    } else {
                      S.log.error("Pas trouvé le bouton paramétrer après 5s", $exoClc.html())
                    }
                    //$('button.tester-parametre').hide()
                  }
                  delayOptions()
                })
              }
            })
          })
        })
      })
    }

    return ecjs
  })
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module")
    console.error(error)
  }
}
