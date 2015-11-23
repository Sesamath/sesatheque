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

'use strict';

/**
 * @module tools/xhr Pour gérer les appels ajax
 */
define('tools/xhr', [], function () {
  /**
   * Fonction qui gère l'appel xhr
   * @private
   * @param {string}   verb
   * @param {string}   url
   * @param {object}   data
   * @param {object}   options
   * @param {function} callback Sera appelée avec (error, réponse),
   *                              si options.response.type === "json" la réponse sera un objet,
   *                              sinon l'objet response du XMLHttpRequest
   */
  function xhr(verb, url, data, options, callback) {
    var request;
    if (typeof verb !== "string") verb = 'GET';
    if (typeof options !== "object") options = {};
    else verb = verb.toUpperCase();

    if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(verb) < 0) return callback(new Error("Verbe http " +verb +" non géré"));

    if (typeof window.XMLHttpRequest !== 'undefined') {
      request = new XMLHttpRequest();
    } else if (typeof ActiveXObject !== "undefined") {
      var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"]
      for(var i = 0, ii = versions.length; i < ii; i++) {
        try {
          /*global ActiveXObject*/
          request = new ActiveXObject(versions[i]);
          break;
        } catch(e) { /* on laisse tomber et on tente le suivant */}
      }
    }

    if (typeof request === 'undefined') {
      callback(new Error('XHR indisponible avec ce navigateur'));
    } else {
      if (options.urlParams) {
        for (var p in options.urlParams) {
          if (options.urlParams.hasOwnProperty(p)) {
            url += (url.indexOf("?") > 0) ? '&' : '?';
            url += p +"=";
            url += encodeURIComponent(options.urlParams[p]);
          }
        }
      }
      request.open(verb, url, true);
      if (options.withCredentials) {
        request.withCredentials = true;
      }
      if (options.responseType) {
        request.responseType = options.responseType;
      }
      if (verb != 'GET') request.setRequestHeader('Content-Type', 'application/json');

      request.onreadystatechange = function () {
        if (this.readyState == this.DONE) {
          var error, retour;

          if (this.status === 200) {
            if (this.response.length && this.response.substr(0, 1) === "{") {
              try {
                retour = JSON.parse(this.response);
              } catch (e) {
                error = new Error("La réponse n'était pas du json valide");
                error.error = e;
                error.status = this.status;
                error.content = this.response;
              }
            } else {
              retour = this.response;
            }
          } else {
            var message;
            switch (this.status) {
              case 0:
                message = "Pas de connexion";
                break;
              case 403:
                message = "Accès réfusé";
                break;
              default:
                message = "Erreur " + this.status;
            }
            message += " sur " + verb + " " + url;
            error = new Error(message);
            error.status = this.status;
            error.content = retour;
          }

          callback(error, retour);
        }
      };
      if (data) try {
        data = JSON.stringify(data);
      } catch (error) {
        data = undefined;
      }
      request.send(data);
    }
  } // xhr

  return {
    /**
     * Appel ajax en GET
     * @param {string}   url
     * @param {object}   options  Objet d'options, on utilise responseType, withCredentials et urlParams (paramètres
     *                              à ajouter à l'url, seront correctement encodés)
     * @param {function} callback Sera appelée avec (error, réponse),
     *                              si options.responseType === "json" la réponse sera un objet,
     *                              sinon l'objet response du XMLHttpRequest
     */
    get : function get(url, options, callback) {
      xhr("GET", url, null, options, callback);
    },
    /**
     * Appel ajax en POST
     * @param {string}   url
     * @param {object}   data     Objet à poster
     * @param {object}   options  Objet d'options, on utilise responseType, withCredentials et urlParams (paramètres
     *                              à ajouter à l'url, seront correctement encodés)
     * @param {function} callback Sera appelée avec (error, réponse),
     *                              si options.responseType === "json" la réponse sera un objet,
     *                              sinon l'objet response du XMLHttpRequest
     * @param url
     * @param options
     * @param callback
     */
    post : function post(url, data, options, callback) {
      xhr('POST', url, data, options, callback);
    }
  };
})