import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {removeNotification} from '../actions/notifications'

const levelToClass = {
  info: 'info',
  warning: 'warning',
  error: 'danger'
}

const Notifications = ({notifications, clear}) => (
  <div className="notifications">
    {notifications.map(({
      message,
      level,
      id
    }) => (
      <div onClick={() => clear(id)} key={id.toString()} className={`notification alert--${levelToClass[level]}`}>
        <i className="fa fa-times" />
        <p>{message}</p>
      </div>
    ))}
  </div>
)

Notifications.propTypes = {
  notifications: PropTypes.array,
  clear: PropTypes.func
}

const mapStateToProps = ({notifications}) => ({
  notifications
})

const mapDispatchToProps = (dispatch) => ({
  clear: (id) => {
    dispatch(removeNotification(id))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Notifications)
