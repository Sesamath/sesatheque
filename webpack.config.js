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
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

// on va forcer l'utilisation notre conf babel pour
// la compilation de certains node_modules
// (seatheque-client, sesaeditgraphe et plugins d'édition)
const babelConfig = require('./package.json').babel
const appConfig = require('./app/server/config')
const {entries, plugins, rules} = require('./app/plugins/webpack.config')

// passer --debug pour ne pas avoir de minification
const isDebug = process.argv.includes('--debug')
// prod d'après la conf (sauf --debug ou test)
const isProd = !isDebug && /prod/.test(appConfig.application.staging)
const isDevServer = !!appConfig.devServer

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

const babelLoader = {
  loader: 'babel-loader',
  options: babelConfig
}

// ajout en prod des js appelés par des sites tiers
const conditionalEntries = isProd ? {
  // le client classique
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
    react: './app/client-react/index.js',
    // pour les html en iframe
    bugsnag: './app/client/page/bugsnag.js',
    display: './app/client/display/index.js',
    // le js chargé par app/plugins/arbre/public/edit.html (mis en iframe)
    editArbre: './app/plugins/arbre/public/edit.js',
    import: './app/client/edit/import.js',
    // (c'est déjà inclus par display, est-ce bien utile ?)
    page: './app/client/page/index.js',
    // utilisé par editgraphe.html (plugin j3p)
    registerSesatheques: './app/client/page/registerSesatheques.js',
    // pour editGraphe et showParcours, c'est copié tel quel plus bas (il a sa conf webpack de son coté)
    ...conditionalEntries
  },
  // cf https://webpack.js.org/configuration/output/#output-filename
  // pour les variables utilisables
  output: {
    path: buildDir,
    publicPath: baseUrl,
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].js',
    chunkFilename: isDevServer ? '[id].js' : '[id]-[chunkhash].js',
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
    // on veut tester le path du require, indépendamment du fait que le module soit linké ou pas
    // sinon avec du (npm|yarn) link sur qq modules, ils ne passent plus les tests de module.rules
    symlinks: false,
    alias: {
      // pour pouvoir faire des require('client-react/xxx') sans la collection de ../../..
      'client-react': path.resolve(__dirname, 'app/client-react'),
      plugins: path.resolve(__dirname, 'app/plugins'),
      server: path.resolve(__dirname, 'app/server'),
      client: path.resolve(__dirname, 'app/client')
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
    rules: [
      ...rules.map(regExp => ({
        test: regExp,
        use: babelLoader
      })), {
        test: /app\/(client|constructors|server|client-react|plugins)\/.*\.jsx?$/,
        exclude: /node_modules\/(?!(@sesatheque-plugins)\/).*/,
        use: babelLoader
      }, {
        // Pour charger la config qui contient des données sensibles, on passe par un loader qui filtre
        // pour _private c'est mis plus loin hors test (ça plante les tests)
        // important de déclarer ça après le match *.js plus haut (pour que ce config-loader passe avant le babel-loader)
        test: /app\/server\/config\.js/,
        exclude: /node_modules/,
        use: 'config-loader'
      },
      {
        // les node_modules qui doivent passer par babel:
        test: /node_modules\/(sesatheque-client|query\-string)\/.*\.js/,
        use: babelLoader
      },
      {
        // html pour nos iframes
        test: /app\/(client|plugins)\/.*\.html/,
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
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin([buildDir]),
    new CopyWebpackPlugin([
      // {from: './node_modules/sesaeditgraphe/dist'},
      // ça c'est facultatif, il serait servi depuis assets, ça permet de l'inclure dans le js en data-uri ou dans les css
      {from: 'app/assets/favicon.png'}
    ]),
    ...plugins
  ],
  // cf https://webpack.js.org/configuration/devtool/#src/components/Sidebar/Sidebar.jsx
  devtool: isProd ? 'source-map' : 'eval',
  // https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
  optimization: {
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
  },
  // cf https://webpack.js.org/configuration/stats/
  stats: {
    // indique l'heure de build, très utile en mode watch
    builtAt: true,
    // Nice colored output
    colors: true
  }
}

if (isDevServer) {
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
