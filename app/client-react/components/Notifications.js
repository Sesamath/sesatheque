import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {removeNotification} from '../actions/notifications'

const levelToClass = {
  info: 'info',
  warning: 'warning',
  error: 'danger'
}

const levelToIcon = {
  info: 'info-circle',
  warning: 'exclamation-circle',
  error: 'exclamation-triangle'
}

const Notifications = ({notifications, clear}) => (
  <div className="notifications">
    {notifications.map(({
      message,
      level,
      id
    }) => (
      <div onClick={() => clear(id)} key={id.toString()} className={`notification alert--${levelToClass[level]}`}>
        <div>
          <i className={`left fa fa-${levelToIcon[level]}`} />
          <p>{message}</p>
        </div>
        <i className="right fa fa-times" />
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
