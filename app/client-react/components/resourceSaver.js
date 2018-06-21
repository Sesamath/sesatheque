import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {saveRessource} from '../actions/ressource'

const mapDispatchToProps = {
  saveRessource
}

const resourceSaver = (WrappedComponent) => {
  class ResourceSaver extends Component {
    constructor (props) {
      super(props)
      this.state = {
        syncFormStore: () => {}
      }
    }

    syncFormStoreRegister (syncFormStore) {
      this.setState({
        syncFormStore
      })
    }

    render () {
      return (
        <WrappedComponent
          syncFormStoreRegister={this.syncFormStoreRegister.bind(this)}
          syncFormStore={this.state.syncFormStore}
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
