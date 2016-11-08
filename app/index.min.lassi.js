'use strict'
/**
 * Un fichier de démarrage minimal pour tester lassi
 */
try {
  var config = require('./config')
  require('lassi')(__dirname)
  GLOBAL.app = {settings: config}
  var app = lassi.component('app', [])
  app.config(function ($cache, $settings) {
    var memcache = $settings.get('memcache', null)
    if (memcache) $cache.addEngine('', 'memcache', memcache)
    console.log('config app')
  })
  app.controller(function () {
    console.log('ajout controller')
    this.get('/', function (context) {
      context.plain({page: 'home'})
    })
  })
  // et on lance le boot
  app.bootstrap()
} catch (error) {
  console.error(error)
}
