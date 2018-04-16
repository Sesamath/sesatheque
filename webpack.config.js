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

// passer --debug pour ne pas avoir de minification
const isProd = process.argv.indexOf('--debug') === -1
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const extractCss = new ExtractTextPlugin('[name].css', {allChunks: true}) // allChunks sinon il en manque…
const cssLoader = isProd ? 'css-loader?minimize' : 'css-loader'
const extractCssLoader = extractCss.extract('style-loader', cssLoader)
const extractLessLoader = extractCss.extract('style-loader', cssLoader + '!less-loader')

const appConfig = require('./app/server/config')
let baseUrl = appConfig.application.baseUrl
if (baseUrl.substr(-1) !== '/') baseUrl += '/'
const baseId = appConfig.application.baseId

// pour pouvoir compiler pour d'autres baseId
let absBaseId = process.env.ABSOLUTE_BASE_ID
if (absBaseId && absBaseId !== baseId) {
  // on veut compiler js et css pour un autre domaine (par ex pour compiler la prod en préprod)
  const sesatheques = require('sesatheque-client/src/sesatheques')
  baseUrl = sesatheques.getBaseUrl(absBaseId, false)
  if (!baseUrl) absBaseId = null
}

// la conf identique dev/prod
const conf = {
  // cf https://github.com/webpack/docs/wiki/configuration#entry
  entry: {
    // chaque entrée contiendra ses dépendances, mais on veut préciser le loader et certains modules dans common
    // et les autres qui l'utilisent, cf https://webpack.github.io/docs/code-splitting.html
    // qui mène à https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
    // apiClient: './app/client/apiClient.js',
    client: ['sesatheque-client'],
    // faut un array, sinon il râle dans les fichiers ayant du require(page) en disant
    // Error: a dependency to an entry point is not allowed
    page: ['./app/client/page/index.js'],
    iframe: ['./app/server/src/styles/iframe.less'],
    display: './app/client/display/index.js',
    edit: './app/client/edit/index.js',
    import: './app/client/edit/import.js'
    // pour editGraphe et showParcours, on copie tel quel plus bas
  },
  output: {
    path: 'build/',
    publicPath: baseUrl,
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].js',
    // cf https://github.com/webpack/docs/wiki/configuration#output-library
    // exporte le module mis dans entry (attention, si y'en a plusieurs c'est le dernier) en global dans cette variable
    library: 'st[name]',
    // comportement par défaut, mais pas plus mal en l'explicitant, pour le type d'export de la library,
    // ici var => globale
    libraryTarget: 'var',
    // ça c'est pour charger les chunks en cross-domain
    crossOriginLoading: 'anonymous'
  },
  devtool: 'source-map', // même en prod
  /* externals: {
    stePage: 'page',
    steDisplay: 'display'
  }, */
  // pour nos loaders perso
  resolveLoader: {
    alias: {
      'config-loader': path.join(__dirname, './webpackConfigLoader.js'),
      'throw-loader': path.join(__dirname, './webpackThrowLoader.js')
    }
  },
  module: {
    loaders: [
      {test: /app\/client\/.*\.js/, loader: 'babel'},
      // On empêche de require un fichier du répertoire _private dans du code client
      {test: /_private\//, loader: 'throw-loader', exclude: /node_modules/},
      // Pour la config qui contient des données sensibles, on passe par un loader qui filtre
      {test: /app\/server\/config\.js/, loader: 'config-loader', exclude: /node_modules/},
      {test: /\.json$/, loader: 'json'},
      {test: /app\/client\/.*\.html/, loader: 'file'},
      // editgraphe passe par babel
      {test: /sesaeditgraphe\/src\/.*\.js/, loader: 'babel'},
      // idem pour sesatheque-client, pour pouvoir utiliser les src/* dans notre code
      {test: /sesatheque-client\/src\/.*\.js/, loader: 'babel'},
      // le statique
      {test: /.*\.css(\?.*)?$/, loader: extractCssLoader},
      {test: /.*\.less(\?.*)?$/, loader: extractLessLoader},
      {test: /\.(jpe?g|png|gif|otf|eot)(\?.*)?$/, loader: 'url-loader?limit=10000'},
      {test: /\.svg(\?\S*)?$/, loader: 'url-loader?mimetype=image/svg+xml&limit=10000'},
      {test: /\.ttf(\?\S*)?$/, loader: 'url-loader?mimetype=application/octet-stream&limit=10000'},
      {test: /\.woff2?(\?\S*)?$/, loader: 'url-loader?mimetype=application/font-woff&limit=10000'}
    ]
  },
  plugins: [
    // Avoid publishing files when compilation failed
    new webpack.NoErrorsPlugin() /* */,
    // la mise en commun, on met dans page ce qui est commun à ces 3 chunks
    new webpack.optimize.CommonsChunkPlugin({
      name: 'page',
      minChunks: 2,
      chunks: ['page', 'display', 'edit']
    }),
    new CopyWebpackPlugin([
      {from: './node_modules/sesaeditgraphe/dist'},
      {from: 'app/client/plugins', to: 'plugins/', ignore: ['*.js']}
    ]),
    extractCss
  ],
  stats: {
    // Nice colored output
    colors: true
  }
} /* * /
if (isProd) {
  conf.plugins.push(new webpack.optimize.UglifyJsPlugin({ mangle: true, sourcemap: true }))
} /* */
if (absBaseId) {
  console.log(`Compilation avec urls absolues pour ${absBaseId}`)
  // faut compiler avec un chemin absolu, pour pouvoir être chargé depuis un autre domaine
  conf.output.publicPath = baseUrl
  // On reste dans le même dossier mais faut changer le nom
  conf.output.filename = `[name].${absBaseId}.js`
}

module.exports = conf
