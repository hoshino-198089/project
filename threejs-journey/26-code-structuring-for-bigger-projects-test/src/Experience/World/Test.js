import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Test {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.debug = this.experience.debug

        // Debug
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('test')
        }

        this.setGeometry()
        this.setTextures()
        this.setMaterial()
        this.setMesh()

        // Debug
        if (this.debug.active) {
            const param = { x: 0.5, y: 0.5 }
            this.updateScrollPosition({ ratioX: param.x, ratioY: param.y })
            this.debugFolder.add(param, 'x').name('ratioX').min(0).max(1).step(0.001)
                .onChange((value) => { this.updateScrollPosition({ ratioX: value, ratioY: param.y }) })
            this.debugFolder.add(param, 'y').name('ratioY').min(0).max(1).step(0.001)
                .onChange((value) => { this.updateScrollPosition({ ratioX: param.x, ratioY: value }) })
        }
    }

    setGeometry() {
        this.geometry = new THREE.PlaneGeometry()
    }

    setTextures() {
        this.textures = {}

        this.textures.color = this.resources.items.testColorTexture
        this.textures.color.colorSpace = THREE.SRGBColorSpace
    }

    setMaterial() {
        this.material = new THREE.MeshBasicMaterial({
            map: this.textures.color,
        })
    }

    setMesh({ parent = null } = {}) {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this[parent === null ? 'scene' : parent].add(this.mesh)
    }

    setGroup() {
        this.group = new THREE.Group()
    }

    getVisibleSize(camera, z) {
        const distance = Math.abs(camera.position.z - z)

        const vFov = THREE.MathUtils.degToRad(camera.fov)

        const height = 2 * Math.tan(vFov / 2) * distance
        const width = height * camera.aspect

        return { width, height }
    }

    updateScrollPosition({ ratioX = 0, ratioY = 0 }) {
        const size = this.getVisibleSize(this.camera.instance, this.mesh.position.z)

        // this.mesh.scale.set(size.width, size.height, 1)
        const meshWidth = 1// * size.width
        const meshHeight = 1// * size.height

        const left = -size.width / 2 - meshWidth / 2
        const right = size.width / 2 + meshWidth / 2
        this.mesh.position.x = THREE.MathUtils.lerp(left, right, ratioX)

        const top = size.height / 2 + meshHeight / 2
        const bottom = -size.height / 2 - meshHeight / 2
        this.mesh.position.y = THREE.MathUtils.lerp(bottom, top, ratioY)
    }

}