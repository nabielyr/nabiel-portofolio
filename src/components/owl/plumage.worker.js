import { PAINTERS } from './paint'

/* Paints the owl's textures off the main thread and hands back ImageBitmaps. */
self.onmessage = ({ data: names }) => {
  try {
    for (const name of names) {
      const canvas = PAINTERS[name]()
      const bitmap = canvas.transferToImageBitmap()
      self.postMessage({ name, bitmap }, [bitmap])
    }
  } catch (e) {
    self.postMessage({ error: String(e) })
  }
}
