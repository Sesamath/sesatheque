/**
 * Un module js pour remplacer console.log
 */

/*global define, require, log, addCss, container, errorsContainer, baseUrl, window */

// le module est une fonction
define(log);

function log(message, objToDump) {
  if (console && console.log) {
    console.log(message)
    if (objToDump) console.log(objToDump)
  }
}
