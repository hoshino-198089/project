import * as THREE from './lib/three.module.js';
import { Param } from './param.js';
import { Calc } from './calc.js';
import { gsap } from "gsap";

export class Enemy {
	constructor(scene, collision_array, index) {
		this.scene = scene
		this.collision_array = collision_array

		const fan_bodyMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			//side: THREE.DoubleSide
			side: THREE.FrontSide
		})
		const fan_lightMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			//side: THREE.DoubleSide
			side: THREE.FrontSide
		})
		const fan_propellerMaterial = new THREE.MeshStandardMaterial({
			color: 0xb9dced,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.7
		})

		const torusGeometry = new THREE.TorusGeometry(15, 0.2, 16, 100)
		const sphereGeometry = new THREE.SphereGeometry(1)
		const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 13.6, 32)

		this.container = new THREE.Object3D()
		collision_array.push(this.container)
		this.scene.add(this.container)

		// const rot = Math.round(Math.random() * 360) * (Math.PI / 180)
		// let dist = ((1 - Math.random() * Math.random()) - 0.5) * 2 * (Param.FIELD_PARAM.dist / 3 * 2 - Param.ENEMY_PARAM.width)
		// dist += Math.sign(dist) * Param.FIELD_PARAM.dist / 3
		// this.container.position.x = Math.sin(rot) * dist
		// this.container.position.z = Math.cos(rot) * dist
		// this.container.rotation.y = rot
		// this.container.rot = rot

		this.container.position.copy(Param.ENEMY_PARAM.initState[index].pos)
		this.container.rotation.y = Param.ENEMY_PARAM.initState[index].rotY
		this.container.rot = Param.ENEMY_PARAM.initState[index].rotY
		//this.container.scale.copy(Param.ENEMY_PARAM.initState[index].scale)

		this.container.label = Param.ENEMY_PARAM.label
		this.container.dir = Param.ENEMY_PARAM.dir
		this.container.tracking = Param.ENEMY_PARAM.tracking
		this.container.falling = Param.ENEMY_PARAM.falling
		this.container.back = Param.ENEMY_PARAM.back
		this.container.lostSightTime = Param.ENEMY_PARAM.lostSightTime
		this.container.width = Param.ENEMY_PARAM.width
		this.container.radius = Param.ENEMY_PARAM.radius
		this.container.swingRot = 0

		//this.container.position.x = 0
		//this.container.position.z = 100
		//this.container.rotation.y = Math.PI
		//this.container.rot = Math.PI

		this.fan_container = new THREE.Object3D()
		this.fan_container.position.y = 26
		this.fan_container.rotation.x = Math.PI / 2
		this.container.add(this.fan_container)

		const fan_otherParts = new THREE.Object3D()
		fan_otherParts.position.y = 7
		this.fan_container.add(fan_otherParts)

		this.fan_headPartsjoint = new THREE.Object3D()
		this.fan_headPartsjoint.position.y = -2
		this.fan_container.add(this.fan_headPartsjoint)

		const fan_headParts = new THREE.Object3D()
		fan_headParts.position.y = 7
		fan_headParts.rotation.x = Math.PI / 20
		this.fan_headPartsjoint.add(fan_headParts)

		this.fan_propellerParts = new THREE.Object3D()
		fan_headParts.add(this.fan_propellerParts)

		const fan_part1Count = 20
		for (let i = 0; i < fan_part1Count; i++) {
			const fan_part1 = new THREE.Mesh(torusGeometry, fan_bodyMaterial)
			fan_headParts.add(fan_part1)
			fan_part1.position.y = 1.2
			fan_part1.scale.y = 0.38
			fan_part1.rotation.y = Math.PI * 2 / fan_part1Count * i + Math.PI / 4
		}

		const fan_part2 = new THREE.Mesh(torusGeometry, fan_bodyMaterial)
		fan_part2.position.y = 1.2
		fan_part2.rotation.x = Math.PI / 2
		fan_headParts.add(fan_part2)

		const fan_part3 = new THREE.Mesh(sphereGeometry, fan_bodyMaterial)
		fan_part3.position.y = 7
		fan_part3.scale.y = 0.8
		fan_headParts.add(fan_part3)

		const fan_part35 = new THREE.Mesh(sphereGeometry, fan_lightMaterial)
		fan_part35.position.y = 7.8
		fan_part35.scale.set(0.7, 0.7, 0.7)
		fan_headParts.add(fan_part35)

		const fan_part4 = new THREE.Mesh(cylinderGeometry, fan_bodyMaterial)
		fan_headParts.add(fan_part4)

		const fan_part5 = new THREE.Mesh(sphereGeometry, fan_bodyMaterial)
		fan_part5.position.y = -7
		fan_part5.scale.set(2, 2, 2)
		fan_headParts.add(fan_part5)

		this.spotLight = new THREE.SpotLight(Param.SPOTLIGHT_LIGHT_PARAM.color, Param.SPOTLIGHT_LIGHT_PARAM.intensity, Param.SPOTLIGHT_LIGHT_PARAM.distance, Param.SPOTLIGHT_LIGHT_PARAM.angle, Param.SPOTLIGHT_LIGHT_PARAM.penumbra, Param.SPOTLIGHT_LIGHT_PARAM.decay);
		this.spotLight.position.copy(Param.SPOTLIGHT_LIGHT_PARAM.position);
		fan_headParts.add(this.spotLight);

		const spotLight_target = new THREE.Object3D()
		this.spotLight.target = spotLight_target;
		spotLight_target.position.set(0, 60, 20)
		fan_headParts.add(spotLight_target);

		const fan_part6 = new THREE.Mesh(cylinderGeometry, fan_bodyMaterial)
		fan_part6.position.set(0, -9, 12)
		fan_part6.scale.set(1.5, 2, 1.5)
		fan_part6.rotation.x = Math.PI / 2
		fan_otherParts.add(fan_part6)

		const fan_part7 = new THREE.Mesh(cylinderGeometry, fan_bodyMaterial)
		fan_part7.position.set(0, -7, 25)
		fan_part7.scale.set(20, 0.1, 20)
		fan_part7.rotation.x = Math.PI / 2
		fan_otherParts.add(fan_part7)

		const fan_part8Count = 5
		for (let i = 0; i < fan_part8Count; i++) {
			const rot = Math.PI * 2 / fan_part8Count * i

			const fan_part8 = new THREE.Mesh(cylinderGeometry, fan_propellerMaterial)
			fan_part8.position.set(6 * Math.sin(rot), 1.2, 6 * Math.cos(rot))
			fan_part8.scale.set(10, 0.01, 14)
			fan_part8.rotation.set(0, rot, -0.2)
			this.fan_propellerParts.add(fan_part8)
		}

		this.speed = 0.02
	}
	fanON(frameTime, strength) {
		this.fan_propellerParts.rotation.y -= frameTime * strength
	}
	swingMode(progressTime) {
		if (this.container.tracking) {
			this.fan_headPartsjoint.rotation.z += Math.sign(this.fan_headPartsjoint.rotation.z) * -0.01
		} else {
			this.fan_headPartsjoint.rotation.z = Math.min(0.9, Math.max(-0.9, Math.sin(progressTime * 4 / 30))) * Math.PI / 4
		}
		this.container.swingRot = this.fan_headPartsjoint.rotation.z
	}
	patrol() {
		const enemy = this.container
		const rot = Math.round(Math.random() * 360) * (Math.PI / 180)
		let dist = ((1 - Math.random() * Math.random()) - 0.5) * 2 * (Param.FIELD_PARAM.dist / 3 * 2 + enemy.width * 2)
		dist += Math.sign(dist) * Param.FIELD_PARAM.dist / 3
		const x = Math.sin(rot) * dist
		const z = Math.cos(rot) * dist
		const newRot = Calc.rotAdjust(Math.atan2(x - enemy.position.x, z - enemy.position.z))
		const newDist = Math.sqrt((x - enemy.position.x) * (x - enemy.position.x) + (z - enemy.position.z) * (z - enemy.position.z))

		let lastTime = performance.now();
		let progressTime = 0
		gsap.timeline()
			.to(enemy.rotation, {
				y: newRot,
				duration: 1,
				ease: "power2.out",
				onUpdate: function () {
					enemy.rot = this.targets()[0].y
				}
			})
			.to(enemy.position, {
				x: x,
				z: z,
				duration: newDist / (Param.FIELD_PARAM.dist * 2) * 24,
				delay: 1.5,
				ease: "power0.inOut",
				onUpdate: () => {
					const currentTime = performance.now();
					const deltaTime = (currentTime - lastTime) / 100;
					lastTime = currentTime;
					progressTime += deltaTime
					this.container.position.y = Math.abs(Math.sin(progressTime) * 0.4)
				},
				onComplete: () => {
					this.patrol()
				}
			})
	}
	back(indexA, indexB) {
		const elemA = this.collision_array[indexA]
		const elemB = this.collision_array[indexB]
		if (elemA.dir == 1 && !this.container.falling) {
			elemA.dir = -1
			let newRot = Calc.rotAdjust(Math.atan2(elemB.position.x - elemA.position.x, elemB.position.z - elemA.position.z))
			const newDist = (elemA.width + elemB.width) / 4
			const x = elemA.position.x - Math.sin(newRot) * newDist
			const z = elemA.position.z - Math.cos(newRot) * newDist

			gsap.timeline()
				.set(elemA, {
					tracking: false,
					back: true,
					overwrite: true,
				})
				.to(elemA.rotation, {
					y: newRot,
					duration: 1,
					ease: "power2.out",
				})
			gsap.timeline()
				.to(elemA.position, {
					x: x,
					z: z,
					duration: 1,
					ease: "power2.out",
					overwrite: true,
					onUpdate: function () {
						elemA.rot = this.targets()[0].y
					},
					onComplete: () => {
						elemA.dir = 1
						elemA.back = false
						this.patrol()
					}
				})
		}
	}
	pause() {
		gsap.set(this.container, {
			dir: 1,
			back: false,
			tracking: false,
			overwrite: true
		})
		gsap.set(this.container.position, {
			x: this.container.position.x,
			z: this.container.position.z,
			overwrite: true
		})
	}
	fallDown() {
		const rot = Math.round(Math.random() * 360) * (Math.PI / 180)
		let dist = ((1 - Math.random() * Math.random()) - 0.5) * 2 * (Param.FIELD_PARAM.dist / 3 * 2 - Param.ENEMY_PARAM.width)
		dist += Math.sign(dist) * Param.FIELD_PARAM.dist / 3

		gsap.timeline()
			.set(this.container, {
				dir: 1,
				back: false,
				tracking: false,
				falling: true,
				lostSightTime: 0,
				overwrite: true
			})
			.to(this.container.position, {
				y: -500,
				duration: 2,
				ease: "power0.inOut",
				overwrite: true
			})
			.set(this.container, { rot: rot })
			.set(this.container.position, {
				x: Math.sin(rot) * dist,
				y: 50,
				z: Math.cos(rot) * dist,
			})
			.set(this.container.rotation, { y: rot })
			.to(this.container.position, {
				y: 0,
				duration: 1,
				ease: "bounce.out",
				onComplete: () => {
					this.container.falling = false
					this.patrol()
				}
			})
	}
	tracking() {
		if (!this.container.falling) {
			this.container.lostSightTime = Date.now()
			if (!this.container.tracking && !this.container.back) {
				gsap.set(this.container, {
					dir: 1,
					tracking: true,
					overwrite: true
				})
			}
		}
	}
	fallCheckAndTrackingMode(userPos, progressTime) {

		//敵の落下判定
		if (Math.sqrt(this.container.position.x * this.container.position.x + this.container.position.z * this.container.position.z) > Param.FIELD_PARAM.dist + this.container.width / 2 && !this.container.falling) {
			this.container.falling = true
			this.fallDown()
		}

		if (this.container.falling) {
			this.container.tracking = false
		}

		//敵の追尾モード
		if (this.container.tracking && !this.container.back) {
			if (Date.now() - this.container.lostSightTime > 5000) {
				this.container.tracking = false
				this.patrol()
				return
			}

			//敵から見たユーザーの角度
			let fromEnemyToUser_rot = Calc.rotAdjust(Math.atan2(userPos.x - this.container.position.x, userPos.z - this.container.position.z))

			//角度差が180度あればプラマイ360度加算で無駄な回転をブロック
			fromEnemyToUser_rot = Math.max(fromEnemyToUser_rot, this.container.rotation.y) - Math.min(fromEnemyToUser_rot, this.container.rotation.y) > Math.PI ? fromEnemyToUser_rot - Math.PI * 2 * Math.sign(fromEnemyToUser_rot - this.container.rotation.y) : fromEnemyToUser_rot

			//敵の現在の角度とユーザーまでの角度の差
			const dRot = fromEnemyToUser_rot - this.container.rotation.y

			//符号を確認して角度の差を詰める
			const rotSign = Math.sign(dRot)
			this.container.rotation.y += rotSign * 0.026

			//追尾
			//this.container.x += Math.sin(this.container.rotation.y) * 0.6
			//this.container.z += Math.cos(this.container.rotation.y) * 0.6

			gsap.timeline()
				.set(this.container.position, {
					x: this.container.position.x + Math.sin(this.container.rotation.y) * 0.6,
					y: Math.abs(Math.sin(progressTime * 1.5) * 0.5),
					z: this.container.position.z + Math.cos(this.container.rotation.y) * 0.6,
					overwrite: true
				})

		}
	}
	outside() {
		this.container.position.x = Param.FIELD_PARAM.dist * 3
		this.container.position.z = Param.FIELD_PARAM.dist * 3
	}
	lightOff(){
		gsap.timeline()
		.to(this.spotLight,{
			intensity: 500,
			duration: 1,
			ease: 'power1.in'
		})
		.to(this.spotLight,{
			intensity: 2000,
			duration: 0.1,
			ease: 'power0.inOut'
		})
		.to(this.spotLight,{
			intensity: 0,
			duration: 0.05,
			ease: 'power0.inOut'
		})
	}
}