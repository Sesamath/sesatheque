import {editable, listes, listesOrdonnees, labels} from '../../server/ressource/config'
import {Field} from 'redux-form'
import CheckboxGroup from './CheckboxGroup'
import React, {Fragment} from 'react'

const categories = {
  name: 'categories',
  title: labels.categories,
  values: Object.entries(listes.categories)
}

const niveaux = {
  name: 'niveaux',
  title: labels.niveaux,
  values: listesOrdonnees.niveaux.map(n => [n, listes.niveaux[n]])
}

const typePedagogiques = {
  name: 'typePedagogiques',
  title: labels.typePedagogiques,
  values: listesOrdonnees.typePedagogiques.map(n => [n, listes.typePedagogiques[n]])
}

const typeDocumentaires = {
  name: 'typeDocumentaires',
  title: labels.typeDocumentaires,
  values: listesOrdonnees.typeDocumentaires.map(n => [n, listes.typeDocumentaires[n]])
}

const parseInteger = (string) => parseInt(string, 10)

const Classification = ({detailled}) => (
  <Fragment>
    <fieldset>
      <div className="grid-4">
        <Field
          parseValue={parseInteger}
          component={CheckboxGroup}
          {...categories}
        />
        <Field
          component={CheckboxGroup}
          {...niveaux}
        />
        {detailled ? (
          <Fragment>
            <Field
              parseValue={parseInteger}
              component={CheckboxGroup}
              {...typePedagogiques}
            />
            <Field
              parseValue={parseInteger}
              component={CheckboxGroup}
              {...typeDocumentaires}
            />
          </Fragment>
        ) : null}
      </div>
    </fieldset>
  </Fragment>
)

export default Classification
