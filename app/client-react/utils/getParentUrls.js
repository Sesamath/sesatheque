const getParentUrls = () => {
  const frames = [window.location.href]
  let frame = window
  // frame.parent devrait toujours exister, mais avec les navigateurs exotiques on sait jamais
  // et on limite à 5 pour éviter une boucle infinie
  // (ou plus malin, s'arrêter si l'url qu'on ajouterait est déjà la dernière du tableau)
  let i = 0
  try {
    while (frame.parent && frame.parent !== frame && i < 5) {
      frame = frame.parent
      i++
      frames.push(frame.location.href)
    }
  } catch (error) {
    console.error(error)
  }

  return frames
}

export default getParentUrls
