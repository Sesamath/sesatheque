import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import JsonEditor from './inputs/JsonEditor'
import addLabel from './hoc/addLabel'

const JsonField = ({name}) => (
  <Field
    name={name}
    component={JsonEditor}
  />
)

JsonField.propTypes = {
  name: PropTypes.string
}

export default addLabel(JsonField)
