import React from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import {listes} from '../../server/ressource/config'
import MetaForm from './MetaForm'
import IEP_Editor from './IEP_Editor'
import resourceLoader from './resourceLoader'

const ResourceForm = props => {
  const {handleSubmit, pristine, reset, submitting, change} = props

  return (
    <form onSubmit={handleSubmit}>
      <MetaForm />
      <IEP_Editor change={change} />
      <div>
        <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregistrer</button>
      </div>
    </form>
  )
}

export default flowRight([
  resourceLoader,
  reduxForm({
    form: 'meta',
  })
])(ResourceForm)
