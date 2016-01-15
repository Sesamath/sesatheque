require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var t =
  [ '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c',
  '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26',
  '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33',
  '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40',
  '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d',
  '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a',
  '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67',
  '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74',
  '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81',
  '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e',
  '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b',
  '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
  'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5',
  'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2',
  'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf',
  'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc',
  'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9',
  'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6',
  'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff' ];
module.exports = function() {
  var A = Math.random()*0xffffffff, B = Math.random()*0xffffffff,
      C = Math.random()*0xffffffff, D = Math.random()*0xffffffff;
  return  t[A&0xff] + t[A>>8&0xff] + t[A>>16&0xff] + t[A>>24&0xff] + '-' +
          t[B&0xff] + t[B>>8&0xff] + '-' +
          t[B>>16&0x0f|0x40] + t[B>>24&0xff] + '-' +
          t[C&0x3f|0x80] + t[C>>8&0xff] + '-' +
          t[C>>16&0xff] + t[C>>24&0xff] + t[D&0xff] + t[D>>8&0xff] + t[D>>16&0xff] + t[D>>24&0xff];
}

},{}],2:[function(require,module,exports){
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
 * Ce fichier fait partie de lapplication Sésathèque, créée par lassociation Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans lespoir quil sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou dADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'
/* pour debug * /
window.log = function () {
  var arg;
  try {
    for (var i = 0; i < arguments.length; i++) {
      arg = arguments[i];
      if (arg instanceof Error) console.error(arg);
      else console.log(arg);
    }
  } catch (e) {
    // rien, fallait un navigateur décent...
  }
} /* */

module.exports = {
  options : {
    arbre     : { deletable : true, editable : true },
    calkc     : { deletable : true, editable : true },
    ecjs      : { deletable : true, editable : true },
    iep       : { deletable : true, editable : true },
    j3p       : { deletable : true, editable : true },
    mathgraph : { deletable : true, editable : true },
    mental    : { deletable : true, editable : true },
    serie     : { deletable : true },
    url       : { deletable : true, editable : true }
  },
  typeToCategories : {
    am    : [2],
    arbre : [8],
    calkc : [7],
    ec2   : [7],
    ecjs  : [7],
    em    : [7],
    iep   : [2],
    mental: [7],
    serie : [8],
    series : [8],
    sequence : [8]
  },
}


},{}],3:[function(require,module,exports){
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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE 
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * @module xhr Pour gérer les appels ajax
 */

/**
 * 10s de timeout par défaut mis à toutes les requêtes qui n'en précisent pas
 * @type {Integer}
 */
var defaultTimeout = 10000
var minTimeout = 100
var maxTimeout = 60000
var myXMLHttpRequest

function log () {
  var arg
  try {
    for (var i = 0; i < arguments.length; i++) {
      arg = arguments[i]
      if (arg instanceof Error) console.error(arg)
      else console.log(arg)
    }
  } catch (e) {
    // rien, fallait un navigateur décent...
  }
}

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
  if (typeof XMLHttpRequest !== 'undefined') {
    xhr = new XMLHttpRequest()
  } else if (myXMLHttpRequest) {
    xhr = new myXMLHttpRequest()
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
    } else if (!!data && typeof data === "object")  {
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
        //console.log("retour xhr", this, "response", this.response)
        var error, retour
        if (this.response) {
          // un navigateur gère ça tout seul, mais le module xmlhttprequest ne renvoie que responseXml et responseText
          retour = this.response
        } else if (xhr.responseType === "json" && this.responseText) {
          try {
            retour = JSON.parse(this.responseText)
          } catch (err) {
            error = err
          }
        } else {
          retour = this.responseText
        }
        if (this.status !== 200) {
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
          if (retour && retour.error) message += " qui précise « " +retour.error +" »"
          error = new Error(message)
          error.status = this.status
          error.content = this.response
        }

        next(error, retour)
      }
    }

    if (data) try {
      data = JSON.stringify(data)
    } catch (error) {
      data = undefined
    }
    xhr.send(data)
  }
} // xhrCall

module.exports = {
  /**
   * Appel ajax en DELETE
   * @param {string}           url
   * @param {string|object}    data     Données éventuelles à envoyer dans le body de la requête
   * @param {xhrOptions}       options
   * @param {responseCallback} callback
   */
  delete : function del(url, data, options, callback) {
    xhrCall("DELETE", url, data, options, callback)
  },
  /**
   * Appel ajax en GET
   * @param {string}           url
   * @param {xhrOptions}       options
   * @param {responseCallback} callback
   */
  get : function get(url, options, callback) {
    xhrCall("GET", url, null, options, callback)
  },
  /**
   * Appel ajax en POST
   * @param {string}           url
   * @param {object}           data     Données éventuelles à envoyer dans le body de la requête
   * @param {xhrOptions}       options
   * @param {responseCallback} callback
   */
  post : function post(url, data, options, callback) {
    xhrCall('POST', url, data, options, callback)
  },
  /**
   * Appel ajax en PUT
   * @param {string}           url
   * @param {object}           data     Données éventuelles à envoyer dans le body de la requête
   * @param {xhrOptions}       options
   * @param {responseCallback} callback
   */
  put : function put(url, data, options, callback) {
    xhrCall('PUT', url, data, options, callback)
  },
  /**
   * Affecte un XMLHttpRequest (pour utiliser ce module coté serveur)
   * @param {XMLHttpRequest} XMLHttpRequest
   */
  setXMLHttpRequest : function (XMLHttpRequest) {
    myXMLHttpRequest = XMLHttpRequest
  }
}

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
},{}],"sesatheque-client":[function(require,module,exports){
(function (global){
/* global require, module, lassi */
'use strict'

var uuid = require('an-uuid')
var xhr = require('./xhr')
var config = require('./config')
var timeout = 10000

/**
 * Fournit des méthodes pour appeler la bibliotheque et récupérer des items normalisés (avec des url absolues)
 * @module sesatheque-client
 * @returns {object} La liste de méthodes
 */

/**
 * La liste des sésatheques à utiliser (sous la forme nom:baseUrl)
 * @private
 * @type {object}
 */
var sesatheques = {};
/**
 * La base du domaine qui nous utilise, avec protocole et slash de fin
 * @private
 * @type {string}
 */
var baseClient
/**
 * Le nom de domaine de baseClient (sans protocole ni port)
 * @private
 * @type {string}
 */
var origine

/**
 * Ajoute un listener sur un message {action:"iframeCloser", id:xxx}
 * @private
 * @param base
 * @param itemCallback
 * @returns {*}
 */
function addCloser(base, itemCallback) {
  // on ajoute le listener, faut un id car on peut être dans un dom avec plusieurs onglets d'édition possibles
  var id = uuid();
  if (typeof window.addEventListener === "undefined") window.addEventListener = function (e, f) { window.attachEvent('on' + e, f); }
  window.addEventListener("message", function (event) {
    if (event.data && event.data.action === "iframeCloser" && event.data.id === id) {
      var data = event.data
      if (data.error) itemCallback(new Error(data.error))
      else if (data.ressource) itemCallback(null, normalize(data.ressource, base))
      else itemCallback(new Error("La réponse n'est pas au format attendu, elle est impossible à interpréter"))
    }
  });

  return id
}

/**
 * Enregistre une sesatheque
 * @private
 * @param {string} name Nom quelconque
 * @param {string} base Url absolue de la base de la sésathèque
 */
function addSesatheque(name, base) {
  if (!base) throw new Error("Il faut fournir une base absolue de la sesatheque")
  if (! /^https?:\/\/[a-z\-\._]+(:[0-9]+)?(\/.*)?$/.test(base)) throw new Error("La base " +base +" n'est pas une racine d'url absolue valide")
  if (typeof name !== "string") throw new Error("Le nom doit être une string")
  if (base.substr(-1) !== "/") base += "/"
  sesatheques[name] = base
}

/**
 * Retourne la base de la sésathèque ou lance une erreur
 * @private
 * @param {string} name Le nom de la Sésathèque (passé à addSesatheques)
 * @returns {string} L'url absolue de la base de la sésathèque
 * @throws {Error} Si la sésathèque n'avait pas été enregistrée au préalable
 */
function getBase(name) {
  if (!sesatheques[name]) throw new Error("La sésathèque " +name +" n'a pas été enregistrée")
  
  return sesatheques[name]
}

/**
 * Récupère le nom d'une base
 * @private
 * @param base
 * @returns {string}
 */
function getBaseName(base) {
  for (var name in sesatheques) {
    if (sesatheques[name] === base) return name
  }
}

/**
 * Retourne la base de l'item (celle de la destination si c'est un alias)
 * @private
 * @param {SesathequeItem} item
 * @returns {*|base}
 */
function getBaseItem(item) {
  return item.base || getBaseUrl(item.displayUrl)
}

/**
 * Retourne la base d'une url
 * @private
 * @param {string} url Une url, avec au moins un caractère après le / racine
 * @returns {string|null} null si l'url n'était pas "conforme" 
 */
function getBaseUrl(url) {
  var base = null
  var matches = /^(https?:\/\/[a-z\-\._]+(:[0-9]+)?\/)./.exec(url)
  if (matches && matches[1]) base = matches[1]
  return base
}

/**
 * Fct de log qui fait rien si le navigateur n'a pas de console
 * @private
 */
function log () {
  var arg;
  try {
    for (var i = 0; i < arguments.length; i++) {
      arg = arguments[i];
      if (arg instanceof Error) console.error(arg);
      else console.log(arg);
    }
  } catch (e) {
    // rien, fallait un navigateur décent...
  }
}

///////////////////////
// Méthodes exportées
///////////////////////

/**
 * Pour modifier un item, retourne d'abord une url à ouvrir en iframe à urlCallback
 * puis un item sauvegardé à itemCallback (quand la ressource aura été sauvegardée si le user va au bout)
 * @param {string}         name         le nom de la sésathèque
 * @param {itemCallback}   itemCallback
 * @param {urlCallback}    urlCallback
 */
function addItem(name, itemCallback, urlCallback) {
  var base = getBase(name)
  var id = addCloser(base, itemCallback)
  urlCallback(null, base +"ressource/ajouter?layout=iframe&closerId=" +id)
}

/**
 * Enregistre des sésathèques
 * @param {object} list Objet de la forme {name:url, name2:url2,…}
 * @throws {Error} Si un nom ou une url est invalide
 */
function addSesatheques(list) {
  for (var name in list) {
    if (list.hasOwnProperty(name)) addSesatheque(name, list[name])
  }
}

/**
 * Clone un item (créera une ressource ou un alias sur la sésathèque mentionnée)
 * Attention, pour le moment ne clone que des ressources (marche pas pour les alias)
 * @param name Le nom de la sésathèque de destination
 * @param {SesathequeItem} item L'item à cloner
 * @param {itemCallback} next
 */
function cloneItem(name, item, next) {
  try {
    var baseDst = getBase(name)
    // on veut la base de destination d'un éventuel alias
    var baseSrc = getBaseUrl(item.displayUrl)
    if (!baseSrc) throw new Error("Ce type d'item ne peut pas être copié (" +item.titre +")") // un dossier ?
    if (baseDst === baseSrc) throw new Error("Cet item est déjà présent (" +item.titre +")")
    var url = baseDst +'api/externalClone/' +item.id
    var options = {withCredentials:true, responseType:"json", urlParams:{base:getBaseItem(item)}}
    xhr.get(url, options, function (error, response) {
      if (error) next(error)
      else if (response && response.error) next(new Error(response.error))
      else if (response && response.ref) next(null, normalize(response, baseDst))
      else next(new Error("La copie de l'item " +item.titre +" a échoué"))
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Efface un item
 * @param {SesathequeItem} item
 * @param {simpleCallback} next
 */
function deleteItem(item, next) {
  //log("deleteItem", item)
  try {
    if (!item.$deleteUrl) throw new Error("Vous n'avez pas les droits suffisants pour supprimer " +item.titre)
    xhr.delete(item.$deleteUrl, null, {withCredentials:true, responseType:"json"}, function (error, response) {
      if (error) next(error)
      else if (response && response.error) next(new Error(response.error))
      else if (response && response.success) next()
      else next(new Error("La suppression de l'item " +item.titre +" a échoué"))
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Récupère un item sur une sésathèque
 * @param {string}       name Le nom de la sésathèque ajoutée au préalable
 * @param {string}       id   L'identifiant de la ressource sur la sésathèque (oid ou origine/idOrigine)
 * @param {itemCallback} next
 */
function getItem(name, id, next) {
  try {
    var base = getBase(name)
    var url = base +"api/ressource/" +id
    var options = {
      responseType : "json",
      timeout : timeout,
      urlParams : {format:"ref"},
      withCredentials : true
    }
    xhr.get(url, options, function (error, item) {
      if (error) {
        next(error)
      } else if (item) {
        //log("getItem récupère", item)
        if (!item.ref || item.ref.indexOf("/") > -1) {
          notifyError(name, "item récupéré pour " +id +" avec ref incohérente", item)
          next(new Error("données récupérées incohérentes pour " +id +" sur la sésathèque " +name))
        } else {
          next(null, normalize(item, base))
        }
      } else {
        next(new Error(url +"?format=ref ne renvoie ni erreur ni ressource"))
      }
    })
  } catch (error) {
    next(error)
  }
}
/**
 * Récupère une ressource complète sur une sésathèque
 * @param {string}       name Le nom de la sésathèque ajoutée au préalable
 * @param {string}       id   L'identifiant de la ressource sur la sésathèque (oid ou origine/idOrigine)
 * @param {ressourceCallback} next
 */
function getRessource(name, id, next) {
  try {
    var base = getBase(name)
    var url = base +"api/ressource/" +id
    var options = {
      responseType : "json",
      timeout : timeout,
      withCredentials : true
    }
    xhr.get(url, options, function (error, ressource) {
      if (error) next(error)
      else next(null, ressource)
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Récupère la liste des ressources perso du user courant
 * @param {string}       name Le nom de la sésathèque ajoutée au préalable
 * @param {itemCallback} next
 */
function getListePerso(name, next) {
  try {
    var base = getBase(name)
    var url = base +"api/liste/perso"
    var options = {
      responseType : "json",
      timeout : timeout,
      withCredentials : true
    }
    xhr.get(url, options, function (error, data) {
      if (error) next(error)
      else if (data.error) next(new Error(data.error))
      else if (data.liste && data.success) {
        var item
        var items = []
        data.liste.forEach(function (ressource) {
          item = normalize(ressource, base)
          //log("item perso", item)
          if (item) items.push(item)
        })
        next(null, items, data.sequenceModeles)
      } else next(new Error("La sésathèque " +name +" n'a pas renvoyé la réponse attendue"))
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Retourne les enfants en liste d'items
 * @param {SesathequeItem} item
 * @param {itemsCallback}  next
 */
function getEnfants(item, next) {
  var enfants = []
  if (typeof item.enfants === "string") {
    var matches = /^(https?:\/\/[a-z\-\._]+(:[0-9]+)?\/)api\/./.exec(item.enfants)
    if (matches && matches[1]) {
      var base = matches[1]
      var options = {responseType:"json"}
      if (item.enfants.indexOf("/public/") === -1) options.withCredentials = true
      xhr.get(item.enfants, options, function (error, arbre) {
        if (error) next(error)
        else getEnfants(normalize(arbre, base), next)
      })
    } else {
      next(new Error("Enfants invalides : " +item.enfants))
    }

  } else if (item.enfants instanceof Array && item.enfants.length) {
    var base = item.base
    if (!base && item.displayUrl) {
      // on a un item sans base, ça peut pas être un alias (ils n'ont pas d'enfants), donc la base est celle de displayUrl
      var matches = /^(https?:\/\/[a-z\-\._]+(:[0-9]+)?\/)./.exec(item.displayUrl)
      if (matches && matches[1]) base = matches[1]
    }
    if (base) {
      for (var i = 0; i < item.enfants.length; i++) {
        enfants.push(normalize(item.enfants[i], base))
      }
      next(null, enfants)
    } else {
      next(new Error("item invalide (sans base ni displayUrl valide)"))
    }
  } else {
    // pas d'enfants
    next(null, enfants)
  }
}

/**
 * Pour modifier un item, retourne d'abord une url à ouvrir en iframe à urlCallback
 * puis un item sauvegardé à itemCallback (quand la ressource aura été sauvegardée si le user va au bout)
 * @param {SesathequeItem} item
 * @param {itemCallback}   itemCallback
 * @param {urlCallback}    urlCallback
 */
function modifyItem(item, itemCallback, urlCallback) {
  if (item.$editUrl) {
    var base = getBaseUrl(item.$editUrl)
    var id = addCloser(base, itemCallback)
    urlCallback(null, item.$editUrl +"?layout=iframe&closerId=" +id)
  } else {
    urlCallback(new Error("Cet item ne peut être modifié"))
  }
}

/**
 * Retourne un item de sesatheque normalisé
 * @param {Ref|Ressource|Alias} ressource
 * @param {string}              base     La base de la sesatheque de la ressource ou son nom,
 *                                       si non précisé, on essaiera de le déduire (de base ou displayUrl)
 * @returns {SesathequeItem}
 */
function normalize(ressource, base) {
  try {
    /** @type {SesathequeItem} */
    var item
    if (!base) base = getBaseItem(ressource)
    if (ressource && base) {
      if (base.substr(0,4) !== "http") base = getBase(base)
      else if (base.substr(-1) !== "/") base += "/"
      item = {
        id: ressource.id || ressource.ref || ressource.oid,
        titre: ressource.titre || "Sans titre",
        type: ressource.type
      }
      if (ressource.resume) item.resume = ressource.resume
      if (ressource.commentaires) item.commentaires = ressource.commentaires
      if (ressource.categories) item.categories = ressource.categories
      var idW, idR
      // 3 cas alias / ref / ressource
      if (ressource.oid && ressource.ref && ressource.base) {
        // c'est un alias, on mémorise la base de l'alias (celle de la cible est dans displayUrl),
        // ça servira aussi à tester plus tard si c'est un alias (s'il est mis dans une série et qu'on veut le cloner plus tard)
        item.baseAlias = base
        if (ressource.base.substr(-1) !== "/") ressource.base += "/"
        item.$deleteUrl = base + "api/alias/" + ressource.oid
        idR = ressource.cle ? 'cle/' + ressource.cle : ressource.ref
        item.displayUrl = ressource.base + "public/voir/" + idR
        // il a pas d'enfant, mais si c'est un arbre faut mettre l'url sur l'api pour les récupérer plus tard si besoin
        if (item.type === "arbre") item.enfants = ressource.base + "api/public/" + idR
        item.public = !!ressource.public

      } else {
        if (ressource.ref || ressource.id) {
          // un enfant quelconque
          item.public = !!ressource.public
          idW = ressource.ref || ressource.id
          // si l'item n'est pas public et qu'il n'y a pas de cle fournie faudrait signaler une anomalie de data qqpart
          // car le user va se prendre un 404… (pas public donc existe pas via /public/)
          idR = (!item.public && ressource.cle) ? 'cle/' + ressource.cle : idW
        } else if (ressource.oid) {
          // ressource full
          item.public = !ressource.restriction
          idW = ressource.oid
          idR = (!item.public && ressource.cle) ? 'cle/' + ressource.cle : idW
        }

        if (idR) {
          item.displayUrl = base + "public/voir/" + idR
          if (ressource.$droits && ressource.$droits.indexOf('D') > -1) item.$deleteUrl = base + "api/ressource/" + idW
          if (ressource.$droits && ressource.$droits.indexOf('W') > -1) item.$editUrl = base + "ressource/modifier/" + idW
        } else if (ressource.enfants || ressource.type === "arbre") {
          // une branche sans ref ni oid, faut stocker la base pour un éventuel futur getEnfants
          item.base = base
        }
        if (ressource.enfants) item.enfants = ressource.enfants
        else if (ressource.type === "arbre") item.enfants = base + "api/public/" + idR
      }
    } else if (ressource) {
      log("Normalize veut une base ou un item qui permet de la déduire", ressource)
    }

  } catch (error) {
    log(error)
    item = undefined
  }

  return item
}

/**
 * Essaie de trouver la base dans la ressource et appelle toutes les sésathèque sinon
 *
 * À éviter si on peut faire autrement, car gourmand en requêtes et pas fiable à 100%
 * (ne trouve pas l'item s'il a été renommé, et pourrait en ramener un de la mauvaise
 * sésathèque s'il y a des homonymes avec le même id sur 2 sésathèques, ce qui serait
 * vraiment pas de bol)
 * @param ressource
 * @param next
 */
function normalizeGuess(ressource, next) {
  function seek(error, item) {
    if (!error && item && item.titre === ressource.titre && item.id === id && item.type === ressource.type) {
      // on l'a trouvé
      next(null, item)
    } else {
      // on va chercher sur le name suivant
      var name = names.pop()
      if (name) getItem(name, id, seek)
      else next(new Error("Cet item n'existe sur aucune sésathèque enregistrée (ou il a changé de titre)"))
    }
  }
  var base = ressource.base || getBaseItem(ressource)
  if (base) {
    next(null, normalize(ressource, base))
  } else {
    // faut name et id pour chercher sur les sésathèques
    var id = ressource.id || ressource.oid || ressource.ref
    var names = []
    for (var name in sesatheques) {
      if (sesatheques.hasOwnProperty(name)) cb.push(name)
    }
    // et on lance l'itération
    seek()
  }
}


/**
 * Notifie une erreur à une sésathèque
 * @param name
 * @param message
 * @param obj
 */
function notifyError(name, message, obj) {
  var notif = {error:message}
  if (obj) notif.detail = obj
  var url = getBase(name) +"api/notifyError"
  xhr.post(url, notif, {responseType:"json"}, function (error, data) {
    if (error) log(error)
  })
}

/**
 * Exporte une séquence modèle d'un sesalab comme ressource sur une sesatheque
 * @param name
 * @param sequenceModele
 * @param next
 */
function saveSequenceModele(name, sequenceModele, next) {
  log("saveSequenceModele sur " +name, serie)
  try {
    var base = getBase(name)
    var url = base +'api/ressource'
    if (!sequenceModele.nom) throw new Error("Modèle de séquence sans titre")
    if (!sequenceModele.oid) throw new Error("Modèle de séquence sans identifiant (oid)")
    var ressource = {
      titre : sequenceModele.nom,
      type : "sequenceModele",
      origine : origine,
      idOrigine : sequenceModele.oid,
      parametres : sequenceModele
    };
    xhr.post(url, serie, {withCredentials:true, responseType:"json"}, function (error, ressource) {
      if (error) {
        next(error)
      } else if (ressource) {
        if (ressource.error) next(new Error(ressource.error))
        else if (ressource.ref) next(null, normalize(ressource, base))
      } else {
        next(new Error("La réponse n'est pas au format attendu"))
      }
    })

  } catch (error) {
    next(error)
  }
}

/**
 * Exporte une série d'un sesalab comme ressource sur une sesatheque
 * @param name Le nom de la Sésathèque (passé à addSesatheques)
 * @param serie
 * @param next
 */
function saveSerie(name, serie, next) {
  log("saveSerie sur " +name, serie)
  try {
    var base = getBase(name)
    var url = base +'api/ressource'
    if (!serie.titre) throw new Error("Série sans titre")
    serie.type = "serie"
    serie.origine = origine
    if (!serie.idOrigine) serie.idOrigine = uuid()
    xhr.post(url, serie, {withCredentials:true, responseType:"json"}, function (error, ressource) {
      if (error) {
        next(error)
      } else if (ressource) {
        if (ressource.error) next(new Error(ressource.error))
        else if (ressource.ref) next(null, normalize(ressource, base))
      } else {
        next(new Error("La réponse n'est pas au format attendu"))
      }
    })

  } catch (error) {
    next(error)
  }
}

/**
 * Constructeur du client
 * @param {object} sesatheques
 * @param {string} base La base du domaine qui nous utilise
 * @param {XMLHttpRequest} [XMLHttpRequest] Un éventuel constructeur XMLHttpRequest si on tourne coté serveur,
 *                                 à construire avec require("xmlhttprequest").XMLHttpRequest
 * @returns {object} La liste des méthodes
 */
module.exports = function (sesatheques, base, XMLHttpRequest) {
  if (XMLHttpRequest && typeof global !== "undefined") {
    log("on passe un xhr")
    xhr.setXMLHttpRequest(XMLHttpRequest)
  }
  addSesatheques(sesatheques)
  if (! /^https?:\/\/[a-z\-\._]+(:[0-9]+)?(\/.*)?$/.test(base)) throw new Error("La base " +base +" n'est pas une racine d'url absolue valide")
  baseClient = base
  if (baseClient.substr(-1) !== "/") baseClient += "/"
  origine = baseClient.replace(/^https?:\/\/([a-z\-\._]+)(:[0-9]+)?(\/.*)?$/, "$1")
  //log("init client avec", sesatheques, base)

  return {
    addItem: addItem,
    cloneItem: cloneItem,
    deleteItem: deleteItem,
    getEnfants: getEnfants,
    getItem: getItem,
    getRessource: getRessource,
    getListePerso: getListePerso,
    modifyItem: modifyItem,
    normalize:normalize,
    normalizeGuess:normalizeGuess,
    notifyError:notifyError,
    saveSequenceModele : saveSequenceModele,
    saveSerie: saveSerie
  }
}

/**
 * Un item de sesatheque normalisé (qui provient de Ressource|Ref|Alias)
 * Les propriétés *Url peuvent être absente (pas de editUrl => pas éditable)
 * @typedef SesathequeItem
 * @property {string}     titre
 * @property {string}     type
 * @property {string}     resume
 * @property {string}     commentaires
 * @property {Integer[]}  categories
 * @property {string}     $deleteUrl  Url absolue pour effacer la ressource (requete DELETE sur l'api withCredentials), absente si pas effaçable
 * @property {string}     displayUrl Url absolue d'affichage de la ressource
 * @property {string}     $editUrl    Url absolue d'édition de la ressource, absente si pas éditable
 * @property {boolean}    [isAlias]
 */

/**
 * @callback itemCallback
 * @param {Error}
 * @param {SesathequeItem}
 */

/**
 * @callback simpleCallback
 * @param {Error}
 */

/**
 * @callback urlCallback
 * @param {Error}
 * @param {string} Une url absolue
 */

/**
 * @callback itemsCallback
 * @param {Error}
 * @param {SesathequeItem[]}
 */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./config":2,"./xhr":3,"an-uuid":1}]},{},[]);
