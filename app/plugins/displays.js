import displays from './generatedDisplays'

const defaultDisplay = () => Promise.resolve({})

const getDisplay = (type) => {
  return displays[type] || defaultDisplay
}

export default getDisplay
