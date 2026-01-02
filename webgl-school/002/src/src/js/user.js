import * as THREE from './lib/three.module.js';
import { Param } from './param.js';
import { Calc } from './calc.js';
import { gsap } from "gsap";

export class User {
  constructor(scene, collision_array) {
    this.scene = scene
    this.collision_array = collision_array

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    const windmillMaterial = new THREE.MeshStandardMaterial({
      color: 0xb9dced,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });

    const sphereGeometry = new THREE.SphereGeometry(10)
    const cylinderGeometry = new THREE.CylinderGeometry(5, 5, 10, 32);

    this.container = new THREE.Object3D();
    this.container.position.copy(Param.USER_PARAM.initPos)
    this.container.scale.set(0.4, 0.4, 0.4)
    this.scene.add(this.container)
    this.collision_array.push(this.container)
    this.container.stepOn = false
    this.container.stepOnJudge = false
    this.container.label = Param.USER_PARAM.label
    this.container.width = Param.USER_PARAM.width
    this.container.radius = Param.USER_PARAM.radius
    this.container.control = Param.USER_PARAM.control
    this.container.windForce = Param.USER_PARAM.windForce
    this.container.accumulatedWindForce = Param.USER_PARAM.accumulatedWindForce

    this.fullBody = new THREE.Object3D();
    this.fullBody.position.baseY = 34.5
    this.fullBody.position.y = this.fullBody.position.baseY
    this.fullBody.rotation.set(Math.PI / 2, 0, Math.PI / 2)
    this.container.add(this.fullBody);

    const top = new THREE.Object3D();

    const head = new THREE.Mesh(sphereGeometry, bodyMaterial);
    head.position.z = -20
    head.scale.set(1.1, 1.1, 1.1)

    const body = new THREE.Mesh(sphereGeometry, bodyMaterial);
    body.scale.set(0.9, 1, 1.1)

    const shoulder = new THREE.Object3D();
    shoulder.position.z = -5
    shoulder.scale.set(0.5, 0.5, 0.65)
    top.add(head, body, shoulder);

    const bottom = new THREE.Object3D();
    bottom.position.z = 5
    this.fullBody.add(top, bottom);

    this.worldPosition = new THREE.Vector3();
    this.regHelper = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 32), new THREE.MeshPhongMaterial({ color: 0xff00ff }))
    //this.scene.add(this.regHelper)


    this.joint = {
      shoulder: [],
      elbow: [],
      elbow2: [],
      hip: [],
      knee: []
    }

    for (let i = 0; i < 2; i++) {
      const sign = i == 0 ? -1 : 1

      const part0 = new THREE.Mesh(sphereGeometry, bodyMaterial);
      part0.position.set(0, 6 * sign, 5)
      part0.scale.set(0.5, 0.5, 0.5)
      top.add(part0);

      const hipJoint = new THREE.Object3D();
      bottom.add(hipJoint);
      this.joint.hip.push(hipJoint)

      const part1 = new THREE.Object3D();
      part1.position.set(0, 6 * sign, 15)
      hipJoint.add(part1);

      const part1_1 = new THREE.Mesh(cylinderGeometry, bodyMaterial);
      part1_1.position.z = -7.5
      part1_1.scale.y = 1.5
      part1_1.rotation.x = Math.PI / 2

      const part1_2 = new THREE.Mesh(sphereGeometry, bodyMaterial);
      part1_2.position.z = 0
      part1_2.scale.set(0.5, 0.5, 0.5)
      part1.add(part1_1, part1_2);

      const part2 = new THREE.Object3D();
      part1.add(part2);
      this.joint.knee.push(part2)

      const part2_1 = new THREE.Mesh(cylinderGeometry, bodyMaterial);
      part2_1.position.z = 5
      part2_1.scale.y = 1
      part2_1.rotation.x = Math.PI / 2

      const part2_2 = new THREE.Mesh(sphereGeometry, bodyMaterial);
      part2_2.position.z = 10
      part2_2.scale.set(0.5, 0.5, 0.5)
      part2.add(part2_1, part2_2);

      const shoulderJoint = new THREE.Object3D();
      shoulderJoint.position.y = 17 * sign
      shoulder.add(shoulderJoint);
      this.joint.shoulder.push(shoulderJoint)

      const part3 = new THREE.Object3D();
      part3.rotation.x = -Math.PI / 5.5 * sign
      shoulderJoint.add(part3);

      const part4 = new THREE.Mesh(sphereGeometry, bodyMaterial);
      part4.scale.set(0.5, 0.5, 0.5)

      const part5 = new THREE.Object3D();
      part5.position.z = 15
      part3.add(part4, part5);

      const part5_1 = new THREE.Mesh(cylinderGeometry, bodyMaterial);
      part5_1.position.z = -7.5
      part5_1.scale.y = 1.5
      part5_1.rotation.x = Math.PI / 2

      const part5_2 = new THREE.Mesh(sphereGeometry, bodyMaterial);
      part5_2.position.z = 0
      part5_2.scale.set(0.5, 0.5, 0.5)
      part5.add(part5_1, part5_2);

      const part6 = new THREE.Object3D();
      part5.add(part6);
      this.joint.elbow.push(part6)

      const part7 = new THREE.Object3D();
      part7.rotation.baseX = Math.PI / 5 * sign
      part7.rotation.x = part7.rotation.baseX
      part6.add(part7);
      this.joint.elbow2.push(part7)

      const part7_1 = new THREE.Mesh(cylinderGeometry, bodyMaterial);
      part7_1.position.z = 5
      part7_1.scale.y = 1
      part7_1.rotation.x = Math.PI / 2

      const part7_2 = new THREE.Mesh(sphereGeometry, bodyMaterial);
      part7_2.position.z = 10
      part7_2.scale.set(0.5, 0.5, 0.5)
      part7.add(part7_1, part7_2);
    }

    this.windmill = new THREE.Object3D();
    top.add(this.windmill);

    const windmill_container = new THREE.Object3D();
    windmill_container.position.z = -32
    windmill_container.scale.set(0.75, 0.75, 0.75)
    windmill_container.rotation.x = Math.PI / 2
    this.windmill.add(windmill_container);

    for (let i = 0; i < 5; i++) {
      const rot = Math.PI * 2 / 5 * i
      const part1 = new THREE.Mesh(cylinderGeometry, windmillMaterial)
      part1.position.set(6 * Math.sin(rot), 1.2, 6 * Math.cos(rot))
      part1.scale.set(1, 0.03, 1.4)
      part1.rotation.set(0, rot, -0.3)
      windmill_container.add(part1)
    }

    this.accumulateRunStrength = 0

  }
  move(progressTime, frameTime, keyFlag) {
    if (!this.container.stepOn) {
      if (keyFlag[0] || keyFlag[1]) {
        const x = Math.sin(this.container.rotation.y) * frameTime * 8
        const z = Math.cos(this.container.rotation.y) * frameTime * 8
        if (keyFlag[0]) {
          this.container.position.x += x
          this.container.position.z += z
        }
        if (keyFlag[1]) {
          this.container.position.x -= x * 0.45
          this.container.position.z -= z * 0.45
        }

        if (keyFlag[0] && keyFlag[1]) {
          this.accumulateRunStrength -= frameTime / 1
        } else {
          this.accumulateRunStrength += frameTime / 5
        }
      }

      if (keyFlag[2]) {
        const newRot = Calc.rotAdjust(this.container.rotation.y + frameTime / 5)
        this.container.rotation.y = newRot
        if (!keyFlag[0] && !keyFlag[1]) {
          this.accumulateRunStrength = 0.2
        }
      }
      if (keyFlag[3]) {
        const newRot = Calc.rotAdjust(this.container.rotation.y - frameTime / 5)
        this.container.rotation.y = newRot
        if (!keyFlag[0] && !keyFlag[1]) {
          this.accumulateRunStrength = 0.2
        }
      }

      if (!keyFlag.includes(true)) {
        this.accumulateRunStrength -= frameTime / 1
      }

      if (!keyFlag[0] && keyFlag[1]) {
        this.accumulateRunStrength = Math.min(0.5, Math.max(0, this.accumulateRunStrength))
      } else {
        this.accumulateRunStrength = Math.min(1, Math.max(0, this.accumulateRunStrength))
      }
      this.runMotion(progressTime, this.accumulateRunStrength, keyFlag);
    }
  }
  stepOnMotion(btnPos) {
    if (!this.container.stepOn) {
      this.container.stepOn = true

      for (let i = 0; i < 2; i++) {
        this.fullBody.position.y = this.fullBody.position.baseY
        this.joint.shoulder[i].rotation.y = 0
        this.joint.elbow[i].rotation.y = 0
        this.joint.elbow2[i].rotation.x = this.joint.elbow2[i].rotation.baseX
        this.joint.hip[i].rotation.y = 0
        this.joint.knee[i].rotation.y = 0
      }

      gsap.timeline({ repeat: 1, yoyo: true }).timeScale(20)
        .to(this.joint.hip[0].rotation, {
          y: Param.STEPON_PARAM.hipL[0],
          duration: 4,
          ease: "power0.inOut",
        })
        .to(this.joint.knee[0].rotation, {
          y: Param.STEPON_PARAM.kneeL[0],
          duration: 4,
          ease: "power0.inOut",
        }, '-=4')
        .to(this.fullBody.position, {
          y: this.fullBody.position.baseY + Param.STEPON_PARAM.fullBody[0].y,
          z: Param.STEPON_PARAM.fullBody[0].z,
          duration: 4,
          ease: "power0.inOut",
        }, '-=4')
        .to(this.joint.shoulder[0].rotation, {
          x: Param.STEPON_PARAM.shoulder[0],
          duration: 4,
          ease: "power0.inOut",
        }, '-=4')
        .to(this.joint.shoulder[1].rotation, {
          x: -Param.STEPON_PARAM.shoulder[0],
          duration: 4,
          ease: "power0.inOut",
        }, '-=4')

      gsap.timeline({
        repeat: 1,
        yoyo: true,
        onComplete: () => {
          this.container.stepOn = false
        }
      }).timeScale(20)
        .to(this.joint.hip[1].rotation, {
          y: Param.STEPON_PARAM.hip[0],
          duration: 2,
          ease: "power0.inOut",
        })
        .to(this.joint.knee[1].rotation, {
          y: Param.STEPON_PARAM.knee[0],
          duration: 2,
          ease: "power0.inOut",
        }, '-=2')
        .to(this.joint.hip[1].rotation, {
          y: Param.STEPON_PARAM.hip[1],
          duration: 2,
          ease: "power0.inOut",
        })
        .to(this.joint.knee[1].rotation, {
          y: Param.STEPON_PARAM.knee[1],
          duration: 2,
          ease: "power0.inOut",
          onComplete: () => {
            this.joint.knee[1].getWorldPosition(this.worldPosition);
            this.regHelper.position.copy(this.worldPosition);
            this.regHelper.position.y -= 5

            const regHelperPos = this.regHelper.position

            if (Math.sqrt((btnPos.x - regHelperPos.x) * (btnPos.x - regHelperPos.x) + (btnPos.z - regHelperPos.z) * (btnPos.z - regHelperPos.z)) < 3 + 2) {
              this.container.stepOnJudge = true
            }
          }
        }, '-=2')
    }
  }
  runMotion(progressTime, strength, keyFlag) {
    for (let i = 0; i < 2; i++) {
      const speedStrength = !keyFlag[0] && keyFlag[1] || !keyFlag[0] && !keyFlag[1] && keyFlag[2] || !keyFlag[0] && !keyFlag[1] && keyFlag[3] ? 1 : 1.5
      const sign = i == 0 ? -1 : 1
      const progress = (progressTime * speedStrength + Param.RUN_PARAM.frame / 2 * i) % Param.RUN_PARAM.frame
      let index = Math.floor(progress)
      let nextIndex = (index + 1) % Param.RUN_PARAM.frame
      let nP = Calc.ease(progress - index)
      let nDP = 1 - nP

      if (!keyFlag[0] && keyFlag[1]) {
        index = 5 - index
        nextIndex = 5 - nextIndex
      }

      if (i == 0) {
        this.fullBody.position.y = this.fullBody.position.baseY + (Param.RUN_PARAM.fullBody[index] * nDP + Param.RUN_PARAM.fullBody[nextIndex] * nP) * strength
      }
      this.joint.shoulder[i].rotation.y = (Param.RUN_PARAM.shoulder[index] * nDP + Param.RUN_PARAM.shoulder[nextIndex] * nP) * strength
      this.joint.elbow[i].rotation.y = (Param.RUN_PARAM.elbow[index] * nDP + Param.RUN_PARAM.elbow[nextIndex] * nP) * strength
      this.joint.elbow2[i].rotation.x = this.joint.elbow2[i].rotation.baseX - (Param.RUN_PARAM.elbow2[index] * nDP + Param.RUN_PARAM.elbow2[nextIndex] * nP) * sign * strength
      this.joint.hip[i].rotation.y = (Param.RUN_PARAM.hip[index] * nDP + Param.RUN_PARAM.hip[nextIndex] * nP) * strength
      this.joint.knee[i].rotation.y = (Param.RUN_PARAM.knee[index] * nDP + Param.RUN_PARAM.knee[nextIndex] * nP) * strength
    }
  }
  fallDown() {
    gsap.timeline()
      .to(this.container.position, {
        y: -500,
        duration: 2,
        ease: "power0.inOut",
      })
      .to(this.container.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
          console.log('end')
        }
      }, '-=1.3')
  }
  blowOff(enemyIndex) {
    const newRot = Calc.rotAdjust(Math.atan2(this.collision_array[enemyIndex].position.x - this.container.position.x, this.collision_array[enemyIndex].position.z - this.container.position.z))
    const newDist = Param.FIELD_PARAM.dist * 2
    const x = this.container.position.x - Math.sin(newRot) * newDist
    const z = this.container.position.z - Math.cos(newRot) * newDist

    gsap.timeline()
      .to(this.container.position, {
        x: x,
        z: z,
        overwrite: true,
        duration: 0.7,
        ease: "power1.inOut",
      })
      .to(this.fullBody.rotation, {
        x: this.fullBody.rotation.x + Math.PI * 3,
        //y: this.fullBody.rotation.y + Math.PI * 3,
        z: this.fullBody.rotation.z + Math.PI * 3,
        overwrite: true,
        duration: 0.7,
        ease: "power1.out",
        onComplete: () => {
          console.log('end')
        }
      }, '-=0.7')
      .to(this.container.scale, {
        x: 0,
        y: 0,
        z: 0,
        overwrite: true,
        duration: 0.3,
        ease: "power0.inOut",
      }, '-=0.3')
  }
  fanON(frameTime, gameState) {
    if (gameState == 'gameover') {
      this.windmill.rotation.z += 0.5 * frameTime * 5
    }
    else {
      this.windmill.rotation.z += this.container.accumulatedWindForce * frameTime * 5
    }
  }
  reset() {
    gsap.timeline()
      .set(this.container.position, {
        x: 0,
        y: 0,
        z: 0,
        overwrite: true,
      })
      .set(this.fullBody.rotation, {
        x: Math.PI / 2,
        z: Math.PI / 2,
        overwrite: true,
      })
      .set(this.container.scale, {
        x: 0.4,
        y: 0.4,
        z: 0.4,
        overwrite: true,
      })
    console.log(this.container.position)
    this.container.stepOn = false
    this.container.stepOnJudge = false
    this.container.control = Param.USER_PARAM.control
    this.container.windForce = Param.USER_PARAM.windForce
    this.container.accumulatedWindForce = Param.USER_PARAM.accumulatedWindForce
  }
}