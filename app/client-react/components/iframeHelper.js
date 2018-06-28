import PropTypes from 'prop-types'
import React, {Component} from 'react'
import addNotifyToProps from '../utils/addNotifyToProps'

/**
 * hoc qui ajoute les props onLoadCb et getParametres à WrappedComponent
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
     * Callback appelée par
     * @param updateStoreFromEditor
     * @return {Function}
     */
    onLoadCb (updateStoreFromEditor) {
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
          onLoadCb={this.onLoadCb.bind(this)}
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
