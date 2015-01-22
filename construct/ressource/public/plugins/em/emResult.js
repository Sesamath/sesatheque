/**
 * Script autonome pour afficher un résultat de type em
 * On peut être chargé sur n'importe quelle appli, donc on a aucune dépendance à une lib externe
 * et on exporte deux fonctions en global
 * - sesatheque.em.getHtmlReponse(resultat, baseUrl)
 * - sesatheque.em.getHtmlScore(resultat)
 * - sesatheque.em.showResult(resultat, element, baseUrl)
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
   * Retourne le code html qui affiche le bilan (ici les carrés colorés)
   * @param {Resultat} resultat L'objet Resultat dont on veut le bilan
   * @param {string}   baseUrl  Le prefix d'url de notre dossier sans / de fin
   * @returns {string} Le code html
   */
  window.sesatheque.em.getHtmlReponse = function (resultat, baseUrl) {
    var output = "";
    // pour em on s'attend à avoir resultat.reponse sous la forme d'une chaine vvprbb
    if (typeof resultat.reponse === "string") {
      for (var i = 0; i < resultat.reponse.length; i++) {
        output += '<img src="' +baseUrl +'/images/reponse_' +resultat.reponse[i] +
        '.gif" width="10" height="15" alt="">';
      }
    } else {
      output = "pas de réponse ou réponse à un mauvais format";
    }
    return output;
  };

  /**
   * Retourne le code html qui affiche le score (ici x/y)
   * @param {Resultat} resultat
   * @returns {string} Le code html
   */
  window.sesatheque.em.getHtmlScore = function (resultat) {
    var output = "";
    var nbok = 0;
    var nbq, lettre;
    // pour em on s'attend à avoir resultat.reponse sous la forme d'une chaine vvprbb
    if (typeof resultat.reponse === "string") {
      nbq = resultat.reponse.length;
      lettre = resultat.reponse[i];
      for (var i = 0; i < nbq; i++) {
        if (lettre === 'v' || lettre === 'p') nbok++;
      }
      output = nbok +' / ' +nbq;
    } else {
      output = "pas de réponse ou réponse à un mauvais format";
    }
    return output;
  };

  /**
   * Affiche score et réponse dans un HTMLElement
   * @param resultat
   * @param element
   * @param baseUrl
   */
  window.sesatheque.em.showResult = function (resultat, element, baseUrl) {
    var html = window.sesatheque.em.getHtmlScore(resultat) +' ' +
        window.sesatheque.em.getHtmlReponse(resultat, baseUrl);
    element.addChild(wd.createTextNode(html));
  };

})();
