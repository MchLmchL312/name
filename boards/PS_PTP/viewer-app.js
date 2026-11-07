import * as THREE from './three.module.js'

const project = await fetch('./project.json').then((response) => response.json())
document.title = project.name
document.querySelector('#title').textContent = project.name

const stage = document.querySelector('#stage')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xd9d8d3)
const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, 0.03, 100)
camera.position.set(project.startView.x, project.startView.eyeHeight, project.startView.z)
camera.rotation.order = 'YXZ'
let yaw = project.startView.yaw
let pitch = 0
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.08
stage.appendChild(renderer.domElement)

const { length, width, height } = project.room
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .92, metalness: 0, side: THREE.DoubleSide })
function addWall(w, x, z, rotationY, wallId) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rotationY
  const covering = project.room.wallCoverings?.[wallId]
  let coveringTexture = null
  if (covering) {
    coveringTexture = new THREE.TextureLoader().load(covering.source)
    coveringTexture.colorSpace = THREE.SRGBColorSpace
    coveringTexture.wrapS = coveringTexture.wrapT = THREE.ClampToEdgeWrapping
    const wallRatio = w / height
    if (covering.sourceRatio > wallRatio) {
      const visible = wallRatio / covering.sourceRatio
      coveringTexture.repeat.set(visible, 1)
      coveringTexture.offset.set((1 - visible) / 2, 0)
    } else if (covering.sourceRatio < wallRatio) {
      const visible = covering.sourceRatio / wallRatio
      coveringTexture.repeat.set(1, visible)
      coveringTexture.offset.set(0, (1 - visible) / 2)
    }
  }
  const addSegment = (segmentWidth, segmentHeight, centerX, centerY) => {
    if (segmentWidth <= .001 || segmentHeight <= .001) return
    const geometry = new THREE.PlaneGeometry(segmentWidth, segmentHeight)
    const positions = geometry.getAttribute('position')
    const uvs = geometry.getAttribute('uv')
    for (let index = 0; index < positions.count; index += 1) {
      uvs.setXY(index, (positions.getX(index) + centerX + w / 2) / w, (positions.getY(index) + centerY) / height)
    }
    uvs.needsUpdate = true
    const material = wallMaterial.clone()
    material.map = coveringTexture
    material.needsUpdate = true
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(centerX, centerY, 0)
    group.add(mesh)
  }
  const doors = (project.doors || []).filter((door) => door.wall === wallId && door.offsetM >= 0 && door.offsetM + door.widthM <= w && door.heightM < height).sort((a, b) => a.offsetM - b.offsetM)
  let cursor = 0
  for (const door of doors) {
    if (door.offsetM > cursor) addSegment(door.offsetM - cursor, height, -w / 2 + cursor + (door.offsetM - cursor) / 2, height / 2)
    const above = height - door.heightM
    addSegment(door.widthM, above, -w / 2 + door.offsetM + door.widthM / 2, door.heightM + above / 2)
    cursor = Math.max(cursor, door.offsetM + door.widthM)
  }
  if (cursor < w) addSegment(w - cursor, height, -w / 2 + cursor + (w - cursor) / 2, height / 2)
  scene.add(group)
}
addWall(length, 0, -width / 2, 0, 'front')
addWall(width, -length / 2, 0, Math.PI / 2, 'left')
addWall(length, 0, width / 2, Math.PI, 'back')
addWall(width, length / 2, 0, -Math.PI / 2, 'right')

const lightLevel = Math.max(.2, project.room.lightIntensity || 1)
scene.add(new THREE.AmbientLight(0xffffff, .72 * lightLevel))
scene.add(new THREE.HemisphereLight(0xffffff, 0xc8c3ba, .55 * lightLevel))
const lightDistance = Math.max(length, width) * 1.7
for (const [x, z] of [[-length * .25, -width * .25], [length * .25, -width * .25], [-length * .25, width * .25], [length * .25, width * .25]]) {
  const light = new THREE.PointLight(0xfff4e4, 22 * lightLevel, lightDistance, 2)
  light.position.set(x, Math.max(1.8, height - .22), z)
  scene.add(light)
}

const floorTexture = new THREE.TextureLoader().load(project.room.floorSource)
floorTexture.colorSpace = THREE.SRGBColorSpace
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(Math.max(1, length / project.room.floorScale), Math.max(1, width / project.room.floorScale))
floorTexture.rotation = THREE.MathUtils.degToRad(project.room.floorRotation)
floorTexture.center.set(.5, .5)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(length, width), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: .82, side: THREE.DoubleSide }))
floor.rotation.x = -Math.PI / 2
scene.add(floor)
const ceilingTexture = new THREE.TextureLoader().load(project.room.ceilingSource || './assets/plafond.jpg')
ceilingTexture.colorSpace = THREE.SRGBColorSpace
ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping
ceilingTexture.repeat.set(Math.max(1, length / Math.max(.1, project.room.ceilingScale || 2)), Math.max(1, width / Math.max(.1, project.room.ceilingScale || 2)))
ceilingTexture.rotation = THREE.MathUtils.degToRad(project.room.ceilingRotation || 0)
ceilingTexture.center.set(.5, .5)
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(length, width), new THREE.MeshStandardMaterial({ color: 0xffffff, map: ceilingTexture, roughness: 1, side: THREE.DoubleSide }))
ceiling.rotation.x = Math.PI / 2
ceiling.position.y = height
scene.add(ceiling)

const artMeshes = []
for (const artwork of project.artworks) {
  let texture
  if (artwork.kind === 'video') {
    const video = document.createElement('video')
    video.src = artwork.source
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.play().catch(() => {})
    texture = new THREE.VideoTexture(video)
  } else {
    texture = new THREE.TextureLoader().load(artwork.source)
  }
  texture.colorSpace = THREE.SRGBColorSpace
  const w = artwork.widthCm / 100
  const h = artwork.heightCm / 100
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: artwork.kind === 'image',
    alphaTest: artwork.kind === 'image' ? 1 / 255 : 0,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
  const y = artwork.bottomM + h / 2
  if (artwork.wall === 'front') mesh.position.set(-length / 2 + artwork.offsetM + w / 2, y, -width / 2 + .012)
  if (artwork.wall === 'back') { mesh.position.set(length / 2 - artwork.offsetM - w / 2, y, width / 2 - .012); mesh.rotation.y = Math.PI }
  if (artwork.wall === 'left') { mesh.position.set(-length / 2 + .012, y, width / 2 - artwork.offsetM - w / 2); mesh.rotation.y = Math.PI / 2 }
  if (artwork.wall === 'right') { mesh.position.set(length / 2 - .012, y, -width / 2 + artwork.offsetM + w / 2); mesh.rotation.y = -Math.PI / 2 }
  mesh.userData.artwork = artwork
  artMeshes.push(mesh)
  scene.add(mesh)
}

const keys = new Set()
addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()))
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()))
const canvas = renderer.domElement
let touchLook = null
canvas.addEventListener('pointerdown', (event) => { touchLook = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId) })
canvas.addEventListener('pointermove', (event) => {
  if (!touchLook || document.pointerLockElement === canvas) return
  yaw -= (event.clientX - touchLook.x) * .005
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - touchLook.y) * .004, -1.15, 1.15)
  touchLook = { x: event.clientX, y: event.clientY }
})
canvas.addEventListener('pointerup', (event) => { touchLook = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId) })
document.querySelectorAll('.touch button').forEach((button) => {
  const keyName = button.dataset.key
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); keys.add(keyName) })
  button.addEventListener('pointerup', () => keys.delete(keyName))
  button.addEventListener('pointercancel', () => keys.delete(keyName))
})

const welcome = document.querySelector('#welcome')
document.querySelector('#enter').addEventListener('click', () => {
  welcome.classList.add('hidden')
  canvas.requestPointerLock?.()
  project.artworks.filter((item) => item.kind === 'video')
})
canvas.addEventListener('click', () => { if (!matchMedia('(pointer: coarse)').matches) canvas.requestPointerLock?.() })
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== canvas) return
  yaw -= event.movementX * .0022
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * .0018, -1.15, 1.15)
})

const raycaster = new THREE.Raycaster()
const info = document.querySelector('#info')
function showArtworkInfo() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
  const hit = raycaster.intersectObjects(artMeshes, false)[0]
  if (!hit) return
  const artwork = hit.object.userData.artwork
  document.querySelector('#info-title').textContent = artwork.title || artwork.fileName
  document.querySelector('#info-artist').textContent = [artwork.artist, artwork.year].filter(Boolean).join(', ')
  document.querySelector('#info-details').textContent = [artwork.medium, `${artwork.widthCm} × ${artwork.heightCm} cm`].filter(Boolean).join(' · ')
  info.classList.add('open')
}
addEventListener('keydown', (event) => { if (event.key === 'Enter') showArtworkInfo() })
canvas.addEventListener('dblclick', showArtworkInfo)
document.querySelector('#close-info').addEventListener('click', () => info.classList.remove('open'))

const fullscreenButton = document.querySelector('#fullscreen')
fullscreenButton.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
})
document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement ? 'Verlaat fullscreen' : 'Fullscreen'
})
addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'f' && !event.repeat) fullscreenButton.click()
})

const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), .05)
  const forward = Number(keys.has('arrowup')) - Number(keys.has('arrowdown'))
  const side = 0
  const turn = Number(keys.has('arrowleft') || keys.has('a')) - Number(keys.has('arrowright') || keys.has('d'))
  const lookVertical = Number(keys.has('w')) - Number(keys.has('s'))
  yaw += turn * dt * 1.4
  pitch = THREE.MathUtils.clamp(pitch + lookVertical * dt * 1.15, -1.15, 1.15)
  if (forward || side) {
    const speed = 1.45 * dt
    camera.position.x += (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed
    camera.position.z += (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed
    const margin = .22
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -length / 2 + margin, length / 2 - margin)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -width / 2 + margin, width / 2 - margin)
  }
  camera.position.y = Math.min(height - .15, project.startView.eyeHeight)
  camera.rotation.set(pitch, yaw, 0)
  renderer.render(scene, camera)
}
animate()
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight) })
