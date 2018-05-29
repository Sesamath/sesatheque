import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const IEP_Editor = () => (
  <div>
    <label htmlFor="iep-editor-width">largeur (en pixel)</label>
    <div>
      <Field
        id="iep-editor-width"
        name="parametres[width]"
        component="input"
        type="number"
      />
    </div>
    <label htmlFor="iep-editor-height">hauteur (en pixel)</label>
    <div>
      <Field
        id="iep-editor-height"
        name="parametres[height]"
        component="input"
        type="number"
      />
    </div>
  </div>
)

export default IEP_Editor
