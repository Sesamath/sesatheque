import PropTypes from 'prop-types'
import React, {Component} from 'react'

/**
 * High Order Component qui ajoute le label autour du WrappedComponent
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const addLabel = (WrappedComponent) => {
  class AddLabel extends Component {
    render () {
      const {className, label, info} = this.props

      return (
        <label className={className}>
          {label} {info && (<i>{info}</i>)}
          <WrappedComponent {...this.props} />
        </label>
      )
    }
  }

  AddLabel.propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    info: PropTypes.string
  }

  return AddLabel
}

export default addLabel
