import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import Warning from '../../Warning'
import getDisplayName from '../../../utils/getDisplayName'

/**
 * High Order Component qui affiche les erreurs éventuelles du WrappedComponent
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const showInvalidField = (WrappedComponent) => {
  class ShowInvalidField extends Component {
    render () {
      const {meta: {touched, error, warning}} = this.props

      return (
        <Fragment>
          <WrappedComponent {...this.props} />
          {touched && (error || warning) ? <Warning message={error || warning} /> : null}
        </Fragment>
      )
    }
  }

  ShowInvalidField.displayName = `showInvalidField(${getDisplayName(WrappedComponent)})`

  ShowInvalidField.propTypes = {
    meta: PropTypes.shape({
      touched: PropTypes.bool,
      error: PropTypes.string,
      warning: PropTypes.string
    })
  }

  return ShowInvalidField
}

export default showInvalidField
