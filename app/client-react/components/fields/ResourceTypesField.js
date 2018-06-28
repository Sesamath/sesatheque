import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import {editable, listes} from '../../../server/ressource/config'
import SelectField from './SelectField'

/**
 * Les types éditables à mettre dans le select (en fait les types des ressources que l'on peut créer,
 * car si on est admin ou éditeur toutes les ressources existantes sont éditables)
 * @type {object} la liste type=>label
 */
const types = {}
Object.keys(editable).forEach(k => {
  if (editable[k]) types[k] = listes.type[k]
})
// Le label d'un type, à mettre dans un input disabled pour afficher
// le bon type d'une ressource "non éditable"
const typeToLabel = (type) => listes.type[type]

const ResourceTypesField = ({
  label,
  disabled = false,
  optional = false
}) => {
  if (disabled) {
    // on rend un champ texte, vu qu'il n'est pas modifiable, mais on garde un Field
    // pour le moment pour avoir le même look
    return (
      <Field
        name="type"
        component="input"
        type="text"
        disabled
        format={typeToLabel}
      />
    )
  }
  // sinon c'est du select classique
  return (
    <SelectField
      label={label}
      values={types}
      disabled={disabled}
      optional={optional}
    />
  )
}

ResourceTypesField.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  optional: PropTypes.bool
}

export default ResourceTypesField
