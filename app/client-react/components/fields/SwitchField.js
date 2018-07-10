import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import Input from './inputs/Input'
import addLabel from './hoc/addLabel'

const SwitchField = ({name}) => (
  <Field
    name={name}
    component={Input}
    type="checkbox"
    className="switch"
  />
)

SwitchField.propTypes = {
  name: PropTypes.string
}

export default addLabel(SwitchField)
