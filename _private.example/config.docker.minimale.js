var path = require('path')

/**
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git,
 * dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 *
 * Il contient toutes les clés utilisées ou utilisables, certaines sont initialisées ici
 * avec leur valeur par défaut. Les clés obligatoires sont mentionnées
 *
 * Ce fichier devrait pouvoir être copié tel quel dans _private et fonctionner avec docker-compose.yml
 * (après avoir complété les champs obligatoires)
 *
 * Pour une paire de sesatheques global/private (avec docker-compose-for-sesalab.yml)
 * prendre les js de _private.exemple-docker-sesamath
 */
module.exports = {
  application: {
    mail: 'xxx', // OBLIGATOIRE
    staging: 'dev' // OBLIGATOIRE
  },

  // options pour les middlewares
  $rail: {
    cookie: {
      // à préciser avec une chaîne aléatoire complexe
      key: '' // OBLIGATOIRE
    },
    session: {
      // à préciser avec une chaîne aléatoire complexe
      secret: '' // OBLIGATOIRE
    }
  }
}

// pour ajouter le SSO Sésamath, il faut installer sesasso-bibli et l'ajouter dans son _private
// le plus simple est de conserver ce module hors node_modules
// (pour éviter qu'il se fasse dégager à chaque install),
// donc dans le dossier _private (il faut avoir les droits sur le dépôt qui n'est pas public)
// cd _private
// git clone git@src.sesamath.net:sesasso-bibli
// cd sesasso-bibli
// yarn install
//
// et ensuite ajouter dans ce fichier, au début
// const sesassoPath = path.resolve(__dirname, 'sesasso-bibli')
// et plus loin dans la config
// extraModules: [sesassoPath],
// ou bien (si on veut aussi du sso avec un sesalab)
// extraModules: [sesassoPath, 'sesalab-sso'],
// et
// extraDependenciesLast: ['sesasso-bibli'],
