import {addNotification} from '../actions/notifications'

const errorMessage = 'La sauvegarde a échoué car un champ contient une erreur'

const errorsMessage = 'La sauvegarde a échoué car des champs contiennent des erreurs'

const ArrayFrom = Array.prototype.slice

const onSubmitFail = (_, dispatch, error) => {
  if (error) {
    dispatch(addNotification({
      level: 'error',
      message: `Erreur: ${error.message}`
    }))
    throw error
  }
  
  const elements = ArrayFrom.call(document.querySelectorAll('.validation-error'))
  if (elements.length) {
    const element = elements[0]
    if (element && element.scrollIntoView) element.scrollIntoView(false)
    dispatch(addNotification({
      level: 'warning',
      message: (elements.length > 1) ? errorsMessage : errorMessage
    }))
  }
}

export default onSubmitFail
