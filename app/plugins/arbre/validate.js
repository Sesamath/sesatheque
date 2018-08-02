const validate = ({enfants}, errors) => {
  let children = enfants
  if (typeof enfants === 'string') {
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
      error = 'Une sous-propriété enfants n\'est pas un tableau'
      return
    }
    enfants.forEach((enfant) => {
      if (error) return
      if (typeof enfant !== 'object') {
        error = 'Les enfants doivent être des objets'
        return
      }
      const {type, titre} = enfant
      if (typeof titre !== 'string' || !titre.length) {
        error = 'Un enfant doit avoir un titre'
        return
      }
      if (typeof type !== 'string' || !type.length) {
        error = 'Un enfant doit avoir un type'
        return
      }
      if (type === 'arbre') {
        treeIterate(enfant.enfants)
      }
    })
  }
  treeIterate(children)
  if (error) { errors.enfants = error }
}

export default validate
