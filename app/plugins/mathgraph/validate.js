
const validate = ({parametres: {content, width, height}}, errors) => {
  const addError = (field, errorMessage) => {
    errors.parametres = errors.parametres || {}
    errors.parametres[field] = errorMessage
  }
  if (typeof content !== 'object') {
    addError('content', 'pas de contenu')
  } else {
    if (typeof content.fig !== 'string' || !content.fig.length) addError('content', 'pas de figure')
    if (!Number.isInteger(content.level) || content.level < 0) addError('propriété level invalide')
  }

  if (typeof width === 'number' && width < 300) addError('width', 'La largeur doit être vide ou supérieure à 300')
  if (typeof height === 'number' && height < 200) addError('height', 'La hauteur doit être vide ou supérieure à 200')
}

export default validate
