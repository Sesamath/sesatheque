// un loader webpack ordinaire exporte une fonction qui retourne du code js (en string)
// commençant par `module.exports = …`
// Ici on exporte un loader webpack qui throw si on l'appelle
module.exports = function () {
  throw new Error(`require d’un fichier protégé interdit via webpack`)
}
