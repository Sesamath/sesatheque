// ajoute un contexte de navigateur au scope global
const {JSDOM} = require('jsdom')
const jsdom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>')
const {window} = jsdom

// recopie les props de src sur target (si ça existait pas)
function copyProps (src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === 'undefined')
    .map(prop => Object.getOwnPropertyDescriptor(src, prop))
  Object.defineProperties(target, props)
}

global.document = window.document
global.HTMLElement = window.HTMLElement
copyProps(window, global)

global.navigator = {
  appName: 'other',
  userAgent: 'node.js',
  platform: 'node.js'
}

module.exports = window
