import {plugins} from './package'

const editors = {}

plugins.forEach(plugin => {
  const {type, editor, validate} = require(`${plugin}/editor`)
  editors[type] = {editor, validate}
})

export default editors
