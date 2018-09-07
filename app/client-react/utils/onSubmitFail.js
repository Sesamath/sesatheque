import {addNotification} from '../actions/notifications'

const errorMessage = 'La sauvegarde a échoué car un champ contient une erreur'

const errorsMessage = 'La sauvegarde a échoué car des champs contiennent des erreurs'

const onSubmitFail = (errors, dispatch) => {
  const names = Object.keys(errors)
  if (names.length) {
    const name = names[0]
    const element = document.querySelector(`[data-fieldname="${name}"]`)
    if (element && element.scrollIntoView) element.scrollIntoView(false)
    dispatch(addNotification({
      level: 'warning',
      message: (names.length > 1) ? errorsMessage : errorMessage
    }))
  }
}

export default onSubmitFail
