import PropTypes from 'prop-types'
import React from 'react'
import {editable, listes} from '../../../server/ressource/config'
import SelectField from './SelectField'

const types = {}
Object.keys(editable).forEach(k => {
  if (editable[k]) types[k] = listes.type[k]
})

const ResourceTypesField = ({
  label,
  disabled = false,
  optional = false
}) => (
  <SelectField
    label={label}
    values={types}
    disabled={disabled}
    optional={optional}
    name="type" />
)

ResourceTypesField.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  optional: PropTypes.bool
}

export default ResourceTypesField
