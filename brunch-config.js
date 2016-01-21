var src = 'app/ressource/srcClient'
var srcs = src +'/'
var constructors = 'app/ressource/constructors/'
//var checkCode = 'if (typeof require === "undefined") throw new Error("Il faut charger page.bundle.js avant ce fichier");'
// ces fichiers sont pas ajoutés car dans le dossier vendor de bower, on les ajoutera en after-brunch, ou on vire conventions.ignored
var head = 'app/static/public/vendor/headjs/dist/1.0.0/head.load.min.js'
// pour ceux qui nous utiliseraient en pensant avoir un vieux head.js (j3p par ex)
var headPreserveCode = 'head.js = function () {console.log("appel de head.js");head.load.apply(head, Array.prototype.slice.call(arguments, 0))}'
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
        'display.bundle.js': [srcs+'tools/*', srcs+'page/*', srcs+'display/*', srcs+'plugins/*/display*', constructors+'Resultat'],
        // les modules d'édition
        'edit.bundle.js': [srcs+'tools/*', srcs+'page/*', srcs+'display/*', srcs+'plugins/*/display*', srcs+'edit/*', srcs+'plugins/*/edit*', srcs+'editors/**'],
        // un module à utiliser à distance pour l'api
        'apiClient.bundle.js' : [srcs+'tools/xhr.js', srcs+'tools/log.js', srcs+"apiClient.js"],
        // et son copain qui fait tout (api + display), avec head et swfobject mais sans jQuery qui devra donc être chargé séparément
        // (faudrait dedans revoir le code pour l'avoir en module)
        'remote.bundle.js' : [srcs+'tools/*', srcs+'page/*', srcs+"apiClient.js", srcs+'display/*', srcs+'plugins/*/display*']
      }
    }
  },

  // Cf https://github.com/brunch/brunch-guide/blob/master/content/fr/chapter11-plugins.md
  plugins: {
    afterBrunch : [
        // on vire le code de brunch qui ajoute require et on met notre check à la place
        //"sed -i -e '1,/^})();/ d' app/ressource/public/display.bundle.js",
        //"sed -i -e '1 i "+checkCode +"' app/ressource/public/display.bundle.js",
        //"sed -i -e '1,/^})();/ d' app/ressource/public/edit.bundle.js",
        //"sed -i -e '1 i "+checkCode +"' app/ressource/public/edit.bundle.js",
        // on ajoute nos vendors inclus en global dans les fichiers voulus
        "cat " +head +">> app/ressource/public/page.bundle.js",
        "echo '" +headPreserveCode +"' >> app/ressource/public/page.bundle.js",
        "cat " +head +" " +jQuery +" " +swfobject +">> app/ressource/public/display.bundle.js",
        "cat " +head +" " +jQuery +" " +swfobject +">> app/ressource/public/edit.bundle.js",
        "cat " +head +" " +swfobject +">> app/ressource/public/remote.bundle.js",
        "echo '" +headPreserveCode +"' >> app/ressource/public/remote.bundle.js"
        /* */
    ],
    babel: {
      // cf http://babeljs.io/docs/usage/options/
      presets: ['es2015'],
      ignore: [/\/(bower_components|vendor|node_modules)\//],
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