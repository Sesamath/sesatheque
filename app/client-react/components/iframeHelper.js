import PropTypes from 'prop-types'
import React, {Component} from 'react'
import addNotifyToProps from '../utils/addNotifyToProps'

const iframeHelper = (WrappedComponent) => {
  class IframeHelper extends Component {
    constructor (props) {
      super(props)
      this.state = {
        getParametres: null
      }
    }

    onLoadCb (updateStoreFromEditor) {
      return (error, getParametres) => {
        if (error) {
          return this.props.notify({
            level: 'error',
            message: `Une erreur s’est produite pendant le chargement de l’éditeur: ${error.message}`
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
