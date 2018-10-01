import {plugins} from './package'

const displays = {}

plugins.forEach(plugin => {
  const {type, display} = require(`${plugin}/display`)
  displays[type] = display
})

export default displays
