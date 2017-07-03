#!/usr/bin/node
/**
 * @licence CC-by-sa
 * @author Daniel Caillibaud <daniel.caillibaud@sesamath.net>
 * @description Attempt to having a `npm install` link compliant
 *   In short, this script look at package.local-extras.json, override package.json with its content,
 *   then make an npm install without dependencies starting with file: and after link them
 *   So it can lead to duplicate modules (in node_module and a linked dependency) !
 * @see https://github.com/npm/npm/issues/10343
 */
'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')

// paths
const root = fs.realpathSync(path.join(__dirname, '/..'))
const modulesDir = root + '/node_modules'
const packageJsonPath = root + '/package.json'
const tmpPackageJsonPath = root + '/package.real.json'

// here is our local file with file:local/path dependencies
let extraPackageJsonPath = root + '/package.local-extras.json'
const linkPrefix = 'file:'
// loggers
const log = data => console.log(data && data.toString ? data.toString() : data)
const logError = data => console.error(data)
// lstat as promise
const pstat = util.promisify(fs.lstat)

/**
 * Pour récupérer les modules déjà liés
 * @return {Promise} qui résoud avec un array de Stats (les symlinks)
 */
async function fetchLinkedModules () {
  const files = fs.readdirSync(modulesDir)
  const statPromises = files.map(file => pstat(modulesDir + '/' + file))
  return await Promise.all(statPromises).then(stats => stats.map((stat, i) => stat.isSymbolicLink() && files[i]).filter(path => path))
}

/**
 * Log error message and exit
 * @param message
 * @param exitCode
 */
function abort (message, exitCode = 1) {
  logError(message)
  process.exit(exitCode)
}

/**
 * init params (and run generateExtra or continue)
 * @return {Promise}
 */
async function init () {
  // other local-extras path
  const pos = process.argv.indexOf('-e')
  if (pos > 0) {
    if (process.argv.length > pos + 1) extraPackageJsonPath = process.argv[pos + 1]
    else abort('-e option need path (of extra-local overrides file) as next argument')
  }
  if (process.argv.indexOf('-g') > 0) return generateExtra()
  // nothing to do if no extras
  if (!fs.existsSync(extraPackageJsonPath)) abort(`${extraPackageJsonPath} doesn’t exists, aborting (you can launch normal "npm i" or générate one with -g`)
}

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

/**
 * Override of dst[prop] with src[prop] with recursion
 * @param prop
 * @param src
 * @param dst
 */
function replaceProp (prop, src, dst) {
  const srcValues = src[prop]
  // if plain object (thanks to lodash)
  if (!!srcValues && typeof srcValues === 'object' && Object.prototype.toString.call(srcValues) === '[object Object]') {
    if (!dst[prop]) dst[prop] = {}
    Object.keys(src[prop]).forEach(subProp => replaceProp(subProp, src[prop], dst[prop]))
  } else {
    // scalar or array or whatever
    if (typeof src[prop] === 'string' && src[prop].indexOf(linkPrefix) === 0) {
      log(`${prop} module will be hidden to npm and linked to ${src[prop]} after npm install`)
      delete dst[prop]
    } else {
      dst[prop] = src[prop]
    }
  }
}

/**
 * sync rm -rf (will probably fail on windows)
 * @param path
 */
function removeDir (path) {
  fs.readdirSync(path).forEach(file => {
    const stat = fs.statSync(file)
    if (stat.isDirectory()) removeDir(file)
    else fs.unlinkSync(file)
  })
}

/**
 * Add symlinks for modules with file: (async, with internal callback handling errors)
 * @param {object} packageJson
 */
function addLinks (packageJson) {
  function link (src, linkPath) {
    fs.symlink(src, linkPath, error => {
      if (error) logError(error)
      log(`${linkPath} => ${src} ${error ? 'KO' : 'ok'}`)
    })
  }

  log(`linking module as ${extraPackageJsonPath} says`)
  Object.keys(packageJson.dependencies).forEach(module => {
    const prefix = 'file:'
    const value = packageJson.dependencies[module]
    if (value.indexOf(prefix) === 0) {
      const modulePath = `${root}/node_modules/${module}`
      const valuePath = value.substring(linkPrefix.length)
      // relative to node_modules or absolute ?
      const moduleSrc = valuePath.substring(0, 2) === '..' ? '../' + valuePath : valuePath
      if (fs.existsSync(modulePath)) {
        // isSymbolicLink need async
        fs.lstat(modulePath, (error, stats) => {
          if (error) return logError(error)
          if (stats.isSymbolicLink()) return
          if (stats.isDirectory()) {
            removeDir(modulePath)
            link(moduleSrc, modulePath)
          } else {
            logError(`${modulePath} isn't symlink or directory`)
          }
        })
      } else {
        link(moduleSrc, modulePath)
      }
    }
  })
}

/**
 * Generate package.local-extras.json (or add existing links in it)
 */
async function generateExtra () {
  if (process.version.split('.')[0] < 8) abort(`generating or upgrading ${extraPackageJsonPath} need node >= 8.x`)
  let overrides
  if (fs.existsSync(extraPackageJsonPath)) {
    overrides = require(extraPackageJsonPath)
    if (!overrides.dependencies) overrides.dependencies = {}
  }
  // watching for existing links
  const symlinks = await fetchLinkedModules() // without modulesDir
  symlinks.forEach(symlink => {
    const absoluteTarget = fs.realpathSync(modulesDir + '/' + symlink)
    const relativeTarget = path.relative(root, absoluteTarget)
    const target = relativeTarget.indexOf('../../') === -1 ? relativeTarget : absoluteTarget
    overrides.dependencies[symlink] = `file:${target}`
  })
  const content = JSON.stringify(overrides, null, 2)
  fs.writeFileSync(extraPackageJsonPath, content + '\n')
  log(`symlinks added in ${extraPackageJsonPath} :`)
  log(content)
  process.exit()
}

function beforeExit (error) {
  logError(error)
  cleanFiles()
}

function main () {
  // ensure clean start
  if (cleanFiles()) logError(`${tmpPackageJsonPath} exists at starting, cleaned`)

  // reading contents
  const packageJson = require(packageJsonPath)
  const overrides = require(extraPackageJsonPath)
  // backup original
  fs.renameSync(packageJsonPath, tmpPackageJsonPath)
  // replacement
  Object.keys(overrides).forEach(prop => replaceProp(prop, overrides, packageJson))
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

  // npm install
  log('\nlaunching npm install')
  const {spawn} = require('child_process')
  const npm = spawn('npm', ['install'], {stdio: ['inherit', 'inherit', 'inherit']})
  npm.on('error', abort)
  npm.on('close', exitCode => {
    if (exitCode !== 0) abort('npm install KO (errors above)', exitCode)
    log('\nnpm install ok, cleaning temporary package.json and adding links if needed')
    cleanFiles()
    addLinks(overrides)
  })
}

init().then(main, beforeExit)
