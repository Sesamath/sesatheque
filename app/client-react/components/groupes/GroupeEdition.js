import {push} from 'connected-react-router'
import {debounce} from 'lodash'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {withProps} from 'recompose'
import {reduxForm} from 'redux-form'
import {GET} from '../../utils/httpMethods'
import {
  SwitchField,
  InputField,
  TextareaField,
  AsyncSelectField
} from '../fields'
import {saveGroupe} from '../../actions/groupes'
import ensureLogged from '../../hoc/ensureLogged'
import groupeLoader from './hoc/groupeLoader'

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

const GroupeEdition = ({
  initialValues: {oid, gestionnaires},
  handleSubmit,
  submitting,
  personne
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
          <span className="remarque">(Tout le monde pourra devenir membre du groupe)</span>
        </div>
        <div>
          <SwitchField
            name="public"
            label="Public"
          />
          <span className="remarque">(Tout le monde pourra s&apos;inscrire au suivi des publications du groupe)</span>
        </div>
        <label>
          Ajouter des gestionnaires
          <span className="remarque"> (L&apos;ajout est irrévocable. Saisir l&apos;oid d&apos;un utilisateur)</span>

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
  personne: PropTypes.object
}

const mapGestionnairesNames = ({
  gestionnaires,
  gestionnairesNames,
  ...others
}) => ({
  ...others,
  gestionnaires: gestionnaires.map((oid, index) => ({
    value: oid,
    label: `${gestionnairesNames[index]} (${oid})`,
    clearableValue: false
  }))
})

export default ensureLogged(
  groupeLoader(
    withProps(({groupe}) => ({
      initialValues: mapGestionnairesNames(groupe)
    }))(
      reduxForm({
        form: 'groupe-edition',
        onSubmit: ({gestionnaires, ...others}, dispatch) => dispatch(saveGroupe(
          {
            ...others,
            gestionnaires: gestionnaires.map(({value}) => value)
          },
          () => dispatch(push('/groupe/perso'))
        ))
      })(
        GroupeEdition
      )
    )
  )
)
