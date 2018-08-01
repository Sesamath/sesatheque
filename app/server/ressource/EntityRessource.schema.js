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

const {constantes: {restriction}} = require('./config')
const restrictionMax = Object.keys(restriction).length - 1

module.exports = {
  type: 'object',
  properties: {
    oid: {type: 'string'},
    rid: {type: 'string'},
    aliasOf: {type: 'string'},
    cle: {type: 'string'},
    origine: {type: 'string'},
    idOrigine: {type: 'string'},
    titre: {type: 'string'},
    type: {type: 'string'},
    resume: {type: 'string'},
    description: {type: 'string'},
    commentaires: {type: 'string'},
    niveaux: {$ref: '#/definitions/arrayOfStrings'},
    categories: {
      type: 'array',
      items: {type: 'integer'}
    },
    typePedagogiques: {
      type: 'array',
      items: {type: 'integer'}
    },
    typeDocumentaires: {
      type: 'array',
      items: {type: 'integer'}
    },
    parametres: {type: 'object'},
    enfants: {
      type: 'array',
      items: {$ref: '#/definitions/enfant'}
    },
    relations: {
      type: 'array',
      items: {$ref: '#/definitions/relation'}
    },
    auteurs: {$ref: '#/definitions/arrayOfMixId'},
    auteursParents: {$ref: '#/definitions/arrayOfMixId'},
    contributeurs: {$ref: '#/definitions/arrayOfMixId'},
    groupes: {$ref: '#/definitions/arrayOfStrings'},
    groupesAuteurs: {$ref: '#/definitions/arrayOfStrings'},
    langue: {type: 'string'},
    publie: {type: 'boolean'},
    restriction: {type: 'integer', minimum: 0, maximum: restrictionMax},
    dateCreation: {instanceof: 'Date'},
    dateMiseAJour: {instanceof: 'Date'},
    version: {type: 'integer', minimum: 1},
    inc: {type: 'integer', minimum: 0},
    indexable: {type: 'boolean'},
    archiveOid: {type: 'string'}
  },
  additionalProperties: false,
  required: ['titre', 'type'],
  definitions: {
    arrayOfMixId: {
      type: 'array',
      items: {$ref: '#/definitions/mixId'}
    },
    arrayOfStrings: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      }
    },
    enfant: {
      type: 'object',
      properties: {
        titre: {type: 'string'},
        type: {type: 'string'},
        aliasOf: {type: 'string'},
        public: {type: 'boolean'},
        resume: {type: 'string'},
        description: {type: 'string'},
        commentaires: {type: 'string'},
        enfants: {
          type: 'array',
          items: {$ref: '#/definitions/enfant'}
        }
      },
      required: ['titre', 'type']
    },
    mixId: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+/[a-z0-9_-]+$'
    },
    relation: {
      type: 'array',
      items: [
        {type: 'integer'},
        {type: 'string'}
      ]
    }
  }
}
