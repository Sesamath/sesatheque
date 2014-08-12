///////////////////////////////////////////////////////////////
// fonction appelée par calkc.swf à la validation d'une opération
// elle a pour but d'enregistrer le resultat en base
///////////////////////////////////////////////////////////////
var histoReponses = new Array(); // contient l'historique des réponses de chaque question

function com_calkc_resultat(nombrequestions,numeroquestion,reponse) {
	// reponse est de la forme 1#+#1#egal#2#|13|ok
	// reponse comporte la liste des touches tapées|le temps écoulé|ok/suite/tard
	var reponseCourante = new Array(nombrequestions,reponse);
	histoReponses.push(reponseCourante);
	datas.reponse = histoReponses;
	saveResult(datas);
}