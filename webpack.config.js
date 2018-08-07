/*
cf https://github.com/petehunt/webpack-howto

Pour le chargement dynamique et les contextes
  https://github.com/webpack/webpack/issues/118

Pour le découpage des chunks
 https://webpack.github.io/docs/code-splitting.html
 https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin

 https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
 https://github.com/webpack/webpack/tree/master/examples/named-chunks

Pour charger des librairies tierces, on utilise page.loadAsync
sinon faudrait passer par https://webpack.github.io/docs/shimming-modules.html
*/
const path = require('path')
const autoprefixer = require('autoprefixer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const appConfig = require('./app/server/config')

// passer --debug pour ne pas avoir de minification
const isDebug = process.argv.includes('--debug')

// prod d'après la conf (sauf --debug)
const isProd = isDebug ? false : (appConfig.application.staging === 'production' || appConfig.application.staging === 'prod')

let baseUrl = appConfig.application.baseUrl
if (baseUrl.substr(-1) !== '/') baseUrl += '/'

// la conf identique dev/prod
const conf = {
  mode: isProd ? 'production' : 'development',
  // cf https://github.com/webpack/docs/wiki/configuration#entry
  entry: {
    // chaque entrée contiendra ses dépendances, mais on veut préciser le loader et certains modules dans common
    // et les autres qui l'utilisent, cf https://webpack.github.io/docs/code-splitting.html
    // qui mène à https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
    // apiClient: './app/client/apiClient.js',
    client: 'sesatheque-client',
    page: './app/client/page/index.js',
    display: './app/client/display/index.js',
    // edit: './app/client/edit/index.js', // tous les éditeurs sont en react
    import: './app/client/edit/import.js',
    react: './app/client-react/index.js',
    // le js chargé par app/plugins/arbre/public/edit.html (mis en iframe)
    editArbre: './app/plugins/arbre/public/edit.js'
    // pour editGraphe et showParcours, c'est copié tel quel plus bas (il a sa conf webpack de son coté)
  },
  // cf https://webpack.js.org/configuration/output/#output-filename
  // pour les variables utilisables
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: baseUrl,
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].js',
    // chunkFilename: '[id].js', // ça n'évite pas le ~ dans les noms de fichier variables exportées…
    // cf https://github.com/webpack/docs/wiki/configuration#output-library
    // exporte le module mis dans entry (attention, si y'en a plusieurs c'est le dernier) en global dans cette variable
    // sauf qu'avec splitChunks [name] se retrouve valoir name~hash et ça plante l'export (var foo~bar = plante assez logiquement…)
    library: 'st[name]',
    // comportement par défaut, mais pas plus mal en l'explicitant, pour le type d'export de la library,
    // ici var => globale
    libraryTarget: 'var',
    // ça c'est pour charger les chunks en cross-domain
    crossOriginLoading: 'anonymous'
  },
  // devtool: 'source-map', // même en prod
  /* externals: {
    stePage: 'page',
    steDisplay: 'display'
  }, */
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      'client-react': path.resolve(__dirname, 'app/client-react'),
      plugins: path.resolve(__dirname, 'app/plugins')
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
      {test: /app\/client\/.*\.js/, loader: 'babel-loader'},
      {test: /app\/(client-react|plugins)\/.*\.jsx?/, loader: 'babel-loader', query: {presets: ['react']}},
      // On empêche de require un fichier du répertoire _private dans du code client
      {test: /_private\//, loader: 'throw-loader', exclude: /node_modules/},
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
      /* process CSS files */
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
      },
      {test: /\.(jpe?g|png|gif|otf|eot)(\?.*)?$/, loader: 'url-loader?limit=10000'},
      {test: /\.svg(\?\S*)?$/, loader: 'url-loader?mimetype=image/svg+xml&limit=10000'},
      {test: /\.ttf(\?\S*)?$/, loader: 'url-loader?mimetype=application/octet-stream&limit=10000'},
      {test: /\.woff2?(\?\S*)?$/, loader: 'url-loader?mimetype=application/font-woff&limit=10000'}
    ]
  },
  plugins: [
    // génération du html pour react
    // cf https://github.com/jantimon/html-webpack-plugin#options
    new CopyWebpackPlugin([
      {from: './node_modules/sesaeditgraphe/dist'},
      // ça c'est facultatif, il serait servi depuis assets, ça permet de l'inclure dans le js en data-uri ou dans les css
      {from: 'app/assets/favicon.png'}
    ])
  ],

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
          ecma: 6,
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
    // utile en mode watch
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
  conf.plugins.push(
    new HtmlWebpackPlugin({
      template: './app/server/main/buildReactPage.js',
      filename: 'index.html',
      // on ne veut pas qu'il mette toutes nos entries en <head> ou <script>
      inject: false
    })
  )
  const nodeUrl = `http://${appConfig.$server.host}:${appConfig.$server.port}`
  conf.devServer = {
    contentBase: conf.output.path,
    host: appConfig.devServer.host,
    disableHostCheck: true, // au cas où host ne serait pas dans les dns
    port: appConfig.devServer.port,
    historyApiFallback: true,
    proxy: {
      '/api': nodeUrl,
      '/public': nodeUrl,
      '/images': nodeUrl,
      '/medias': nodeUrl,
      '/vendor': nodeUrl,
      '/sesasso': nodeUrl,
      '/sesalabSso': nodeUrl,
      '/ressource/voir': nodeUrl
    }
  }
}

module.exports = conf
