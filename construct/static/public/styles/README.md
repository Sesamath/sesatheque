Les styles de la Sésathèque
===========================

Sesatheque utilise le micro framework [knacss](http://knacss.com/) sous licence [WTFPL](http://www.wtfpl.net/), 
avec les icones [material design](http://google.github.io/material-design-icons/) sous licence [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
et la police [roboto](https://github.com/google/fonts/tree/master/apache/roboto) sous licence [Apache v2](http://www.apache.org/licenses/LICENSE-2.0.html)

Knacss
------

Récupération des sources et duplication des less chez nous sans leur namespace

```bash
# installe les sources dans construct/static/public/vendors/knacss
bower install knacss

# on veut récupérer les sources less sans namespace pour pouvoir les utiliser en mixin 
# (sinon impossible de faire du .foo {.@{kna-namespace}bar()})
cd construct/static/public
[ -d ] styles/knacssSrc || mkdir styles/knacssSrc
for f in vendors/knacss/less/*.less; do sed -e 's/@{kna-namespace}//g' $f > styles/knacssSrc/$(basename $f); done
```

On précisera ce que l'on inclue dans notre construct/static/public/styles/page.less (dérivé de construct/static/public/vendors/knacss/less/knacss.less)
avec nos définitions de styles propres à sesatheque dans construct/static/public/styles/sesatheque.less

Utilisation locale des polices google
-------------------------------------

Pour récupérer localement les icones material design et la police roboto 

```bash
cd construct/static/public/styles/fonts

# On récupère les polices MaterialIcons
for e in eot ttf woff woff2; do wget -O MaterialIcons-Regular.$e https://github.com/google/material-design-icons/blob/master/iconfont/MaterialIcons-Regular.$e?raw=true; done

# polices roboto
# Dans le dossier styles/fonts, pour récupérer la police roboto on récupère le css de google
wget -O ../roboto.css https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&lang=en

# On va chercher les fonts qui sont dedans
sed -ne "/fonts.gstatic.com/ s/.*local('\([^']*\)'), url(\(.*\)) format.*$/wget \2 -O fonts\/\1.ttf/p" ../roboto.css|sh

# On génère notre less pour les utiliser localement (ATTENTION, cette commande écrase le ../_00-roboto.less existant
echo "/* Cf README pour la récupération des fichiers de police et la génération de ce fichier */" > ../_00-roboto.less
sed -e "/fonts.gstatic.com/ s/local('\(.*\)'), url(\(.*\)) format/local('\1'), url(\/styles\/fonts\/\1.ttf) format/" ../roboto.css >> ../_00-roboto.less
# On efface le fichier récupéré qui n'était qu'intermédiaire
rm ../roboto.css
```

Personnalisation
----------------

Pour changer les couleurs et les tailles, modifier _00-config-sesatheque.less devrait suffire, 
et pour modifier le reste c'est dans sesatheque.less
