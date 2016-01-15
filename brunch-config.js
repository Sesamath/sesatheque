var src = 'app/ressource/srcClient'
var srcs = src +'/'
var checkCode = 'if (typeof require === "undefined") throw new Error("Il faut charger page.bundle.js avant ce fichier");'
// ces fichiers sont pas ajoutés car dans le dossier vendor de bower, on les ajoutera en after-brunch, ou on vire conventions.ignored
var head = 'app/static/public/vendor/headjs/head.load.1.0.js'
var jQuery = 'app/static/public/vendor/jquery/dist/jquery.min.js'
var swfobject = 'app/static/public/vendor/swfobject/swfobject.2.3.js'

var config = {
  // cf
  paths : {
    public : 'app/ressource/public',
    watched : src
  },

  files: {
    javascripts: {
      // cf https://github.com/brunch/brunch/blob/master/docs/config.md#files et https://github.com/es128/anymatch#anymatch-
      joinTo: {
        // la base avec headjs (doit être chargé par tous)
        'page.bundle.js': [srcs+'tools/*', srcs+'page/*'],
        // les modules d'affichage, avec jQuery mais pas jQueryUi (qui sera chargé en async pour l'édition d'arbre)
        'display.bundle.js': [srcs+'display/*', srcs+'plugins/*/display*'],
        // les modules d'édition
        'edit.bundle.js': [srcs+'edit/*', srcs+'plugins/*/edit*', srcs+'editors/**'],
        'apiClient.bundle.js' : [srcs+'tools/xhr.js', srcs+"apiClient.js"]
      }
    }
  },

  // Cf https://github.com/brunch/brunch-guide/blob/master/content/fr/chapter11-plugins.md
  plugins: {
    afterBrunch : [
        // on vire le code de brunch qui ajoute require et on met notre check à la place
        //"sed -i -e '1,/^})();/ d' app/ressource/public/display.bundle.js",
        "sed -i -e '1 i "+checkCode +"' app/ressource/public/display.bundle.js",
        //"sed -i -e '1,/^})();/ d' app/ressource/public/edit.bundle.js",
        "sed -i -e '1 i "+checkCode +"' app/ressource/public/edit.bundle.js",
        // on ajoute nos vendors inclus en global dans les fichiers voulus
        "cat " +head +">> app/ressource/public/page.bundle.js",
        "cat " +jQuery +" " +swfobject +">> app/ressource/public/display.bundle.js"
        /* */
    ],
    babel: {
      // cf http://babeljs.io/docs/usage/options/
      presets: ['es2015'],
      ignore: [/^(bower_components|vendor|node_modules)/],
      //loose: "all"
    }
  },
  // merci https://github.com/brunch/brunch-guide/blob/master/content/fr/chapter07-using-brunch-on-legacy-code.md
  modules : {
    nameCleaner : function (path) {
      "use strict";
      return path.replace(srcs, '').replace('constructors/', '')
    }
  },
  /* marche pas, jquery et swfobject sont pas ajoutés… * /
  conventions : {
    // on prend tout, les dossiers vendor sont pas dans watched
    ignored : [/[\\/]_/],
    vendor : /^node_modules[\\/]/ // default /(^bower_components|node_modules|vendor)[\\/]/
  },
  /* */

  // en prod on ajoute uglify
  overrides : {
    production : {
      plugins : {
        uglify : {
          compress : true,
          mangle:true,
          sourceMaps : true
        }
      }
    }
  }
}

// on ajoute uglify en prod seulement


exports.config = config