import {plugins} from './package'

const defaultValues = {}

plugins.forEach(plugin => {
  const {type, defaultValue} = require(`${plugin}/editor`)
  defaultValues[type] = defaultValue
})

export default defaultValues
