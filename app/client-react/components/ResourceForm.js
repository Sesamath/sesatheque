import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {flowRight} from 'lodash'
import {reduxForm} from 'redux-form'
import MetaForm from './MetaForm'
import EditorArbre from './EditorArbre'
import EditorExternal from './EditorExternal'
import EditorIep from './EditorIep'
import EditorJ3p from './EditorJ3p'
import EditorMathGraph from './EditorMathGraph'
import EditorSimple from './EditorSimple'
import GroupContainer from './GroupContainer'
import aliasForker from '../hoc/aliasForker'
import resourceLoader from '../hoc/resourceLoader'
import resourceSaver from '../hoc/resourceSaver'
import NavMenu from './NavMenu'

const typeToData = {
  arbre: EditorArbre,
  calkc: EditorSimple,
  ec2: EditorSimple,
  iep: EditorIep,
  j3p: EditorJ3p,
  mathgraph: EditorMathGraph,
  mental: EditorSimple,
  poseur: EditorSimple,
  tep: EditorSimple
}

const ResourceForm = ({
  initialValues: {type, oid: ressourceOid, titre},
  handleSubmit,
  change,
  submitting,
  updateStoreFromEditor,
  setUpdateStoreFromEditor,
  saveRessource,
  history
}) => {
  const Editor = typeToData[type] || EditorExternal

  return (
    <Fragment>
      <h1 className="fl">Modifier la ressource « {titre} »</h1>
      <NavMenu
        history={history}
        ressourceOid={ressourceOid}
      />
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
  saveRessource: PropTypes.func,
  history: PropTypes.object
}

export default flowRight([
  resourceLoader,
  aliasForker,
  resourceSaver,
  renameProp('ressource', 'initialValues'),
  reduxForm({form: 'ressource'})
])(ResourceForm)
