/**
 * One-shot signal that the hero WebGL scene is compiled and has drawn its
 * first frames. The Preloader holds its counter at 000% until this resolves,
 * so the unavoidable main-thread cost of loading Three.js, creating the GL
 * context and compiling shaders never lands in the middle of the 0→100 count.
 */
let resolveReady
export const sceneReady = new Promise((resolve) => {
  resolveReady = resolve
})

export function markSceneReady() {
  resolveReady()
}
