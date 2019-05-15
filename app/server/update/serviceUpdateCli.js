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
const fs = require('fs')
const path = require('path')

/**
 * Affiche les entités demandées
 * @param {string} updateNum Le numéro de l'update
 * @param {errorCallback} done
 */
function applyUpdate (updateNum, done) {
  // vire notre fichier de lock avant de sortir
  function unlockAndQuit (error) {
    console.log(`FIN update n°${updateNum} ${error ? 'KO' : 'OK'} `)
    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile)
      } catch (error) {
        console.error(error)
      }
    }
    done(error)
  }
  if (arguments.length !== 2) throw new Error('Erreur interne, il faut deux arguments')
  if (typeof done !== 'function') throw new Error('Erreur interne, pas de callback de commande')
  // on est en cli, on override la fct log.error qui écrit dans un log pour le sortir en console à la place
  log.error = function logErrorConsole (msg, obj2dump) {
    console.error(msg)
    if (obj2dump) console.error(obj2dump)
  }
  const updateFile = path.join(__dirname, 'updates', updateNum + '.js')
  const lockFile = path.join(__dirname, '../../../_private/updates.lock')
  if (fs.existsSync(lockFile)) return done(new Error(`${lockFile} présent, on ne peut pas lancer ${updateFile}`))
  // on le crée (en mettant dedans l'update qu'on va appliquer)
  else fs.appendFileSync(lockFile, updateFile)
  try {
    const update = require(updateFile)
    if (!update.run) return unlockAndQuit(new Error(`Le module js ${updateFile} ne contient pas de méthode run`))
    console.log(`lancement de l’update n°${updateNum}`)
    update.run(unlockAndQuit)
  } catch (error) {
    unlockAndQuit(error)
  }
}

applyUpdate.help = function applyUpdateHelp () {
  console.log('La commande applyUpdate demande 1 argument, le n° de l’update à lancer.')
  console.log('Ça laissera intact le n° de version de la base)')
}

/**
 * Liste les updates disponibles
 * @param {errorCallback} done
 */
function listUpdates (done) {
  if (typeof done !== 'function') throw new Error('Erreur interne, pas de callback de commande')
  const updateDir = path.join(__dirname, 'updates')
  if (!fs.existsSync(updateDir)) return done(new Error(`${updateDir} n’existe pas`))
  try {
    fs.readdir(updateDir, function (error, files) {
      if (error) return done(error)
      files.forEach((file) => {
        if (file.substr(-3) !== '.js') return
        const update = require(path.join(updateDir, file))
        if (!update || !update.name || !update.run) console.log(`${file} est dans ${updateDir} mais ce n’est pas un update`, update)
        else console.log(`${file}\t${update.name} ${update.description ? '\n' + update.description + '\n' : ''}`)
      })
      console.log('fin listUpdates')
      done()
    })
  } catch (error) {
    done(error)
  }
}

listUpdates.help = function listUpdatesHelp () {
  console.log('La commande listUpdates ne prend pas d’arguments, elle liste les updates disponibles')
}

/**
 * Service de gestion des updates via cli
 * @service $update-cli
 */
module.exports = function (component) {
  component.service('$update-cli', function () {
    return {
      commands: () => ({
        applyUpdate,
        listUpdates
      })
    }
  })
}
