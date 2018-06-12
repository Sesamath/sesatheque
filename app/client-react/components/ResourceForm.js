import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorIep from './EditorIep'
import resourceLoader from './resourceLoader'
import ShowError from './ShowError'
import NavMenu from './NavMenu'

const ResourceForm = ({
  handleSubmit,
  pristine,
  change,
  submitting,
  saveError,
  initialValues
}) => {
  const {oid: ressourceOid} = initialValues

  return (
    <Fragment>
      <h1 className="fl">Modifier la ressource IEP</h1>
      <NavMenu ressourceOid={ressourceOid} />
      <form onSubmit={handleSubmit}>
        <MetaForm />
        <hr />
        <EditorIep change={change} />
        <div className="buttons-area">
          <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregistrer</button>
        </div>
        <ShowError error={saveError} />
      </form>
    </Fragment>
  )
}

ResourceForm.propTypes = {
  handleSubmit: PropTypes.func,
  pristine: PropTypes.bool,
  change: PropTypes.func,
  submitting: PropTypes.bool,
  saveError: PropTypes.func,
  initialValues: PropTypes.object
}

export default flowRight([
  resourceLoader,
  reduxForm({
    form: 'meta'
  })
])(ResourceForm)
