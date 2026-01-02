import * as THREE from './lib/three.module.js';
import { Param } from './param.js';

export class Obj {
  constructor(scene, objMaterial, collision_array, index) {
    this.scene = scene

    const sphereGeometry = new THREE.SphereGeometry(20)
    const positionAttribute = sphereGeometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const y = positionAttribute.getY(i) * 3
      const a = Math.round(Math.sin(Math.PI * 1 * (1 - Math.abs(y / 20))) * 100) / 100
      const x = positionAttribute.getX(i) + (Math.random() - 0.5) * 6 * a
      const z = positionAttribute.getZ(i) + (Math.random() - 0.5) * 6 * a;
      positionAttribute.setXYZ(i, x, y, z);
    }
    positionAttribute.needsUpdate = true;

    this.container = new THREE.Object3D();
    this.scene.add(this.container)
    collision_array.push(this.container)

    this.width = Math.round(Math.random() * 20) + 40
    this.container.position.copy(Param.OBJ_PARAM.initPos[index])
    this.container.scale.x = this.width / 40
    this.container.scale.y = Math.random() * 0.5 + 0.5
    this.container.scale.z = this.width / 40
    this.container.label = Param.OBJ_PARAM.label
    this.container.dir = Param.OBJ_PARAM.dir
    this.container.width = this.width
    this.container.radius = this.width / 2

    const obj1 = new THREE.Mesh(sphereGeometry, objMaterial);
    const obj2 = new THREE.Mesh(sphereGeometry, objMaterial);
    obj2.position.x = -0.5
    obj2.rotation.z = Math.PI
    obj2.scale.z = 0.75
    this.container.add(obj1, obj2)

  }
  posUpdate(){
    const rot = Math.round(Math.random() * 360) * (Math.PI / 180)
    let dist = Math.random() * (Param.FIELD_PARAM.dist - this.width) / 6 * 5
    dist += Math.sign(dist) * (Param.FIELD_PARAM.dist - this.width) / 6
    this.container.position.x = Math.sin(rot) * dist
    this.container.position.z = Math.cos(rot) * dist
  }
}