import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {labels} from '../../server/ressource/config'
import listes from '../utils/listesFromConfig'
import {SelectField} from './fields'

/**
 * Pure component pour afficher les select multiples categories, niveaux, typePedagogiques, typeDocumentaires.
 * Doit être dans un redux-form
 * @type {PureComponent}
 * @param {object} props
 * @param {boolean} props.detailed
 */
const Classification = ({detailed}) => (
  <fieldset>
    <div className="grid-4">
      <SelectField
        name="categories"
        label={labels.categories}
        options={listes.categories}
        isMulti
      />
      <SelectField
        name="niveaux"
        label={labels.niveaux}
        options={listes.niveaux}
        isMulti
      />
      {detailed ? (
        <Fragment>
          <SelectField
            name="typePedagogiques"
            label={labels.typePedagogiques}
            options={listes.typePedagogiques}
            isMulti
          />
          <SelectField
            name="typeDocumentaires"
            label={labels.typeDocumentaires}
            options={listes.typeDocumentaires}
            isMulti
          />
        </Fragment>
      ) : null}
    </div>
  </fieldset>
)

Classification.propTypes = {
  /** Si true, affiche typePedagogiques et typeDocumentaires */
  detailed: PropTypes.bool
}
Classification.defaultProps = {
  detailed: false
}

export default Classification
