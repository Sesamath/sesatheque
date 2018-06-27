import React from 'react'
import {formValues, Field} from 'redux-form'

/**
 * Formate un objet en string json (pretty)
 * @param {object|string} value Un objet (si string elle sera retournée telle quelle)
 * @return {string} La chaîne de caractères formattée en "pretty" json ({} si value n'était pas un objet stringifiable)
 */
function formatTextarea (value) {
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    console.error(error)
    return '{}'
  }
}

const EditorSimple = () => (
  <fieldset>
    <label>Paramètres
      <Field
        id="parametres"
        name="parametres"
        component="textarea"
        format={formatTextarea}
        cols="80"
        rows="20"
      />
    </label>
  </fieldset>
)

// on wrap dans reduxForm
export default formValues({parametres: 'parametres'})(EditorSimple)
