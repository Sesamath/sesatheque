const validate = ({parametres: {fig, width, height}}, errors) => {
  if (typeof fig !== 'string' || fig.length === 0) {
    errors.parametres = errors.parametres || {}
    errors.parametres.fig = 'La figure est vide'
  }

  if (typeof width === 'number' && width < 300) {
    errors.parametres = errors.parametres || {}
    errors.parametres.width = 'La largeur doit être vide ou supérieure à 300'
  }

  if (typeof height === 'number' && height < 200) {
    errors.parametres = errors.parametres || {}
    errors.parametres.height = 'La hauteur doit être vide ou supérieure à 200'
  }
}

export default validate
