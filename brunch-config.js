exports.config = {
  // cf
  paths : {
    public : 'app/ressource/public',
    watched : 'app/ressource/client'
  },

  files: {
    javascripts: {
      // cf https://github.com/brunch/brunch/blob/master/docs/config.md#files et https://github.com/es128/anymatch#anymatch-
      joinTo: {
        'page.bundle.js': [
          'app/ressource/client/tools/dom.js',
          'app/ressource/client/tools/log.js',
          'app/ressource/client/page.js'
        ],
        'site.bundle.js': [
          'app/ressource/client/tools/dom.js',
          'app/ressource/client/tools/log.js',
          'app/ressource/client/tools/xhr.js',
          'app/ressource/client/refreshAuth.js'
        ],
        'display.bundle.js': ['app/ressource/client/plugins/*/display.js', 'app/ressource/client/display.js'],
        'edit.bundle.js': ['app/ressource/client/plugins/*/edit.js'],
        'apiClient.js': ['app/ressource/client/api/index.js']
      }
    }
  },

  plugins: {
    babel: {
      // cf http://babeljs.io/docs/usage/options/
      presets: ['es2015'],
      ignore: [/^(bower_components|vendor|node_modules)/],
      //loose: "all"
    }
  }
}
