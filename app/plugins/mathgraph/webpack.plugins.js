const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const {version} = require('../../../package')
const subsituteVersion = new RegExp('{version}', 'g')

const plugins = [
  new CopyWebpackPlugin([{
    from: path.resolve(__dirname, 'public') + '/**',
    // pour pointer sur build/plugins/mathgraph/
    to: 'plugins/mathgraph/',
    // pour copier à la racine de la destination et pas dans build/plugins/mathgraph/app/plugins/mathgraph/public/
    flatten: true,
    ignore: ['*.html', '*.md']
  }, {
    from: path.resolve(__dirname, 'editor', 'mathgraph-editor.html'),
    to: 'plugins/mathgraph/',
    flatten: true,
    transform: (content) => content.toString().replace(subsituteVersion, version)
  }])
]

module.exports = plugins
