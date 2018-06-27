import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {Fields} from 'redux-form'
import AddGroup from './AddGroup'
import GroupesSelector from './GroupesSelector'

let GroupContainer = ({groupesList}) => (
  <fieldset>
    {groupesList.length ? (
      <Fields
        names={['groupes', 'groupesAuteurs']}
        component={GroupesSelector}
        groupesList={groupesList}
      />
    ) : (
      <p>Vous n’êtes membre d’aucun groupe (pour y publier cette ressource ou déléguer des droits de modification)</p>
    )}
    <AddGroup />
  </fieldset>
)

GroupContainer.propTypes = {
  groupesList: PropTypes.arrayOf(PropTypes.string)
}

const mapStateToProps = (state) => ({
  groupesList: (state.personne && state.personne.groupesMembre) || []
})

export default connect(mapStateToProps)(GroupContainer)
