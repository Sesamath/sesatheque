const {plugins: {internal, external}} = require('../server/config')

const plugins = [
  ...internal.map(plugin => `./${plugin}`),
  ...Object.keys(external)
]

module.exports = {plugins, external}
