import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorIep from './EditorIep'
import EditorJ3p from './EditorJ3p'
import resourceLoader from './resourceLoader'
import ShowError from './ShowError'
import NavMenu from './NavMenu'

const typeToComponent = {
  iep: EditorIep,
  j3p: EditorJ3p
}

const ResourceForm = ({
  initialValues: {type, oid: ressourceOid},
  handleSubmit,
  pristine,
  change,
  submitting,
  saveError,
  saveError
}) => {
  const Editor = typeToComponent[type]

  return (
    <Fragment>
      <h1 className="fl">Modifier la ressource IEP</h1>
      <NavMenu ressourceOid={ressourceOid} />
    <form onSubmit={handleSubmit}>
      <MetaForm />
      <hr />
      <Editor change={change} />
      <div className="buttons-area">
        <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregistrer</button>
      </div>
      <ShowError error={saveError} />
    </form>
    </Fragment>
  )
}

ResourceForm.propTypes = {
  initialValues: PropTypes.object,
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
