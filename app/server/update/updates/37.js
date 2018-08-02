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

const flow = require('an-flow')
const {uniq} = require('lodash')

const {application: {baseId}} = require('../../config')

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updateLog = require('an-log')('update' + updateNum)

module.exports = {
  name: 'pour ressource & archive, rectifie les cibles de relation en oid (et pas rid), paramètres array et pas object, doublons dans les typeDocumentaires et typePedagogiques',
  description: '',
  run: function run (next) {
    const EntityRessource = lassi.service('EntityRessource')
    const EntityArchive = lassi.service('EntityArchive')
    // const $ressourceRepository = lassi.service('$ressourceRepository')
    // on utilise le cli de lassi pour validAll
    const $entitiesCli = require('lassi/source/services/entities-cli')
    const {validAll} = $entitiesCli().commands()

    let nbAno = 0

    flow([EntityArchive, EntityRessource]).seqEach(function (EntityDef) {
      // le nom pour les message
      const name = EntityDef.name.substr('Entity'.length).toLowerCase()

      // la cb de nettoyage de chaque entity
      const onEach = (entity, next) => {
        const {oid} = entity
        let hasChanged = false
        // ajout baseId sur les target des relations s'il manque
        if (entity.relations) {
          entity.relations = entity.relations
            .filter((relation, index) => {
              if (!Array.isArray(relation) || relation.length !== 2 || !Number.isInteger(relation[0]) || !/^[a-zA-Z0-9_-]+\/[a-z0-9_-]+$/.test(relation[1])) {
                console.error(`${name} ${oid} a une relation #${index} invalide`, relation)
                hasChanged = true
                return false
              }
              return true
            })
            .map((relation) => {
              if (!relation[1].includes('/')) {
                const [predicat, target] = relation
                hasChanged = true
                return [predicat, `${baseId}/${target}`]
              }
              return relation
            })
        }

        // check des parametres
        if (typeof entity.parametres !== 'object' || Array.isArray(entity.parametres)) {
          hasChanged = true
          let type = typeof entity.parametres
          if (type === 'object') type = 'Array' // plus lisible
          updateLog.error(`${name} ${oid} avait une propriété parametres de type ${type}`)
          entity.parametres = {}
        }

        // on vire enfants si ça existe sur autre chose que des arbres
        if (entity.type !== 'arbre' && entity.enfants) {
          updateLog.error(`${name} ${oid} avait une propriété enfants alors que c'est un type ${entity.type}`)
          hasChanged = true
          delete entity.enfants
        }

        // on dédoublonne typeDocumentaires et typePedagogiques
        const td = uniq(entity.typeDocumentaires)
        const tp = uniq(entity.typePedagogiques)
        if (td.length < entity.typeDocumentaires.length) {
          hasChanged = true
          entity.typeDocumentaires = td
        }
        if (tp.length < entity.typePedagogiques.length) {
          hasChanged = true
          entity.typePedagogiques = tp
        }

        if (hasChanged) nbAno++

        // on refait un store pour tout le monde, sur toutes les archives pour mettre l'oid déduit au passage
        // (et supprimer tous les doublons que ça crée au fur et à mesure)
        // et sur les ressources pour supprimer les index string de la racine (ils sont dans _data)
        //
        // ici on ne peut pas utiliser $ressourceRepository.save car il va incrémenter la version et l'archivage de
        // l'ancienne entity foireuse (il va la chercher en bdd) ne passera pas la validation de l'archive
        // tant pis pour le cache (et l'archivage mais ça c'est plutôt mieux de pas archiver du foireux)
        entity.store(next)
      }

      updateLog(`Nettoyage des entity ${name}`)
      EntityDef.match().forEachEntity(onEach, this, {progressBar: true})
    }).seq(function () {
      if (nbAno) updateLog(`${nbAno} ressource(s) et archives rectifiées`)
      else updateLog('Aucune ressource ou archive avec un problème de relation ou de parametre')

      this(null, ['EntityExternalRef', 'LassiUpdate', 'EntityPersonne', 'EntityGroupe', 'EntityUpdate'])
    }).seqEach(function (entityName) {
      updateLog(`Lancement de la vérification d’intégrité des ${entityName}`)
      validAll(entityName, this)
    }).seq(function (listOfoidsWithErrors) {
      const nb = listOfoidsWithErrors.reduce((acc, oidsWithErrors) => acc + oidsWithErrors.length, 0)
      if (nb) next(Error(`Il y a ${nb} entities invalides (cumulés parmi les ${listOfoidsWithErrors.length} types d’entités)`))
      else next()
    }).catch(error => {
      console.error(`pb dans l’update ${updateNum}`, error.ajv ? error.message : error)
      next(error)
    })
  } // run
}
