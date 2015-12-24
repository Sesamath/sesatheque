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
 * Met à jour l'affichage sur les pages publiques (vérifie si on est authentifié pour ajouter les infos et les boutons qui vont bien)
 * Auto-exécuté au chargement
 */

/* global window, define, require, alert */
if (typeof define === 'undefined' || typeof require === 'undefined') {
  alert("requireJs doit être chargé avant ce fichier");
} else if (typeof window === 'undefined') {
  throw new Error("Ce module est un module requireJs prévu pour fonctionner dans un navigateur");
} else {
  // faut d'abord un module sans dépendance pour pouvoir la charger avec le bon chemin si besoin
  define('refreshAuth', ['tools/xhr', 'initGlobal'], function (xhr) {
    "use strict";

    function addLink(parent, link) {
      var li = S.getElement('li');
      var aOptions = {};
      if (link.href) aOptions.href = link.href;
      if (link.selected) aOptions.class = "selected";
      if (link.icon) aOptions.title = link.value;
      var a = S.getElement('a', aOptions);
      if (link.icon) {
        S.addElement(a, 'i', {class: "fa fa-" + link.icon});
        S.addElement(a, 'span', {}, link.value);
      } else if (link.iconStack) {
        var spanStack = S.getElement('span', {class: "fa-stack fa-lg"});
        link.iconStack.forEach(function (icon) {
          S.addElement(spanStack, 'i', {class:"fa fa-" +icon});
        });
        a.appendChild(spanStack);
        S.addElement(a, 'span', {}, link.value);
      } else {
        S.addText(a, link.value);
      }
      li.appendChild(a);
      parent.appendChild(li);
    }

    var S = window.sesamath;

    return function () {
      if (window.location.pathname.indexOf("/public/") > -1) {
        var url = "/api/auth";
        // on regarde si on est sur une ressource
        var match = window.location.pathname.match(/\/public\/[a-z]+\/(.+)$/);
        if (match) url += "?ressourceId=" +match[1];
        xhr.get(url, {withCredentials:true, responseType:"json"}, function (error, response) {
          S.log.enable()
          S.log("on récupère auth", response);
          if (error) {
            S.log.error(error);
          } else if (response && response.isLogged) {
            if (response.authBloc) {
              var data = response.authBloc;
              var authBloc = document.getElementById("auth");
              if (authBloc) {
                // Cf views/auth.dust
                S.empty(authBloc);
                var a = S.addElement(authBloc, 'a', {href:"#"});
                S.addElement(a, 'i', {class:"fa fa-user"});
                S.addText(a, " ");
                S.addElement(a, 'i', {class:"fa fa-ellipsis-v"});
                var ul = S.addElement(authBloc, 'ul');
                S.addElement(ul, 'div', {}, data.user.prenom +" " +data.user.nom)
                data.ssoLinks.forEach(function (link) {
                  addLink(ul, link);
                });
                addLink(ul, data.logoutLink);
              }
            } else {
              S.log.error("pas de authBloc dans la réponse de l'api");
            }
            // on passe aux boutons d'action si on est sur une ressource
            if (response.permissions && document.getElementById("actions")) {
              if (response.permissions.indexOf("C") > -1) S.setStyles(document.getElementById("buttonDuplicate"), {display:"block"});
              if (response.permissions.indexOf("D") > -1) S.setStyles(document.getElementById("buttonDelete"), {display:"block"});
              if (response.permissions.indexOf("W") > -1) S.setStyles(document.getElementById("buttonEdit"), {display:"block"});
            }
            // la navigation
            if (response.permissions.indexOf("C") > -1) S.setStyles(document.getElementById("buttonAdd"), {display:"inline-block"});
            var buttonMyRessources = document.getElementById("buttonMyRessources");
            if (buttonMyRessources && response.oid) {
              buttonMyRessources.href += response.oid;
              S.setStyles(buttonMyRessources, {display: "inline-block"});
            }
            var buttonSearch = document.getElementById("buttonSearch");
            if (buttonSearch) buttonSearch.href = buttonSearch.href.replace("public", "ressource");
          }
        });
      }
    };
  }); // define
  // et on s'auto exécute
  require(['refreshAuth'], function (refreshAuth) { refreshAuth(); });
}
