import PropTypes from 'prop-types'
import React from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorJ3p from './EditorJ3p'
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
    <hr />
    <EditorJ3p change={change} />
    <div className="buttons-area">
      <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregistrer</button>
    </div>
    <ShowError error={saveError} />
  </form>
)

ResourceForm.propTypes = {
  handleSubmit: PropTypes.func,
  pristine: PropTypes.bool,
  change: PropTypes.func,
  submitting: PropTypes.bool,
  saveError: PropTypes.func
}

export default flowRight([
  resourceLoader,
  reduxForm({
    form: 'meta'
  })
])(ResourceForm)
