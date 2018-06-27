import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {Fields} from 'redux-form'
import AddGroup from './AddGroup'
import GroupesSelector from './GroupesSelector'

let GroupContainer = ({groupes}) => (
  <fieldset>
    {groupes.length ? (
      <Fields
        names={['groupes', 'groupesAuteurs']}
        component={GroupesSelector}
        groupes={groupes}
      />
    ) : (
      <p>Vous n’êtes membre d’aucun groupe (pour y publier cette ressource ou déléguer des droits de modification)</p>
    )}
    <AddGroup />
  </fieldset>
)

GroupContainer.propTypes = {
  groupes: PropTypes.arrayOf(PropTypes.string)
}

const mapStateToProps = (state) => ({
  groupes: (state.personne && state.personne.groupesMembre) || []
})

export default connect(mapStateToProps)(GroupContainer)
