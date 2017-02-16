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

const filters = require('sesajstools/utils/filters')
const {getBaseIdFromId} = require('sesatheque-client/src/sesatheques.js')
/**
 * Filtre une liste de personne en vérifiant que c'est bien de la forme baseId/xxx avec baseId connue
 * (les vire si c'est pas le cas)
 * @param {string[]} list
 * @return {Array} la liste filtrée
 */
function filterUserList (list) {
  if (list && Array.isArray(list) && list.length) {
    return filters.arrayString(list).filter(uid => {
      getBaseIdFromId(uid, false)
    })
  }
  return []
}
/**
 * Constructeur de l'objet Ressource (utilisé par l'entity Ressource coté serveur ou les plugins coté client)
 * @constructor
 * @param {Object} initObj Un objet ayant des propriétés d'une ressource
 */
function Ressource (initObj, myBaseId) {
  /**
   * @private
   * @type {Ressource}
   */
  var values = Object.assign({}, initObj)

  // on a déjà l'oid
  if (values.oid) {
    /**
     * L'identifiant interne à cette Sésathèque
     * @type {string}
     */
    this.oid = values.oid
    if (values.rid) {
      /**
       * Identifiant unique de ressource (baseId/oid pour usage inter Sesathèques)
       * @type {string}
       */
      this.rid = values.rid
    } else if (values.baseId) {
      this.rid = values.baseId + '/' + values.oid
    } else if (myBaseId) {
      this.rid = myBaseId + '/' + values.oid
    } else {
      throw new Error('Impossible d’instancier une Ressource avec oid sans rid ni baseId')
    }
  } else if (values.rid) {
    this.rid = values.rid
    // et on en déduit l'oid si on peut
    if (myBaseId && values.rid.indexOf(myBaseId + '/') === 0) {
      this.oid = values.rid.substr(myBaseId.length + 1)
    }
  }

  if (values.aliasOf) {
    /**
     * Pointe vers la ressource réelle (si ça existe on est un alias)
     * @default undefined
     * @type {string}
     */
    this.aliasOf = values.aliasOf
  }
  // pour le cast Ref => Ressource de l'ancien format ref
  if (values.ref) {
    // à l'ancien format on avait ref et baseId, mais ref pouvait être origine/idOrigine, ou cle/token
    // le nouveau format est le rid avec baseId/oid
    if (!values.baseId) throw new Error('Une ressource ne peut pas avoir de propriété ref sans propriété baseId')
    this.aliasOf = values.baseId + '/' + values.ref
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
        console.error(error)
      }
    }
  } else {
    if (values.parametres) {
      if (values.parametres instanceof Object) {
        /**
         * Contenu qui dépend du type (toutes les infos spécifique à ce type)
         * @type {Object}
         */
        this.parametres = values.parametres
      } else if (typeof values.parametres === 'string') {
      // on accepte une chaîne json
        try {
          const parametres = JSON.parse(values.parametres)
          if (typeof parametres === 'object') this.parametres = parametres
        } catch (error) {
          console.error(error)
        }
      }
    }
    if (!this.parametres) this.parametres = {}
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

  if (values.relations && Array.isArray(values.relations) && values.relations.length) {
    /**
     * Liste des ressources liées, une liaison étant un array [idLiaison, idRessourceLiée]
     * idRessourceLiée peut être un oid ou une string origine/idOrigine
     * @type {relation[]}
     */
    this.relations = values.relations
      .filter(rel => Array.isArray(rel) && rel.length === 2)
      .map(([relId, relTarget]) => [filters.int(relId), filters.string(relTarget)])
      .filter(([relId, relTarget]) => relId && relTarget)
  } else {
    this.relations = []
  }
  /**
   * Liste de uid d'auteurs
   * @type {Integer[]}
   */
  this.auteurs = filterUserList(values.auteurs)
  /**
   * Liste d'url pour les auteurs précédents
   */
  if (values.auteursParents) {
    this.auteursParents = filterUserList(values.auteursParents)
  }
  /**
   * Liste d'id de contributeurs
   * @type {Integer[]}
   */
  this.contributeurs = filterUserList(values.contributeurs)
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
   * @type {string}
   */
  this.archiveOid = filters.string(values.archiveOid)
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
    // this est bien l'objet courant car c'est une fct fléchée
    // mais on assure le coup en le passant en 2e param de forEach
    if (Array.isArray(this[p])) {
      // pour les tableaux on regarde si on a toujours autant d'éléments
      if (Array.isArray(values[p])) {
        if (this[p].length < values[p].length) {
          this._errors.push(`des éléments de la propriété ${p} étaient invalides et ont été ignorés`)
          if (typeof log === 'function' && log.debug) {
            log.debug(`pour ${p} on a initialement`, values[p])
            log.debug('qui donne', this[p])
          } else {
            console.error(`${p} valait`, values[p], 'et est devenu', this[p])
          }
        }
      } else if (values[p]) {
        // on voulait un array mais on nous a filé autre chose
        this._errors.push(`La propriété ${p} n’était pas un tableau, elle a été ignorée`)
        console.error('contenu invalide', values[p])
      }

    // sinon c'est scalaire ou objet
    } else if (!this.hasOwnProperty(p) && p.substr(0, 1) !== '$') {
      this._warnings.push(`La propriété ${p} n’existe pas dans une ressource, elle a été ignorée`)
      if (typeof log !== 'undefined') log.errorData(`propriété ${p} ignorée dans`, values)
      else console.error(`propriété ${p} ignorée`, values[p])
    }
  }, this) // au cas où qqun virerait la fct flèchée…
}

/**
 * Cast en string d'une ressource (son titre)
 * @returns {string}
 */
Ressource.prototype.toString = function () {
  return this.titre
}

module.exports = Ressource
