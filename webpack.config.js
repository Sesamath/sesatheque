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
const path = require('path')
const autoprefixer = require('autoprefixer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const appConfig = require('./app/server/config')
const pluginsConfig = require('./app/plugins/webpack.plugins')
const pluginsEntry = require('./app/plugins/webpack.entry')

// ça c'est pour mocka-webpack
const isTest = process.env.BABEL_ENV === 'test'
// passer --debug pour ne pas avoir de minification
const isDebug = process.argv.includes('--debug')
// prod d'après la conf (sauf --debug ou test)
const isProd = !isDebug && !isTest && /prod/.test(appConfig.application.staging)

let baseUrl = appConfig.application.baseUrl
if (baseUrl.substr(-1) !== '/') baseUrl += '/'

// la conf identique dev/prod
const conf = {
  mode: isProd ? 'production' : 'development',
  // cf https://github.com/webpack/docs/wiki/configuration#entry
  entry: {
    ...pluginsEntry,
    react: './app/client-react/index.js'
    // le reste est mis plus bas si !isTest
  },
  // cf https://webpack.js.org/configuration/output/#output-filename
  // pour les variables utilisables
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: baseUrl,
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].js',
    chunkFilename: '[id]-[chunkhash].js',
    // cf https://github.com/webpack/docs/wiki/configuration#output-library
    // exporte le module mis dans entry (attention, si y'en a plusieurs c'est le dernier) en global dans cette variable
    // sauf qu'avec splitChunks [name] se retrouve valoir name~hash et ça plante l'export (var foo~bar = plante assez logiquement…)
    library: 'st[name]', // ne plus changer cela car des scripts externes l'utilisent (j3p, nos plugins…)
    // comportement par défaut, mais pas plus mal en l'explicitant, pour le type d'export de la library,
    // ici var => on aura l'export de l'entry dispo en global (obj ou fonction suivant le module)
    libraryTarget: 'var',
    // ça c'est pour charger les chunks en cross-domain
    crossOriginLoading: 'anonymous'
  },
  /* externals: {
    stePage: 'page',
    steDisplay: 'display'
  }, */
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      'client-react': path.resolve(__dirname, 'app/client-react'),
      plugins: path.resolve(__dirname, 'app/plugins'),
      server: path.resolve(__dirname, 'app/server')
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
    rules: [
      {test: /app\/(client|server)\/.*\.js/, loader: 'babel-loader'},
      {test: /app\/(client-react|plugins)\/.*\.jsx?/, loader: 'babel-loader', query: {presets: ['react']}},
      {test: /test\/react\/.*\.jsx?/, loader: 'babel-loader', query: {presets: ['react']}},
      // Pour charger la config qui contient des données sensibles, on passe par un loader qui filtre
      {test: /app\/server\/config\.js/, loader: 'config-loader', exclude: /node_modules/},
      // {test: /\.json$/, loader: 'json-loader'},
      {test: /app\/client\/.*\.html/, loader: 'file-loader'},
      {test: /app\/plugins\/.*\.html/, loader: 'file-loader'},
      // editgraphe doit passer par babel
      {test: /sesaeditgraphe\/src\/.*\.js/, loader: 'babel-loader'},
      // idem pour sesatheque-client, pour pouvoir utiliser les src/* dans notre code
      {test: /sesatheque-client\/src\/.*\.js/, loader: 'babel-loader'},
      // le statique
      {test: /\.(jpe?g|png|gif|otf|eot)(\?.*)?$/, loader: 'url-loader?limit=10000'},
      {test: /\.svg(\?\S*)?$/, loader: 'url-loader?mimetype=image/svg+xml&limit=10000'},
      {test: /\.ttf(\?\S*)?$/, loader: 'url-loader?mimetype=application/octet-stream&limit=10000'},
      {test: /\.woff2?(\?\S*)?$/, loader: 'url-loader?mimetype=application/font-woff&limit=10000'}
      // css plus loin pour éviter la compil sass en test
    ]
  }
}

if (isTest) {
  // pour avoir un dossier séparé faut aussi préciser un SESATHEQUE_CONF=test
  // (mocha-webpack ne met rien dans output)

  // pas besoin de css en test
  conf.module.rules.push({
    test: /\.s?css$/,
    rules: [{loader: 'null-loader'}]
  })
} else {
  // faut ajouter toutes les entry utilisées par nos html en iframe
  Object.assign(conf.entry, {
    // pour les html en iframe
    bugsnag: './app/client/page/bugsnag.js',
    display: './app/client/display/index.js',
    // le js chargé par app/plugins/arbre/public/edit.html (mis en iframe)
    editArbre: './app/plugins/arbre/public/edit.js',
    import: './app/client/edit/import.js',
    // (c'est déjà inclus par display, est-ce bien utile ?)
    page: './app/client/page/index.js',
    // utilisé par editgraphe.html (plugin j3p)
    registerSesatheques: './app/client/page/registerSesatheques.js'
    // pour editGraphe et showParcours, c'est copié tel quel plus bas (il a sa conf webpack de son coté)
  })

  if (isProd) {
    // faut ajouter aussi les js appelés par des sites tiers
    Object.assign(conf.entry, {
      // le client classique
      client: 'sesatheque-client',
      // un autre client plus light qui ne fait que récupérer des ressources sur l'api (sites tiers)
      fetch: 'sesatheque-client/src/fetch.js'
    })
  }

  // cf https://webpack.js.org/configuration/devtool/#src/components/Sidebar/Sidebar.jsx
  conf.devtool = isProd ? 'source-map' : 'eval'

  // On empêche de require un fichier du répertoire _private dans du code client
  // (mais ça plante en mode test)
  conf.module.rules.unshift({test: /_private\//, loader: 'throw-loader', exclude: /node_modules/})
  conf.module.rules.push({
    test: /\.s?css$/,
    rules: [
      {loader: 'style-loader'},
      {loader: 'css-loader'},
      {
        loader: 'postcss-loader',
        options: {
          plugins: () => [
            autoprefixer({
              browsers: [
                'ie 11',
                'last 3 iOS versions',
                'last 3 Safari versions',
                'last 3 Android versions'
              ]
            })
          ]
        }
      },
      {test: /\.scss$/, loader: 'sass-loader'}
    ]
  })

  conf.plugins = [
    new CopyWebpackPlugin([
      {from: './node_modules/sesaeditgraphe/dist'},
      // ça c'est facultatif, il serait servi depuis assets, ça permet de l'inclure dans le js en data-uri ou dans les css
      {from: 'app/assets/favicon.png'}
    ]),
    ...pluginsConfig
  ]

  // https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
  conf.optimization = {
    // par défaut c'est false en dev et true en prod, décommenter la ligne suivante pour trouver l'origine d'un plantage de build en prod
    // noEmitOnErrors: false,

    minimizer: [
      // we specify a custom UglifyJsPlugin here to get source maps in production
      // cf https://stackoverflow.com/a/49059746
      // sinon par défaut y'a du uglify en prod mais sans sourceMap
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          compress: false,
          ecma: 5,
          mangle: true
        },
        sourceMap: true
      })
    ]

    // cf https://webpack.js.org/plugins/split-chunks-plugin/
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    /*, splitChunks: {
      // IMPORTANT car sinon, avec notre `filename: '[name].js` et `library: 'st[name]`
      // on se retrouve avec du `var stclient~2a42e354 = …` dans build/client~2a42e354.js
      automaticNameDelimiter: '_', // faut un caractère compatible avec un nom de variable js
      maxSize: 201000 // bytes, mais si on met ça on a plus de react.js, seulement des react_<chunckhasch>.js
    } */
  }

  // cf https://webpack.js.org/configuration/stats/
  conf.stats = {
    // indique l'heure de build, très utile en mode watch
    builtAt: true,
    // Nice colored output
    colors: true
  }
}

// pour pouvoir compiler les js de plusieurs baseId dans des dossiers différents
// (qui se retrouveront docroot si on passe le même env SESATHEQUE_CONF au lancement de l'appli)
if (process.env.SESATHEQUE_CONF) {
  console.log(`Compilation avec urls absolues pour ${process.env.SESATHEQUE_CONF}`)
  // faut compiler dans un dossier spécifique (le serve des assets ira là-dedans
  // si on lui passe le même environnement)
  conf.output.path = path.resolve(__dirname, 'build', process.env.SESATHEQUE_CONF)
}

if (appConfig.devServer) {
  const nodeUrl = `http://${appConfig.$server.host}:${appConfig.$server.port}`
  conf.devServer = {
    contentBase: conf.output.path,
    host: appConfig.devServer.host,
    disableHostCheck: true, // au cas où host ne serait pas dans les dns
    port: appConfig.devServer.port,
    proxy: {
      '/': nodeUrl
    }
  }
}

module.exports = conf
