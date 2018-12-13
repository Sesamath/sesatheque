const {pluginsPaths} = require('./plugins')
const {version} = require('../server/config')

const params = {version}

const allEntries = {}
const allPlugins = []
const allRules = []

pluginsPaths.forEach(plugin => {
  const {entries, plugins, rules} = require(`${plugin}/webpack.config`)(params)
  Object.assign(allEntries, entries)
  allPlugins.push(...plugins)
  allRules.push(...rules)
})

module.exports = {
  entries: allEntries,
  plugins: allPlugins,
  rules: allRules
}
