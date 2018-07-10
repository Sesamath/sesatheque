import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {labels} from '../../server/ressource/config'
import listes from '../utils/listesFromConfig'
import {SelectField} from './fields'

const Classification = ({detailed}) => (
  <fieldset>
    <div className="grid-4">
      <SelectField
        name="categories"
        label={labels.categories}
        options={listes.categories}
        multi
      />
      <SelectField
        name="niveaux"
        label={labels.niveaux}
        options={listes.niveaux}
        multi
      />
      {detailed ? (
        <Fragment>
          <SelectField
            name="typePedagogiques"
            label={labels.typePedagogiques}
            options={listes.typePedagogiques}
            multi
          />
          <SelectField
            name="typeDocumentaires"
            label={labels.typeDocumentaires}
            options={listes.typeDocumentaires}
            multi
          />
        </Fragment>
      ) : null}
    </div>
  </fieldset>
)

Classification.propTypes = {
  detailed: PropTypes.bool
}

export default Classification
