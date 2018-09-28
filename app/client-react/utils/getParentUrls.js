const getParentUrls = () => {
  const frames = [window.location.href]
  let frame = window
  // frame.parent devrait toujours exister, mais avec les navigateurs exotiques on sait jamais

  while (frame.parent && frame.parent !== frame) {
    frame = frame.parent
    try {
      frames.push(frame.location.href)
    } catch (_) {
      break
    }
  }

  return frames
}

export default getParentUrls
