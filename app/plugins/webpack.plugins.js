const mathgraph = require('./mathgraph/webpack.plugins')
const em = require('./em/webpack.plugins')

const plugins = [
  ...mathgraph,
  ...em
]

module.exports = plugins
