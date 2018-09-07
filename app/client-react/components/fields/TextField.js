import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import TextEditor from './inputs/TextEditor'
import addLabel from './hoc/addLabel'

const TextField = ({name, onValidate, mode}) => (
  <Field
    name={name}
    onValidate={onValidate}
    component={TextEditor}
    mode={mode}
  />
)

TextField.propTypes = {
  mode: PropTypes.string,
  name: PropTypes.string,
  onValidate: PropTypes.func
}

export default addLabel(TextField, 'div')
