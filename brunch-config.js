exports.config = {
  // cf
  paths : {
    public : 'app/ressource/public',
    watched : 'app/ressource/src'
  },

  files: {
    javascripts: {
      // cf https://github.com/brunch/brunch/blob/master/docs/config.md#files et https://github.com/es128/anymatch#anymatch-
      joinTo: {
        'init.bundle.js': ['app/ressource/src/plugins/*/edit.js'],
        'display.bundle.js': ['app/ressource/src/plugins/*/display.js'],
        'edit.bundle.js': ['app/ressource/src/plugins/*/edit.js']
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
