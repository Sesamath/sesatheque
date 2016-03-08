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

// var path = require('path');
var webpack = require('webpack')

// la conf identique dev/prod
var conf = {
  entry: {
    // chaque entrée contiendra ses dépendances, mais on veut préciser le loader et certains modules dans common
    // et les autres qui l'utilisent, cf https://webpack.github.io/docs/code-splitting.html
    // qui mène à https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
    // apiClient: './app/srcClient/apiClient.js',
    client: 'sesatheque-client',
    // on laisse les 2 fichiers sinon il râle dans les fichiers avec du require(page) en disant
    // Error: a dependency to an entry point is not allowed
    page: [
      './app/srcClient/page/index.js',
      './app/srcClient/page/refreshAuth.js'
    ],
    display: './app/srcClient/display/index.js',
    edit: './app/srcClient/edit/init.js'
  },
  output: {
    path: 'app/ressource/public/',
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].bundle.js',
    // cf https://webpack.github.io/docs/configuration.html#output-library
    library: 'st[name]',
    crossOriginLoading: 'anonymous'
  },
  module: {
    loaders: [
      {
        test: /app\/srcClient\/.*\.js/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    // Avoid publishing files when compilation failed
    new webpack.NoErrorsPlugin(),
    // la mise en commun, on met dans page ce qui est commun à ces 3 chunks
    new webpack.optimize.CommonsChunkPlugin({
      name: 'page',
      minChunks: 2,
      chunks: ['page', 'display', 'edit']
    })
  ],
  stats: {
    // Nice colored output
    colors: true
  }
  // Create Sourcemaps for the bundle
} /* */

// passer --debug pour ne pas avoir de minification
var isDev = process.argv.indexOf('--debug') > -1
var isHjs = process.argv.length > 1 && process.argv[1].indexOf('hjs-dev-server') > -1
if (isHjs) {
  // pas trop la peine de s'énerver, visiblement hjs-webpack est prévu pour une single page app
  // de toute façon faudrait modifier l'appli pour que ce soit elle qui lance hjs-webpack et utilise ses urls
  // on verra plus tard…
  conf.devServer = {
    // sans lui préciser ça il répond Listening at http://undefined:undefined
    hostname: 'localhost',
    port: 3000,
    // sans ça il plante dès le départ
    https: process.argv.indexOf('--https') !== -1
    // mais ça suffit pas, ça plante qq secondes après le démarrage
  }
  isDev = true
}
if (isDev) {
  conf.devtool = 'source-map'
  // pour hjs-webpack
} else {
  conf.plugins.push(new webpack.optimize.UglifyJsPlugin({ mangle: true, sourcemap: true }))
}

module.exports = conf
