const checkBrowser = () => {
  if (
    typeof Function.prototype.bind !== 'function' ||
    typeof window.addEventListener !== 'function' ||
    typeof window.XMLHttpRequest === 'undefined' || // vire IE ≤ 10
    typeof window.addEventListener === 'undefined' || // vire IE ≤ 10
    !Function.prototype.bind || // => vire IE ≤ 8
    !Array.prototype.forEach ||
    !Array.isArray // => vire IE ≤ 8
  ) {
    window.location = '/navigateurObsolete'
  }
}

export default checkBrowser
