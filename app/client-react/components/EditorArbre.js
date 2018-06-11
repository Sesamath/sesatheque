import PropTypes from 'prop-types'
import React, {Component} from 'react'
import Iframe from './Iframe'

class EditorArbre extends Component {
  constructor (props) {
    super(props)
    this.state = {
      importError: null
    }
  }

  onLoad (iframe) {
    this.iframe = iframe
  }

  render () {
    return (
      <fieldset>
        <Iframe
          change={this.props.change}
          onLoad={this.onLoad.bind(this)}
          src={require('../../client/plugins/arbre/iframe.html')}
        />
      </fieldset>
    )
  }
}

EditorArbre.propTypes = {
  change: PropTypes.func
}

export default EditorArbre
