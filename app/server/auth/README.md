Propagation d'authentification
==============================

Description du SSO dans la Sésathèque

Le service d'authentification de la Sésathèque permet d'avoir plusieurs clients SSO.
Le SSO ne peut fonctionner qu'en pleine page pour que les cookies soient correctements 
gérés par le navigateur (ça marche pas en iframe avec la configuration par défaut qui 
refuse les cookies tiers)

Le principe du sso est

- login/pass saisi sur le serveur
- redirection vers le client avec un ticket
- vérification du ticket par le client qui récupère un user et le connecte localement

et pour le logout

- déconnexion sur le serveur
- appel de chaque client pour déconnecter

Chaque client doit gérer

- appel du serveur pour login
- réponse à une demande de logout ajax
- réponse à une demande de logout avec redirection
- appel du validate serveur pour récupérer un user à partir d'un ticket

Chaque serveur doit gérer

- login / pass, génération d'un ticket, mise en cache du user correspondant au ticket 
  et redirection vers le client demandeur de login avec le ticket
- si l'initiative du login est sur le serveur, login classique, 
  avec propagation éventuelle et affichage de l'appli serveur
- si l'initiative du login vient du client, valide login/pass, redirige vers l'appli cliente avec un ticket
  et fournira le user au validate (avec ou sans propagation éventuelle ailleurs)
- un controleur pour le validate, qui renvoie au serveur de l'appli cliente le user correspondant au ticket

Un client DEVRAIT fournir les méthodes

- init pour lui fournir
  - loginCallback pour connecter un user, cette fct devra rediriger vers le redirect demandé ou l'appli authentifiée
  - logoutCallback pour déconnecter un user, cette fct devra rediriger vers le redirect demandé ou répondre en json
  - errorCallback pour afficher une erreur sur l'appli cliente
  - authServer : les caractéristiques du serveur sur lequel il devra s'authentifier (s'il en a besoin, peut être déclaré en config)
  - prefix : un préfixe d'url pour ses contrôleurs (idem, facultatif)
- login : redirige vers le serveur d'authentification et rappelera loginCallback au retour
- logout : redirige vers le serveur d'authentification et rappelera logoutCallback au retour
- getLinks : renvoie des liens à ajouter dans le menu user sur l'appli cliente

Mais pour des raisons historique, ce n'est pas encore très normé :-/
