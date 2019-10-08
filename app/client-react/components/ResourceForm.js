import {identity} from 'lodash'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {withProps} from 'recompose'
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
import onSubmitFail from '../utils/onSubmitFail'
import commonValidate from '../utils/ressourceValidate'
import getEditor from 'plugins/editors'

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
  const {editor: Editor = EditorSimple} = getEditor(type)

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
  pristine: PropTypes.bool
}

const validate = (values) => {
  const errors = commonValidate(values)
  const {type} = values
  const {validate: typeValidate} = getEditor(type)
  if (typeValidate) {
    console.log(`pour le type ${type} on a un validate`)
    typeValidate(values, errors)
  }
  console.log(`pour le type ${type} on retourne les erreurs de validation`, errors)
  return errors
}

const onSubmit = (values, dispatch, {saveRessource}) => {
  const {saveHook = identity} = getEditor(values.type)

  return saveRessource(saveHook(values), (savedRessource) => {
    // On notifie le parent concernant la mise à jour de la ressource
    if (parent !== window && parent.postMessage) {
      const parsedQuery = parse(window.location.search)
      if (parsedQuery.closerId) {
        // @todo harmoniser ces préfixes _ retournés par l'api pour mettre du $ partout (maintenant qu'on passe plus par context.rest qui les virait)
        const ressource = {...savedRessource}
        delete ressource._droits
        ressource.$droits = savedRessource._droits
        parent.postMessage({
          action: 'iframeCloser',
          id: parsedQuery.closerId,
          ressource
        }, '*')
      }
    }
  })
}

const propsAfterLoadHook = ({ressource}) => {
  const {loadHook = identity} = getEditor(ressource.type)

  return {
    initialValues: loadHook(ressource)
  }
}
const formDef = {
  form: 'ressource',
  validate,
  onSubmit,
  onSubmitFail,
  enableReinitialize: true
}
const formComponent = reduxForm(formDef)(ResourceForm)

export default ensureLogged(
  resourceLoader(
    aliasForker( // fork si on édite un alias
      resourceSaver( // fournit saveRessource
        withProps(propsAfterLoadHook)(formComponent)
      )
    )
  )
)
