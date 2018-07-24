import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import JsonEditor from './inputs/JsonEditor'
import addLabel from './hoc/addLabel'

const JsonField = ({name, onValidate}) => (
  <Field
    name={name}
    onValidate={onValidate}
    component={JsonEditor}
  />
)

JsonField.propTypes = {
  name: PropTypes.string,
  onValidate: PropTypes.func
}

export default addLabel(JsonField)
