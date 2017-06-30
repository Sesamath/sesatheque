/**
 * @licence CC-by-sa
 * @author Daniel Caillibaud <daniel.caillibaud@sesamath.net>
 * @description Attempt to having a `npm install` link compliant, but still doesn't work with npm5
 * @see https://github.com/npm/npm/issues/10343
 */
'use strict'

const fs = require('fs')
// paths
const root = fs.realpathSync(__dirname + '/..')
const packageJsonPath = root + '/package.json'
const tmpPackageJsonPath = root + '/package.real.json'
// here is our local file with file:local/path dependencies
const extraPackageJsonPath = root + '/package.local-extras.json'
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

function replaceProp (prop, src, dst) {
  const srcValues = src[prop]
  // if plain object (thanks to lodash)
  if (!!srcValues && typeof srcValues === 'object' && Object.prototype.toString.call(srcValues) === '[object Object]') {
    if (!dst[prop]) dst[prop] = {}
    Object.keys(src[prop]).forEach(subProp => replaceProp(subProp, src[prop], dst[prop]))
  } else {
    // scalar or array or whatever
    dst[prop] = src[prop]
  }
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
  process.exit(0)

  // npm install
  const {spawn} = require('child_process')
  const npm = spawn('npm', ['install'])
  npm.on('error', logError)
  // @todo dynamic output of npm isn't rendered (I guess it delete output before buffer is sent with event)
  npm.stdout.on('data', log)
  npm.stderr.on('data', logError)
  npm.on('close', exitCode => {
    if (exitCode === 0) log('OK, npm install ended')
    else logError('npm install KO (errors above)')
    cleanFiles()
    process.exit(exitCode)
  })
} catch (error) {
  console.error(error)
  cleanFiles()
}

