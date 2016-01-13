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
  define(['tools/swf', 'underscore'], function (swf) {
    /**
     * Ressource calcul mental en flash (avec param en json, mais dans parametres.xml (sic)
     * qui permettent de générer un xml ici avec l'aléatoire paramétré)
     * ex 36162 36248 36404 40141 (pris au hasard dans les ressources persos de profs)
     */
    'use strict'
    // underscore exporte _ dans le dom global
    /*global _*/

    /**
     * Module pour afficher les ressources mental (exercices de calcul mental, avec cm.swf et un xml de paramètres)
     * @plugin mental
     */
    var mental = {}

    // raccourcis, si ça plante le catch gère
    var S = window.sesamath
    var ST = S.sesatheque

    var baseMental
    /**
     * l'historique des réponses de chaque question
     * @private
     */
    var histoReponses = []

    /**
     * Affiche la ressource
     * @memberOf mental
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
     */
    mental.display = function (ressource, options, next) {
      var swfUrl

      S.log('start mental display avec la ressource', ressource)

      try {
        //les params minimaux
        if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.xml) {
          throw new Error("Paramètres manquants")
        }
        // base et swf
        baseMental = options.pluginBase + 'cm/swf'
        swfUrl = baseMental + '/cm.swf'

        // les fcts exportées pour le swf
        if (options && options.resultatCallback) {
          window.com_mental_resultat = function (nbQuestions, numQuestion, reponse) {
            // reponse est de la forme o/n
            histoReponses.push([nbQuestions, reponse])
            // labomep recevait aussi type_tag : 'mental', node_type: 'mental', idres : ressource.oid, origine & seance_id,
            // l'appelant devra le mettre dans la callback qu'il nous donne s'il en a besoin
            options.resultatCallback({
              reponse: histoReponses
            })
          }
        } else window.com_mental_resultat = function () {
        }

        // On réinitialise le conteneur
        var container = options.container
        S.empty(container)

        // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
        container.setAttribute("width", 735)
        container.style.width = '735px'

        var swfOptions = {
          largeur: 735,
          hauteur: 450,
          base: baseMental,
          flashvars: {
            parametres_xml: getXmlParam(ressource.parametres.xml)
          }
        }

        swf.load(container, swfUrl, swfOptions, next)
      } catch (error) {
        ST.addError(error)
      }
    }

    return mental

    // tout le reste est de la cuisine interne pour générer le xml passé en paramètre au display

    /**
     * Renvoie le xml qui sera passé au flash à partir de ressource.parametres.xml
     * adaptation en js du code de labomep:outils/mental/display.php
     * @private
     * @param params le contenu de ressource.parametres.xml, qui est du json !!
     */
    function getXmlParam(params) {
      if (!_.isArray(params.series)) {
        throw new Error("Aucune série à traiter")
      }

      // L'objet js que l'on construit à partir des params
      var o = {
        isDelai: (params.isdelai === 'o'),
        delai: '',
        aleatoire_exercice: (params.alea === 'o'),
        temp_series: [],
        operations: []
      }
      if (o.isDelai && params.delai) o.delai = nettoie_nombre(params.delai)

      params.series.forEach(function (serie) {
        var newSerie = {
          quantite: nettoie_nombre(serie.ndcdcs),
          type: serie.tdcdcs,
          aleatoire: (serie.posalea === 'alea'),
          isdelai: (serie.isdelai === 'o'),
          delai: (serie.delai || ''),
          nombres: getNombresFromSerie(serie),
          signes: getSignesFromSerie(serie)
        }
        var newOperation = getOperations(serie)
        // si une des opérations de la série est foireuse on oublie la série
        if (newOperation) {
          o.temp_series.push(newSerie)
          o.operations.push(newOperation)
        }
      }); // params.series.forEach

      // mélanges les opérations des différentes séries si nécéssaire
      if (o.aleatoire_exercice) o.operations = shuffle(o.operations)

      // reste à générer le xml
      return xmlGenerate(o)
    }

    /**
     * Retourne le tableaux nombres d'une série
     * @private
     * @param serie
     * @returns {Array}
     */
    function getNombresFromSerie(serie) {
      // le tableau que l'on va retourner
      var nombres = []
      serie.nb.forEach(function (nb) {
        var newNb
        // nature du nombre
        switch (nb.cts) {
          case 1:
            newNb = {
              type: 'fixe',
              fixe: nettoie_nombre(nb.cns)
            }
            break

          case 2:
            newNb = {
              type: 'liste',
              liste: [],
              liaison: (nb.cls === 'o')
            }
            nb.cns.split('|').forEach(function (item) {
              newNb.liste.push(nettoie_nombre(item))
            })
            break

          case 3:
            newNb = {
              type: 'intervalle'
            }
            var bornes = nb.cns.split('|')
            newNb.debut = nettoie_nombre(bornes[0])
            newNb.fin = nettoie_nombre(bornes[1])
            break

          case 4:
            newNb = {type: 'sans restriction'}
            break

          default :
            ST.addError("ressource incohérente (type de série inconnu)")
        }

        // chiffres admissibles
        if (nb.cts > 2) { // intervalle ou sans restriction
          newNb.chiffres = []
          for (var posChiffre = 0; posChiffre < 8; posChiffre++) {
            newNb.chiffres.push(nb.ccs.substr(posChiffre, 1) == 1)
          }
        }

        // couleur
        newNb.couleur = nb.ccns
        // temps d'affichage du nombre
        newNb.idDelai = (nb.cdns !== 'permanent')
        if (newNb.isDelai) newNb.delai = parseInt(nb.cdns); // '20 s' => 20
        // fini pour ce nb
        nombres.push(newNb)
      }); // serie.nb.forEach

      return nombres
    }

    function getSignesFromSerie(serie) {
      // les signes qui seront retournés
      var signes = []
      var type = serie.tdcdcs
      var numsigne = 0
      var signe = {}
      var symbole, nbTermes
      _.each(serie.s, function (s) {
        numsigne++
        switch (type) {
          // addition
          case '1':
          case '2':
          case '3':
          case '4':
            nbTermes = type + 1
            symbole = (numsigne < nbTermes) ? '+' : '='
            break
          // soustraction
          case '5':
            symbole = (numsigne < 2) ? '-' : '='
            break
          // multiplication de 2, 3, 4 ou 5 facteurs
          case '6':
          case '7':
          case '8':
          case '9':
            nbTermes = type - 4
            symbole = (numsigne < nbTermes) ? '*' : '='
            break
          case '10':
            symbole = (numsigne < 2) ? '-' : '='
            break
          default :
            ST.addError("ressource incohérente (type de série inconnu)")
        }
        signe.signe = symbole
        signe.couleur = s.ccss
        signe.isdelai = (s.ccds != 'permanent')
        if (signe.isdelai) signe.delai = parseInt(s.ccds)
        signes.push(signe)
      })

      return signes
    }

    /**
     * Retourne les opérations de la série (ou undefined si on a pas réussi à trouver de tirage aléatoire satisfaisant)
     * @private
     * @param {Object} serie
     * @returns {Array|undefined}
     */
    function getOperations(serie) {
      var nombres_generes,
          signes_generes,
          choix_position_liaison,
          temp_position,
          nombre_genere,
          signe_genere,
          operation,
          operations = [],
          operation_annullee,
          c, i,
          resultat,
          val0,
          val1,
          temp
      var maxTentatives = 100
      for (var q = 0; q < serie.quantite; q++) {
        operation_annullee = true
        c = 0
        // Si le tirage convient pas on recommence, mais pas trop quand même
        while (operation_annullee && c < maxTentatives) {
          nombres_generes = []
          signes_generes = []
          choix_position_liaison = false
          // création des nombres constitutifs de l'opération
          serie.forEach(function (nombre) {
            // valeur numérique ou rang dans la liste en cas de liste liée
            switch (nombre.type) {
              case 'fixe':
                nombre_genere.valeur = genere_fixe(nombre)
                break

              case 'liste':
                if (nombre.liste && nombre.liste.liaison) {
                  if (choix_position_liaison) {
                    nombre_genere.valeur = nombre[temp_position]
                  } else {
                    temp_position = genere_position_liste_liee(nombre)
                    choix_position_liaison = true
                    nombre_genere.valeur = nombre[temp_position]
                  }
                } else {
                  nombre_genere.valeur = genere_liste_non_liee(nombre)
                }
                break

              case 'intervalle':
                temp = genere_intervalle(nombre)
                nombre_genere.valeur = temp
                break

              case 'sans restriction':
                temp = genere_sans_restriction(nombre)
                nombre_genere.valeur = temp
                break

              default :
                ST.addError("ressource incohérente (type liste/intervalle inconnu)")
            }

            // temps d'affichage
            nombre_genere.isdelai = nombre.isdelai
            nombre_genere.delai = nombre.delai || ''
            // couleur
            nombre_genere.couleur = couleur_nom(nombre.couleur)
            // on empile le nombre généré
            nombres_generes.push = nombre_genere
          }); // jshint ignore:line

          // si nécéssaire, on mélange les positions des nombres au sein de l'opération
          if (serie.aleatoire) {
            shuffle(nombres_generes)
          }

          // création des signes opératoires constitutifs de l'opération
          _.each(serie.signes, function (signe) {
            // on se charge du temps d'affichage
            signe_genere.isdelai = signe.isdelai
            signe_genere.delai = signe.delai || ''
            // de quel signe s'agit-il ?
            signe_genere.valeur = signe.signe
            // on se charge de la couleur
            signe_genere.couleur = couleur_nom(signe.couleur)
            // on empile le signe généré
            signes_generes.push(signe_genere)
          }); // jshint ignore:line

          // determination du résultat de l'opération
          // - attention, dans le cas d'un quotient, c'est la partie entière du quotient qui constitue le résultat

          if (!nombres_generes[0].hasOwnProperty('valeur')) {
            throw new Error("Le premier nombre généré n'a pas de valeur")
          }

          switch (serie.type) {
            // addition
            case 1:
            case 2:
            case 3:
            case 4:
              resultat = nombres_generes[0].valeur
              for (i = 1; i <= serie.type; i++) resultat += nombres_generes[i].valeur
              break
            // soustraction
            case 5:
              // on veut pas obtenir de négatif comme résultat de soustraction
              if (nombres_generes[0].valeur < nombres_generes[1].valeur) operation_annullee = true
              else resultat = nombres_generes[0].valeur - nombres_generes[1].valeur
              break
            // multiplication
            case 6:
            case 7:
            case 8:
            case 9:
              resultat = nombres_generes[0].valeur
              for (i = 1; i < serie.type - 5; i++) resultat = resultat * nombres_generes[1].valeur
              break
            // division
            case 10:
              val0 = nombres_generes[0].valeur
              val1 = nombres_generes[1].valeur
              // pas de diviseur nul
              if (val1 === 0) operation_annullee = true
              // le résultat doit être entier
              resultat = Math.floor(val0 / val1)
              operation_annullee = (resultat !== Math.floor(resultat))
              break
            default :
              ST.addError("ressource incohérente (type de série inconnu)")
          }
        } // while operation_annullee

        if (c === maxTentatives) {
          S.log("Impossible de trouver un tirage aléatoire satisfaisant toutes les conditions")
          // ça va annuler la série
          return undefined
        }

        // on empile l'opération créée en plaçant nombres et signes dans l'ordre d'écriture
        operation = []
        operation[0] = nombres_generes[0]
        operation[1] = signes_generes[0]
        operation[2] = nombres_generes[1]
        operation[3] = signes_generes[1]
        if (nombres_generes[2])  operation[4] = nombres_generes[2]
        if (signes_generes[2])   operation[5] = signes_generes[2]
        if (nombres_generes[3])  operation[6] = nombres_generes[3]
        if (signes_generes[3])   operation[7] = signes_generes[3]
        if (nombres_generes[4])  operation[8] = nombres_generes[4]
        if (signes_generes[4])   operation[9] = signes_generes[4]
        operation.resultat = resultat
        operation.isdelai = serie.isdelai
        operation.delai = serie.delai
        operations.push(operation)

      } // for sur quantite

      return operations
    } // getOperations

    /**
     * Retourne le xml généré à partir de l'objet
     * @private
     * @param o
     * @returns {string}
     */
    function xmlGenerate(o) {
      // cf https://developer.mozilla.org/fr/docs/Comment_cr%C3%A9er_un_arbre_DOM
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument
      //
      if (!window.document.implementation || typeof window.document.implementation.createDocument !== 'function') {
        throw new Error("Votre navigateur ne supporte pas la méthode document.implementation.createDocument " +
            "et ne peut donc pas afficher de ressource de calcul mental")
      }
      // notre arbre, on commence par la racine
      var parametrage = window.document.implementation.createDocument("", "", null)
      var noeud_poseur = parametrage.createElement('CALCUL_MENTAL')
      noeud_poseur.setAttribute("version", "1")
      if (o.isDelai) noeud_poseur.setAttribute("t", o.delai)
      o.operations.forEach(function (operation) {
        var noeud_ques = parametrage.createElement('saisie')
        if (operation.isdelai) noeud_ques.setAttribute("t", operation.delai)
        var noeud = {}
        _.each(operation, function (tab, key) {
          // on gère pas ici les propriétés non numériques (cf getOperations)
          if (parseInt(key) == key) {
            noeud[key] = parametrage.createElement('affiche', formate_nombre(tab.valeur))
            if (tab.couleur != 'noir') noeud[key].setAttribute("c", tab.couleur)
            if (tab.isdelai) noeud[key].setAttribute("t", tab.delai)
            noeud_ques.appendChild(noeud[key])
          }
        })
        // le point d'interrogation (ATTENTION, le tag saisie s'appelle noeud_ques et le tag affiche s'appelle noeud_saisie)
        var noeud_saisie = parametrage.createElement('affiche', '?')
        noeud_ques.appendChild(noeud_saisie)
        // valeur du résultat
        var noeud_resultat = parametrage.createElement('reponse', formate_nombre(operation.resultat))
        noeud_ques.appendChild(noeud_resultat)
        noeud_poseur.appendChild(noeud_ques)
      })
      parametrage.appendChild(noeud_poseur)

      return parametrage.toString().replace(/\n/g, '').replace(/\+/g, "#").replace(/"/g, "'")
    } // xmlGenerate

    /**
     * Transforme une chaîne en nombre (vire les espaces éventuels et remplace , par .)
     * @private
     * @param {string|number} nb
     * @returns {number}
     */
    function nettoie_nombre(nb) {
      if (_.isString(nb)) return Number(nb.replace(/,/g, '.').replace(/\s/g, ''))
      else return Number(nb)
    }

    /**
     * Retourne une string avec la virgule en séparateur décimal
     * @private
     * @param nombre
     * @returns {string}
     */
    function formate_nombre(nombre) {
      var nbString = nombre + ''
      return nbString.replace('.', ',')
    }

    /**
     * Retourne le tableau d'entrée mélangé sans le modifier
     * @private
     * @param tab
     * @returns {Array}
     */
    function shuffle(tab) {
      if (tab.length < 2) return tab
      var shuffled = []
      var i
      while (tab.length > 1) {
        i = intRandom(tab.length)
        shuffled.push(tab.splice(i, 1)[0])
      }
      shuffled.push(tab[0])

      return shuffled
    }

    /**
     * Retourne le nb fixe
     * @private
     * @param nombre
     * @returns {number}
     */
    function genere_fixe(nombre) {
      return nettoie_nombre(nombre.fixe)
    }

    /**
     * générateur de nombres fixes dans une liste non liée
     * (je sais pas non plus ce que ça veut dire mais le code renvoie un nb pris au hasard dans nombre.liste)
     * @private
     * @param nombre
     * @returns {number}
     */
    function genere_liste_non_liee(nombre) {
      var i = intRandom(nombre.liste.length)
      return nombre.liste[i]
    }

    /**
     * générateur de position dans une liste non liée
     * Renvoie un index aléatoire de nombre.liste
     * @private
     * @param nombre
     * @returns {number|*}
     */
    function genere_position_liste_liee(nombre) {
      return intRandom(nombre.liste.length)
    }

    /**
     * Générateur de nombres dans un intervalle
     * @private
     * @param {Array} nombre [debut, fin]
     * @return {Integer} Le nombre généré dans
     */
    function genere_intervalle(nombre) {
      if (!nombre.hasOwnProperty('debut') || !nombre.hasOwnProperty('fin') || nombre.fin < nombre.debut) {
        throw new Error("Paramètres d'intervalle incorrects")
      }
      return rand(nombre.debut, nombre.fin)
    }

    /**
     * générateur de nombres sans restrictions
     * Génère un nombre xxx,xxxxx au hasard, en appliquant le masque de nombre.chiffres
     * @private
     * @param nombre
     * @returns {number}
     */
    function genere_sans_restriction(nombre) {
      var presence_un_chiffre = false
      var nombre_genere = 0
      var i, chiffre, puissance
      for (i = 0; i < 8; i++) {
        if (nombre.chiffres[i]) {
          chiffre = rand(0, 9)
          puissance = Math.pow(10, (3 - i))
          nombre_genere += chiffre * puissance
          presence_un_chiffre = true
        }
      }
      if (presence_un_chiffre) return nombre_genere
      else return false
    }

    /**
     * conversion code=>nom des couleurs
     * @private
     * @param code_couleur
     * @returns {string}
     */
    function couleur_nom(code_couleur) {
      var tab_couleurs = ["orange", "rouge", "vert", "brique", "bleu", "noir"]
      return tab_couleurs[code_couleur]
    }

    /**
     * Génère un entier aléatoire entre min et max (inclus)
     * @private
     * @param min
     * @param max
     * @returns {number} entier >= min et <= max
     */
    function rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    /**
     * Renvoie un entier entre 0 (inclus) et inferieurA (exclu)
     * @private
     * @param inferieurA
     * @returns {number|*}
     */
    function intRandom(inferieurA) {
      return Math.floor(Math.random() * inferieurA)
    }

  })
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module")
    console.error(error)
  }
}
