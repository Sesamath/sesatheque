/**
 * Script autonome pour afficher un résultat de type am
 * On peut être chargé sur n'importe quelle appli, donc on a aucune dépendance à une lib externe
 * et on exporte des fonctions en global
 * - sesatheque.am.getHtmlReponse(resultat, baseUrl)
 * - sesatheque.am.getHtmlScore(resultat)
 * - sesatheque.am.showResult(resultat, element, baseUrl)
 */
/*global window*/
(function () {
  // vérif minimale du contexte
  if (typeof window === "undefined") throw new Error("Ce script ne fonctionne que dans un dom html");
  if (typeof window.document === "undefined") throw new Error("Ce script ne fonctionne que dans un dom html");
  if (typeof window.sesatheque === "undefined") window.sesatheque = {};
  if (typeof window.sesatheque.em === "undefined") window.sesatheque.em = {};

  /** Raccourci pour window.document */
  var wd = window.document;

  /**
   * Retourne le code html qui affiche le bilan (ici la durée d'affichage)
   * @param {Resultat} resultat L'objet Resultat dont on veut le bilan
   * @param {string}   baseUrl  Le prefix d'url de notre dossier sans / de fin
   * @returns {string} Le code html
   */
  window.sesatheque.em.getHtmlReponse = function (resultat, baseUrl) {
    var output = "";
    // pour url on a pas de resultat.reponse, seule la durée peut servir
    if (resultat.duree > 0) {
      output = "affiché pendant ";
      if (resultat.duree > 59) {
        output += Math.floor(resultat.duree / 60) + ' minutes ';
      }
      output += resultat.duree % 60 +' s';
    } else {
      output = "pas de durée d'affichage connue";
    }

    return output;
  };

  /**
   * Retourne le code html qui affiche le score (ici x/y)
   * @param {Resultat} resultat
   * @returns {string} Le code html
   */
  window.sesatheque.em.getHtmlScore = function (resultat) {
    return "affiché";
  };

  /**
   * Affiche score et réponse dans un HTMLElement
   * @param resultat
   * @param element
   * @param baseUrl
   */
  window.sesatheque.em.showResult = function (resultat, element, baseUrl) {
    var html = window.sesatheque.em.getHtmlReponse(resultat, baseUrl);
    element.addChild(wd.createTextNode(html));
  };

})();
