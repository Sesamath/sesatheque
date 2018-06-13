import PropTypes from 'prop-types'
import React from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorIep from './EditorIep'
import EditorJ3p from './EditorJ3p'
import EditorMathGraph from './EditorMathGraph'
import resourceLoader from './resourceLoader'
import ShowError from './ShowError'

const typeToComponent = {
  iep: EditorIep,
  j3p: EditorJ3p,
  mathgraph: EditorMathGraph
}

const ResourceForm = ({
  initialValues: {type},
  handleSubmit,
  change,
  submitting,
  saveError
}) => {
  const Editor = typeToComponent[type]

  return (
    <form onSubmit={handleSubmit}>
      <MetaForm />
      <hr />
      <Editor change={change} />
      <div className="buttons-area">
        <button type="submit" className="btn--primary" disabled={submitting}>Enregistrer</button>
      </div>
      <ShowError error={saveError} />
    </form>
  )
}

ResourceForm.propTypes = {
  initialValues: PropTypes.object,
  handleSubmit: PropTypes.func,
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
