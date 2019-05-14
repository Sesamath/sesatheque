// mis là pour mutualisation entre webpack.config et buildSrc
const {plugins: {internal, external}} = require('../server/config')

const pluginsPaths = [
  ...internal.map(plugin => `./${plugin}`),
  ...Object.keys(external)
]

module.exports = {
  /**
   * Liste des dossiers (ou url) de tous les plugins, chacun pouvant être passé à require()
   * @type {string[]}
   */
  pluginsPaths,
  /**
   * Liste des plugins externes déclarés en configuration, nom:url (même format que les dependencies d'un package.json)
   * @type {object}
   */
  external
}
