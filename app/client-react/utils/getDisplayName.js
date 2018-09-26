// https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging

const getDisplayName = WrappedComponent =>
  WrappedComponent.displayName ||
  WrappedComponent.name ||
  'Component'

export default getDisplayName
