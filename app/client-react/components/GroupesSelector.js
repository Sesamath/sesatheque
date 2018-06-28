import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import SingleCheckboxForGroups from './SingleCheckboxForGroups'

const GroupesSelector = ({
  groupesList,
  names,
  ...fields
}) => (
  <div>
    <label>Publication dans les groupes</label>
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Nom du groupe</th>
          <th scope="col">Publié dans ce groupe</th>
          <th scope="col">Les membres du groupe peuvent modifier cette ressource</th>
        </tr>
      </thead>
      <tbody>
        {groupesList.map((groupeName, index) => (
          <tr key={groupeName}>
            <td>{groupeName}</td>
            {names.map((name, index) => {
              const {value, onChange} = fields[name].input
              return (
                <td key={index.toString()}>
                  <SingleCheckboxForGroups
                    name={name}
                    value={groupeName}
                    inputValue={value}
                    onChange={onChange}
                  />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

GroupesSelector.propTypes = {
  groupesList: PropTypes.arrayOf(PropTypes.string),
  names: PropTypes.arrayOf(PropTypes.string),
  fields: PropTypes.object
}

const mapStateToProps = (state) => ({
  groupesList: (state.personne && state.personne.groupesMembre) || []
})

export default connect(
  mapStateToProps
)(GroupesSelector)
