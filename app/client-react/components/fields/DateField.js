import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import Input from './inputs/Input'
import addLabel from './hoc/addLabel'

const format = (value) => moment(value).format('YYYY-MM-DD')

const DateField = ({
  className,
  label,
  name,
  disabled
}) => (
  <Field
    format={format}
    name={name}
    component={Input}
    type="date"
    disabled={disabled}
  />
)

DateField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool
}

export default addLabel(DateField)
