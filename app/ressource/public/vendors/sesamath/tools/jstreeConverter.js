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
(function (global) {
  'use strict';
  var jstreeConverter = {};
  // global est window dans un navigateur
  var baseUrl = (typeof global.baseUrl === 'undefined') ? '' : global.baseUrl;
  if (baseUrl && baseUrl.substr(-1) !== "/") baseUrl += "/";
  var log;
  try {
    // on prend celui-là si on le trouve
    log = window.sesamath.log;
  } catch (error) {
    log = function () {};
    log.error = function () {};
  }

  /**
   * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
   * @see http://www.jstree.com/docs/json/ pour le format
   * @param {Ressource} ressource
   * @param {string}    [defaultBase]
   */
  jstreeConverter.getJstNode = getJstNode;
  function getJstNode(ressource, defaultBase) {
    /**
     * Retourne les datas qui nous intéressent à mettre sur le tag a
     * (pour a_attr : data-ref, data-type, href et alt)
     * @return {Object}
     */
    function getAttr() {
      var prefix;
      var attr = {};
      var base = ressource.base || defaultBase || baseUrl;
      if (base && base.substr(-1) !== "/") base += "/";
      // ref
      var ref = ressource.id || ressource.ref || ressource.oid;
      if (!ref && ressource.origine && ressource.idOrigine) ref = ressource.origine + '/' + ressource.idOrigine;
      var isPublic = (ressource.public || ressource.restriction === 0)
      var displayUrl = ressource.displayUrl;
      var dataUrl = ressource.dataUrl;
      if (ref || ressource.cle) {
        if (ref) {
          attr['data-ref'] = ref;
          if (!displayUrl) {
            if (isPublic) displayUrl = base + 'public/voir/' + ref;
            else if (ressource.cle) displayUrl = base + 'public/voir/cle/' + ressource.cle;
            else displayUrl = base + 'ressource/voir/' + ref;
          }
          if (!dataUrl) {
            if (isPublic) dataUrl = base + 'api/public/' + ref;
            else if (ressource.cle) dataUrl = base + 'api/public/cle/' + ressource.cle;
            else dataUrl = base + 'api/ressource/' + ref;
          }
        } else {
          if (!displayUrl) displayUrl = base + 'public/voir/cle/' + ressource.cle;
          if (!dataUrl) dataUrl = base + 'api/public/cle/' + ressource.cle;
        }
      }
      if (displayUrl) {
        attr.href = displayUrl;
        attr['data-displayUrl'] = displayUrl;
      }
      if (dataUrl) attr['data-dataUrl'] = dataUrl;
      if (ressource.type) attr['data-type'] = ressource.type;
      if (ressource.resume) attr.alt = ressource.resume;

      return attr;
    }

    var node;
    if (ressource) {
      node = {
        text  : ressource.titre,
        a_attr: getAttr(),
        icon  : ressource.type + 'JstNode'
      };
    } else throw new Error("getJstNode appelé sans ressource");

    return node;
  }

  /**
   * Retourne un tableau children au format jstree
   * @param {string} nodeId Le nodeId dont on veut les enfants, passer '#' ou null pour la racine
   *               (pour trouver l'objet jstree._model.data[nodeId])
   * @param {object} jstree L'objet jstree complet, retourné par $.jstree.reference('#leTree')
   * @return {Array} Le tableau des enfants de nodeId
   */
  jstreeConverter.getEnfants = function (nodeId, jstree) {
    //log('getEnfants de ' +nodeId, jstree);
    var enfants = [];
    var i = 0;
    try {
      if (!nodeId) nodeId = '#';
      var root = jstree._model.data;
      root[nodeId].children.forEach(function (rootChildId) {
        var child = root[rootChildId];
        var enfant = jstreeConverter.toRef(child, jstree);
        if (i<5) {
          log("traitement child", child);
          log("devenu", enfant);
          i++;
        }
        if (enfant && (enfant.ref || enfant.type === 'arbre')) enfants.push(enfant);
        else log.error("Pb de conversion du child, ni ref ni arbre", child);
      });
    } catch(error) {
      log.error(error);
    }
    //log("pour " +nodeId +" on va retourner", enfants);

    return enfants;
  };

  /**
   * Retourne un tableau children au format jstree
   * @param {Ressource} ressource
   * @param {string}    [defaultBase]
   * @return {Array} Le tableau des enfants
   */
  jstreeConverter.getJstreeChildren = function (ressource, defaultBase) {
    var base = ressource.base || defaultBase || baseUrl;
    var children = [];
    if (ressource.type === 'arbre' && ressource.enfants && ressource.enfants.forEach) {
      ressource.enfants.forEach(function (enfant) {
        var child;
        if (enfant.type === 'arbre') {
          child = jstreeConverter.toJstree(enfant, base);
        } else {
          child = getJstNode(enfant, base);
        }
        children.push(child);
      });
    }

    return children;
  };

  /**
   * Affecte la base de la sésathèque pour les urls mis dans les éléments de l'arbre
   * (sinon ces urls seront absolues sur le domaine courant)
   * @param {string} url L'url de base http://domaine.tld:port de la sesatheque
   */
  jstreeConverter.setBaseUrl = function (url) {
    if (typeof url === 'string') {
      if (url.substr(-1) === '/') url = url.substr(0, url.length - 1);
      baseUrl = url;
    }
  };

  /**
   * Transforme un ressource de la bibli en node pour jstree
   * (il faudra le mettre dans un tableau, à un seul élément si c'est un arbre)
   * @param {Ressource|Alias} ressource Une ressource ou une référence à une ressource
   * @param {string}          [defaultBase]
   * @returns {Object}
   */
  jstreeConverter.toJstree = function (ressource, defaultBase) {
    var base = ressource.base || defaultBase || baseUrl;
    var node = getJstNode(ressource, base);
    if (ressource.type === 'arbre') {
      if (ressource.enfants && ressource.enfants.length) {
        node.children = jstreeConverter.getJstreeChildren(ressource, base);
      } else {
        // url pour récupérer les enfants
        var url;
        if (ressource.oid) url = '/api/jstree?ref=' + ressource.oid;
        else if (ressource.ref) url = '/api/jstree?ref=' + ressource.ref;
        else if (ressource.origine && ressource.idOrigine) url = '/api/jstree?ref=' + ressource.origine + '/' + ressource.idOrigine;
        if (url) {
          node.children = true;
          node.data = {url: base + url + '&children=1'};
        }
      }
    }

    return node;
  };

  /**
   * Retourne une Ref à partir d'un node jstree
   * @param {jQueryElement} node Un element de l'objet reference jstree _model.data[childId]
   * @returns {Ref} La ref (presque, ref, titre, type, avec displayUrl & resume en plus,
   *                mais pas categories, et enfants seulement si on passe le jstree complet)
   */
  jstreeConverter.toRef = function (node, jstree) {
    //log('toRef de', node);
    var item = {};
    var nodeSrc;
    if (node.text && node.a_attr) {
      nodeSrc = node;
    } else if (node.original) {
      nodeSrc = node.original;
    } else {
      log.error("node impossible à convertir en ref", node);
    }
    if (nodeSrc) {
      item.titre = nodeSrc.text;
      if (nodeSrc.a_attr) {
        item.type = nodeSrc.a_attr['data-type'];
        if (item.type === 'arbre' && node.children && node.children.length && jstree) {
          item.enfants = jstreeConverter.getEnfants(node.id, jstree);
        }
        if (nodeSrc.a_attr['data-displayUrl']) item.displayUrl = nodeSrc.a_attr['data-displayUrl'];
        if (nodeSrc.a_attr['data-dataUrl']) item.dataUrl = nodeSrc.a_attr['data-dataUrl'];
        if (nodeSrc.a_attr['data-ref']) item.ref = nodeSrc.a_attr['data-ref'];
        if (nodeSrc.a_attr.alt) item.resume = nodeSrc.a_attr.alt;
      }
      //log('converti en', item);
    }

    return item;
  };

  // suivant que l'on est coté serveur ou client
  if (typeof define === 'function') define(function () { return jstreeConverter; }); // requireJs
  else if (typeof module === 'object') module.exports = jstreeConverter; // node
  // sinon il se passe rien
})(this);
