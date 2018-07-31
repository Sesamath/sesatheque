function chargeAideModeleAncien () {
  clearInterval(_level0.aide_charge);
  // @todo voir si on pourrait pas faire ici plutôt un appel http HEAD pour savoir si ça existe, et charger ensuite, plutôt que de déclencher plein de 404
  loadMovieNum("../aides/" + abreviationLangue + "/aide" + idAide + ".swf", 100);
}
function forcer_activer_suite () {
  if (_level0.btn.Suite_btn.enabled == false) {
    _level0.fonctions.activer_bouton("Suite");
  }
  return (true);
}
function forcer_activer_aide () {
  if (_level0.btn.Aide_btn.enabled == false) {
    _level0.fonctions.activer_bouton("Aide");
  }
  return (true);
}
// cette fonction envoie message au console.log js
function log2consoleJs (message) {
  if (flash.external.ExternalInterface.available) {
    flash.external.ExternalInterface.call("console.log", message);
  }
}
System.security.allowDomain("*");

// @todo virer ces ajouts, le 1er génère une erreur dans le js si top n'est pas accessible (pas same domain)
if (flash.external.ExternalInterface.available) {
  // ces deux fonctions ne servent à rien, sinon à ajouter dans le global js une fonction qui appelle
  // la fonction as log2consoleJs qui appelle console.log (autant que le js appelle console.log directement)
  flash.external.ExternalInterface.addCallback("top.menu.feedback", log2consoleJs);
  flash.external.ExternalInterface.addCallback("feedbackSwf", log2consoleJs);
}

if (_level0.mode_debug == "o") {
  flash.external.ExternalInterface.call("console.log", "La flashvars mode_debug a été détectée à \'o\' par fonctions_reseau.swf, ce swf enverra des logs commençant par FoncRezo.");
}
var modeleMep = "2";
var idAide = 0;
var abreviationLangue = "fr";
var nomFonctionCallback = "";
var idUtilisateur = 0;
var isBoutonSuite = "n";
var isBoutonAide = "n";
if (_level0.idMep != undefined) {
  _level0.nomDeLexo = _level0.idMep;
  _root.nomDeLexo = _level0.idMep;
  _root.mep_swf_id = _level0.idMep;
  idMep = _level0.idMep;
  idMep = int(idMep);
}
if (_level0.modeleMep == "1") {
  modeleMep = "1";
}
if (_level0.idAide != undefined) {
  idAide = _level0.idAide;
}
_level0.html_lang = "fr";
if (_level0.abreviationLangue != undefined) {
  abreviationLangue = _level0.abreviationLangue;
  _level0.html_lang = _level0.abreviationLangue;
}
if (_level0.nomFonctionCallback != undefined) {
  nomFonctionCallback = _level0.nomFonctionCallback;
}
if (_level0.idUtilisateur != undefined) {
  idUtilisateur = _level0.idUtilisateur;
  idUtilisateur = int(idUtilisateur);
}
if (_level0.isBoutonSuite == "o") {
  isBoutonSuite = "o";
}
if (_level0.isBoutonAide == "o") {
  isBoutonAide = "o";
}
if (_level0.nb_chances == undefined) {
  _level0.nb_chances = 2;
}
var objetCallback = {};
for (i = 1; i < _level0.nbre_questions + 1; i++) {
  // @todo passer par un objet global plutôt que set / eval
  set("r" + i, "");
  if (_level0.ch == "n") {
    set("r_non_cryptee" + i, "");
  }
}
if (_level0.affichage_nb_questions != "n") {
  if (_level0.nbre_questions > 1) {
    _level0.exoMeP.affiche_textes.login.text = _level0.nbre_questions + " questions";
  } else {
    _level0.exoMeP.affiche_textes.login.text = _level0.nbre_questions + " question";
  }
}
if (_level0.recommencer == undefined) {
  _level0.recommencer = false;
} else if (_level0.recommencer == true) {
  flash.external.ExternalInterface.call("menuUpdate");
}
var mclListener = new Object();
mclListener.onLoadError = function (target_mc, errorCode, httpStatus) {
  cliptestaide.removeMovieClip();
  _level0.nomDeLAide = "modele_aide.swf";
  _level0.nom_aide = "../aides/modele_aide.swf";
  clearInterval(_level0.aide_charge);
  _level0.charge_aide();
};
mclListener.onLoadComplete = function () {
  _level0.nomDeLAide = "aide" + idAide + ".swf";
  _level0.nom_aide = "../aides/" + abreviationLangue + "/aide" + idAide + ".swf";
  testAide.unloadClip();
  cliptestaide.removeMovieClip();
  clearInterval(_level0.aide_charge);
  _level0.charge_aide();
};
if (idAide != "none" && idAide != 0 && modeleMep == "2") {
  var testAide = new MovieClipLoader();
  _root.createEmptyMovieClip("cliptestaide", 50001);
  cliptestaide._visible = false;
  testAide.addListener(mclListener);
  testAide.loadClip("../aides/" + abreviationLangue + "/aide" + idAide + ".swf", cliptestaide);
} else if (modeleMep == "2") {
  _level0.nomDeLAide = "modele_aide.swf";
  _level0.nom_aide = "../aides/modele_aide.swf";
  clearInterval(_level0.aide_charge);
  _level0.charge_aide();
} else if (modeleMep == "1") {
  intervalHelpLabomep = setTimeout(chargeAideModeleAncien, 750);
}
if (isBoutonSuite == "o" && modeleMep == "2") {
  var pas_suite = true;
  for (i = 0; i < _level0.liste_boutons.length; i++) {
    if (_level0.liste_boutons[i] == "Suite") {
      pas_suite = false;
    }
  }
  if (pas_suite) {
    _level0.liste_boutons.push("Suite");
    _level0.fonctions.boutonsMeP(99, _level0.liste_boutons);
  }
  _level0.fonctions.activer_bouton("Suite");
  setInterval(forcer_activer_suite, 500);
} else if (isBoutonSuite == "o" && modeleMep == "1") {
  _level0.createEmptyMovieClip("fnrzopasser", 100000);
  with (_level0.fnrzopasser) {
    beginFill(16711680, 40);
    lineStyle(1, 16711680, 100);
    moveTo(645, 5);
    lineTo(730, 5);
    lineTo(730, 25);
    lineTo(645, 25);
    lineTo(645, 5);
    endFill();
    createTextField("bouton", 1, 650, 5, 80, 30);
    formattextedes = new TextFormat();
    formattextedes.size = 15;
    formattextedes.bold = true;
    bouton.selectable = false;
    bouton.text = "Suite";
    bouton.setTextFormat(formattextedes);
  } // End of with
  _level0.fnrzopasser.onRelease = function () {
    _level0.avance();
  };
}
if (isBoutonAide == "o" && modeleMep == "2") {
  var pas_aide = true;
  for (i = 0; i < _level0.liste_boutons.length; i++) {
    if (_level0.liste_boutons[i] == "Aide") {
      pas_aide = false;
    }
  }
  if (pas_aide) {
    _level0.liste_boutons.push("Aide");
    _level0.fonctions.boutonsMeP(99, _level0.liste_boutons);
  }
  _level0.fonctions.activer_bouton("Aide");
  setInterval(forcer_activer_aide, 500);
} else if (isBoutonAide == "o" && modeleMep == "1") {
  _level0.createEmptyMovieClip("fnrzovoiraide", 100001);
  with (_level0.fnrzovoiraide) {
    beginFill(16711680, 40);
    lineStyle(1, 16711680, 100);
    moveTo(645, 28);
    lineTo(730, 28);
    lineTo(730, 48);
    lineTo(645, 48);
    lineTo(645, 28);
    endFill();
    createTextField("bouton", 1, 650, 28, 80, 30);
    formattextedes = new TextFormat();
    formattextedes.size = 15;
    formattextedes.bold = true;
    bouton.selectable = false;
    bouton.text = "Voir aide";
    bouton.setTextFormat(formattextedes);
  } // End of with
  _level0.fnrzovoiraide.onRelease = function () {
    _level100._visible = true;
  };
}

// la fonction globale commphp qui envoie le résultat
// elle est appelée à chaque réponse, objetCallback stocke en global les réponses précédentes
_level0.commphp = function () {
  function log (str) {
    trace(str);
    if (_level0.mode_debug == "o") {
      flash.external.ExternalInterface.call("console.log", str);
    }
  }
  trace("COMMPHP appelé");
  objetCallback.fin = "n";
  if (modeleMep == "1") {
    if (_level0._level100._visible != true && _level0._level100._visible != false) {
      _level0._level100._visible = false;
    }
    trace("_level100._visible depuis fctrezo:" + _level0._level100._visible);
    var nb_reponses_eleves = _level0.erreur;
  } else {
    var nb_reponses_eleves = _level0.nb_reponse;
  }
  log("FoncRezo : on vérifie la présence (et le nom) de la flashvars nomFonctionCallback qui permet le renvoi d\'un bilan :" + _level0.nomFonctionCallback);
  log("FoncRezo : modèle d\'exo detecté : Mepv" + modeleMep);
  if (_level0.nomFonctionCallback == undefined) {
    trace("ICI");
    return (true);
  }
  if (numquestion_temoin != _level0.numquestions) {
    numquestion_temoin = _level0.numquestions;
    erreur_temoin = 0;
  }
  trace("FCT REZO: numquestion_temoin=" + numquestion_temoin + " _level0.numquestions=" + _level0.numquestions + " erreur_temoin=" + erreur_temoin + "_level0.juste=" + _level0.juste + " et nb_reponses_eleves=" + nb_reponses_eleves);
  log("FoncRezo : erreur_temoin = " + erreur_temoin + " et nb_reponses_eleves=" + nb_reponses_eleves + " juste=" + _level0.juste);
  if (erreur_temoin != nb_reponses_eleves) {
    erreur_temoin = nb_reponses_eleves;
  } else if (!_level0.juste && _level0.fin_exercice_a_signaler != true) {
    trace("LAAAA");
    log("FoncRezo : une condition qui peut arrêter l\'execution de la fonction de renvoi de bilan : une question blanche");
    log("FoncRezo : Détails: ce serait si erreur_temoin == _level0.nbr_reponse et si_level0.juste==false");
    log("FoncRezo : erreur_temoin=" + erreur_temoin + " et  _level0.nbr_reponse =" + _level0.nbr_reponse + " et _level0.juste=" + _level0.juste + " fin des détails");
  }
  if (modeleMep == "1") {
    if (_level0.juste && _level0.erreur != 1) {
      code_reponse_numerique = 4;
    } else if (_level0.juste && _level0.erreur == 1) {
      code_reponse_numerique = 3;
    } else if (_level0.erreur == 2 || _level0.nb_chances == 1) {
      code_reponse_numerique = 2;
    } else {
      code_reponse_numerique = 1;
    }
    trace("code_reponse_numerique=" + code_reponse_numerique);
  } else if (_level0.juste && _level0.nbr_reponse == 0) {
    code_reponse_numerique = 4;
  } else if (_level0.juste && _level0.nbr_reponse > 0) {
    code_reponse_numerique = 3;
  } else if (_level0.nbr_reponse >= _level0.nb_chances) {
    code_reponse_numerique = 2;
  } else {
    code_reponse_numerique = 1;
  }
  if (_level0.ch == "n") {
    if (code_reponse_numerique == 4) {
      code_reponse = "v";
    }
    if (code_reponse_numerique == 3) {
      code_reponse = "p";
    }
    if (code_reponse_numerique == 2) {
      code_reponse = "r";
    }
    if (code_reponse_numerique == 1) {
      code_reponse = "j";
    }
  }
  if (_level0.numquestions == _level0.nbre_questions && code_reponse_numerique > 1) {
    if (modeleMep == "2" || _level0.affichage_boite_finale != "n") {
      _level0.recommencer = true;
    }
    if (modeleMep == "1") {
      log("FoncRezo : pour j3p, on lui dit que c\'est la dernière question de l\'exo, et on met la flahsvars fin à o");
      objetCallback.dernier = 1;
      objetCallback.fin = "o";
    }
  }
  set("r" + _level0.numquestions, code_reponse_numerique);
  if (_level0.ch == "n") {
    set("r_non_cryptee" + _level0.numquestions, code_reponse);
  }

  // ici on chiffre en appelant une fct qui ne peut pas être dans ce source public
  codes_reponse_crypte = code_reponse;

  if (_level0.nombre_questions_limitees != undefined) {
    if (_level0.numquestions == _level0.nombre_questions_limitees && code_reponse_numerique > 1) {
      log("FoncRezo : j3p a demandé de n\'afficher que les x premières questions et non pas toutes, on s\'arrête à la dernière");
      objetCallback.dernier = 1;
      objetCallback.fin = "o";
    }
  }
  if (_level0.retour_fin_exercice == "o" && modeleMep == "1") {
    log("FoncRezo : on veut connaitre la fin de l\'exo pour MepV1, typiquement via j3p");
    if (objetCallback.dernier == 1) {
      log("FoncRezo : c\'est la fin j\'essaie de masquer le btn ou de le desactiver");
      _root.onEnterFrame = function () {
        _level0.btn_recommence._visible = false;
      };
    } else {
      log("FoncRezo : ce n\'est pas encore la fin");
    }
  }
  if (_level0.ch == "n") {
    log("FoncRezo :on demande de ne pas crypter le retour (utile pour J3P par exemple), qui sera stocké dans objetCallback.score:" + _level0.score);
    objetCallback.score = _level0.score;
    objetCallback.reponse = "";
    for (i = 1; i < _level0.nbre_questions + 1; i++) {
      objetCallback.reponse = objetCallback.reponse + (eval("r_non_cryptee" + i));
    }
    log("FoncRezo :on renvoit également le code réponse stocké dans objetCallback.reponse:" + objetCallback.reponse);
  } else {
    log("FoncRezo :on demande de crypter le retour qui sera stocké dans objetCallback.reponse:" + codes_reponse_crypte);
    objetCallback.reponse = codes_reponse_crypte;
  }
  if (_level0.fin_exercice_a_signaler == true) {
    log("FoncRezo : c\'est la fin de l\'exercice modèle 2 normalement, et on le signale en mettant objetCallback à \'o\'");
    objetCallback.fin = "o";
  }
  objetCallback.nbq = _level0.nbre_questions;
  flash.external.ExternalInterface.call(nomFonctionCallback, objetCallback);
};
