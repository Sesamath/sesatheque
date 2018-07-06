import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {listes, listesOrdonnees, labels} from '../../server/ressource/config'
import MultiSelectField from './fields/MultiSelectField'

const categories = {
  name: 'categories',
  title: labels.categories,
  values: Object.keys(listes.categories).map((n, index) => ({
    label: listes.categories[n],
    value: index
  }))
}

const niveaux = {
  name: 'niveaux',
  title: labels.niveaux,
  values: listesOrdonnees.niveaux.map(n => ({
    label: listes.niveaux[n],
    value: n
  }))
}

const typePedagogiques = {
  name: 'typePedagogiques',
  title: labels.typePedagogiques,
  values: listesOrdonnees.typePedagogiques.map(n => ({
    label: listes.typePedagogiques[n],
    value: n
  }))
}

const typeDocumentaires = {
  name: 'typeDocumentaires',
  title: labels.typeDocumentaires,
  values: listesOrdonnees.typeDocumentaires.map(n => ({
    label: listes.typeDocumentaires[n],
    value: n
  }))
}

const Classification = ({detailed}) => (
  <fieldset>
    <div className="grid-4">
      <MultiSelectField
        name={categories.name}
        label={categories.title}
        placeholder={categories.title}
        options={categories.values}
      />
      <MultiSelectField
        name={niveaux.name}
        label={niveaux.title}
        placeholder={niveaux.title}
        options={niveaux.values}
      />
      {detailed ? (
        <Fragment>
          <MultiSelectField
            name={typePedagogiques.name}
            label={typePedagogiques.title}
            placeholder={typePedagogiques.title}
            options={typePedagogiques.values}
          />
          <MultiSelectField
            name={typeDocumentaires.name}
            label={typeDocumentaires.title}
            placeholder={typeDocumentaires.title}
            options={typeDocumentaires.values}
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
