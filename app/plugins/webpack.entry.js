const {plugins} = require('./package')

const entries = {}

plugins.forEach(plugin => {
  const pluginEntries = require(`${plugin}/webpack.entry`)
  Object.assign(entries, pluginEntries)
})

module.exports = entries
