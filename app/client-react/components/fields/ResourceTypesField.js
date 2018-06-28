import PropTypes from 'prop-types'
import React from 'react'
import {editable, listes} from '../../../server/ressource/config'
import SelectField from './SelectField'

/**
 * Les types éditables à mettre dans le select (en fait les types des ressources que l'on peut créer,
 * car si on est admin ou éditeur toutes les ressources existantes sont éditables)
 * @type {object} la liste type=>label
 */
const editableTypes = {}
const allTypes = {}
Object.keys(editable).forEach(k => {
  const label = listes.type[k]
  if (editable[k]) editableTypes[k] = label
  allTypes[k] = label
})

const ResourceTypesField = ({
  children,
  label,
  disabled = false,
  optional = false
}) => (
  <SelectField
    name="type"
    label={label}
    values={disabled ? allTypes : editableTypes}
    disabled={disabled}
    optional={optional}
  >
    {children}
  </SelectField>
)

ResourceTypesField.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  optional: PropTypes.bool,
  children: PropTypes.node
}

export default ResourceTypesField
