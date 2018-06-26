import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorArbre from './EditorArbre'
import EditorIep from './EditorIep'
import EditorJ3p from './EditorJ3p'
import EditorMathGraph from './EditorMathGraph'
import GroupContainer from './GroupContainer'
import resourceLoader from './resourceLoader'
import resourceSaver from './resourceSaver'
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
  },
  arbre: {
    Editor: EditorArbre,
    name: 'arbre'
  }
}

const ResourceForm = ({
  initialValues: {type, oid: ressourceOid},
  handleSubmit,
  change,
  submitting,
  updateStoreFromEditor,
  setUpdateStoreFromEditor,
  saveRessource
}) => {
  const {Editor, name} = typeToData[type]

  return (
    <Fragment>
      <h1 className="fl">Modifier la ressource {name}</h1>
      <NavMenu ressourceOid={ressourceOid} />
      <form>
        <MetaForm />
        <hr />
        <GroupContainer />
        <hr />
        <Editor
          change={change}
          setUpdateStoreFromEditor={setUpdateStoreFromEditor}
        />
        <div className="buttons-area">
          <button
            type="button"
            className="btn--primary"
            disabled={submitting}
            onClick={(e) => {
              e.persist()
              return Promise.resolve(updateStoreFromEditor())
                .then(() => handleSubmit(saveRessource)(e))
            }}
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Fragment>
  )
}

ResourceForm.propTypes = {
  initialValues: PropTypes.object,
  handleSubmit: PropTypes.func,
  change: PropTypes.func,
  submitting: PropTypes.bool,
  updateStoreFromEditor: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func,
  saveRessource: PropTypes.func
}

export default flowRight([
  resourceLoader,
  resourceSaver,
  renameProp('ressource', 'initialValues'),
  reduxForm({form: 'ressource'})
])(ResourceForm)
