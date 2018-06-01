FROM node:8.11

RUN git clone https://github.com/Sesamath/sesalab.git

WORKDIR /sesalab

# Ici on peut changer la version cible de sesalab
RUN git checkout 194704f7

# le reste est fait au runtime, cf docker-compose.avec.sesalab.yml
