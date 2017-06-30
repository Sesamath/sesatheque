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
// paths
const root = fs.realpathSync(path.join(__dirname, '/..'))
const packageJsonPath = root + '/package.json'
const tmpPackageJsonPath = root + '/package.real.json'
// here is our local file with file:local/path dependencies
const extraPackageJsonPath = root + '/package.local-extras.json'
const linkPrefix = 'file:'
// loggers
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

try {
  // nothing to do if no extras
  if (!fs.existsSync(extraPackageJsonPath)) process.exit()

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
  npm.on('error', error => {
    logError(error)
    process.exit(1)
  })
  npm.on('close', exitCode => {
    if (exitCode !== 0) {
      logError('npm install KO (errors above)')
      process.exit(exitCode)
    }
    log('\nnpm install ok, cleaning temporary package.json and adding links if needed')
    cleanFiles()
    addLinks(overrides)
  })
} catch (error) {
  console.error(error)
  cleanFiles()
}

