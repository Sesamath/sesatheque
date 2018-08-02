# cf https://github.com/docker-library/official-images/blob/master/library/node
FROM node:10

RUN git clone https://framagit.org/Sesamath/sesalab.git

WORKDIR /sesalab

# Ici on peut changer la version cible de sesalab
RUN git pull -a
RUN git checkout 8e2ef247
#RUN git checkout HEAD

# le reste est fait au runtime, cf docker-compose.avec.sesalab.yml
