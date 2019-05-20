import editors from './generatedEditors'

/**
 * Retourne un objet avec une proprité éditor, ou un objet vide si le plugin du type ne fourni pas d'éditeur
 * @param {string} type
 * @return {Object}
 */
const getEditor = (type) => editors[type] || {}

export default getEditor
