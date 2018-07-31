import React from 'react'
import {TextField} from './fields'

const EditorSimple = () => (
  <fieldset>
    <TextField
      label="Paramètres"
      name="parametres"
      mode="json"
    />
  </fieldset>
)

export default EditorSimple
