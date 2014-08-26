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
var liensuivant = w.getElt("img", {
  class: 'liensuivant',
  src  : w.baseUrl +'/images/forward.png',
  align: 'absmiddle',
  alt  : 'suivant'
});
var vliensuivant = w.getElt("img", {
  id   : 'liensuivant',
  class: 'liensuivant',
  src  : w.baseUrl +'/images/forward.png',
  align: 'absmiddle',
  alt  : 'suivant'
});

var etapes = {
  encours: 0,
  order  : [],
  titres : {},
  show   : showEtapes,
  next   : function () {
    if (etapes.encours >= etapes.order.length) return;
    etapes.encours++;
    etapes.show();
  }
};

var consigne = {
  optionsdialog: {
    position : [30, 50],
    width    : 450,
    height   : 350,
    resizable: false,
    title    : 'Consigne',
    close    : function () { $('#lienconsigne').css('font-weight', 'bold'); },
    open     : function () { $('#lienconsigne').css('font-weight', 'normal'); }
  },
  init : function () { $('#consigne').dialog(consigne.optionsdialog); },
  activer      : function () { $('#lienconsigne').show(); },
  desactiver   : function () {
    $('#consigne').dialog('close');
    $('#lienconsigne').hide();
  },
  toggle       : function () {
    if ($('#consigne').dialog('isOpen')) $('#consigne').dialog('close');
    else $('#consigne').dialog('open');
  }
};

var reponse = {
  optionsdialog: {
    width    : 472,
    height   : 290,
    position : [$('body').width() - 30 - 472, 50],
    resizable: false,
    title    : 'Ta réponse',
    close    : function () { $('#lienreponse').css('font-weight', 'bold'); },
    open     : function () { $('#lienreponse').css('font-weight', 'normal'); }
  },
  init : function () { $('#reponse').dialog(reponse.optionsdialog); },
  activer      : function () { $('#lienreponse').show(); },
  desactiver   : function () {
    if ($('#reponse').dialog('isOpen')) $('#reponse').dialog('close');
    $('#lienreponse').hide();
  },
  toggle       : function () {
    if ($('#reponse').dialog('isOpen')) $('#reponse').dialog('close');
    else $('#reponse').dialog('open');
  }
};

var page = {
  activer   : function () { $("#divpage").show(); },
  desactiver: function () { $("#divpage").hide(); }
};

var informations = {
  optionsDialog: {
    modal    : true,
    title    : 'Information',
    resizable: false,
    position : ['center', 40],
    buttons  : {
      "OK": function () { $(this).dialog("close"); }
    }
  },
  activer      : function () { $('#information').dialog(informations.optionsDialog); }
};

function showEtapes() {
  // on init les dialog
  reponse.init();
  reponse.desactiver();
  consigne.init();
  consigne.desactiver();
  page.desactiver();
  var i;
  var etape = etapes.order[etapes.encours]
  for (i in etape) {
    etape[i].activer();
  }
  $('#filariane').html("");
  var j=0;
  for (i in etapes.titres) {
    j++;
    if (j==etapes.encours+2) {
      $('#filariane').append(vliensuivant);
      $('#liensuivant').click(etapes.next);
    }
    else if(j>1) {
      $('#filariane').append(" >> ");
    }
    if (j==etapes.encours+1) {
      $('#filariane').append("Étape "+j+" : ").append(w.getElt('span', {class:'highlight'}, etapes.titres["e"+j]));
    }
    else {
      $('#filariane').append("Étape "+j+" : "+etapes.titres["e"+j]);
    }
  }
  log('ds showEtapes')
}

/**
 */
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
  $('#lienconsigne').click(consigne.toggle);
  $('#lienreponse').click(reponse.toggle);
  log('main.start avec ' +question_option +' et ' +answer_option)

  if (question_option == "off") {
    etapes.order = [[informations, page]];
    if (answer_option == "while") {
      $('#information').html("Observe ce document et réponds.");
      etapes.order[0].push(reponse);
      etapes.titres = {
        e1:"Visualisation du document et réponse"
      };
    } else if (answer_option == "after") {
      $('#information').html("Observe ce document puis clique sur "+liensuivant+" pour répondre.");
      etapes.order.push([reponse]);
      etapes.titres = {
        e1: "Visualisation du document",
        e2: "Réponse"
      };
    }
  }

  else if (question_option == "before") {
    etapes.order = [[consigne,informations],[page]];
    if (answer_option == "off") {
      $('#information').html("Commence par lire la consigne, puis clique sur "+liensuivant+" pour voir le document.");
      etapes.titres = {
        e1: "Lecture de la consigne",
        e2: "Visualisation du document"
      };
    }
    else if (answer_option == "while") {
      $('#information').html("Lis la consigne, clique sur "+liensuivant+" pour voir le document et répondre.");
      etapes.order[1].push(reponse);
      etapes.titres = {
        e1:"Lecture de la consigne",
        e2:"Visualisation du document et réponse"
      };
    }
    else if (answer_option == "after") {
      $('#information').html("Lis la consigne, clique sur "+liensuivant+" pour voir le document, puis encore une fois pour répondre.");
      etapes.order.push([reponse]);
      etapes.titres = {
        e1: "Lecture de la consigne",
        e2: "Visualisation du document",
        e3: "Réponse"
      };
    }
    else if (answer_option == "question") {
      $('#information').html("Réponds à la question, puis clique sur "+liensuivant+" pour voir le document.");
      // on ajoute la réponse avant l'info
      etapes.order[0].splice(1,0,reponse);
      etapes.titres = {
        e1: "Lecture de la consigne et réponse",
        e2: "Visualisation du document"
      };
    }
  }

  else if (question_option == "while") {
    etapes.order = [[consigne, page]];
    $('#divpage').show();
    if (answer_option == "after") {
      etapes.order[0].push(informations);
      $('#information').html("Lis la consigne, observe bien le document puis clique sur "+liensuivant+" pour pouvoir répondre.");
      etapes.order.push([reponse]);
      etapes.titres = {
        e2: "Réponse",
        e1: "Visualisation de la consigne et du document"
      };
    }
    else if (answer_option == "while" || answer_option == "question") {
      $('#filariane').hide();
      etapes.order[0].push(reponse);
      etapes.titres = {
        e1: "Consigne, visualisation du document et réponse"
      };
    }
    else {
      $('#filariane').hide();
      etapes.titres = {
        e1: "Consigne et visualisation du document"
      };
    }
  }

  else if(question_option == "after") {
    $('#divpage').show();
    etapes.order = [[page, informations], [consigne]];
    if (answer_option == "off") {
      $('#information').html("Observe bien le document puis clique sur "+liensuivant+" pour lire la consigne.");
      etapes.titres = {
        e1: "Visualisation du document",
        e2: consigne
      };
    }
    else if (answer_option == "after") {
      $('#information').html("Observe bien le document puis clique sur "+liensuivant+" pour lire la consigne et encore une fois pour répondre.");
      etapes.order.push([reponse]);
      etapes.titres = {
        e1: "Visualisation du document",
        e2: "Lecture de la consigne",
        e3: "Réponse"
      };
    }
    else {
      $('#information').html("Observe bien le document puis clique sur "+liensuivant+" pour lire la consigne et répondre.");
      etapes.order[1].push(reponse);
      etapes.titres = {
        e1: "Visualisation du document",
        e2: "Consigne et réponse"
      };
    }
  }
  etapes.show();
}
