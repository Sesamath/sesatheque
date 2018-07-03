import PropTypes from 'prop-types'
import React from 'react'
import {editable, listes} from '../../../server/ressource/config'
import SelectField from './SelectField'

const {type: allTypes} = listes

/**
 * Les types éditables à mettre dans le select (en fait les types des ressources que l'on peut créer,
 * car si on est admin ou éditeur toutes les ressources existantes sont éditables)
 * @type {object} la liste type=>label
 */
const editableTypes = {}
Object.keys(allTypes).forEach(k => {
  if (editable[k]) editableTypes[k] = allTypes[k]
})

const ResourceTypesField = ({
  children,
  label,
  editable = false,
  disabled = false
}) => (
  <SelectField
    name="type"
    label={label}
    values={editable ? editableTypes : allTypes}
    disabled={disabled}
  >
    {children}
  </SelectField>
)

ResourceTypesField.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  editable: PropTypes.bool,
  children: PropTypes.node
}

export default ResourceTypesField
