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
(function () {
  'use strict';
  var jstreeConverter = {};
  var baseUrl = (typeof baseUrl === 'undefined') ? '' : baseUrl;
  var log;
  // on prend celui-là si on le trouve
  try {
    log = window.Sesamath.log;
  } catch (error) {
    log = function () {};
  }
  /**
   * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
   * @see http://www.jstree.com/docs/json/ pour le format
   * @param {Ressource} ressource
   */
  function getJstNode(ressource) {
    /**
     * Retourne les datas qui nous intéressent à mettre sur le tag a
     * (pour a_attr : data-ref, data-typeTechnique, href et alt)
     * @return {Object}
     */
    function getAttr() {
      var attr = {};
      // ref
      if (ressource.oid) attr['data-ref'] = ressource.oid;
      else if (ressource.ref) attr['data-ref'] = ressource.ref;
      else if (ressource.origine && ressource.idOrigine) attr['data-ref'] = ressource.origine + '/' + ressource.idOrigine;
      // url complète
      if (ressource.displayUri) {
        attr.href = baseUrl + ressource.displayUri;
        attr['data-displayUri'] = ressource.displayUri;
      }
      if (ressource.dataUri) attr['data-dataUri'] = ressource.dataUri;
      if (ressource.typeTechnique) attr['data-typeTechnique'] = ressource.typeTechnique;
      if (ressource.resume) attr.alt = ressource.resume;

      return attr;
    }

    var node;
    if (ressource) {
      node = {
        text  : ressource.titre,
        a_attr: getAttr(),
        icon  : ressource.typeTechnique + 'JstNode'
      };
    } else throw new Error("getJstNode appelé sans ressource");

    return node;
  }

  /**
   * Retourne un tableau children au format jstree
   * @param nodeId Le nodeId dont on veut les enfants, passer '#' ou null pour la racine
   *               (pour trouver l'objet jstree._model.data[nodeId])
   * @param jstree L'objet jstree complet, retourné par $.jstree.reference('#leTree')
   * @return {Array} Le tableau des enfants de node
   */
  jstreeConverter.getEnfants = function (nodeId, jstree) {
    //log('getEnfants de ' +nodeId, jstree);
    var enfants = [];
    try {
      if (!nodeId) nodeId = '#';
      var root = jstree._model.data;
      root[nodeId].children.forEach(function (rootChildId) {
        var child = root[rootChildId];
        var enfant = jstreeConverter.toRef(child, jstree);
        if (enfant && (enfant.ref || enfant.typeTechnique === 'arbre')) enfants.push(enfant);
        else log.error("Pb de conversion du child", child);
      });
    } catch(error) {
      log.error(error);
    }
    //log("pour " +nodeId +" on va retourner", enfants);

    return enfants;
  };

  /**
   * Retourne un tableau children au format jstree
   * @param ressource
   * @return {Array} Le tableau des enfants
   */
  jstreeConverter.getJstreeChildren = function (ressource) {
    var children = [];
    if (ressource.typeTechnique === 'arbre' && ressource.enfants && ressource.enfants.forEach) {
      ressource.enfants.forEach(function (enfant) {
        var child;
        if (enfant.typeTechnique === 'arbre') {
          child = jstreeConverter.toJstree(enfant);
        } else {
          child = getJstNode(enfant);
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
   * @param {Ressource|Ref} ressource Une ressource ou une ref à une ressource
   * @returns {Object}
   */
  jstreeConverter.toJstree = function (ressource) {
    var node = getJstNode(ressource);
    if (ressource.typeTechnique === 'arbre') {
      if (ressource.enfants && ressource.enfants.length) {
        node.children = jstreeConverter.getJstreeChildren(ressource);
      } else {
        // uri pour récupérer les enfants
        var url;
        if (ressource.oid) url = '/api/jstree?ref=' + ressource.oid;
        else if (ressource.ref) url = '/api/jstree?ref=' + ressource.ref;
        else if (ressource.origine && ressource.idOrigine) url = '/api/jstree?ref=' + ressource.origine + '/' + ressource.idOrigine;
        if (url) {
          node.children = true;
          node.data = {url: baseUrl + url + '&children=1'};
        }
      }
    }

    return node;
  };

  /**
   * Retourne une Ref à partir d'un node jstree
   * @param {jQueryElement} node Un element de l'objet reference jstree _model.data[childId]
   * @returns {Ref} La ref (presque, ref, titre, typeTechnique, avec displayUrl & resume en plus,
   *                mais pas categories, et enfants seulement si on passe le jstree complet)
   */
  jstreeConverter.toRef = function (node, jstree) {
    //log('toRef de', node);
    var item = {};
    if (node.original) {
      item.titre = node.original.text;
      if (node.original.a_attr) {
        item.typeTechnique = node.original.a_attr['data-typeTechnique'];
        if (item.typeTechnique === 'arbre' && node.children && node.children.length && jstree) {
          item.enfants = jstreeConverter.getEnfants(node.id, jstree);
        }
        if (node.original.a_attr['data-displayUri']) item.displayUri = node.original.a_attr['data-displayUri'];
        if (node.original.a_attr['data-dataUri']) item.displayUri = node.original.a_attr['data-dataUri'];
        if (node.original.a_attr['data-ref']) item.ref = node.original.a_attr['data-ref'];
        if (node.original.a_attr.alt) item.resume = node.original.a_attr.alt;
      }
      //log('converti en', item);
    }

    return item;
  };

  // suivant que l'on est coté serveur ou client
  if (typeof define === 'function') define(function () { return jstreeConverter; }); // requireJs
  else if (typeof module === 'object') module.exports = jstreeConverter; // node
  // sinon il se passe rien
})();
