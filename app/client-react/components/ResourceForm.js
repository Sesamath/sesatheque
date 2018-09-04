import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {reduxForm} from 'redux-form'
import {Prompt} from 'react-router'
import {parse} from 'query-string'

import MetaForm from './MetaForm'
import EditorSimple from './EditorSimple'
import GroupContainer from './GroupContainer'
import aliasForker from '../hoc/aliasForker'
import resourceLoader from '../hoc/resourceLoader'
import resourceSaver from '../hoc/resourceSaver'
import ensureLogged from '../hoc/ensureLogged'
import NavMenu from './NavMenu'
import commonValidate from '../utils/ressourceValidate'
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

const onSubmit = (values, dispatch, {saveRessource, initialize}) => saveRessource(values, (savedRessource) => {
  // On notifie le parent concernant la mise à jour de la ressource
  if (parent !== window && parent.postMessage) {
    const parsedQuery = parse(window.location.search)
    if (parsedQuery.closerId) {
      parent.postMessage({
        action: 'iframeCloser',
        id: parsedQuery.closerId,
        ressource: savedRessource
      }, '*')
    }
  }
  initialize(savedRessource)
})

const formDef = {
  form: 'ressource',
  validate,
  onSubmit
}

const ResourceForm = ({
  initialValues: {
    type,
    oid: ressourceOid,
    titre,
    _droits: droits
  },
  handleSubmit,
  submitting,
  pristine
}) => {
  const Editor = (editors[type] && editors[type].editor) || EditorSimple

  return (
    <Fragment>
      <NavMenu
        titre={`Modifier la ressource « ${titre} »`}
        ressourceOid={ressourceOid}
        droits={droits}
      />
      <form onSubmit={handleSubmit}>
        <MetaForm />
        <hr />
        <GroupContainer />
        <hr />
        <Editor />
        <div className="buttons-area">
          <button
            type="submit"
            className="btn--primary"
            disabled={submitting}
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
  submitting: PropTypes.bool,
  saveRessource: PropTypes.func,
  pristine: PropTypes.bool,
  initialize: PropTypes.func
}

export default ensureLogged(
  resourceLoader(
    aliasForker( // fork si on édite un alias
      resourceSaver( // fournit saveRessource
        renameProp('ressource', 'initialValues')(
          reduxForm(formDef)(ResourceForm)
        )
      )
    )
  )
)
