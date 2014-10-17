/**
 * Module js pour gérer l'affichage / masquage de question / réponse / page
 */
/* global define, window */
var w = window;
var $ = w.jQuery;

/**
 * On exporte une seule méthode
 */
define({start:start})

/**
 * La gestion de consigne / question / réponse
 * On reprend tel quel (quasiment) l'ancien url.js de l'outil labomep
 */
/** Le html du lien à mettre dans #information */
var liensuivant = w.getElement("img", {
  class: 'liensuivant',
  src  : w.baseUrl +'/images/forward.png',
  align: 'absmiddle',
  alt  : 'suivant'
});
/** Le lien qui sera dans #filariane, avec id pour lui coller un comportement au clic */
var liensuivantId = w.getElement("img", {
  id   : 'liensuivant',
  class: 'liensuivant',
  src  : w.baseUrl +'/images/forward.png',
  align: 'absmiddle',
  alt  : 'suivant'
});

var etapes = {
  currentIndex: 0,
  // chaque elt est une etape, un tableau avec les objets à afficher (parmi consigne, reponse, information)
  liste  : [],
  // les titres de chaque étape
  titres : [],
  show   : showEtape,
  next   : function () {
    if (etapes.currentIndex >= etapes.liste.length) return;
    etapes.currentIndex++;
    etapes.show();
  }
};

/** La page en iframe, ou div si swf */
var page = {
  activer   : function () { $("#page").show(); },
  desactiver: function () { $("#page").hide(); }
};

/** objet pour la fenêtre modale information */
var information = {
  optionsDialog: {
    title    : 'Information',
    autoOpen : false,
    resizable: false,
    position : ['center', 40],
    buttons  : {
      "OK": function () { $('#information').dialog("close"); }
    }
  },
  init       : function () { $('#information').dialog(information.optionsDialog); },
  activer    : function () { $('#information').dialog('open'); },
  desactiver   : function () { if ($('#information').dialog('isOpen')) $('#information').dialog('close'); },
  setContent : function (content) { $('#information').html(content); }
};

/** objet pour la fenêtre modale consigne */
var consigne = {
  optionsdialog: {
    //position : [30, 50],
    // cf http://api.jqueryui.com/position/
    position : {my:'left+30 top+50', at:'left bottom', of:'#head'},
    width    : 450,
    height   : 350,
    resizable: false,
    autoOpen : false,
    title    : 'Consigne',
    close    : function () { $('#lienconsigne').css('font-weight', 'bold'); },
    open     : function () { $('#lienconsigne').css('font-weight', 'normal'); }
  },
  init : function () { $('#consigne').dialog(consigne.optionsdialog); },
  activer      : function () {
    $('#consigne').dialog('open');
    $('#lienconsigne').show();
  },
  desactiver   : function () {
    $('#consigne').dialog('close');
    $('#lienconsigne').hide();
  },
  toggle       : function () {
    if ($('#consigne').dialog('isOpen')) $('#consigne').dialog('close');
    else $('#consigne').dialog('open');
  }
};

/** objet pour la fenêtre modale réponse */
var reponse = {
  optionsdialog: {
    width    : 472,
    height   : 290,
    //position : [$('body').width() - 30 - 472, 50],
    position : {my:'right-30 top+70', at:'right bottom', of:'#head'},
    resizable: false,
    autoOpen : false,
    title    : 'Ta réponse',
    close    : function () { $('#lienreponse').css('font-weight', 'bold'); },
    open     : function () { $('#lienreponse').css('font-weight', 'normal'); }
  },
  init : function () { $('#reponse').dialog(reponse.optionsdialog); },
  activer      : function () {
    $('#reponse').dialog('open');
    $('#lienreponse').show();
  },
  desactiver   : function () {
    $('#reponse').dialog('close');
    $('#lienreponse').hide();
  },
  toggle       : function () {
    if ($('#reponse').dialog('isOpen')) $('#reponse').dialog('close');
    else $('#reponse').dialog('open');
  }
};


function showEtape() {
  var i, num;

  // on ferme tout
  reponse.desactiver();
  consigne.desactiver();
  page.desactiver();

  // et on active les elts de l'etape en cours
  var etape = etapes.liste[etapes.currentIndex]
  for (i = 0; i < etape.length; i++) {
    etape[i].activer();
  }
  
  // reconstruction du fil d'ariane (titre des étapes passées + titre actuel ≠ + suivant)
  $('#filariane').html("");
  for (i = 0; i < etapes.titres.length; i++) {
    num = i+1;
    if (i < etapes.currentIndex) {
      $('#filariane').append("Étape "+num+" : "+etapes.titres[i] +' >> ');
    } else if (i == etapes.currentIndex) {
      // ajout titre courant
      $('#filariane').append("Étape "+(i+1) +" : ").append(w.getElement('span', {class:'highlight'}, etapes.titres[i]));
    } else if (i == etapes.currentIndex +1) {
      // y'a un suivant
      $('#filariane').append(liensuivantId);
      $('#liensuivant').click(etapes.next);
    }
  }
}

/**
 * Affecte les comportements
 * @param {string} question_option Option de l'affichage de la question qui peut prendre les valeurs
 *   "off"    : pas de question
 *   "before" : avant la page
 *   "while"  : pendant la page
 *   "after"  : après la page
 * @param {string} answer_option Option de l'affichage de la réponse qui peut prendre les valeurs
 *   "off"      : pas de réponse attendue
 *   "question" : pendant l'affichage de la question
 *   "while"    : pendant l'affichage de la page
 *   "after"    : après la page
 */
function start(question_option, answer_option) {
  log('main.start avec ' + question_option + ' et ' + answer_option);

  // les comportements qui dépendent pas du contexte
  $('#lienconsigne').click(consigne.toggle);
  $('#lienreponse').click(reponse.toggle);

  // init dialog
  information.init();
  consigne.init();
  reponse.init();

  if (question_option == "off") {
    etapes.liste = [[information, page]];
    if (answer_option == "while") {
      etapes.titres = ["Visualisation du document et réponse"];
      information.setContent("Observe ce document et envoie ta réponse.");
      etapes.liste[0].push(reponse);

    } else if (answer_option == "after") {
      etapes.titres = ["Visualisation du document", "Réponse"];
      information.setContent("Observe ce document puis clique sur " +liensuivant +" pour répondre.");
      etapes.liste.push([reponse]);
    }
  }

  else if (question_option == "before") {
    etapes.liste = [[consigne,information],[page]];
    if (answer_option == "off") {
      etapes.titres = ["Lecture de la consigne", "Visualisation du document"];
      information.setContent("Commence par lire la consigne, puis clique sur " +liensuivant +" pour voir le document.");

    } else if (answer_option == "while") {
      etapes.titres = ["Lecture de la consigne", "Visualisation du document et réponse"];
      information.setContent("Lis la consigne, clique sur " +liensuivant +" pour voir le document et répondre.");
      etapes.liste[1].push(reponse);

    } else if (answer_option == "after") {
      etapes.titres = ["Lecture de la consigne", "Visualisation du document", "Réponse"];
      information.setContent("Lis la consigne, clique sur " +liensuivant +
          " pour voir le document, puis encore une fois pour répondre.");
      etapes.liste.push([reponse]);

    } else if (answer_option == "question") {
      etapes.titres = ["Lecture de la consigne et réponse", "Visualisation du document"];
      information.setContent("Réponds à la question, puis clique sur " +liensuivant +" pour voir le document.");
      // réponse avant l'info
      etapes.liste = [[consigne, reponse, information],[page]];
    }
  }

  else if (question_option == "while") {
    etapes.liste = [[consigne, page]];
    if (answer_option == "after") {
      etapes.liste[0].push(information);
      information.setContent("Lis la consigne, observe bien le document puis clique sur " +liensuivant +
          " pour pouvoir répondre.");
      etapes.liste.push([reponse]);
      etapes.titres = ["Réponse", "Visualisation de la consigne et du document"];

    } else if (answer_option == "while" || answer_option == "question") {
      $('#filariane').hide();
      etapes.liste[0].push(reponse);
      etapes.titres = ["Consigne, visualisation du document et réponse"];

    } else {
      $('#filariane').hide();
      etapes.titres = ["Consigne et visualisation du document"];
    }
  }

  else if(question_option == "after") {
    etapes.liste = [[page, information], [consigne]];
    if (answer_option == "off") {
      etapes.titres = ["Visualisation du document", "consigne"];
      information.setContent("Observe bien le document puis clique sur " +liensuivant +" pour lire la consigne.");

    } else if (answer_option == "after") {
      etapes.titres = ["Visualisation du document", "Lecture de la consigne", "Réponse"];
      information.setContent("Observe bien le document puis clique sur " +liensuivant +
          " pour lire la consigne et encore une fois pour répondre.");
      etapes.liste.push([reponse]);
    }
    else {
      information.setContent("Observe bien le document puis clique sur "+liensuivant+" pour lire la consigne et répondre.");
      etapes.liste[1].push(reponse);
      etapes.titres = ["Visualisation du document", "Consigne et réponse"];
    }
  }

  // et on affiche ce qu'il faut
  etapes.show();
}
