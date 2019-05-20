/**
 * Retourne true si la string passée en paramètre est un pid plausible
 * @param {string} pid
 * @return {boolean}
 */
function looksLikePid (pid) {
  if (typeof pid !== 'string') return false
  return /[a-zA-Z0-9]+\/[a-zA-Z0-9]+/.test(pid)
}

module.exports = {
  looksLikePid
}
