Tests de la bibliothèque
------------------------

Il y a déjà `./script/run_tests -a` pour tester le code serveur et l'api

Pour tester le js client, en attendant d'écrire de vrais tests phantomjs (ou casper ou autre), on a quelque pages html.
* iframe.html?domain=bibliotheque.sesamath.net&id=em/42 chargement en iframe de id sur domain
* iframe.html?domain=bibliotheque.sesamath.net&id=em/42 chargement via appel js (apiClient+display)

Pour compiler les js de test, lancer `./script/build_tests -a`

