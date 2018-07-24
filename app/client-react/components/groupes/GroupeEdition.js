import {push} from 'connected-react-router'
import {debounce} from 'lodash'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {withProps} from 'recompose'
import {formValues, reduxForm} from 'redux-form'
import {GET} from '../../utils/httpMethods'
import {
  SwitchField,
  InputField,
  TextareaField,
  AsyncSelectField
} from '../fields'
import {saveGroupe} from '../../actions/groupes'
import groupesLoader from './hoc/groupesLoader'

const debouncedGET = debounce((input, callback) => {
  GET(`/api/personne/byOid/${input}`)
    .then(({user}) => {
      if (user === null) { return callback(null, ({ options: [] })) }
      const {oid, prenom, nom} = user

      return callback(null, {
        options: [
          {
            value: oid,
            label: `${prenom} ${nom} (${oid})`
          }
        ]
      })
    })
    .catch(error => callback(error, null))
}, 500)

const getOptions = (input, callback) => {
  if (!input) return callback(null, ({ options: [] }))
  debouncedGET(input, callback)
}

/**
 * Formulaire d'édition de groupe
 * Doit être dans un redux-form
 * @type {PureComponent}
 * @param {object} props
 * @param {boolean} props.detailed
 */
const GroupeEdition = ({
  initialValues: {oid, gestionnaires},
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
        <label>
          Ajouter des gestionnaires
          <span className="remarque"> (saisir l’identifiant d’un utilisateur, ATTENTION l’ajout est irrévocable)</span>

          <AsyncSelectField
            placeholder="Saisir un oid"
            name="gestionnaires"
            loadOptions={getOptions}
            multi
          />
        </label>
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

const getInitialValues = ({
  groupes,
  match: {params: {groupe: groupeNom}},
  personne: {
    oid,
    nom,
    prenom
  }
}) => {
  let groupe
  if (groupeNom) {
    groupe = groupes[groupeNom] || {
      ouvert: false,
      public: true,
      gestionnaires: [oid],
      gestionnairesNames: [`${prenom} ${nom}`],
      nom: groupeNom
    }
  } else {
    groupe = {
      ouvert: false,
      public: true,
      gestionnaires: [oid],
      gestionnairesNames: [`${prenom} ${nom}`]
    }
  }
  const {gestionnaires, gestionnairesNames, ...others} = groupe
  const gestionnairesItems = gestionnaires.map((oid, index) => ({
    value: oid,
    label: `${gestionnairesNames[index]} (${oid})`,
    clearableValue: false
  }))
  const initialValues = {
    ...others,
    gestionnaires: gestionnairesItems
  }
  return {initialValues}
}

const onSubmit = ({gestionnaires, ...others}, dispatch) => {
  const groupe = {
    ...others,
    gestionnaires: gestionnaires.map(({value}) => value)
  }
  const onSaveSuccess = () => dispatch(push('/groupes/perso'))
  const action = saveGroupe(groupe, onSaveSuccess)
  dispatch(action)
}

const formDefinition = {
  form: 'groupe-edition',
  onSubmit
}

const propsFromForm = {
  // public est un mot clé js, on préfixe avec is
  isPublic: 'public',
  // pour ouvert aussi par cohérence
  isOuvert: 'ouvert'
}

// groupesLoader contient ensureLogged
export default groupesLoader(
  withProps(getInitialValues)(
    reduxForm(formDefinition)(
      formValues(propsFromForm)(GroupeEdition))
  )
)
