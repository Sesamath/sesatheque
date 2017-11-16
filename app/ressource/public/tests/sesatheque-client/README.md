Test de sesatheque-client
=========================

Compiler sesatheque-client.Test.js avec
```
alias browserify=chemin/vers/node_modules/.bin/browserify
for f in tests/*.test.js; do dst=tests/build/$(basename $f .test.js).bundle.js; echo -n "$dst "; browserify -o $dst -e $f && echo "ok" || echo "KO"; done
```

Ouvrir les tests/*.html dans un navigateur (copier le dossier tests dans un vrai serveur web car les appels ajax marchent pas en file://)
