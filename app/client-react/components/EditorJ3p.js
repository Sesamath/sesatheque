import PropTypes from 'prop-types'
import React, {Component} from 'react'
import Iframe from './Iframe'

class EditorJ3p extends Component {
  constructor (props) {
    super(props)
    this.iframe = React.createRef()
  }

  onLoad () {
    this.iframe.current.iframe.current.contentWindow.load()
  }

  render () {
    return (
      <fieldset>
        <div>
          <Iframe
            allowManualEdition
            change={this.props.change}
            onLoad={this.onLoad.bind(this)}
            ref={this.iframe}
            src={require('../../client/plugins/j3p/editgraphe.html')} // @todo: Use J3P's URL
          />
        </div>
      </fieldset>
    )
  }
}

EditorJ3p.propTypes = {
  change: PropTypes.func
}

export default EditorJ3p
