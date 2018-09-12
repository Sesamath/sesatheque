import {plugins} from './package'

const icons = {}

plugins.forEach(plugin => {
  const {type, icon} = require(`${plugin}/icon`)
  icons[type] = icon
})

export default icons
