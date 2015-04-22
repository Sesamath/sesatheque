#!/bin/bash

dirInitial="$PWD"
dirApp=$(dirname $0)/../

function fin() {
  cd "$dirInitial"
}

function usage() {
  echo "Lance l'application en mode dev avec node construct/index.js"
  echo "(ce script n'est là que pour donner la commande à lancer)"
  exit 0
}

# on veut exécuter fin avant de sortir
trap fin EXIT

cd "$dirApp"

node construct/index.js

fin
