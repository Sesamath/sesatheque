import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {reduxForm} from 'redux-form'
import {Prompt} from 'react-router'
import MetaForm from './MetaForm'
import EditorSimple from './EditorSimple'
import GroupContainer from './GroupContainer'
import aliasForker from '../hoc/aliasForker'
import resourceLoader from '../hoc/resourceLoader'
import resourceSaver from '../hoc/resourceSaver'
import ensureLogged from '../hoc/ensureLogged'
import NavMenu from './NavMenu'
import commonValidate from '../utils/validate'
import editors from 'plugins/editors'

const validate = (values) => {
  const errors = commonValidate(values)
  const {type} = values
  const typeValidate = editors[type] && editors[type].validate
  if (typeValidate) {
    typeValidate(values, errors)
  }
  return errors
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
  pristine,
  initialize
}) => {
  const Editor = (editors[type] && editors[type].editor) || EditorSimple

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
                .then(() => handleSubmit(
                  values => saveRessource(values, initialize))(e))
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
  pristine: PropTypes.bool,
  initialize: PropTypes.func
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
