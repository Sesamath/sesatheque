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

import icons from 'plugins/icons'
import getUrls from 'sesatheque-client/src/getUrls'
import arbreNodeRef from '../images/arbreRef.gif'
// import log from 'sesajstools/utils/log'

/**
 * Retourne les datas qui nous intéressent à mettre sur le tag a
 * (propriété a_attr du node
 * @private
 * @param {Ressource|Ref} ressource
 * @return {{alt: string, data-aliasof: string, data-type: string, data-dataurl: string, href: string}}
 */
function getAttrs (ressource) {
  // est-ce bien une ressource (un dossier d'arbre sans aliasOf ni rid est possible)
  const originalRid = ressource.aliasOf || ressource.rid
  if (originalRid) {
    const props = getUrls(ressource)
    const attrs = {
      alt: ressource.resume || '',
      'data-type': ressource.type,
      'data-aliasof': originalRid,
      'data-dataurl': props.dataUrl,
      href: props.displayUrl
    }
    if (ressource.resume) attrs['data-resume'] = ressource.resume
    if (ressource.description) attrs['data-description'] = ressource.description
    if (ressource.commentaires) attrs['data-commentaires'] = ressource.commentaires
    if (ressource.categories) attrs['data-categories'] = JSON.stringify(ressource.categories)
    // public
    if (ressource.hasOwnProperty('public')) {
      attrs['data-public'] = ressource.public ? '1' : '0'
    } else if (ressource.hasOwnProperty('restriction')) {
      if (ressource.hasOwnProperty('publie') && !ressource.publie) attrs['data-public'] = '0'
      else attrs['data-public'] = ressource.restriction ? '0' : '1'
    }
    // cle
    if (attrs['data-public'] === '0' && ressource.cle) attrs['data-cle'] = ressource.cle
    return attrs
  } else if (ressource.type === 'arbre') {
    // c'est un dossier sans rid ni aliasOf
    return {
      alt: '',
      'data-type': 'arbre',
      'data-public': '1'
    }
  }

  return {
    alt: 'Élément invalide',
    'data-type': 'error'
  }
}

/**
 * Retourne un node jstree (propriétés text, icon et a_attr qui porte nos data)
 * SANS les enfants (utiliser toJstree pour les avoir)
 * @see http://www.jstree.com/docs/json/ pour le format
 * @private
 * @param {Ressource|Ref} ressource
 */
function getJstNode (ressource) {
  if (!ressource) throw new Error('getJstNode appelé sans ressource')
  return {
    text: ressource.titre,
    a_attr: getAttrs(ressource),
    icon: icons[ressource.type]
  }
}

/**
 * Retourne un tableau children au format jstree
 * @param {Ressource} ressource
 * @return {Array} Le tableau des enfants
 */
export function getJstreeChildren (ressource) {
  if (!ressource) throw new Error('Ressource invalide')
  if (ressource.type !== 'arbre') throw new Error('la ressource n’est pas un arbre')
  if (ressource.enfants && ressource.enfants.length) {
    return ressource.enfants.map(enfant => {
      // on veut pas qu'un enfant foireux plante tout l'arbre
      try {
        return (enfant.type === 'arbre') ? toJstree(enfant) : getJstNode(enfant)
      } catch (error) {
        console.error(error)
        return {
          alt: (enfant && enfant.titre) || 'enfant invalide',
          text: error.toString(),
          a_attr: {
            'data-type': 'error'
          },
          icon: 'errorJstNode'
        }
      }
    })
  } else if (ressource.aliasOf) {
    // il faudra un appel ajax pour aller chercher les enfants
    return true
  } else {
    // une liste d'enfants vide
    return []
  }
}

/**
 * Transforme un ressource de la bibli en node pour jstree
 * (il faudra le mettre dans un tableau, à un seul élément si c'est un arbre)
 * @param {Ressource|Ref} ressource Une ressource ou une référence à une ressource
 * @returns {Object}
 */
export function toJstree (ressource) {
  const node = getJstNode(ressource)
  if (ressource.type === 'arbre') {
    node.children = getJstreeChildren(ressource)
    // c'est une ref dont on a pas encore les enfants, on met l'icone ref
    if (node.children === true && ressource.aliasOf) node.icon = arbreNodeRef
  }

  return node
}
