import {connect} from 'react-redux'
import {addNotification} from '../actions/notifications'

const mapDispatchToProps = (dispatch) => ({
  notify: (notification) => {
    dispatch(addNotification(notification))
  }
})

export default connect(null, mapDispatchToProps)
