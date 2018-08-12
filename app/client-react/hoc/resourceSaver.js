import {connect} from 'react-redux'
import {saveRessource} from '../actions/ressource'

const mapDispatchToProps = (dispatch) => ({
  saveRessource: (values, success) => dispatch(saveRessource(values, success))
})

export default connect(
  null,
  mapDispatchToProps
)
