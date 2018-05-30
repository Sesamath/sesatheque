import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const IEP_Editor = () => (
  <div className="grid-3">
    <label>
      Largeur (en pixel)
      <Field
        name="parametres[width]"
        component="input"
        type="number"
      />
    </label>
    <label>
      Hauteur (en pixel)
      <Field
        name="parametres[height]"
        component="input"
        type="number"
      />
    </label>
  </div>
)

export default IEP_Editor
