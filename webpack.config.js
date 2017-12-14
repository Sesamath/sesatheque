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

// passer --debug pour ne pas avoir de minification
var isProd = process.argv.indexOf('--debug') === -1
var webpack = require('webpack')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var extractCss = new ExtractTextPlugin('[name].css', {allChunks: true}) // allChunks sinon il en manque…
var extractCssLoader = extractCss.extract('style-loader', isProd ? 'css-loader?minimize' : 'css-loader')

var appConfig = require('./app/config')
var baseUrl = appConfig.application.baseUrl
if (baseUrl.substr(-1) !== '/') baseUrl += '/'
var webpackOutput = 'app/ressource/' + (appConfig.application.webpackOutput || 'public') + '/'

// la conf identique dev/prod
var conf = {
  // cf http://webpack.github.io/docs/configuration.html#entry
  entry: {
    // chaque entrée contiendra ses dépendances, mais on veut préciser le loader et certains modules dans common
    // et les autres qui l'utilisent, cf https://webpack.github.io/docs/code-splitting.html
    // qui mène à https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
    // apiClient: './app/srcClient/apiClient.js',
    client: ['sesatheque-client'],
    // faut un array, sinon il râle dans les fichiers ayant du require(page) en disant
    // Error: a dependency to an entry point is not allowed
    page: ['./app/srcClient/page/index.js'],
    display: './app/srcClient/display/index.js',
    edit: './app/srcClient/edit/index.js',
    import: './app/srcClient/edit/import.js'
    // pour editGraphe et showParcours, on copie tel quel plus bas
  },
  output: {
    path: webpackOutput,
    publicPath: baseUrl,
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].bundle.js',
    // cf https://webpack.github.io/docs/configuration.html#output-library
    // exporte le module mis dans entry (attention, si y'en a plusieurs c'est le dernier) en global dans cette variable
    library: 'st[name]',
    // comportement par défaut, mais pas plus mal en l'explicitant, pour le type d'export de la library, ici var => globale
    libraryTarget: 'var',
    // ça c'est pour charger les chunks en cross-domain
    crossOriginLoading: 'anonymous'
  },
  devtool: 'source-map', // même en prod
  /* externals: {
    stePage: 'page',
    steDisplay: 'display'
  }, */
  module: {
    loaders: [
      {test: /app\/srcClient\/.*\.js/, loader: 'babel'},
      {test: /_private\/.*\.js/, loader: 'babel'},
      {test: /\.json$/, loader: 'json'},
      {test: /app\/srcClient\/.*\.html/, loader: 'file'},
      // editgraphe passe par babel
      {test: /sesaeditgraphe\/src\/.*\.js/, loader: 'babel'},
      // idem pour sesatheque-client, pour pouvoir utiliser les src/* dans notre code
      {test: /sesatheque-client\/src\/.*\.js/, loader: 'babel'},
      // le statique
      {test: /(src|node_modules)\/.*\.css/, loader: extractCssLoader},
      {test: /\.otf(\?\S*)?$/, loader: 'url-loader?limit=10000'},
      {test: /\.eot(\?\S*)?$/, loader: 'url-loader?limit=10000'},
      {test: /\.svg(\?\S*)?$/, loader: 'url-loader?mimetype=image/svg+xml&limit=10000'},
      {test: /\.ttf(\?\S*)?$/, loader: 'url-loader?mimetype=application/octet-stream&limit=10000'},
      {test: /\.woff2?(\?\S*)?$/, loader: 'url-loader?mimetype=application/font-woff&limit=10000'},
      {test: /\.(jpe?g|png|gif)$/, loader: 'url-loader?limit=10000'}
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
    new CopyWebpackPlugin([{from: './node_modules/sesaeditgraphe/dist'}]),
    extractCss
  ],
  stats: {
    // Nice colored output
    colors: true
  }
  // Create Sourcemaps for the bundle
} /* */

if (isProd) {
  conf.plugins.push(new webpack.optimize.UglifyJsPlugin({ mangle: true, sourcemap: true }))
}

module.exports = conf
