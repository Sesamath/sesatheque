import React from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import {listes} from '../../server/ressource/config'
import MetaForm from './MetaForm'
import IEP_Editor from './IEP_Editor'
import resourceLoader from './resourceLoader'
import ShowError from './ShowError'

const ResourceForm = ({
  handleSubmit,
  pristine,
  change,
  submitting,
  saveError
}) => (
  <form onSubmit={handleSubmit}>
    <MetaForm />
    <IEP_Editor change={change} />
    <hr />
    <div className="buttons-area">
      <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregistrer</button>
    </div>
    <ShowError error={saveError} />
  </form>
)

export default flowRight([
  resourceLoader,
  reduxForm({
    form: 'meta',
  })
])(ResourceForm)
