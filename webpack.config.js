/*
cf https://github.com/petehunt/webpack-howto

Pour le chargement dynamique et les contextes
  https://github.com/webpack/webpack/issues/118

Pour le découpage des chunks
  https://webpack.js.org/guides/code-splitting

  https://webpack.js.org/plugins/split-chunks-plugin/

  Le découpage automatique des entries se fait avec:
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
  La difficulté est qu'il faut ensuite charger dans les fichiers html tous les morceaux (à moins d'utiliser HtmlWebpackPlugin qui a été retiré du projet sesatheque).

  Pour l'instant, on ne découpe pas. Le chargement des pages sesatheque dans labomep utilisant convenablement le cache du navigateur.

Pour charger des librairies tierces, on utilise page.loadAsync
sinon faudrait passer par https://webpack.github.io/docs/shimming-modules.html
*/
// const fs = require('fs')
const path = require('path')
const autoprefixer = require('autoprefixer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const preRun = require('./webpack.preRun')

// On récupère babelConfig pour forcer l'utilisation de notre conf babel dans certains node_modules
// (seatheque-client, sesaeditgraphe et plugins d'édition)
const babelConfig = require('./package').babel

const appConfig = require('./app/server/config')
const {entries, plugins, rules} = require('./app/plugins/webpack.config')
// webstorm exécute ce fichier mais n'a pas de process.argv
const args = process.argv || []
// passer --debug pour ne pas avoir de minification
const isDebug = args.includes('--debug')
// prod d'après l'environnement ou la conf (sauf --debug ou test)
const isProd = !isDebug && (process.NODE_ENV === 'production' || /prod/.test(appConfig.application.staging))
console.log('wepback production env', isProd ? 'yes' : 'no')
const isDevServer = args[1] && args[1].includes('dev-server')
console.log('wepback-dev-server', isDevServer ? 'yes' : 'no')

let baseUrl = appConfig.application.baseUrl
if (baseUrl.substr(-1) !== '/') baseUrl += '/'

let buildDir = path.resolve(__dirname, 'build')
// pour pouvoir compiler les js de plusieurs baseId dans des dossiers différents
// (qui se retrouveront docroot si on passe le même env SESATHEQUE_CONF au lancement de l'appli)
if (process.env.SESATHEQUE_CONF) {
  console.log(`Compilation avec urls absolues pour ${process.env.SESATHEQUE_CONF}`)
  // faut compiler dans un dossier spécifique (le serve des assets ira là-dedans
  // si on lui passe le même environnement)
  buildDir += '.' + process.env.SESATHEQUE_CONF
}

// on lance preRun qui va vider build et y copier ces deux fichiers (avec substitution qui va bien et minification éventuelle)
preRun({
  baseUrl,
  buildDir,
  isProd,
  files: {
    display: './app/client/display/index.preLoad.js',
    react: './app/client-react/index.preLoad.js'
  }
})

const babelLoader = {
  loader: 'babel-loader',
  options: babelConfig
}
/* **
 * Remplacer la déclaration précédente par ce qui suit pour voir en console la liste des fichiers qui passent par babel
 * (c'est parfois nécessaire pour trouver la cause d'une erreur au runtime du genre "_typeof is not defined")
 * /
const babelized = new Set()
const babelLoader = ({realResource}) => {
  if (!babelized.has(realResource)) {
    console.log(`babelize`, realResource)
    babelized.add(realResource)
  }
  return {
    loader: 'babel-loader',
    options: babelConfig
  }
}
/* */

// les différences de conf babel pour la version module (pour noModule on prend la conf du package.json)
// cf https://philipwalton.com/articles/deploying-es2015-code-in-production-today/
const babelConfigModule = {
  ...babelConfig,
  // on change l'option presets
  presets: babelConfig.presets.map(preset => {
    // seulement l'entrée @babel/preset-env
    if (preset[0] === '@babel/preset-env') {
      return [
        '@babel/preset-env',
        // https://caniuse.com/#feat=es6-module liste les targets qui savent utiliser module, mais targets.esmodules fait ça
        // et attention, c'est bien module:false qu'il faut passer pour une compilation type=module (pour dire à babel de ne pas convertir les import de type module js)
        Object.assign({}, preset[1], { modules: false, targets: { esmodules: true } })
      ]
    }
    // le reste tel quel
    return preset
  })
}
const babelLoaderModule = {
  loader: 'babel-loader',
  options: babelConfigModule
}

// ajout en prod des js appelés par des sites tiers
const entriesForPeers = isProd ? {
  // le client classique (j3p le charge ici)
  client: 'sesatheque-client',
  // un autre client plus light qui ne fait que récupérer des ressources sur l'api (sites tiers)
  fetch: 'sesatheque-client/src/fetch.js'
} : {}

// la conf identique dev/prod
const conf = {
  mode: isProd ? 'production' : 'development',
  // cf https://github.com/webpack/docs/wiki/configuration#entry
  entry: {
    ...entries,
    react: ['./app/polyfill.js', './app/client-react/index.js'],
    // pour les html en iframe
    bugsnag: './app/client/page/bugsnag.js',
    // fichiers connus qui utilisent ça :
    // https://ressources.sesamath.net/coll/lecteur/voir_j3p.php
    display: ['./app/polyfill.js', './app/client/display/index.js'],
    // utilisé par editgraphe.html (du plugin j3p)
    registerSesatheques: './app/client/page/registerSesatheques.js',
    ...entriesForPeers
  },
  // cf https://webpack.js.org/configuration/output/#output-filename
  // pour les variables utilisables
  output: {
    path: buildDir,
    publicPath: baseUrl,
    // [name] est remplacé par le nom de la propriété de entry
    // faut ajouter le suffixe es5 pour les 2 entrées spécifiques es5 (le preload sans suffixe est créé par webpack.preRun)
    filename: ({chunk}) => `[name]${['react', 'display'].includes(chunk.name) ? '.es5' : ''}.js`,
    // filename: (data) => {console.log(data); process.exit()}, // pour voir ce que contient data
    chunkFilename: isDevServer ? '[id].js' : '[id]-[chunkhash].js',
    // cf https://github.com/webpack/docs/wiki/configuration#output-library
    // exporte le module mis dans entry (attention, si y'en a plusieurs c'est le dernier) en global dans cette variable
    // sauf qu'avec splitChunks [name] se retrouve valoir name~hash et ça plante l'export (var foo~bar = plante assez logiquement…)
    // ATTENTION, ne plus changer ce préfixe st car des scripts externes l'utilisent (j3p, nos plugins…)
    library: 'st[name]',
    // comportement par défaut, mais pas plus mal en l'explicitant, pour le type d'export de la library,
    // ici var => on aura l'export de l'entry dispo en global (obj ou fonction suivant le module)
    libraryTarget: 'window',
    // ça c'est pour charger les chunks en cross-domain
    crossOriginLoading: 'anonymous'
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    // on veut tester le path du require, indépendamment du fait que le module soit linké ou pas
    // sinon avec du (npm|yarn) link sur qq modules, ils ne passent plus les tests de module.rules
    // symlinks: false,
    alias: {
      // pour pouvoir faire des require('client-react/xxx') sans la collection de ../../..
      client: path.resolve(__dirname, 'app/client'),
      'client-react': path.resolve(__dirname, 'app/client-react'),
      plugins: path.resolve(__dirname, 'app/plugins'),
      server: path.resolve(__dirname, 'app/server'),
      utils: path.resolve(__dirname, 'app/utils'),
      // Un alias pour obliger tous les require / import à prendre la même instance de jQuery
      // Car les plugins peuvent avoir la leur (et pas mal d'extension jquery font leur
      // propre import jquery qu'elles augmentent sans le renvoyer)
      // ça règle les pbs avec jquery-ui et jstree
      jquery: path.resolve(__dirname, 'node_modules/jquery'),
      // sans ces alias webpack plante sur les plugins en pnpm link
      'prop-types': path.resolve(__dirname, 'node_modules/prop-types'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-hot-loader': path.resolve(__dirname, 'node_modules/react-hot-loader'),
      'react-redux': path.resolve(__dirname, 'node_modules/react-redux'),
      redux: path.resolve(__dirname, 'node_modules/redux'),
      'redux-form': path.resolve(__dirname, 'node_modules/redux-form'),
      'redux-thunk': path.resolve(__dirname, 'node_modules/redux-thunk'),
      'core-js': path.resolve(__dirname, 'node_modules/core-js'),
      'regenerator-runtime': path.resolve(__dirname, 'node_modules/regenerator-runtime')
    }
  },
  // pour nos loaders perso
  resolveLoader: {
    alias: {
      'config-loader': path.join(__dirname, './webpackConfigLoader.js'),
      'throw-loader': path.join(__dirname, './webpackThrowLoader.js')
    }
  },
  module: {
    // si deux règles matchent sur un fichier les deux sont appliquées,
    // la dernière de la liste s'applique d'abord
    // en cas d'erreur "_typeof is not defined", c'est qu'un fichier est passé deux fois par babel, ou qu'il faut l'exclure du babel-loader
    rules: [
      ...rules.map(rule => ({
        ...rule,
        use: babelLoader
      })), {
        test: /app\/(client|client-react|constructors|plugins|server|utils)\/.*\.jsx?$/,
        exclude: /node_modules\//,
        use: babelLoader
      }, {
        // avec pnpm nos plugins sont dans node_modules/.framagit.org/Sesamath/sesatheque-plugin-xx/yyy/node_modules/@sesatheque-plugins/xx
        // et on veut que ça fonctionne aussi s'ils sont linked (ils sont alors dans
        // pathLocal/sesatheque-plugin-xxx/…
        // ou dans un node_modules/@sesatheque-plugins/xxx/)
        // ça c'est pour le build "ordinaire"
        test: /\/@sesatheque-plugins\/.*\.jsx?/,
        exclude: /\/@sesatheque-plugins\/.*\/node_modules\//,
        use: babelLoader
      }, {
        // et ça pour le build avec module linké path local sans /@sesatheque-plugins/ dedans
        test: /\/sesatheque-plugin-[a-z]+\/.*\.jsx?/,
        // on exclue ça, déjà pris au test précédent
        exclude: [/\/@sesatheque-plugins\//, /\/sesatheque-plugin-[a-z]+\/node_modules\//],
        use: babelLoader
      }, {
        // idem pour sesatheque-client ou sesaeditgraphe ou instrumenpoche
        test: /\/(sesatheque-client|sesaeditgraphe|instrumenpoche)\/.+\.js/,
        exclude: /\/(sesatheque-client|sesaeditgraphe|instrumenpoche)\/node_modules\//,
        use: babelLoader
      }, {
        // Pour charger la config qui contient des données sensibles, on passe par un loader qui filtre
        // pour _private c'est mis plus loin hors test (ça plante les tests)
        // important de déclarer ça après le match *.js plus haut (pour que ce config-loader passe avant le babel-loader)
        test: /app\/server\/config\.js/,
        exclude: /node_modules/,
        use: 'config-loader'
      }, {
        // les node_modules qui doivent passer par babel:
        test: /node_modules\/(query-string|strict-uri-encode|split-on-first)\/.*\.js/,
        // mais pas leurs dépendances
        exclude: /node_modules\/(query-string|strict-uri-encode|split-on-first)\/.*node_modules\//,
        use: babelLoader
      }, {
        // html pour nos iframes
        test: /app\/(client|plugins)\/.*\.html/,
        use: 'file-loader'
      }, {
        // idem pour les html des modules en link local (pas de @ donc on re-match pas les node_modules du test précédent)
        test: /\/sesatheque-plugin-[\w]+\/.*\.html/,
        use: 'file-loader'
      },
      // le statique
      {test: /\.(jpe?g|png|gif|otf|eot)(\?.*)?$/, loader: 'url-loader?limit=10000'},
      {test: /\.svg(\?\S*)?$/, loader: 'url-loader?mimetype=image/svg+xml&limit=10000'},
      {test: /\.ttf(\?\S*)?$/, loader: 'url-loader?mimetype=application/octet-stream&limit=10000'},
      {test: /\.woff2?(\?\S*)?$/, loader: 'url-loader?mimetype=application/font-woff&limit=10000'},
      // On empêche de require un fichier du répertoire _private dans du code client:
      {test: /_private\//, use: 'throw-loader', exclude: /node_modules/},
      {
        test: /\.s?css$/,
        rules: [
          {loader: 'style-loader'},
          {loader: 'css-loader'},
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                // il prend sa liste de browsers dans package.json:browserslist
                autoprefixer()
              ]
            }
          },
          {test: /\.scss$/, loader: 'sass-loader'}
        ]
      }
    ]
  },
  plugins: [
    // plus besoin de CleanWebpackPlugin, le dossier de build est vidé au preRun
    // statique
    new CopyWebpackPlugin([
      // {from: './node_modules/sesaeditgraphe/dist'},
      // ça c'est facultatif, il serait servi depuis assets, ça permet de l'inclure dans le js en data-uri ou dans les css
      {from: 'app/assets/favicon.png'}
    ]),
    // on a tenté ça pour régler les pbs d'instance multiple de jQuery, sans succès
    // c'est remplacé par un alias qui force le jquery de la racine (et pas celui des plugins)
    // new webpack.ProvidePlugin({
    //   'jQuery': 'jquery',
    //   '$': 'jquery',
    //   'global.jQuery': 'jquery'
    // }),
    ...plugins
  ],
  // cf https://webpack.js.org/configuration/devtool/#src/components/Sidebar/Sidebar.jsx
  // toujours source-map, eval rend le code illisible en console ou dans les js de build
  devtool: 'source-map',
  // https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
  optimization: {
    // par défaut c'est false en dev et true en prod, décommenter la ligne suivante pour trouver l'origine d'un plantage de build en prod
    // noEmitOnErrors: false,

    // cf https://webpack.js.org/plugins/split-chunks-plugin/
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    /*, splitChunks: {
      // IMPORTANT car sinon, avec notre `filename: '[name].js` et `library: 'st[name]`
      // on se retrouve avec du `var stclient~2a42e354 = …` dans build/client~2a42e354.js
      automaticNameDelimiter: '_', // faut un caractère compatible avec un nom de variable js
      maxSize: 201000 // bytes, mais si on met ça on a plus de react.js, seulement des react_<chunckhasch>.js
    } */
  },
  // cf https://webpack.js.org/configuration/stats/
  stats: {
    // indique l'heure de build, très utile en mode watch
    builtAt: true,
    // Nice colored output
    colors: true
  }
}
if (isProd) {
  // on minifie
  const terserMinimizer = new TerserPlugin({
    // https://webpack.js.org/plugins/terser-webpack-plugin/
    // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
    cache: true,
    parallel: true,
    // par défaut il laisse N fois les commentaires identiques (avec @licence) dans le fichier minifié
    // on ne veut pas extraire les commentaires dans un fichier .LICENSE séparé,
    // seulement n'en garder qu'un, d'où le output.comments ci-dessous
    extractComments: false,
    // sourceMap: true, // Must be set to true if using source-maps
    // pour terserOptions cf https://github.com/terser-js/terser#minify-options
    terserOptions: {
      output: {
        // les seuls qu'on garde dans le fichier minifié
        // https://github.com/webpack-contrib/terser-webpack-plugin#preserve-comments
        // Attention, la chaîne passée à la regex démarre après "/*" (ou //)
        comments: /^\**!/
      },
      // https://github.com/webpack-contrib/terser-webpack-plugin#warningsfilter
      // avec 'verbose' c'est vraiment très verbeux, avec plein de warning qui n'en sont pas vraiment
      // (par ex il vire une variable utilisée une seule fois sur la ligne suivante,
      // mais c'est souvent fait exprès et bienvenu pour la lisibilité)
      // warnings: 'verbose'
      warnings: true
    },
    // cf https://github.com/webpack-contrib/terser-webpack-plugin#warningsfilter
    warningsFilter: (warning, source, file) => {
      // on veut pas des warnings sur du code externe
      if (/node_module/.test(source)) return false
      // ni sur ces trucs ajoutés par core-js
      if (/Side effects in initialization of unused variable es_/.test(warning)) return false
    }
  })
  conf.optimization.minimizer = [terserMinimizer]
}

const confModule = {
  ...conf,
  entry: {
    // pour les autres js c'est la version es5 pour tout le monde
    react: ['./app/client-react/index.js'],
    display: ['./app/client/display/index.js']
  },
  output: {
    ...conf.output,
    filename: '[name].module.js'
  },
  module: {
    ...conf.module,
    rules: conf.module.rules.map(rule => {
      // on ne modifie que les regles avec babel-loader
      if (rule.use === babelLoader) return {...rule, use: babelLoaderModule}
      return rule
    })
  }
}

if (isDevServer) {
  // pas de chargement cross-domain
  conf.output.publicPath = '/'
  // y'a un bug dans webpack-dev-server, préciser le port ne sert à rien, il démarre toujours sur le 8081
  // il faut le préciser dans la ligne de commande avec du --host
  // par ex pour le lancer sur commun, il faut
  // env SESATHEQUE_CONF=commun node_modules/.bin/webpack-dev-server --hot --host commun.local --port 3002
  /* mais ça marche toujours pas… après des heures à chercher on laisse tomber pour le moment
    en 1.6 ça fonctionnait avec
    conf.devServer = {
      host: 'localhost',
      contentBase: conf.output.path,
      port: 3001,
      proxy: {
        '/': 'http://localhost:3021'
      },
      disableHostCheck: true
    }
    mais ça marche plus… (probablement lié à la double compilation car imposer les même version de webpack* que 1.6 ne change rien
   */
  conf.devServer = Object.assign({}, appConfig.devServer, {
    // on impose ça
    contentBase: conf.output.path,
    disableHostCheck: true // au cas où host ne serait pas dans les dns
  })
  console.log('conf devServer', conf.devServer)
  // on exporte que la version module
  module.exports = confModule
} else {
  module.exports = [conf, confModule]
}
