import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {withProps} from 'recompose'
import {formValues, reduxForm} from 'redux-form'

import {
  SwitchField,
  InputField,
  TextareaField
} from '../fields'
import {saveGroupe} from 'client-react/actions/groupes'
import onSubmitFail from 'client-react/utils/onSubmitFail'
import validate, {asyncBlurFields, asyncValidate} from 'client-react/utils/groupeValidate'
import groupesLoader from './hoc/groupesLoader'

// Cf versions avant 2019-05-20 pour l'autocomplete MultiValueRemove
// (ajout de gestionnaires, qu'on a viré car ça permettait d'interroger la base user
// en itérant sur sesasso/NN, mais le composant fonctionnait très bien)

/**
 * Formulaire d'édition de groupe
 * Doit être dans un redux-form
 * @type {PureComponent}
 * @param {object} props
 */
const GroupeEdition = ({
  initialValues: {oid, gestionnairesNames},
  handleSubmit,
  isOuvert,
  isPublic,
  submitting
}) => (
  <Fragment>
    <h1>{oid ? 'Modifier un groupe' : 'Ajouter un groupe'}</h1>
    <form onSubmit={handleSubmit}>
      <fieldset>
        <InputField
          label="Nom du groupe"
          name="nom"
          disabled={!!oid}
        />
        <TextareaField
          name="description"
          label="Description"
        />
        <div>
          <SwitchField
            name="ouvert"
            label="Ouvert à tous"
          />
          <span className="remarque">({isOuvert
            ? 'tout le monde pourra devenir membre du groupe'
            : 'seul un gestionnaire pourra ajouter un membre'
          })</span>
        </div>
        <div>
          <SwitchField
            name="public"
            label="Public"
          />
          <span className="remarque">({isPublic
            ? 'tout le monde peut suivre les publications du groupe'
            : 'il faut être membre pour suivre les publications du groupe'
          })</span>
        </div>

        <div>
          <label className="field">Gestionnaire(s)</label>
          <ul>
            {gestionnairesNames.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
          <label className="field">Ajouter un gestionnaire <i>(en le faisant vous vous engagez à lui avoir demandé son avis avant, toutes les modifications de gestionnaires sont enregistrées)</i></label>
          <p>ATTENTION : l’ajout sera effectif lors du clic sur « Modifier » et il est irrévocable.</p>
          <div className="grid-2">
            <InputField name="newGestionnairePid" label="Son identifiant" placeholder="celui qui apparaît dans « mes informations personnelles »"/>
            <InputField name="newGestionnaireNom" label="Son nom" placeholder="Entrez également le nom (insensible à la casse)" />
          </div>
        </div>

      </fieldset>
      <hr />
      <div className="buttons-area">
        <button
          type="submit"
          className="btn--primary"
          disabled={submitting}
        >
          {oid ? 'Modifier' : 'Créer le groupe'}
        </button>
      </div>
    </form>
  </Fragment>
)

GroupeEdition.propTypes = {
  initialValues: PropTypes.object,
  handleSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  isOuvert: PropTypes.bool,
  isPublic: PropTypes.bool
}

// fourni une prop initialValues (en le passant à withProps)
const getInitialValues = ({
  // tous les groupes chargés dans le store (appel de groupes/perso, fourni par le hoc groupesLoader)
  groupes,
  // le nom du groupe édité d'après l'url
  match: {params: {groupe: groupeNom}},
  // vient de la session (via ensureLogged appelé par groupesLoader)
  personne: {
    oid,
    nom,
    prenom
  }
}) => {
  // valeurs par défaut à la création
  const newGroupe = {
    ouvert: false,
    public: true,
    gestionnairesNames: [`${prenom} ${nom}`]
  }
  let groupe
  if (groupeNom) {
    if (groupes[groupeNom]) {
      // groupe existant
      groupe = groupes[groupeNom]
    } else {
      // un nouveau groupe que l'on vient de créer, pas encore dans le state
      groupe = {...newGroupe}
      groupe.nom = groupeNom
    }
  } else {
    groupe = newGroupe
  }
  return {initialValues: groupe}
}

const onSubmit = ({gestionnairesNames, ...groupe}, dispatch) => {
  const onSaveSuccess = () => dispatch(push('/groupes/perso'))
  const action = saveGroupe(groupe, onSaveSuccess)
  dispatch(action)
}

const formDefinition = {
  form: 'groupe-edition',
  asyncValidate,
  asyncBlurFields,
  onSubmit,
  validate,
  onSubmitFail
}

// le mapping props => values que formValues apporte
// le render en a besoin dynamiquement
const formValuesToProps = {
  // public est un mot clé js, on préfixe avec is
  isPublic: 'public',
  // pour ouvert aussi par cohérence
  isOuvert: 'ouvert'
}

// on a besoin de groupesLoader pour aller chercher les props du groupe courant
// dans la liste des groupes persos (s'il s'y trouve pas c'est une création)
export default groupesLoader(
  withProps(getInitialValues)(
    reduxForm(formDefinition)(
      formValues(formValuesToProps)(GroupeEdition))
  )
)
