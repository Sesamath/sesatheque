import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {saveRessource} from '../actions/ressource'

const mapDispatchToProps = {
  saveRessource
}

/**
 * High Order Component qui fournit updateStoreFromEditor et setUpdateStoreFromEditor à
 * WrappedComponent (ResourceEditor éventuellement wrappé par un autre hoc)
 * Son state stocke la fct updateStoreFromEditor pour la ressource en cours d'édition
 * @param WrappedComponent
 * @return {*}
 */
const resourceSaver = (WrappedComponent) => {
  class ResourceSaver extends Component {
    constructor (props) {
      super(props)
      this.state = {
        updateStoreFromEditor: () => {}
      }
    }

    /**
     * Au chargement d'un éditeur en iframe, on lui passe cette fonction
     * pour qu'il nous donne une fonction à rappeler quand on voudra récupérer ses valeurs.
     * On met cette fonction dans notre state
     * @param {function} updateStoreFromEditor
     */
    setUpdateStoreFromEditor (updateStoreFromEditor) {
      this.setState({
        updateStoreFromEditor
      })
    }

    render () {
      return (
        <WrappedComponent
          setUpdateStoreFromEditor={this.setUpdateStoreFromEditor.bind(this)}
          updateStoreFromEditor={this.state.updateStoreFromEditor}
          {...this.props}
        />
      )
    }
  }

  ResourceSaver.propTypes = {
    saveRessource: PropTypes.func
  }

  return connect(
    null,
    mapDispatchToProps
  )(ResourceSaver)
}

export default resourceSaver
