import validate from './validate'
import {addNotification} from 'client-react/actions/notifications'
import {GET} from 'client-react/utils/httpMethods'
import {getCheckPidUrl} from 'client-react/apiRoutes'
import {looksLikePid} from 'utils/validators'

const requiredFields = ['nom']
const groupeValidate = validate({requiredFields})
export default groupeValidate

export const asyncBlurFields = ['newGestionnairePid', 'newGestionnaireNom']

// un objet pour stocker les appels déjà faits, pour éviter de le refaire plusieurs fois
// sinon on a une notif à chaque blur d'un des deux champs même si on ne les modifie pas
const alreadyCalled = {}

/**
 * Appelé au blur sur un des asyncBlurFields (si la validation sync est ok)
 * @see https://redux-form.com/6.0.5/examples/asyncvalidation/
 * @param {Object} values Les values du form GroupeEdition
 * @return {Promise}
 */
export const asyncValidate = (values, dispatch) => {
  // on regarde d'abord si les deux champs qui nous intéressent sont non-vide
  if (asyncBlurFields.every(key => !values[key])) return Promise.resolve()
  const errors = {}
  asyncBlurFields.forEach(key => {
    if (!values[key] || !values[key].trim()) errors[key] = 'Champ requis pour ajouter un gestionnaire'
  })
  if (values.newGestionnairePid && !looksLikePid(values.newGestionnairePid)) errors.newGestionnairePid = 'identifiant invalide'
  if (Object.keys(errors).length) return Promise.reject(errors)

  const pid = values.newGestionnairePid
  const nom = values.newGestionnaireNom

  if (alreadyCalled[pid] && alreadyCalled[pid][nom]) return Promise.resolve()

  const url = getCheckPidUrl({pid, nom})
  return GET(url)
    .then(({nom: realNom, prenom}) => {
      // on a pas besoin de récupérer l'oid car il sera revérifié coté serveur avant l'ajout
      if (!alreadyCalled[pid]) alreadyCalled[pid] = {}
      alreadyCalled[pid][nom] = true
      dispatch(
        addNotification({
          level: 'info',
          message: `${prenom} ${realNom} a bien l'identifiant (${pid})`
        })
      )
      return Promise.resolve()
    }).catch((error) => {
      console.error(error)
      const errors = {newGestionnairePid: error.message}
      return Promise.reject(errors)
    })
}
