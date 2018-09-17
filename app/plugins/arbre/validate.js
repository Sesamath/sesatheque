/**
 * Valide un arbre (ajoutera éventuellement une string dans errors.enfants)
 * @param {Ressource} arbre
 * @param {Object} errors
 * @param {string} errors.enfants L'erreur éventuelle qui sera ajoutée en cas de pb de validation
 */
const validate = (arbre, errors) => {
  let children = arbre.enfants
  if (typeof children === 'string') {
    try {
      children = JSON.parse(children)
    } catch (err) {
      errors.enfants = 'Le JSON est invalide'
      return
    }
  }

  let error = ''
  const treeIterate = (enfants) => {
    if (error) return
    if (!Array.isArray(enfants)) {
      error = 'Une propriété enfants n’est pas un tableau'
      return
    }
    enfants.forEach((enfant) => {
      if (error) return
      if (typeof enfant !== 'object') {
        error = 'Les enfants doivent être des objets'
        return
      }
      const {type, titre, aliasOf} = enfant
      if (typeof titre !== 'string' || !titre.length) {
        error = 'Un enfant doit avoir un titre'
        return
      }
      if (typeof type !== 'string' || !type.length) {
        error = 'Un enfant doit avoir un type'
        return
      }
      if (type === 'arbre') {
        if (aliasOf) return // un enfant alias n'a pas d'enfants
        treeIterate(enfant.enfants)
      }
    })
  }

  treeIterate(children)

  if (error) {
    console.error(Error(error), arbre.enfants)
    errors.enfants = error
  }
}

export default validate
