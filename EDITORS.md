Webstorm
========

Pour configurer standard avec webstorm https://github.com/feross/standard/blob/master/docs/webstorm.md

Il y a semble t'il un pb avec les réglages eslint, il utilise la commande eslint et pas la commande standard, donc la
 conf package.json:standard est ignorée, et mettre du package.json:eslintConfig désactive le plugin de vérif dans 
 westorm ! Ajouter des .eslintrc aussi, ce qui est gênant pour mettre des règles spécifiques par dossier (pour 
 app/srcClient par ex), du coup on ajoute dans les settings 
* extra eslint options : --plugin eslint-plugin-standard --global "lassi, log, isProd"

 
 
