const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

const plugins = [
  new CopyWebpackPlugin([{
    from: path.resolve(__dirname, 'public/spinner.gif'),
    to: 'plugins/mathgraph/spinner.gif'
  }, {
    from: path.resolve(__dirname, 'public/outilSave.png'),
    to: 'plugins/mathgraph/outilSave.png'
  }])
]

module.exports = plugins
