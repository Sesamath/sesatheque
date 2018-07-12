import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {reduxForm, Field, FieldArray, formValues} from 'redux-form'
import {
  SwitchField,
  InputField,
  TextareaField
} from './fields'
import groupeLoader from '../hoc/groupeLoader'

const renderMembers = ({
  fields,
  meta: { error, submitFailed },
  grou,
  initial
}) => (
  <ul>
    <button type="button" onClick={() => fields.push('')}>
      Ajouter un gestionnaire
    </button>
    {fields.map((member, index) => (
      <li key={index}>
        <h4>Gestionnaire #{index + 1}</h4>
        <Field
          name={member}
          type="text"
          component="input"
          disabled={initial[index]}
        />
      </li>
    ))}
  </ul>
)


const GroupeEdition = ({
  initialValues: {oid, gestionnaires},
  handleSubmit,
  submitting,
  grou
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
          <span className="remarque">(Tout le monde pourra s'inscrire au suivi des publications du groupe)</span>
        </div>
        <label>
          Ajouter des gestionnaires
          <span className="remarque">(L'ajout est irrévocable. Entrer un ou des identifiants séparés par des espaces, la confirmation sera demandée sur la page suivante avec les noms affichés)</span>
          <FieldArray
            name="gestionnaires"
            component={renderMembers}
            initial={gestionnaires}
            current={grou}
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

export default groupeLoader(
  renameProp('groupe', 'initialValues')(
    reduxForm({
      form: 'groupe-edition',
      onSubmit: (values) => {console.log(values)}
    })(
      formValues({grou: 'gestionnaires'})(GroupeEdition)
    )
  )
)
