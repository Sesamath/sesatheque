import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorIep from './EditorIep'
import EditorJ3p from './EditorJ3p'
import EditorMathGraph from './EditorMathGraph'
import resourceLoader from './resourceLoader'
import ShowError from './ShowError'
import NavMenu from './NavMenu'

const typeToData = {
  iep: {
    Editor: EditorIep,
    name: 'iep'
  },
  j3p: {
    Editor: EditorJ3p,
    name: 'j3p'
  },
  mathgraph: {
    Editor: EditorMathGraph,
    name: 'mathGraph'
  }
}

const ResourceForm = ({
  initialValues: {type, oid: ressourceOid},
  handleSubmit,
  change,
  submitting,
  saveError
}) => {
  const {Editor, name} = typeToData[type]

  return (
    <Fragment>
      <h1 className="fl">Modifier la ressource {name}</h1>
      <NavMenu ressourceOid={ressourceOid} />
      <form onSubmit={handleSubmit}>
        <MetaForm />
        <hr />
        <Editor change={change} />
        <div className="buttons-area">
          <button type="submit" className="btn--primary" disabled={submitting}>Enregistrer</button>
        </div>
        <ShowError error={saveError} />
      </form>
    </Fragment>
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
