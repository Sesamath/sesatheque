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
  define(function () {
    'use strict';
    /**
     * module pour afficher les ressources coll_doc (atome de manuel ou cahier)
     * @plugin coll_doc
     */
    var coll_doc = {};

    // raccourcis, si ça plante le catch gère
    var S = window.Sesamath;

    /* Le moment où ce module a été chargé dans le navigateur */
    var startDate = new Date();

    var baseCollDoc = "http://ressources.sesamath.net";

    /**
     * Affiche la ressource dans l'élément d'id mepRess
     * @memberOf coll_doc
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé (sans argument ou avec une erreur)
     */
    coll_doc.display = function (ressource, options, next) {
      var container = options.container;
      if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");

      // on enverra le résultat à la fermeture
      if (options.resultatCallback && container.addEventListener) {
        container.addEventListener('unload', function () {
          var resultat = {
            ressType: 'coll_doc',
            ressId: ressource.oid,
            date: startDate,
            duree: Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000),
            score: 1
          };
          if (options.sesatheque) resultat.sesatheque = options.sesatheque;
          options.resultatCallback(resultat);
        });
      }

      S.log('start coll_doc display avec la ressource', ressource);
      //les params minimaux
      if (!ressource.oid || !ressource.titre || !ressource.parametres) {
        throw new Error("Paramètres manquants");
      }
      var url;
      try {
        url = ressource.parametres.url || ressource.parametres.files[0].uri;
      } catch (error) {
        S.log.error(error);
        throw new Error("Il manque l'adresse de cette ressource dans ses paramètres");
      }
      // On réinitialise le conteneur
      S.empty(container);
      if (ressource.parametres.url) {
        // on affiche le lecteur d'origine
        S.addElement(container, 'iframe', {src: url, style: "width:100%;height:100%", onload: next});
      } else if (url) {
        // on affiche les lien de téléchargement
        var msg;
        if (ressource.parametres.files.length > 1) msg = "Fichiers composant la ressource";
        else msg = "Voici le lien pour télécharger la ressource";
        var ul = S.addElement(container, 'ul', null, msg);
        ressource.parametres.files.forEach(function (file) {
          var li = S.addElement(ul, 'li');
          if (file.uri) {
            url = baseCollDoc + file.uri;
            var pos = file.uri.lastIndexOf('/');
            var name = file.uri.substr(pos + 1);
            S.addElement(li, 'a', {href: url}, name);
          } else {
            S.addElement(li, 'span', {class: "error"}, "Url manquante");
          }
        });
        next();
      }
    };

    return coll_doc;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}