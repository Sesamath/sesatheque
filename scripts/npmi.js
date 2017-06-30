/**
 * This file is part of SesaXXX.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaXXX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaXXX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SesaReactComponent (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de SesaReactComponent, créée par l'association Sésamath.
 *
 * SesaXXX est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaXXX est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

const fs = require('fs')
// paths
const packageJsonPath = '../package.json'
const tmpPackageJsonPath = '../package.real.json'
const extraPackageJsonPath = '../package.local-extras.json'

const log = data => console.log(data && data.toString ? data.toString() : data)
const logError = data => console.error(data && data.toString ? data.toString() : data)

/**
 * Ensure having "normal" package.json in its place
 * @return {boolean} true if name changes are made
 */
function cleanFiles () {
  if (fs.existsSync(tmpPackageJsonPath)) {
    if (fs.existsSync(packageJsonPath)) fs.unlinkSync(packageJsonPath)
    fs.renameSync(tmpPackageJsonPath, packageJsonPath)
    return true
  }
  return false
}

let exitCode = 0

try {
  const todo = process.argv.length === 3 && process.argv[2]
  if (todo !== 'pre' && todo !== 'post') {
    logError(`${__filename} doit être appelé avec l'argument pre ou post, à priori seulement via les scripts npm preinstall et postinstall`)
    process.exit()
  }
  // nothing to do if no extras
  if (!fs.existsSync(extraPackageJsonPath)) process.exit()

  // quite simple in postinstall
  if (todo === 'post') {
    cleanFiles()
    process.exit()
  }

  // ça marche pas via preinstall ou postinstall car npm ne relit pas le package.json après le hook preinstall

  // ensure clean start
  if (cleanFiles()) {
    console.error(`${tmpPackageJsonPath} exists at starting, cleaned`)
  }
  // reading contents
  const packageJson = require(packageJsonPath)
  const overrides = require(extraPackageJsonPath)

  fs.renameSync(packageJsonPath, tmpPackageJsonPath)
  // local package.json
  Object.keys(overrides.dependencies).forEach(module => {
    packageJson.dependencies[module] = overrides.dependencies[module]
  })
  fs.writeFileSync(packageJsonPath, packageJson)
  // npm install
  /*
  const {spawn} = require('child_process')
  const npm = spawn('npm', ['install'])
  npm.on('error', logError)
  npm.stdout.on('data', log)
  npm.stderr.on('data', logError)
  npm.on('close', npmExitCode => {
    if (npmExitCode === 0) log('OK, npm install ended')
    else logError('npm install KO (errors above)')
    cleanFiles()
    exitCode = npmExitCode
  })
  */
} catch (error) {
  console.error(error)
  cleanFiles()
}
