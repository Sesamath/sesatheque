import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {reduxForm} from 'redux-form'
import {Prompt} from 'react-router'
import MetaForm from './MetaForm'
import EditorArbre from './EditorArbre'
import EditorEcjs from './EditorEcjs'
import EditorExternal from './EditorExternal'
import EditorIep from './EditorIep'
import EditorJ3p from './EditorJ3p'
import EditorMathGraph from './EditorMathGraph'
import EditorSimple from './EditorSimple'
import EditorUrl from './EditorUrl'
import GroupContainer from './GroupContainer'
import aliasForker from '../hoc/aliasForker'
import resourceLoader from '../hoc/resourceLoader'
import resourceSaver from '../hoc/resourceSaver'
import ensureLogged from '../hoc/ensureLogged'
import NavMenu from './NavMenu'
import validate from '../utils/validate'

const typeToData = {
  arbre: EditorArbre,
  calkc: EditorSimple,
  ec2: EditorSimple,
  ecjs: EditorEcjs,
  iep: EditorIep,
  j3p: EditorJ3p,
  mathgraph: EditorMathGraph,
  mental: EditorSimple,
  poseur: EditorSimple,
  tep: EditorSimple,
  url: EditorUrl
}

const ResourceForm = ({
  initialValues: {
    type,
    oid: ressourceOid,
    titre,
    _droits: droits
  },
  handleSubmit,
  change,
  submitting,
  updateStoreFromEditor,
  setUpdateStoreFromEditor,
  saveRessource,
  pristine
}) => {
  const Editor = typeToData[type] || EditorExternal

  return (
    <Fragment>
      <NavMenu
        titre={`Modifier la ressource « ${titre} »`}
        ressourceOid={ressourceOid}
        droits={droits}
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
      <Prompt
        when={!pristine}
        message="Il existe des changements non sauvegardés sur le formulaire, êtes vous sûr de vouloir changer de page ?"
      />
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
  pristine: PropTypes.bool
}

export default ensureLogged(
  resourceLoader(
    aliasForker(
      resourceSaver(
        renameProp('ressource', 'initialValues')(
          reduxForm({form: 'ressource', validate})(ResourceForm)
        )
      )
    )
  )
)
