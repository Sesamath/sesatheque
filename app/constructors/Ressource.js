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
/* global module */

var filters = require('sesajstools/utils/filters')

/**
 * Constructeur de l'objet Ressource (utilisé par l'entity Ressource coté serveur ou les plugins coté client)
 * @constructor
 * @param {Object} initObj Un objet ayant des propriétés d'une ressource
 */
function Ressource (initObj) {
  var values = Object.assign({}, initObj)
  /**
   * L'identifiant interne à cette Sésathèque
   * @default undefined
   * @type {Integer}
   */
  this.oid = filters.int(values.oid) || undefined // on préfère l'absence de propriété à 0
  // les alias ont une ref avec la baseId qui donne la source (l'oid est celui de l'alias)
  if (values.ref) {
    if (!values.baseId) throw new Error('Une ressource ne peut pas avoir de propriété ref sans propriété baseId')
    /**
     * La référence à une autre ressource
     * @type {string}
     */
    this.ref = values.ref
    /**
     * L'id de la sésathèque qui référence cette ressource d'origine
     * @type {string}
     */
    this.baseId = values.baseId
  }
  /**
   * Une clé permettant de lire la ressource (si elle est publiée) en outrepassant les droits
   * @default undefined
   * @type {string}
   */
  this.cle = filters.string(values.cle)
  /**
   * identifiant du dépôt d'origine (où est stockée et géré la ressource), 'local' si créé sur cette sesatheque
   * @default ''
   * @type {string}
   */
  this.origine = filters.string(values.origine)
  /**
   * Id de la ressource dans son dépôt d'origine
   * @default ''
   * @type {string}
   */
  this.idOrigine = filters.string(values.idOrigine)
  /**
   * Le code du plugin qui gère la ressource
   * @default ''
   * @type {string}
   */
  this.type = filters.string(values.type)
  /**
   * Titre
   * @default ''
   * @type {string}
   */
  this.titre = filters.string(values.titre)
  /**
   * Résumé qui apparait souvent au survol du titre ou dans les descriptions brèves, destiné à tous
   * @default ''
   * @type {string}
   */
  this.resume = filters.string(values.resume)
  /**
   *  Description plus complète, facultative (préférer le résumé)
   *  @default ''
   *  @type {string}
   */
  this.description = filters.string(values.description)
  /**
   * Commentaires destinés aux éditeurs, ou au prescipteur de la ressource mais pas à l'utilisateur
   * @default ''
   * @type {string}
   */
  this.commentaires = filters.string(values.commentaires)
  if (this.type === 'arbre') {
    /**
     * Les enfants de l'arbre (à la place de la propriété parametres si type vaut 'arbre')
     * @type {Object}
     */
    this.enfants = Array.isArray(values.enfants) ? values.enfants : []
    // on accepte une chaîne json
    if (values.enfants && typeof values.enfants === 'string') {
      try {
        var enfants = JSON.parse(values.enfants)
        if (Array.isArray(enfants)) this.enfants = enfants
        else throw new Error('enfants invalides')
      } catch (error) {
        if (console && console.error) console.error(error)
      }
    }
  } else {
    /**
     * Contenu qui dépend du type (toutes les infos spécifique à ce type)
     * @type {Object}
     */
    this.parametres = (values.parametres instanceof Object) ? values.parametres : {}
    // on accepte une chaîne json
    if (values.parametres && typeof values.parametres === 'string') {
      try {
        this.parametres = JSON.parse(values.parametres)
      } catch (error) {
        if (console && console.error) console.error(error)
      }
    }
  }
  /**
   * Niveaux scolaire de la ressource
   * (faudra gérér ultérieurement différents système éducatif, fr_FR pour tout le monde en attendant)
   * @type {Array}
   */
  this.niveaux = filters.arrayString(values.niveaux, false)
  /**
   * Un id de catégorie correspond à un recoupement de types, par ex [7] pour 'exercice interactif'
   * @type {Array}
   */
  this.categories = filters.arrayInt(values.categories, false)
  /**
   * Type pédagogique (5.2 - scolomfr-voc-010) : cours, exercice...
   * C'est un champ conditionné par la catégorie, mais à priori seulement, l'utilisateur peut modifier / enrichir
   * @see {@link http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=62}
   * @type {Array}
   */
  this.typePedagogiques = filters.arrayInt(values.typePedagogiques, false)
  /**
   * type documentaire (1.9 - scolomfr-voc-004) : image, ressource interactive, son, texte
   * Idem, conditionné par la catégorie mais à priori seulement
   * @see {@link http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=49}
   * @type {Array}
   */
  this.typeDocumentaires = filters.arrayInt(values.typeDocumentaires, false)
  /**
   * Liste des ressources liées, une liaison étant un array [idLiaison, idRessourceLiée]
   * idRessourceLiée peut être un oid ou une string origine/idOrigine
   * @type {relation[]}
   */
  this.relations = []
  if (Array.isArray(values.relations) && values.relations.length) {
    values.relations.forEach(rel => {
      if (Array.isArray(rel) && rel.length === 2) {
        const typeRel = filters.int(rel[0])
        const ressId = filters.string(rel[1])
        if (typeRel && ressId) this.relations.push([typeRel, ressId])
      }
    }, this)
  }
  /**
   * Liste d'id d'auteurs
   * @type {Integer[]}
   */
  // pas arrayInt car on peut recevoir du origin/idOrigin que l'on transforme ensuite, voire peut-être des urls un jour
  this.auteurs = filters.arrayString(values.auteurs, false)
  /**
   * Liste d'url pour les auteurs précédents
   */
  if (values.auteursParents) this.auteursParents = filters.arrayString(values.auteursParents)
  /**
   * Liste d'id de contributeurs
   * @type {Integer[]}
   */
  this.contributeurs = filters.arrayString(values.contributeurs, false)
  /**
   * Liste de noms de groupes dans lesquels cette ressource est publiée
   * @type {string[]}
   */
  this.groupes = filters.arrayString(values.groupes, false)
  /**
   * Liste de noms de groupes dont les membres peuvent modifier cette ressource
   * @type {string[]}
   */
  this.groupesAuteurs = filters.arrayString(values.groupesAuteurs, false)
  /**
   * code langue ISO 639-2
   * @see {@link http://fr.wikipedia.org/wiki/Liste_des_codes_ISO_639-2}
   * @type {string}
   */
  this.langue = filters.string(values.langue) || 'fra'
  /**
   * Vrai si la ressource est publiée (les non-publiées sont visibles par leur auteur et ceux ayant les droits ad hoc)
   * false par défaut
   * @type {boolean}
   */
  this.publie = !!values.publie
  /**
   * Restriction sur la ressource, cf lassi.settings.ressource.constantes.restriction
   * @type {Integer}
   */
  this.restriction = filters.int(values.restriction)
  /**
   * Date de création
   * @type {Date}
   */
  this.dateCreation = filters.date(values.dateCreation) || new Date()
  /**
   * Date de mise à jour
   * @type {Date}
   */
  this.dateMiseAJour = filters.date(values.dateMiseAJour)
  /**
   * Version de la ressource
   * @type {Integer}
   */
  this.version = filters.int(values.version) || 1
  /**
   * Si la ressource est indexable elle peut sortir dans un résultat de recherche
   * Passer à false pour des ressources 'obsolètes' car remplacées par d'autres, mais toujours publiées car utilisées.
   * @type {boolean}
   * @default true
   */
  this.indexable = values.hasOwnProperty('indexable') ? !!values.indexable : true
  /**
   * L'oid de l'archive correspondant à la version précédente
   * @default undefined
   * @type {Integer}
   */
  this.archiveOid = filters.int(values.archiveOid)
  /**
   * Une liste d'avertissements éventuels (incohérences, données manquantes, etc.)
   * Pratique d'avoir un truc pour faire du push dedans sans vérifier qu'il existe
   * Non sauvegardé
   * @default {[]}
   * @type {string[]}
   */
  this._warnings = []
  if (values._warnings) {
    this._warnings = filters.arrayString(values._warnings)
  }
  /**
   * Une liste d'erreurs éventuelles (incohérences, données manquantes, etc.)
   * Bloque l'enregistrement s'il n'est pas vide (sinon viré avant enregistrement)
   * @default {[]}
   * @type {string[]}
   */
  this._errors = []
  if (values._errors) {
    this._errors = filters.arrayString(values._errors)
  }
  // et on ajoute des erreurs si on a viré des trucs
  Object.getOwnPropertyNames(values).forEach(p => {
    if (Array.isArray(this[p])) {
      // on ne vérifie que ce qui fini en tableau
      if (Array.isArray(values[p])) {
        if (this[p].length < values[p].length) {
          this._errors.push(`des éléments de la propriété ${p} étaient invalides et ont été ignorés`)
          if (typeof log === 'function' && log.debug) {
            log.debug(`pour ${p} on a initialement`, values[p])
            log.debug('qui donne', this[p])
          }
        }
      } else if (values[p]) {
        this._errors.push(`La propriété ${p} était invalide et a été ignorée`)
        console.error('contenu invalide', values[p])
      }
    }
  }, this) // pas utile de préciser le this de forEach avec une fct fléchée, au cas où elle serait plus fléchée…
}

/**
 * Cast en string d'une ressource (son titre)
 * @returns {string}
 */
Ressource.prototype.toString = function () {
  return this.titre
}

/**
 * Retourne un id (oid ou origine/idOrigine si pas encore d'oid)
 * @returns {Integer|string}
 */
Ressource.prototype.getId = function () {
  return this.oid || this.origine + '/' + this.idOrigine
}

module.exports = Ressource
