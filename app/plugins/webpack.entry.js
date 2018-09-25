const j3p = require('./j3p/webpack.entry')
const mathgraph = require('./mathgraph/webpack.entry')

module.exports = {
  ...j3p,
  ...mathgraph
}
