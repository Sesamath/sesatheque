Utilisation de MDL dans Sésathèque
==================================

MDL ([Material Design Lite](http://www.getmdl.io/)) est un framework css basé sur les principes "[material design](http://google.com/design/spec)" de Google.

Les sources sont disponibles sur leur [dépôt github](https://github.com/google/material-design-lite) (sous licence libre apache v2).

Sésathèque utilise aussi les [icones du même nom](http://google.github.io/material-design-icons/) (sous licence CC-BY 4.0).

Utilisation locale
------------------

Pour récupérer localement la police roboto 

```bash
cd construct/static/public/mdl/fonts

# On récupère les polices MaterialIcons
for e in eot ttf woff woff2; do wget -O MaterialIcons-Regular.$e https://github.com/google/material-design-icons/blob/master/iconfont/MaterialIcons-Regular.$e?raw=true; done

# polices roboto
# Dans le dossier mdl/fonts, pour récupérer la police roboto on récupère le css de google
wget -O ../roboto.css https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&lang=en

# On va chercher les fonts qui sont dedans
sed -ne "/fonts.gstatic.com/ s/.*local('\([^']*\)'), url(\(.*\)) format.*$/wget \2 -O fonts\/\1.ttf/p" ../roboto.css|sh

# On génère le css pour les utiliser localement (qu'il faut coller dans mdl/localfont.css)
sed -e "/fonts.gstatic.com/ s/local('\(.*\)'), url(\(.*\)) format/local('\1'), url(\/mdl\/fonts\/\1.ttf) format/" ../roboto.css
```

Personnalisation
----------------

Pour changer les couleurs, on peut en choisir dans ce que propose le [générateur](http://www.getmdl.io/customize/index.html) et copier le résultat dans mdl/material.min.css, ou bien récupérer les sources et les personnaliser.

```bash
# dans un dossier quelconque hors sesatheque
git clone https://github.com/google/material-design-lite.git material-design-lite
cd material-design-lite
npm install
# en juillet 2015 il y avait un pb de dépendance entre gulp-mocha-phantomjs et phantomjs, cette commande a réglé le pb
npm install gulp-mocha-phantomjs@0.8.0 --save-dev && npm install
# pour installer gulp (remplacer "-g" par "--save-dev" pour l'installer dans node_modules et pas globalement)
npm install -g gulp

# modifier src/_variables.scss
# générer material.min.css avec ces nouvelles valeurs
gulp

# copier dist/material.min.css et dist/material.min.js dans le dossier construct/static/public/mdl/ de sesatheque
```
