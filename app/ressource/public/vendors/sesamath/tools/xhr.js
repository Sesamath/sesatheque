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

/*jshint asi:true */
'use strict'

/**
 * @module tools/xhr Pour gérer les appels ajax, copie de sesatheque-client/xhr.js (mais celui-ci est browser only)
 */
define('tools/xhr', [], function () {
  /**
   * 10s de timeout par défaut mis à toutes les requêtes qui n'en précisent pas
   * @type {Integer}
   */
  var defaultTimeout = 10000
  var minTimeout = 100
  var maxTimeout = 60000

  /**
   * Fonction qui gère l'appel xhr
   * @private
   * @param {string}   verb
   * @param {string}   url
   * @param {object}   data
   * @param {object}   options
   * @param {function} callback Sera appelée avec (error, réponse),
   *                              si options.responseType === "json" la réponse sera un objet,
   *                              sinon l'objet response du XMLHttpRequest
   */
  function xhrCall(verb, url, data, options, callback) {
    var xhr, isNextCalled = false
      // pour s'assurer qu'on ne l'appelle qu'une fois, entre timeout, error et done
      function next(error, data) {
        if (!isNextCalled) {
        isNextCalled = true
        callback(error, data)
        }
      }

    if (typeof verb !== "string") verb = 'GET'
    else verb = verb.toUpperCase()
    if (typeof options !== "object") options = {}

      // on est une méthode privée, tous les appels sont listés plus bas
    //if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(verb) < 0) return next(new Error("Verbe http " +verb +" non géré"))

    if (typeof window.XMLHttpRequest !== 'undefined') {
      xhr = new XMLHttpRequest()
    } else if (typeof ActiveXObject !== "undefined") {
      var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"]
      for(var i = 0; i < versions.length; i++) {
        try {
          /*global ActiveXObject*/
        xhr = new ActiveXObject(versions[i])
        break
        } catch(e) { /* on laisse tomber et on tente le suivant */}
      }
    }

    if (typeof xhr === 'undefined') {
      next(new Error('Appel ajax indisponible avec ce navigateur'))
    } else {
      if (options.urlParams) {
        for (var p in options.urlParams) {
          if (options.urlParams.hasOwnProperty(p)) {
            url += (url.indexOf("?") > 0) ? '&' : '?'
            url += p +"="
            url += encodeURIComponent(options.urlParams[p])
          }
        }
      }
      xhr.open(verb, url, true)
      if (options.withCredentials)          xhr.withCredentials = true
      if (options.responseType)             xhr.responseType = options.responseType
      // mettre un Content-Type sur du GET déclenche un preflight,
      // Ce Content-Type ne concerne que ce que l'on envoie donc on regarde
      // si y'a qqchose à envoyer, et si c'est un objet on le met d'office,
      // sinon on laisse l'appelant préciser s'il veut (on peut poster du xml par ex)
      if (options.headers) {
        for (var header in options.headers) {
          if (options.headers.hasOwnProperty(header) && typeof options.headers[header] === "string") {
            xhr.setRequestHeader(header, options.headers[header])
          }
        }
      } else if (data && typeof data === "object")  {
        xhr.setRequestHeader('Content-Type', 'application/json')
      }
      xhr.timeout = options.timeout || defaultTimeout
      if (xhr.timeout < minTimeout) {
        log(new Error("timeout " +xhr.timeout +"ms trop faible sur l'url " +url +" réinitialisé à " +(defaultTimeout/1000) +"s"))
        xhr.timeout = defaultTimeout
      }
      if (xhr.timeout > maxTimeout) {
        log(new Error("timeout " +xhr.timeout +"ms trop élevé sur l'url " +url +" réinitialisé à " +(defaultTimeout/1000) +"s"))
        xhr.timeout = defaultTimeout
      }
      xhr.onerror = function () {
        // Pb de connexion au serveur
        var errMsg = "Le serveur a renvoyé une erreur"
        if (xhr.status) errMsg += ' ' +xhr.status
        errMsg += ' : ' +xhr.responseText
        next(new Error(errMsg))
      }

      xhr.ontimeout = function () {
        var msg = "Le serveur n'a pas répondu"
        if (options.timeout) msg += " après " +Math.floor(options.timeout / 1000) +"s d'attente."
        next(new Error(msg))
      }

      xhr.onreadystatechange = function () {
        if (this.readyState == this.DONE) {
          var error, retour

          if (this.status === 200) {
            retour = this.response

          } else {
            // KO (les redirections sont normalement gérées par le navigateur)
            var message
              switch (this.status) {
                case 0:
                message = "Pas de connexion"
                break
                case 403:
                message = "Accès refusé"
                break
                default:
                message = "Erreur " + this.status
              }
            message += " sur " + verb + " " + url
            // au cas où c'est du json qui renvoie une erreur
            if (this.response && this.response.error) message += " qui précise « " +this.response.error +" »"
            error = new Error(message)
            error.status = this.status
            error.content = this.response
          }

          next(error, retour)
        }
      }

      if (data) {
        try {
          data = JSON.stringify(data)
        } catch (error) {
          data = undefined
        }
      }
      xhr.send(data)
    }
  } // xhrCall

  return {
    /**
     * Appel ajax DELETE
     * @param {string}           url
     * @param {object|string}    data      Body éventuel
     * @param {xhrOptions}       options
     * @param {responseCallback} callback
     */
    delete : function del(url, data, options, callback) {
      xhrCall("DELETE", url, data, options, callback);
    },
    /**
     * Appel ajax en GET
     * @param {string}           url
     * @param {xhrOptions}       options
     * @param {responseCallback} callback
     */
    get : function get(url, options, callback) {
      xhrCall("GET", url, null, options, callback);
    },
    /**
     * Appel ajax en POST
     * @param {string}           url
     * @param {object|string}    data     Objet ou body à poster
     * @param {xhrOptions}       options
     * @param {responseCallback} callback
     */
    post : function post(url, data, options, callback) {
      xhrCall('POST', url, data, options, callback);
    },
    /**
     * Appel ajax en PUT
     * @param {string}           url
     * @param {object|string}    data      Body éventuel
     * @param {xhrOptions}       options
     * @param {responseCallback} callback
     */
    put : function put(url, data, options, callback) {
      xhrCall('PUT', url, data, options, callback)
    }
  };
})


/**
 * Options éventuelles à passer avec la requête xhr
 * @typedef xhrOptions
 * @param {string}  responseType    Préciser json pour récupérer un objet plutôt qu'une string dans la réponse
 * @param {object}  headers         Liste de headers à ajouter à l'appel, sous la forme header:headerValue (par ex {"Content-Type":"text/xml"})
 * @param {boolean} withCredentials Passer true pour l'ajouter
 * @param {object}  urlParams       Liste de clé:valeur à ajouter à l'url (les valeurs seront passées à encodeURIComponent)
 */

/**
 * @callback responseCallback
 * @param {Error}         error    Erreur éventuelle
 * @param {string|object} response L'objet response du XMLHttpRequest, un objet si on avait précisé options.responseType = "json", une string sinon
 */
 