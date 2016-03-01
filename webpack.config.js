/*
cf https://github.com/petehunt/webpack-howto

Pour le chargement dynamique et les contextes
  https://github.com/webpack/webpack/issues/118

Pour le découpage des chunks
 https://webpack.github.io/docs/code-splitting.html
 https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin

 https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
 https://github.com/webpack/webpack/tree/master/examples/named-chunks
*/

// var path = require('path');
var webpack = require('webpack')

module.exports = {
  entry: {
    // chaque entrée contiendra ses dépendances, mais on veut préciser le loader et certains modules dans common
    // et les autres qui l'utilisent, cf https://webpack.github.io/docs/code-splitting.html
    // qui mène à https://github.com/webpack/webpack/tree/master/examples/multiple-commons-chunks
    apiClient: './app/ressource/srcClient/apiClient.js',
    sesathequeClient: 'sesatheque-client',
    page: [
      './app/ressource/srcClient/page/index.js',
      './app/ressource/srcClient/page/refreshAuth.js'
    ],
    display: './app/ressource/srcClient/display/index.js',
    edit: './app/ressource/srcClient/edit/init.js'
  },
  output: {
    path: 'app/ressource/public/',
    // [name] est remplacé par le nom de la propriété de entry
    filename: '[name].bundle.js'
  },
  module: {
    loaders: [
      {
        test: /app\/ressource\/srcClient\/.*\.js/,
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
  },
  // Create Sourcemaps for the bundle
  devtool: 'source-map'
} /* */
