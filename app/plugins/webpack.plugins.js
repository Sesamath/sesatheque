const {plugins} = require('./plugins')
const {version} = require('../server/config')

const params = {version}

const webpackPlugins = []

plugins.forEach(plugin => {
  const newWebpackPlugins = require(`${plugin}/webpack.plugins`)(params)
  webpackPlugins.push(...newWebpackPlugins)
})

module.exports = webpackPlugins
