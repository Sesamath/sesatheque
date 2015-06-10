Imports
=======

Voici la liste des scripts d'import (à réaliser plutôt dans cet ordre)

importMEPS
----------
Importe les em et am depuis les tables de mepcol 
(aka interface dev, principalement MEPS et AIDES mais pas seulement)

`node tasks/importMEPS.js`

importLabomep BIBS
------------------
importe le contenu de la table labomep.BIBS

`node tasks/importLabomep.js --bibs`

Atomes et compléments
---------------------
Les atomes (ressources.vign_atomes) et compléments (ressources.accomp) sont importés via un script php externe 
(mep-outils:/manuel_numerique/export2bibli.php)

importJ3pViaXml
---------------
importe tous les j3p trouvés dans arbresXml/exercices_interactifs.xml, avec les infos 
contenues dans BIBS et dans l'ancienne bibliotheque symfony

`node tasks/importJ3pViaXml.js`

importArbresXml
---------------
importe les arbres xml de labomep 
(tous les xml trouvés dans le sous-dossier arbresXml, les recopier avant dedans)

Le lancer après les autres imports (sauf persos qui est indépendant) pour éviter d'avoir des enfants inconnus

 `node tasks/importArbresXml.js`
 
importLabomep PERSOS
--------------------
 importe le contenu de la table labomep.PERSOS
 
 `node tasks/importLabomep.js --persos`
