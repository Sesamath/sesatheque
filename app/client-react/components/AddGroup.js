import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {addGroupe} from '../actions/session'

/**
 * Input pour ajouter un groupe
 */
const AddGroupe = ({
  saveGroupe
}) => {
  let groupeInput = null

  return (
    <div className="grid-3">
      <label>
        Créer un nouveau groupe
        <input
          type="text"
          ref={input => { groupeInput = input }}
        />
      </label>
      <label>
        <br />
        <button
          type="button"
          className="btn--success"
          onClick={() => saveGroupe(groupeInput)}>Créer le groupe</button>
      </label>
    </div>
  )
}

AddGroupe.propTypes = {
  /** dispatch l'actionCreator addGroupe (fourni par connect(mapDispatchToProps)) */
  saveGroupe: PropTypes.func
}

const mapDispatchToProps = (dispatch) => ({
  saveGroupe: (input) =>
    dispatch(addGroupe(input.value))
      .then(() => {
        input.value = ''
      })
      .catch((err) => {
        console.error(err)
      })
})

export default connect(
  null,
  mapDispatchToProps
)(AddGroupe)
