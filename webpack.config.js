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
const fs = require('fs')
const path = require('path')

// passer --debug pour ne pas avoir de minification
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const appConfig = require('./app/server/config')
const version = require('./package').version

const isDebug = process.argv.includes('--debug')
// prod d'après la conf (sauf --debug)
const isProd = isDebug ? false : (appConfig.application.staging === 'production' || appConfig.application.staging === 'prod')

// allChunks sinon il en manque
const extractCss = new ExtractTextPlugin('[name].css', {allChunks: true})
const cssLoader = isProd ? 'css-loader?minimize' : 'css-loader'
const extractCssLoader = extractCss.extract('style-loader', cssLoader)

let baseUrl = appConfig.application.baseUrl
if (baseUrl.substr(-1) !== '/') baseUrl += '/'

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
    // juste pour compiler iframe.css
    iframe: ['./app/srcStyles/iframe.scss'],
    display: './app/client/display/index.js',
    edit: './app/client/edit/index.js',
    import: './app/client/edit/import.js',
    react: './app/client-react/index.js',
    // arbre passe par babel
    editArbre: ['./app/client/plugins/arbre/edit.js']
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
      {test: /app\/client-react\/.*\.jsx?/, loader: 'babel-loader', query: {presets: ['react']}},
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
      {test: /\.scss$/, loaders: [extractCssLoader, 'css-loader', 'sass-loader']},
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
  watchOptions: {
    ignored: ['/node_modules/', 'app/assets', 'app/srcStyles', 'app/client/plugins']
  },
  stats: {
    // Nice colored output
    colors: true
  }
}

if (isProd) {
  conf.plugins.push(new webpack.optimize.UglifyJsPlugin({ mangle: true, sourcemap: true }))
}

// génération du html pour react
// cf https://github.com/jantimon/html-webpack-plugin#options
conf.plugins.push(new HtmlWebpackPlugin({
  isDev: !isProd,
  title: appConfig.application.name,
  version: version,
  verbose: isDebug,
  baseId: appConfig.application.baseId,
  sesatheques: JSON.stringify(appConfig.sesatheques),
  template: './app/server/views/index.html',
  filename: 'index.html',
  // on ne veut pas qu'il génère de html, ni qu'il mette toutes nos entries en <head> ou <script>
  inject: false
}))

// pour pouvoir compiler les js de plusieurs baseId dans des dossiers différents
// (qui se retrouveront docroot si on passe le même env SESATHEQUE_CONF au lancement de l'appli)
if (process.env.SESATHEQUE_CONF) {
  console.log(`Compilation avec urls absolues pour ${process.env.SESATHEQUE_CONF}`)
  // faut compiler dans un dossier spécifique (le serve des assets ira là-dedans
  // si on lui passe le même environnement)
  conf.output.path = `build/${process.env.SESATHEQUE_CONF}/`
}
// on crée le dossier de build s'il n'existe pas encore
const buildDir = path.resolve(__dirname, conf.output.path)
try {
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, 0o775)
  // on vérifie, au cas où ça existait sans être un dossier
  const stats = fs.statSync(buildDir)
  if (!stats.isDirectory()) throw new Error(`${buildDir} existe mais n’est pas un dossier`)
} catch (error) {
  console.error(`Impossible de créer le dossier ${buildDir}, ABANDON`, error)
  process.exit(1)
}

module.exports = conf
