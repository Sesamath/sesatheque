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
 * @file Liste de typedef pour jsdoc
 * @private
 */

/**
 * Callback appellée avec une erreur ou sans argument
 * @callback errorCallback
 * @param {Error} [error] Une erreur éventuelle
 */

/**
 * @callback groupeCallback
 * @param {Error}  [error]  erreur éventuelle
 * @param {Groupe} [groupe] Entity ou Object
 */

/**
 * @callback groupeListCallback
 * @param {Error}    [error] erreur éventuelle
 * @param {Groupe[]} groupes tableau d'entity groupe
 */

/**
 * @callback personneCallback
 * @param {Error}    [error]    erreur éventuelle
 * @param {Personne} [personne] Entity ou Object
 */

/**
 * @callback entityPersonneCallback
 * @param {Error}          [error]    Erreur éventuelle
 * @param {EntityPersonne} [personne] Une Entity Personne
 */

/**
 * @callback ressourceCallback
 * @param {Error}     [error]
 * @param {Ressource} [ressource]
 */

/**
 * @callback entityRessourceCallback
 * @param {Error}           [error]
 * @param {EntityRessource} [ressource]
 */

/**
 * Callback appellée sans argument
 * @callback simpleCallback
 */

/**
 * Une des relations d'une ressource
 * @typedef relation
 * @type {Integer[]}
 * @property {Integer} 0 Id du type de liaison (cf app/ressource/config:listes.relations)
 * @property {Integer} 1 rid de la ressource liée
 */

/**
 * Objet link à passer à la vue link.dust
 * @typedef Link
 * @type {Object}
 * @property {string} href    L'url du lien
 * @property {string} value   Le texte à mettre dans le lien
 * @property {string} [icon]  Le nom de l'icone
 * @property {nameValue[]} [attributes] Attributs supplémentaires à mettre dans le tag a
 */

/**
 * Paire name / value
 * @typedef nameValue
 * @type {Object}
 * @property {string} name
 * @property {string} value
 */

/**
 * Une liste de critères de recherche.
 *
 * Chaque propriété est l'index sur lequel faire la recherche,
 * Sa valeur doit toujours être un tableau. S'il est vide on match simplement l'index
 * (non null dans mongo), sinon les valeurs demandées.
 * ex {type: 'j3p', groupes: ['foo', 'bar']} var chercher les ressources de type j3p publiées dans les groupes foo OU bar
 * Si une valeur de type string contient % on fera du like dessus (à éviter car gourmand, préférer fulltext)
 *
 * La clé fulltext est particulière, ça lance un textSearch lassi, en concaténant toutes les valeurs
 * (donc ['foo', 'bar'] revient au même que ['foo bar'], il faut passer ['"foo bar"'] pour une recherche exacte sur plusieurs mots)
 * @typedef {Object} searchQuery
 */

/**
 * Objet qui formalise la requete sous forme index: valeurs à chercher
 * C'est du ET entre les index, et du ou pour un index donné.
 * @typedef searchQuery
 * @type Object
 * @property {string|string[]} anIndexName Un nom d'index avec les valeurs qu'on cherche
 * @property {string|string[]} anotherIndexName Un autre nom d'index avec les valeurs qu'on cherche
 */

/**
 * Options de recherche (skip, limit & orderBy)
 * @typedef {Object} searchQueryOptions
 * @param {number} [skip=0] Offset
 * @param {number} [limit=25] Le nombre max de ressources à remonter
 * @param {orderByParam[]} [orderBy] La liste éventuelle des clés de tri
 */
/**
 * Indication de tri (on accepte une string pour un tri ascendant)
 * @typedef orderByParam
 * @type {Array|string}
 * @property {string} 0 la clé sur laquelle trier
 * @property {string} [1=asc] passer 'desc' pour un tri inversé
 */
