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

/**
 * @file Script autonome pour afficher un résultat d'un exercice de type j3p
 * Ce script ne sert à rien ici, il est à répercuter dans
 */
module.exports = {
  /**
   * Retourne le code html qui affiche le bilan (ici les carrés colorés)
   * @param {Resultat} resultat L'objet Resultat dont on veut le bilan
   * @param {string}   baseUrl  Le prefix d'url de notre dossier sans / de fin (si on veut charger des css ou des images dedans)
   * @returns {string} Le code html
   */
  getHtmlReponse: function getHtmlReponse (resultat, baseUrl) {
    var output
    var nbnoeuds
    var score
    console.log('resultat=', resultat)
    // pour j3p on s'attend à avoir resultat.contenu.scores sous la forme d'un tableau de scores
    if (resultat.contenu && resultat.contenu.scores && resultat.contenu.scores.length) {
      output = ''
      nbnoeuds = resultat.contenu.scores.length
      for (var i = 0; i < nbnoeuds; i++) {
        score = resultat.contenu.scores[i]
        output += 'Nœud n°' + resultat.contenu.noeuds[i] + ' : ' + Math.round(100 * score) + '<br />'
      }
      if (nbnoeuds > 1) output += 'Vue graphique du parcours de l’élève (à venir)'
    } else {
      output = 'pas de réponse'
    }

    return output
  },

  /**
   * Retourne le code html qui affiche le score (ici x/y en texte seul)
   * @param {Resultat} resultat
   * @returns {string} Le code html
   */
  getHtmlScore: function getHtmlScore (resultat) {
    var output
    var nbnoeuds
    var score
    console.log('resultat=', resultat)
    // pour j3p on s'attend à avoir
    if (resultat.contenu && resultat.contenu.scores && resultat.contenu.scores.length) {
      score = 0
      nbnoeuds = resultat.contenu.scores.length
      for (var i = 0; i < nbnoeuds; i++) {
        score += resultat.contenu.scores[i]
      }
      score = Math.round(100 * score / nbnoeuds)
      output = score + ' % '
    } else {
      output = 'pas de réponse ou réponse à un mauvais format'
    }
    return output
  }
}
