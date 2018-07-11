import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {reduxForm} from 'redux-form'
import {
  SwitchField,
  InputField,
  TextareaField
} from './fields'

const GroupeEdition = ({
  handleSubmit,
  submitting
}) => (
  <Fragment>
    <h1>Ajouter un groupe</h1>
    <form onSubmit={handleSubmit}>
      <fieldset>
        <InputField
          label="Nom du groupe"
          name="nom"
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
          <span className="remarque">(Tout le monde pourra s'inscrire au suivi des publications du groupe)</span>
        </div>
      </fieldset>
      <hr />
      <div className="buttons-area">
        <button
          type="submit"
          className="btn--primary"
          disabled={submitting}
        >
          Créer le groupe
        </button>
      </div>
    </form>
  </Fragment>
)

export default reduxForm({
  form: 'groupe-edition',
  onSubmit: (values) => {console.log(values)}
})(GroupeEdition)
