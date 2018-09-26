const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

const plugins = [
  new CopyWebpackPlugin([{
    from: path.resolve(__dirname, 'public', 'images', '*.gif'),
    to: 'plugins/em/images',
    flatten: true
  }])
]

module.exports = plugins
