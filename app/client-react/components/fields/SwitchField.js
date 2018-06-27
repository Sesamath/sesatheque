import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const SwitchField = ({label, name}) => (
  <Fragment>
    <label>
      {label}
      <Field
        name={name}
        component="input"
        type="checkbox"
        className="switch" />
    </label>
  </Fragment>
)

SwitchField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string
}

export default SwitchField
