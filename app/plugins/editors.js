import editors from './generatedEditors'

const getEditor = (type) => {
  return editors[type] || {}
}

export default getEditor
