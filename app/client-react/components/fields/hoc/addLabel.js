import PropTypes from 'prop-types'
import React, {Component} from 'react'

/**
 * High Order Component qui ajoute le label autour du WrappedComponent
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const addLabel = (WrappedComponent, Tag = 'label') => {
  class AddLabel extends Component {
    render () {
      const {className, label, info, name} = this.props
      const classList = []
      if (className) classList.push(className)
      if (Tag !== 'label') classList.push('label')

      return (
        <Tag
          className={classList.join(' ')}
          data-fieldname={name}
        >
          {label} {info && (<i>{info}</i>)}
          <WrappedComponent {...this.props} />
        </Tag>
      )
    }
  }

  AddLabel.propTypes = {
    className: PropTypes.string,
    info: PropTypes.string,
    label: PropTypes.string,
    name: PropTypes.string
  }

  return AddLabel
}

export default addLabel
