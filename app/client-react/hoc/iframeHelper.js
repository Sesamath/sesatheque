import PropTypes from 'prop-types'
import React, {Component} from 'react'
import addNotifyToProps from './addNotifyToProps'

/**
 * hoc qui ajoute les props getLoadCb et getParametres à WrappedComponent
 * (avec )
 * @param WrappedComponent
 */
const iframeHelper = (WrappedComponent) => {
  class IframeHelper extends Component {
    constructor (props) {
      super(props)
      this.state = {
        getParametres: null
      }
    }

    /**
     * Callback à passer en 2e param de la fct load de l'iframe
     * @callback loadEditorCb
     * @param {Error} [error]
     * @param {function} getParametres qui permettra de récupérer les paramètres de l'éditeur graphique
     */
    /**
     * Retourne une callback à passer à la fct load de l'iframe
     * @param {function} updateStoreFromEditor La fonction qui met à jour parametres dans le store
     * @return {loadEditorCb}
     */
    getLoadCb (updateStoreFromEditor) {
      return (error, getParametres) => {
        if (error) {
          return this.props.notify({
            level: 'error',
            message: `Une erreur s’est produite pendant le chargement de l’éditeur : ${error}`
          })
        }
        this.setState({
          getParametres
        })
        this.props.setUpdateStoreFromEditor(updateStoreFromEditor)
      }
    }

    render () {
      return (
        <WrappedComponent
          getLoadCb={this.getLoadCb.bind(this)}
          getParametres={this.state.getParametres}
          {...this.props}
        />
      )
    }
  }

  IframeHelper.propTypes = {
    notify: PropTypes.func,
    setUpdateStoreFromEditor: PropTypes.func
  }

  return addNotifyToProps(IframeHelper)
}

export default iframeHelper
