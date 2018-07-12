import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {renameProp} from 'recompose'
import {reduxForm} from 'redux-form'
import {
  SwitchField,
  InputField,
  TextareaField,
  SelectField
} from './fields'
import ensureLogged from '../hoc/ensureLogged'
import groupeLoader from '../hoc/groupeLoader'

const GroupeEdition = ({
  initialValues: {oid, gestionnaires},
  handleSubmit,
  submitting,
  personne
}) => (
  <Fragment>
    <h1>{oid ? 'Modifier un groupe' : 'Ajouter un groupe'}</h1>
    <form onSubmit={handleSubmit}>
      <fieldset>
        <InputField
          label="Nom du groupe"
          name="nom"
          disabled={!!oid}
        />
        <TextareaField
          name="description"
          label="Description"
        />
        <div>
          <SwitchField
            name="ouvert"
            label="Ouvert à tous"
          />
          <span className="remarque">(Tout le monde pourra devenir membre du groupe)</span>
        </div>
        <div>
          <SwitchField
            name="public"
            label="Public"
          />
          <span className="remarque">(Tout le monde pourra s&apos;inscrire au suivi des publications du groupe)</span>
        </div>
        <label>
          Ajouter des gestionnaires
          <span className="remarque">(L&apos;ajout est irrévocable. Entrer un ou des identifiants séparés par des espaces, la confirmation sera demandée sur la page suivante avec les noms affichés)</span>

          <SelectField
            clearable={false}
            name="gestionnaires"
            options={[{
              value: personne.oid,
              label: `${personne.nom} ${personne.prenom} (${personne.oid})`,
              clearableValue: false
            }, {
              value: 'sfsfee43ewrsf',
              label: 'Marie Totote (wewedaa3434)'
            }]}
            multi
          />
        </label>
      </fieldset>
      <hr />
      <div className="buttons-area">
        <button
          type="submit"
          className="btn--primary"
          disabled={submitting}
        >
          {oid ? 'Modifier' : 'Créer le groupe'}
        </button>
      </div>
    </form>
  </Fragment>
)

GroupeEdition.propTypes = {
  initialValues: PropTypes.object,
  handleSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  personne: PropTypes.object
}

export default ensureLogged(
  groupeLoader(
    renameProp('groupe', 'initialValues')(
      reduxForm({
        form: 'groupe-edition',
        onSubmit: (values) => { console.log(values) }
      })(
        GroupeEdition
      )
    )
  )
)
