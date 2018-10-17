import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import getDisplayName from '../../../utils/getDisplayName'

/**
 * High Order Component qui affiche les erreurs éventuelles du WrappedComponent
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const showInvalidField = (WrappedComponent, condition = 'touched') => {
  class ShowInvalidField extends Component {
    render () {
      const {meta: {[condition]: show, error}} = this.props

      return (
        <Fragment>
          <WrappedComponent {...this.props} />
          {show && error ? (
            <div
              className="validation-error alert--danger"
            >
              <i className="fa fa-exclamation-circle"></i>
              {error}
            </div>
          ) : null}
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
