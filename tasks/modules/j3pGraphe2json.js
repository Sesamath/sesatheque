/**
 * Module js qui exporte une fonction qui prend une chaîne (graphe au format bizarre) et renvoie un graphe en json
 *
 * Moulinette qui transforme un graphe au format J3P en json (utile pour la bibli)
 * code envoyé par Alexis le 20/01/15 à 16:17, avec correctif du 04/03/15 à 09:56
 *
 * On essaie pas de rendre ce code standard…
 *eslint-disable
 */
function J3PSupprimeEspaces (ch) {
  while (ch.indexOf(' ') !== -1) {
    var pos = ch.indexOf(' ')
    ch = ch.substring(0, pos) + ch.substring(pos + 1)
  }
  return ch
}

function J3PRemplace (ch, position1, position2, souschaine) {
  // position1 incluse
  // position 2 incluse

  //alert('ch='+ch+'  position='+position+'  souschaine='+souschaine)
  ch = ch.substring(0, position1) + souschaine + ch.substring(position2 + 1);

  return ch;
}

/*

 Par exemple, en entrée :
 ch =
 [1,'proglab',[{pe:'<=0.6',nn:'1',conclusion:"Recommencez, c'est trop nul '},{pe:'>=0.6',nn:'2',conclusion:'Continuons mais sans aide maintenant. '},{fichier:'exoprog1.txt",param1:5}]];
 [2,'proglab',[{pe:'<=0.4',nn:'1',conclusion:"Recommençons avec l'aide.'},{pe:'>=0.4',nn:'3',conclusion:'Continuons '},{fichier:'exoprog2.txt'}]];
 [3,'proglab',[{pe:'<=0.6',nn:'3',conclusion:'Recommencez '},{pe:'>=0.4',nn:'4',conclusion:'Continuons mais sans aide maintenant. '},{fichier:'exoprog3.txt"}]];
 [4,'proglab',[{pe:'<=0.4',nn:'3',conclusion:"Recommençons avec l'aide '},{pe:'>=0.4',nn:'5',conclusion:'Continuons '},{fichier:'exoprog4.txt"}]];
 [5,'proglab',[{pe:'<=0.6',nn:'5',conclusion:'Recommencez '},{pe:'>=0.4',nn:'6',conclusion:'Continuons mais sans aide maintenant. '},{fichier:'exoprog5.txt'}]];
 [6,'proglab',[{pe:'<=0.4',nn:'5',conclusion:"Recommençons avec l'aide '},{pe:'>=0.4',nn:'7',conclusion:'Continuons '},{fichier:'exoprog6.txt"}]];
 [7,'proglab',[{pe:'<=0.4',nn:'7',conclusion:'Recommencez'},{pe:'>=0.4',nn:'fin',conclusion:'Parcours terminé '},{fichier:'exoprog7.txt'}]];

 sortie:
 [[1,'proglab',[{'pe':'<=0.6','nn':'1','conclusion':"Recommencez, c'est trop nul '},{'pe':'>=0.6','nn':'2','conclusion':'Continuons mais sans aide maintenant. '},{'fichier':'exoprog1.txt','param1':5}]],[2,'proglab',[{'pe':'<=0.4','nn':'1','conclusion':'Recommençons avec l'aide.'},{'pe':'>=0.4','nn':'3','conclusion':'Continuons '},{'fichier':'exoprog2.txt'}]],[3,'proglab',[{'pe':'<=0.6','nn':'3','conclusion':'Recommencez '},{'pe':'>=0.4','nn':'4','conclusion':'Continuons mais sans aide maintenant. '},{'fichier':'exoprog3.txt'}]],[4,'proglab',[{'pe':'<=0.4','nn':'3','conclusion':'Recommençons avec l'aide '},{'pe':'>=0.4','nn':'5','conclusion':'Continuons '},{'fichier':'exoprog4.txt'}]],[5,'proglab',[{'pe':'<=0.6','nn':'5','conclusion':'Recommencez '},{'pe':'>=0.4','nn':'6','conclusion':'Continuons mais sans aide maintenant. '},{'fichier':'exoprog5.txt'}]],[6,'proglab',[{'pe':'<=0.4','nn':'5','conclusion':'Recommençons avec l'aide '},{'pe':'>=0.4','nn':'7','conclusion':'Continuons '},{'fichier':'exoprog6.txt'}]],[7,'proglab',[{'pe':'<=0.4','nn':'7','conclusion':'Recommencez'},{'pe':'>=0.4','nn':'fin','conclusion':'Parcours terminé '},{'fichier':'exoprog7.txt"}]]]
 */

function bibliotheque(ch) {

  //teste si l'élément chaine[index] est un séparateur d'un tableau
  function teste_separateur_tableau(chaine, index) {
    var bool = false;
    var tableau1 = chaine.substring(0, index);
    var tableau2 = chaine.substring(index + 1);
    //console.log('tableau1='+tableau1+' et tableau2='+tableau2);
    //on teste si  l'index du dernier [ est supérieur à l'index du dernier ] dans tableau1 et l'inverse dans le second (attention à l'absence de [ dans le tableau2 qui aura donc pour index -1)
    var tab1_index_ouvrante = tableau1.lastIndexOf('[');
    var tab1_index_fermante = tableau1.lastIndexOf(']');
    var tab2_index_ouvrante = tableau2.indexOf('[');
    var tab2_index_fermante = tableau2.indexOf(']');
    if ((tab1_index_ouvrante > tab1_index_fermante) && (tab2_index_fermante < tab2_index_ouvrante || (tab2_index_ouvrante === -1 && tab2_index_fermante !== -1))) {
      bool = true;
    }
    //console.log('tab1_index_ouvrante='+tab1_index_ouvrante+' et tab1_index_fermante='+tab1_index_fermante+' et tab2_index_ouvrante='+tab2_index_ouvrante+' et tab2_index_fermante='+tab2_index_fermante);
    //console.log(bool);
    return bool;
  }

  //fonction qui remplace les virgules séparatrice d'un tableau par des points_virgules,
  function remplace_virgules(ch) {
    var chaine;
    chaine = ch;
    for (var index = 0; index <= ch.length - 1; index++) {
      if (ch.charAt(index) == ',') {
        if (teste_separateur_tableau(ch, index)) {
          //on remplace alors cette virgule par un point-virgule
          chaine = chaine.substring(0, index) + '*' + chaine.substring(index + 1);
        }
        //console.log('chaine avec remplacement ='+chaine);
      }
    }
    return chaine;
  }

  //fonction qui remplace des quotes par des guillemets
  function remplace_quotes(ch) {
    var chaine = ch;
    if (ch.charAt(0) == "'' && ch.charAt(ch.length - 1) == ''") {
      chaine = '"' + ch.substring(1, ch.length - 1) + '"';
    }
    return chaine;
  }

  //fonction réciproque
  function remet_virgules(ch) {
    var chaine;
    chaine = ch;
    for (var index = 0; index <= ch.length - 1; index++) {
      if (ch.charAt(index) == '*') {
        if (teste_separateur_tableau(ch, index)) {
          //on remplace alors cette virgule par un point-virgule
          chaine = chaine.substring(0, index) + ',' + chaine.substring(index + 1);
        }
        // console.log('chaine avec remplacement ='+chaine);
      }
    }
    return chaine;
  }

  var ch1, ch2, ch3, test, debutchaine;
  var pos1, pos2;
  var sortie = '';
  //pour mes tests:
  //  var ch='[1,'prodquot_affine',[{pe:'>=0',nn:'fin',conclusion:'Fin'},{'nbrepetitions':3,'nbchances':2,'seuilreussite':0.8,'seuilerreur':0.5,'nb_facteurs_affine':2,'type_expres':['produit'],'imposer_fct':['',''],'imposer_signe':'','a':'[-10;10]','b':'[-10;10]','zeroentier':[false,false],'ordre_affine':'alea','signe_seulement':false}]];';
  //var ch='[1,'limites_ln1',[{pe:'sans condition',nn:'fin',conclusion:'Fin'},{nbrepetitions:5,indication:'',nbchances:2,tab_choix:[1,2,3,4,5]}]];';
  // var ch='[1,'limites_exp2',[{'pe':'sans condition','nn':'fin','conclusion':'Fin'},{'nbrepetitions':6,'indication':'','nbchances':2,'tab_choix':[1,2,3,4,5,6]}]];'
  // console.log(ch)
  //on splitte les différents noeuds
  var tab1 = ch.split('];');//correctif : initialement on splittait sur ; mais ça pose pb pour les chaines '[-10;10]'

  tab1.pop();//suppression du dernier élément vide
  // console.log(tab1)
  //je remets les ] manquants :
  for (var index = 0; index <= tab1.length - 1; index++) {
    tab1[index] = tab1[index] + ']';
    // console.log(tab1[index]);
  }
  //console.log(tab1[0]);

  for (var k = 0; k < tab1.length; k++) {
    //tab1[0]=[1,'proglab',[{pe:'<=0.6',nn:'1',conclusion:"Recommencez, c'est trop nul  '},{pe:'>=0.6',nn:'2',conclusion:'Continuons mais sans aide maintenant. '},{fichier:'exoprog1.txt",param1:5}}]]
    // Remplacement de l'éventuel guillemet simple du nom de la section par un guillemet double (ou ajout de guillemets doubles)
    var ch1 = tab1[k];
    // console.log('ch1=', ch1)
    test = ch1.charAt(ch1.indexOf(',') + 1);
    // console.log('test=', test)
    if (test == '\'') {
      pos1 = ch1.indexOf(',') + 2;//premier caractere du nom de la section
      pos2 = ch1.indexOf(',', pos1) - 2;//dernier caractere du nom de la section
      ch1 = J3PRemplace(ch1, pos1 - 1, pos2 + 1, '"' + ch1.substring(pos1, pos2 + 1) + '"')
    }
    // Ajout éventuel de guillemets doubles si abscence de guillemets
    else if (test != '"') {
      pos1 = ch1.indexOf(',') + 1;//premier caractere du nom de la section
      pos2 = ch1.indexOf(',', pos1) - 1;//dernier caractere du nom de la section
      ch1 = J3PRemplace(ch1, pos1, pos2, '"' + ch1.substring(pos1, pos2 + 1) + '"')
    }
    tab1[k] = ch1;
    // console.log('tab1[k]=', tab1[k])
    // Extraction de ch2={pe:'<=0.6',nn:'1',conclusion:'Recommencez '},{pe:'>=0.6',nn:'2',conclusion:'Continuons mais sans aide maintenant. '},{fichier:'exoprog1.txt'}
    var possecondcrochet = tab1[k].substring(1).indexOf('[');
    ch2 = tab1[k].substring(possecondcrochet + 2, tab1[k].lastIndexOf(']') - 1);//+2 et non +1 à cause du substring(1)
    debutchaine = tab1[k].substring(0, possecondcrochet + 1);
    //[1,'proglab',

    var tab2 = ch2.split(',{')
    // il manque toutes les parenthèses ouvrantes de tous les éléments sauf le premier
    for (var j = 1; j < tab2.length; j++)
      tab2[j] = '{' + tab2[j]

    // on supprime les accolades
    for (var j = 0; j < tab2.length; j++)
      tab2[j] = tab2[j].substring(1, tab2[j].length - 1)
    // par exemple
    // tab2[2] =['pe:'<=0.6',nn:'3',conclusion:'Recommencez, c'est trop nul  ',
    //          'pe:'>=0.4',nn:'4',conc...ans aide maintenant. ',
    //           fichier:'exoprog3.txt',param1:5]

    var tab3 = [];
    if (tab2[tab2.length - 1].indexOf(',nn') == -1 && tab2[tab2.length - 1] !== '') {
      //il y a des paramètres : fichier:'exoprog1.txt',param1:5
      //Initialement split sur la virgule mais posait pb pour les paramètres du type tableau fichier:'exoprog1.txt',param1:5,['choix1','choix2']
      //Autre modif au 03/03/2015 : pb avec les params du type ['[-5;5]','[0;0]"] dont la virgule n'était pas convertie en *, autre méthode : split suivant le :
      // console.log('avant split', tab2[tab2.length - 1])
      var tab_temp = tab2[tab2.length - 1].split(':');
      // console.log('tab_temp=', tab_temp)
      //tab_temp est alors un tableau avec le premier un paramètre et ensuite la valeur d'un param une virgule et un nouveau param, sauf pour le dernier
      var tab3 = new Array;
      tab3[0] = J3PSupprimeEspaces(tab_temp[0]);
      if (tab3[0].charAt(0) != '"') {
        tab3[0] = '"' + tab3[0] + '"';
      }
      for (var i = 1; i < tab_temp.length - 1; i++) {
        //on splitte suivant la dernière virgule, la première pouvant être un élément de la valeur du param...
        var index = tab_temp[i].lastIndexOf(',');
        var valeur = remplace_quotes(tab_temp[i].substring(0, index));
        var param_suivant = J3PSupprimeEspaces(tab_temp[i].substring(index + 1));
        // console.log('valeur=', valeur, ' et param suivant=', param_suivant);
        //on ajoute eventuellement des guillemets au nom du param
        if (param_suivant.charAt(0) != '"') {
          // console.log('param_suivant='+tab3[i].substring(tab3[i].indexOf(':')))
          param_suivant = '"' + param_suivant + '"';
          //on doit avoir en tab3[i] 'param':valeur
        }
        tab3[i - 1] = tab3[i - 1] + ':' + remplace_quotes(valeur);
        tab3[i] = param_suivant;
        // console.log('tab3[i]=', tab3[i])
      }
      tab3[tab_temp.length - 2] = tab3[tab_temp.length - 2] + ':' + remplace_quotes(tab_temp[tab_temp.length - 1])
      //on remplace donc les virgule des tableaux par des points_virgules et on les remettra ensuite.
      /*var tab_temp=remplace_virgules(tab2[tab2.length-1]);
       // console.log('tab_temp=',tab_temp)
       tab3=tab_temp.split(',');
       //tab3 = tab2[tab2.length-1].split(',');
       //console.log('tab 3 splitté :');

       //tab3 = [fichier:'exoprog1.txt',param1:5]`
       for (var i=0;i<tab3.length;i++){
       //on remet les virgules dans les tableaux :
       tab3[i]=remet_virgules(tab3[i]);
       //console.log('tab3[i]='+tab3[i]);
       ch3 = J3PSupprimeEspaces(tab3[i].substring(0,tab3[i].indexOf(':')));//fichier
       // console.log('ch3=',ch3)
       if (ch3.charAt(0)!='"'){
       // console.log('ch3='+tab3[i].substring(tab3[i].indexOf(':')))
       ch3='"'+ch3+'"';
       tab3[i]=ch3+remplace_quotes(tab3[i].substring(tab3[i].indexOf(':')));
       // console.log('tab3[i]=',tab3[i]);
       }
       }*/
      // console.log('!!!! tab3=', tab3)
      tab2.pop();//on supprime le dernier élément contenant les paramètres
      // console.log('tab2=', tab2)
    }
    // A ce stade tab2 ne contient plus de paramètres (ou n'en contenait pas)
    // les éléments restant sont des accolades de condition
    // comme par exemple :  {pe:'<=0.6',nn:'1',conclusion:"Recommencez, c'est trop nul "}

    // Le point délicat du code : impossible de spliter en fonction des virgules
    // il suffit de rechercher nn: , pe: , conclusion: , snn: , sconclusion: , max: , score: et d'ajouter les '
    var motsclefs = ['pe:', 'conclusion:', 'nn:', 'snn:', 'max:', 'sconclusion:', 'score:']
    for (var j = 0; j < tab2.length; j++) {
      for (var i = 0; i < motsclefs.length; i++) {
        var pos = tab2[j].indexOf(motsclefs[i])
        if ((pos != -1) && (tab2[j].charAt(pos - 1) != '"')) {
          // il y le mot clef et il n'est pas entouré par des guillemets
          tab2[j] = tab2[j].substring(0, pos) + '"' + motsclefs[i].substring(0, motsclefs[i].length - 1) + '":' + tab2[j].substring(pos + motsclefs[i].length)
        }
      }
      //console.log(tab2[j])
    }

    // on ajoute à tab2 un élément contenant le paramétrage (s'il existe), réunion des éléments de tab3
    if (tab3.length > 0)
      tab2.push(tab3.join(','));

    // Ajout des accolades
    for (var j = 0; j < tab2.length; j++)
      tab2[j] = '{' + tab2[j] + '}';

    ch2 = '[' + tab2.join(',') + ']';
    // console.log('ch2=', ch2)
    //[{'pe':'<=0.6','nn':'1','conclusion':"Recommencez, c'est trop nul '},{'pe':'>=0.6','nn':'2','conclusion':'Continuons mais sans aide maintenant. '},{'fichier':'exoprog1.txt','param1':5}]
    sortie += debutchaine + ch2 + ']' + ',';
    // console.log('sortie=', sortie)
  }
  sortie = sortie.substring(0, sortie.length - 1);//on enleve la dernière virgule
  //console.log(sortie)
  sortie = '[' + sortie + ']';
  // console.log('chaine au format json:")

  // console.log(sortie);

  return sortie;

  //console.log(tab1)

}

/* on commente ces 2 lignes
 var legraphe = '[1,'proglab',[{pe:'<=0.6',nn:'1',conclusion:"Recommencez, c\'est trop nul '},{pe:'>=0.6',nn:'2',conclusion:'Continuons mais sans aide maintenant. '},{fichier:'exoprog1.txt",param1:5}]];';
 bibliotheque(legraphe);
 et ajoute celle qui suit */

module.exports = bibliotheque

/* eslint-enable */
