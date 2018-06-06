import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Field} from 'redux-form'
import Iframe from './Iframe'

class EditorJ3p extends Component {
  constructor (props) {
    super(props)
    this.iframe = React.createRef()
    this.onIframeMessage = this.onIframeMessage.bind(this)
  }

  onIframeMessage (action, data) {
    this.props.change('parametres', data.toString())
  }

  render () {
    return (
      <fieldset>
        <div>
          <label>Script
            <Field
              name="parametres"
              component="textarea"
              cols="80"
              rows="20"
            />
          </label>
          <Iframe
            ref={this.iframe}
            src="http://localhost:3001/test-receive.html" // @todo: Use J3P's URL
            onMessage={this.onIframeMessage}/>
        </div>
      </fieldset>
    )
  }
}

EditorJ3p.propTypes = {
  change: PropTypes.func
}

export default EditorJ3p
