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

var flow = require('an-flow')
const applog = require('an-log')(lassi.settings.application.name)
var replace = require('sesajstools/utils/object').replace
var Ref = require('../../constructors/Ref')
var config = require('../../config')

var name = 'normalisation des arbres'
var description = 'remplacement origine/idOrigine par oid et commentaires à la place de description'

var limit = 10

var EntityRessource = lassi.service('EntityRessource')
var $ressourceRepository = lassi.service('$ressourceRepository')

/**
 * Normalise un arbre et l'enregistre
 * @param arbre
 * @param next
 */
function cleanArbre (arbre, next) {
  function saveAndNext () {
    $ressourceRepository.save(arbre, next)
  }
  applog('update 4', 'traitement arbre ' + arbre.oid)
  // traitement de la base
  cleanBase(arbre)
  // fin base, on passe aux enfants
  if (arbre.enfants && arbre.enfants.length) {
    // on a déjà rencontré des enfants undefined…
    arbre.enfants = arbre.enfants.filter((enfant) => !!enfant)
    if (arbre.enfants.length) {
      flow(arbre.enfants).seqEach(function (enfant) {
        cleanEnfant(enfant, arbre.oid, this)
      }).seq(function () {
        saveAndNext()
      }).catch(next)
    } else {
      log.dataError('arbre ' + arbre.oid + ' avait des enfants mais tous undefined')
      saveAndNext()
    }
  } else {
    log.dataError('arbre ' + arbre.oid + ' sans enfants')
    saveAndNext()
  }
}

/**
 * Normalise un item d'arbre (un enfant) en récursif
 * @param enfant
 * @param arbreOid
 * @param nextEnfant
 */
function cleanEnfant (enfant, arbreOid, nextEnfant) {
  function ptitsEnfants () {
    if (enfant.enfants && enfant.enfants.length) enfant.enfants = enfant.enfants.filter((enfant) => !!enfant)
    if (enfant.enfants && enfant.enfants.length) {
      flow(enfant.enfants).seqEach(function (enfant2) {
        cleanEnfant(enfant2, arbreOid, this)
      }).done(nextEnfant)
    } else {
      log.dataError('enfants tous undefined dans l’arbre ' + arbreOid, enfant)
      nextEnfant()
    }
  }

  function set404AndNext () {
    log.dataError('enfant ' + enfant.ref + ' de l’arbre ' + arbreOid + ' introuvable', enfant)
    enfant = {
      titre: 'Erreur, ressource "' + enfant.titre + ' introuvable, ref ' + enfant.ref,
      type: 'error',
      ref: enfant.ref
    }
  }

  // go
  cleanBase(enfant)
  // on nettoie le reste en mettant de coté enfants
  var enfants = enfant.enfants
  replace(enfant, new Ref(enfant))
  enfant.enfants = enfants
  if (enfant.ref) {
    $ressourceRepository.load(enfant.ref, function (error, ressource) {
      if (error) return nextEnfant(error)
      if (ressource) {
        // on peut pas faire simplement enfant = new Ref(ressource), sinon on perd la ref à l'objet initial
        replace(enfant, new Ref(ressource))
      } else {
        // on essaie de retrouver cette ressource, si c'est du labomepBIBS/xxx on a une petite idée…
        var prefix = 'labomepBIBS/'
        if (typeof enfant.ref === 'string' && enfant.ref.indexOf(prefix) === 0) {
          var idOrigine = Number(enfant.ref.substr(prefix.length))
          var newRef
          if (idOrigine > 1000000 && idOrigine < 4000000) {
            // ils ont probablement été remplacé par la vraie ressource d'origine
            if (idOrigine < 2000000) {
              newRef = 'ato/' + (idOrigine - 1000000)
            } else if (idOrigine < 3000000) {
              newRef = 'coll_doc/' + (idOrigine - 2000000)
            } else {
              newRef = 'accomp/' + (idOrigine - 3000000)
            }
            $ressourceRepository.load(newRef, function (error, ressource) {
              if (error) return nextEnfant(error)
              if (ressource) {
                replace(enfant, new Ref(ressource))
                nextEnfant()
              } else {
                log.debug('on a cherché ' + newRef + ' à partir de ' + enfant.ref + ' sans succès ' + arbreOid)
                set404AndNext()
              }
            })
          } else {
            set404AndNext()
          }
        } else {
          set404AndNext()
        }
      }
      // s'il a une ref il ne doit pas avoir d'enfants
      if (enfant.type === 'arbre' && enfant.enfants) {
        if (enfant.enfants.length) log.dataError(enfant.titre + ', ref ' + enfant.ref + ' de l’arbre ' + arbreOid + ' avait ' + enfant.enfants.length + ' enfant(s)')
        delete enfant.enfants
      }
      nextEnfant()
    })
  } else if (enfant.enfants && enfant.enfants.length) {
    ptitsEnfants()
  } else {
    nextEnfant()
  }
} // cleanEnfant

/**
 * Vire base si y'a pour remplacer par baseId (si on la connait)
 * @param arbre sera modifié
 */
function cleanBase (arbre) {
  if (arbre.base) {
    if (arbre.base.substr(-1) !== '/') arbre.base += '/'
    if (arbre.baseId && config.sesatheques && config.sesatheques[arbre.baseId] === arbre.base) {
      delete arbre.base
    } else if (arbre.baseId) {
      log.dataError('arbre ' + arbre.oid + ' avec baseId inconnue ' + arbre.baseId + ' et base ' + arbre.base)
    } else {
      if (arbre.base === config.application.baseUrl) {
        delete arbre.base
      } else {
        for (var p in config.sesatheques) {
          if (config.sesatheques.hasOwnProperty('p') && config.sesatheques[p] === arbre.base) {
            arbre.baseId = p
            delete arbre.base
          }
        }
        if (arbre.base) log.dataError('arbre ' + arbre.oid + ' avec base inconnue ' + arbre.base)
      }
    }
  } else if (arbre.hasOwnProperty('base')) {
    // on vire la propriété si null ou undefined
    delete arbre.base
  }
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    // récupère limit arbres et les traite
    function grab () {
      applog('update 4', 'traitement des arbres de ' + offset + ' à ' + (offset + limit))
      EntityRessource.match('type').equals('arbre').sort('oid').grab(limit, offset, function (error, arbres) {
        if (error) return next(error)
        flow(arbres).seqEach(function (arbre) {
          cleanArbre(arbre, this)
        }).seq(function () {
          if (arbres.length === limit) {
            offset += limit
            grab()
          } else {
            this()
          }
        }).done(next)
      })
    }
    // init
    var offset = 0
    // go
    grab()
  } // run
}
