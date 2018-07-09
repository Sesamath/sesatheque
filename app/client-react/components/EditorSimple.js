import React from 'react'
import {Field} from 'redux-form'
import {JsonEditor} from './fields'

const EditorSimple = () => (
  <fieldset>
    <label>Paramètres
      <Field
        name="parametres"
        component={JsonEditor}
      />
    </label>
  </fieldset>
)

export default EditorSimple
