const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

const plugins = [
  new CopyWebpackPlugin([
    {
      from: path.resolve(__dirname, 'public/spinner.gif'),
      to: 'plugins/mathgraph/spinner.gif'
    }
  ])
]

module.exports = plugins
