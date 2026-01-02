
// ============================================================================
// ドミノをイメージして作成、BoxGeometryは700個使用
//
// 様々な要素でObject3Dの機能が使えるという情報から、
// カメラを動かしてみたいと思ったのがきっかけです。
// ============================================================================

import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  app.render();
}, false);

function calcRadian(pos){
	let angle = Math.atan2(pos[1][0] - pos[0][0], pos[1][1] - pos[0][1])
	return angle
}

function calcLerp(pos, dist){
	var result = new Array()
	for(let i = 0; i < dist; i++){
		var dx = pos[0][0] * (1 - i / dist) + pos[1][0] * (i / dist)
		var dz = pos[0][1] * (1 - i / dist) + pos[1][1] * (i / dist)
		result.push([dx, dz])
	}
	return result
}

function calcDist(pos){
	var dx = pos[1][0] - pos[0][0]
	var dz = pos[1][1] - pos[0][1]
	return Math.sqrt(dx * dx + dz * dz)
}

function calcArc(parm, target){
	let array = new Array()
	let length = Math.round(Math.abs(parm.range[1] - parm.range[0]) / 360 * parm.radius * 2 * Math.PI) * 0.5
	let angleStep = (parm.range[1] - parm.range[0]) * (Math.PI / 180) / length
	
	for(var i = 0; i < length; i++){
		let param = new Object()
		let angle = parm.range[0] * (Math.PI / 180) + (angleStep * i)
		let dx = parm.pos[0] + parm.radius * Math.cos(angle)
		let dz = parm.pos[1] + parm.radius * Math.sin(angle)

		angle *= -1
		angle += parm.range[1] - parm.range[0] >= 0 ? 180 * (Math.PI / 180) : 0
		if(angle < 0){
			angle += 2 * Math.PI
		}
		else if(angle >= 2 * Math.PI){
			angle %= 2 * Math.PI
		}

		param.pos = [dx, dz]
		param.rot = angle
		array.push(param)
	}
	array.reverse()
	target.push(...array)
}

function calcBezier(startPos, controlPos, endPos, startRot, endRot, length, target){
	for(let i = 0; i <= length; i++){
		let param = new Object()
		let t = i / length * 0.94
		let dt = 1 - t
		let x = Math.pow(dt, 2) * startPos[0] + 2 * dt * t * controlPos[0] + Math.pow(t, 2) * endPos[0]
		let y = Math.pow(dt, 2) * startPos[1] + 2 * dt * t * controlPos[1] + Math.pow(t, 2) * endPos[1]

		let dx = 2 * dt * (controlPos[0] - startPos[0]) + 2 * t * (endPos[0] - controlPos[0])
		let dy = 2 * dt * (controlPos[1] - startPos[1]) + 2 * t * (endPos[1] - controlPos[1])
		let angle = Math.atan2(dx,dy)
		if(angle < 0){
			angle += 2 * Math.PI
		}
		else if(angle >= 2 * Math.PI){
			angle %= 2 * Math.PI
		}
		
		param.pos = [x, y]
		param.rot = angle
		target.push(param)
	}
}

function smoothstep(x) {
	return x * x * x * (6 * x * x - 15 * x + 10)
}

function easeOutCubic(x){
	return 1 - Math.pow(1 - x, 3)
}

function cutomEase(x){
	return smoothstep(x) * easeOutCubic(x)
}

class ThreeApp {
  static CAMERA_PARAM = {
    fovy: 60,
    maxFovy: 120,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200.0,
    position: new THREE.Vector3(0.0, 120.0, 0.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static RENDERER_PARAM = {
    clearColor: 0x222226,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static SPOTLIGHT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 35.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
		target: new THREE.Object3D(),
		penumbra: 1
	};
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.5,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
  };
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.03,
  };
  static MATERIAL_PARAM = {
    color: [
			0xF3EEEA,
			0xEBE3D5,
			0xB0A695,
			0x776B5D
		],
  };
  static FX_MATERIAL_PARAM = {
    color: 0xffffff,
  };

  constructor(wrapper) {
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

		// カメラ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
		this.cameraMoveFlag = true

		// スポットライト
		this.spotLight = new THREE.SpotLight(
			ThreeApp.SPOTLIGHT_LIGHT_PARAM.color,
			ThreeApp.SPOTLIGHT_LIGHT_PARAM.intensity
		);
		this.spotLight.position.copy(ThreeApp.SPOTLIGHT_LIGHT_PARAM.position);
    this.scene.add(this.spotLight);
		this.scene.add(ThreeApp.SPOTLIGHT_LIGHT_PARAM.target);
		this.spotLight.target = ThreeApp.SPOTLIGHT_LIGHT_PARAM.target;
		this.spotLight.penumbra = ThreeApp.SPOTLIGHT_LIGHT_PARAM.penumbra;
		
    // アンビエントライト
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // マテリアル
    this.materials = [
			new THREE.MeshPhongMaterial({color: ThreeApp.MATERIAL_PARAM.color[0]}),
			new THREE.MeshPhongMaterial({color: ThreeApp.MATERIAL_PARAM.color[1]}),
			new THREE.MeshPhongMaterial({color: ThreeApp.MATERIAL_PARAM.color[2]}),
			new THREE.MeshPhongMaterial({color: ThreeApp.MATERIAL_PARAM.color[3]}),
			new THREE.MeshPhongMaterial({color: ThreeApp.MATERIAL_PARAM.color[3]}),
		]
    this.fxMaterial = new THREE.MeshBasicMaterial(ThreeApp.FX_MATERIAL_PARAM)

		let scale = 0.5
    const paramArray = [
			{type: 'line', pos: [[197, 573], [221, 616]], index: 0},
			{type: 'circle', pos: [224, 614], radius: 7 * scale, range: [14, 168], index: 0},
			{type: 'line', pos: [[228, 613], [236.7, 585]], index: 0},
			{type: 'circle', pos: [239.5, 586], radius: 6 * scale, range: [347, 182], index: 0},
			{type: 'line', pos: [[243, 587], [250.5, 609.5]], index: 0},
			{type: 'circle', pos: [253.5, 607.5], radius: 6 * scale, range: [28, 190], index: 0},
			{type: 'line', pos: [[257, 607.3], [284, 560]], index: 0},
			{type: 'line', pos: [[274, 605], [288, 593]], index: 1},
			{type: 'bezier', pos: [292, 584], length: 7, index: 1},
			{type: 'line', pos: [[280.5, 588.5], [269, 603]], index: 1},
			{type: 'bezier', pos: [265, 617], length: 10, index: 1},
			{type: 'line', pos: [[282, 612], [294, 605]], index: 1},
			{type: 'line', pos: [[311, 573], [299, 607]], index: 2},
			{type: 'bezier', pos: [300, 613], length: 5, index: 2},
			{type: 'line', pos: [[304, 608], [308, 602]], index: 2},
			{type: 'bezier', pos: [312, 592], length: 8, index: 2},
			{type: 'line', pos: [[316, 587], [319, 585]], index: 2},
			{type: 'bezier', pos: [325, 582], length: 7, index: 2},
			{type: 'line', pos: [[327, 591], [326, 594]], index: 2},
			{type: 'bezier', pos: [324, 600], length: 8, index: 2},
			{type: 'line', pos: [[314, 607], [308, 612]], index: 2},
			{type: 'line', pos: [[362, 567], [362, 564]], index: 3},
			{type: 'bezier', pos: [363, 560], length: 4, index: 3},
			{type: 'line', pos: [[357, 560], [352, 562]], index: 3},
			{type: 'bezier', pos: [335, 575], length: 16, index: 3},
			{type: 'line', pos: [[333, 600], [334, 605]], index: 3},
			{type: 'bezier', pos: [340, 612], length: 9, index: 3},
			{type: 'line', pos: [[353, 604], [365, 588]], index: 3},
			{type: 'bezier', pos: [373, 575], length: 8, index: 3},
			{type: 'line', pos: [[363, 578], [346, 587]], index: 3},
			{type: 'line', pos: [[390, 555], [374, 592]], index: 4},
			{type: 'bezier', pos: [369, 600], length: 7, index: 4},
			{type: 'line', pos: [[379, 601], [411, 593]], index: 4},
			{type: 'line', pos: [[290, 622], [282, 624]], index: 5},
			{type: 'bezier', pos: [252, 633], length: 12, index: 5},
			{type: 'line', pos: [[272, 643], [280, 646]], index: 5},
			{type: 'bezier', pos: [289, 652], length: 7, index: 5},
			{type: 'line', pos: [[281, 664], [277, 667]], index: 5},
			{type: 'bezier', pos: [266, 672], length: 7, index: 5},
			{type: 'line', pos: [[255, 670], [252, 669]], index: 5},
			{type: 'line', pos: [[306, 651], [309, 647]], index: 6},
			{type: 'bezier', pos: [311, 639], length: 5, index: 6},
			{type: 'line', pos: [[305, 639], [302, 641]], index: 6},
			{type: 'bezier', pos: [296, 646.5], length: 12, index: 6},
			{type: 'line', pos: [[294, 656], [293, 660]], index: 6},
			{type: 'bezier', pos: [295, 667], length: 6, index: 6},
			{type: 'line', pos: [[301, 666], [304, 665]], index: 6},
			{type: 'bezier', pos: [313, 662], length: 12, index: 6},
			{type: 'line', pos: [[320, 656], [322, 654]], index: 6},
			{type: 'line', pos: [[352, 615], [327, 660]], index: 7},
			{type: 'bezier', pos: [326, 666], length: 4, index: 7},
			{type: 'line', pos: [[331, 662], [337, 653]], index: 7},
			{type: 'bezier', pos: [348, 642], length: 9, index: 7},
			{type: 'line', pos: [[351, 647], [352, 650]], index: 7},
			{type: 'bezier', pos: [350, 658], length: 6, index: 7},
			{type: 'line', pos: [[354, 661], [355, 662]], index: 7},
			{type: 'line', pos: [[373, 637], [367, 642]], index: 8},
			{type: 'bezier', pos: [354, 662], length: 12, index: 8},
			{type: 'line', pos: [[371, 659], [377, 654]], index: 8},
			{type: 'bezier', pos: [388, 646], length: 10, index: 8},
			{type: 'line', pos: [[379, 637], [375, 635]], index: 8},
			{type: 'line', pos: [[398, 635], [394, 639]], index: 9},
			{type: 'bezier', pos: [388, 646], length: 8, index: 9},
			{type: 'line', pos: [[391, 656], [395, 659]], index: 9},
			{type: 'bezier', pos: [415, 650], length: 13, index: 9},
			{type: 'line', pos: [[404, 637], [400, 633]], index: 9},
			{type: 'line', pos: [[431, 611], [418, 640]], index: 10},
			{type: 'bezier', pos: [410, 655], length: 8, index: 10},
			{type: 'line', pos: [[422, 653], [429, 650]], index: 10},
			{type: 'line', pos: [[197, 573], [221, 616]], index: 11},
			{type: 'circle', pos: [224, 614], radius: 7 * scale, range: [14, 168], index: 11},
			{type: 'line', pos: [[228, 613], [236.7, 585]], index: 11},
			{type: 'circle', pos: [239.5, 586], radius: 6 * scale, range: [347, 182], index: 11},
			{type: 'circle', pos: [306, 576], radius: 130 * scale, range: [70, 170], index: 11},
		]
		const posArray = []
		this.boxGeometry = new THREE.BoxGeometry(2.2, 3, 0.4)
		this.boxGeometry.translate(0, this.boxGeometry.parameters.height / 2, -this.boxGeometry.parameters.depth / 2)
    this.boxArray = []
    this.progress = 0
    this.endCount = 0
    this.rotIndex = []
    this.delay = [0, 30, 0, 5, 10, 10, 10, 16, 10, 5, 5, 5, 5]
    this.baseSpeed = 0.02
    this.addSpeed = 0
    this.topSpeed = 0.16
		for(let i = 0; i < 12; i++){
			posArray.push([])
			this.boxArray.push([])
			this.rotIndex.push(0)
		}
		
		// ドミノの座標と角度のセット
		paramArray.forEach(function(data, index){
			if(data.type == 'line'){
				let dist = Math.round(calcDist(data.pos) * scale)
				let pos = calcLerp(data.pos, dist)
				let rot = calcRadian(data.pos)
				for(let i = 0; i < dist; i++){
					let param = new Object()
					param.pos = pos[i]
					param.rot = rot
					posArray[data.index].push(param)
				}
			}
			else if(data.type == 'circle'){
				calcArc(data, posArray[data.index])
			}
			else if(data.type == 'bezier'){
				let prevTarget = paramArray[index - 1]
				let nextTarget = paramArray[index + 1]
				calcBezier(prevTarget.pos[1], data.pos, nextTarget.pos[0], calcRadian(prevTarget.pos), calcRadian(nextTarget.pos), data.length, posArray[data.index])
			}
		})

		// ドミノの作成
		for(let i = 0; i < posArray.length; i++){
			for(let h = 0; h < posArray[i].length; h++){
				let materialIndex = Math.round(Math.random() * 10)
				if(materialIndex < 1){materialIndex = 3}
				if(materialIndex < 2){materialIndex = 2}
				else if(materialIndex < 4){materialIndex = 1}
				else{materialIndex = 0}
				
				const box = i != 11 ? new THREE.Mesh(this.boxGeometry, this.materials[materialIndex]) : new THREE.Mesh(this.boxGeometry, this.materials[4])
				const data = posArray[i][h]
				box.position.x = data.pos[0] * scale - 320 * scale - 10 * scale;
				box.position.y = i != 11 ? 0 : Math.max(0, h - 45) * 0.2;
				box.position.z = data.pos[1] * scale - 610 * scale - 10 * scale;
				box.rotation.y = data.rot
				box.rot = 0
				box.rotY = data.rot
				
				// 最後のデータはカメラの移動用なので透過
				if(i == 11){
					box.material.transparent = true
					box.material.opacity = 0
				}
				this.scene.add(box);
				this.boxArray[i].push(box);
			}
		}
		
		// 効果線の作成
		this.fxArray = [];
		this.fxGeometry = new THREE.BoxGeometry(0.01, 0.01, 1.05)
    this.fxAlpha = 0;
		for(let i = 0; i < 40; ++i){
      const box = new THREE.Mesh(this.fxGeometry, this.fxMaterial);
      box.position.set(0, 0, 0)
			box.material.transparent = true
			box.material.opacity = 0.1 + Math.random() * 0.3
			box.offset = {
				x: Math.sign(Math.random() - 0.5) * (Math.round(Math.random() * 2) + 1),
				y: Math.sign(Math.random() - 0.5) * (Math.round(Math.random() * 2) + 0.2),
				z: Math.sign(Math.random() - 0.5) * (Math.round(Math.random() * 2) + 1)
			}
			box.progress = Math.random()
      this.scene.add(box)
      this.fxArray.push(box)
    }

    // 軸ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength)
    //this.scene.add(this.axesHelper)

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    // this のバインド
    this.render = this.render.bind(this)

    // リサイズ
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    }, false)
  }

  render() {
    requestAnimationFrame(this.render);
		
		if(this.endCount < 11){
			const speed = Math.min(this.topSpeed, this.baseSpeed + this.addSpeed);
			this.addSpeed += 0.00016
			const rotSpeed = speed / 2.5
			const boxMaxAngle = 1.16
			this.progress += speed
			const orbitIndex = 11
			const targetIndex = Math.floor(this.progress % this.boxArray[orbitIndex].length)
			const p = this.progress - Math.floor(this.progress)
			const dp = (1 - p)
			const t = cutomEase(Math.max(0, targetIndex - ((this.boxArray[orbitIndex].length - 1) / 2)) / ((this.boxArray[orbitIndex].length - 1) / 2))
			const dt = (1 - t)

			if(this.cameraMoveFlag){

				// カメラ 更新
				const currentTarget = this.boxArray[orbitIndex][targetIndex]
				const nextTarget = this.boxArray[orbitIndex][Math.min(targetIndex + 1, this.boxArray[orbitIndex].length - 1)]
				const newCameraAngle = (currentTarget.rotY * dp + nextTarget.rotY * p) * dt + 180 * (Math.PI / 180) * t

				const newCameraOrigin = {
					x: currentTarget.position.x * dp + nextTarget.position.x * p,
					y: currentTarget.position.y * dp + nextTarget.position.y * p,
					z: currentTarget.position.z * dp + nextTarget.position.z * p,
				}
				this.camera.position.set(
					(newCameraOrigin.x - (5.5 - speed * 20) * Math.sin(newCameraAngle)) * dt,
					(newCameraOrigin.y + 3.2) * dt + 120 * t,
					(newCameraOrigin.z - (5.5 - speed * 20) * Math.cos(newCameraAngle)) * dt
				);
				this.camera.lookAt(
					newCameraOrigin.x * dt,
					(newCameraOrigin.y + .8) * dt,
					newCameraOrigin.z * dt
				);
				this.camera.fov = Math.min(ThreeApp.CAMERA_PARAM.maxFovy, this.camera.fov + speed) * dt + 60 * t
				this.camera.updateProjectionMatrix();

				// スポットライト 更新
				this.spotLight.position.set(
					(newCameraOrigin.x - (2.5 - speed * 20) * Math.sin(newCameraAngle)) * dt,
					(newCameraOrigin.y + 5) * dt + 120 * t,
					(newCameraOrigin.z - (1.5 - speed * 20) * Math.cos(newCameraAngle)) * dt
				);
				ThreeApp.SPOTLIGHT_LIGHT_PARAM.target.position.set(
					(newCameraOrigin.x) * dt,
					(newCameraOrigin.y + 1.2) * dt,
					(newCameraOrigin.z) * dt
				);
				this.spotLight.intensity = ThreeApp.SPOTLIGHT_LIGHT_PARAM.intensity * dt + 40000 * t

				// カメラの終了判定
				if(targetIndex == this.boxArray[orbitIndex].length - 1){
					this.cameraMoveFlag = false
				}

				// 効果線 更新
				this.fxAlpha = Math.min(1, this.fxAlpha + speed / 50)
				for(let i = 0; i < this.fxArray.length; i++){
					const box = this.fxArray[i]
					box.progress += speed
					const progress = box.progress - Math.floor(box.progress)

					if(box.lastTime - progress > 0.5){
						box.material.opacity = t == 0 ? (0.1 + Math.random() * 0.3) * this.fxAlpha : 0
						box.offset = {
							x: Math.sign(Math.random() - 0.5) * (Math.round(Math.random() * 2) + 1),
							y: Math.sign(Math.random() - 0.5) * (Math.round(Math.random() * 2) + 0.2),
							z: Math.sign(Math.random() - 0.5) * (Math.round(Math.random() * 2) + 1)
						}
					}
					box.lastTime = progress
					box.position.set(
						this.camera.position.x * progress + ThreeApp.SPOTLIGHT_LIGHT_PARAM.target.position.x * (1 - progress) + box.offset.x,
						this.camera.position.y + box.offset.y,
						this.camera.position.z * progress + ThreeApp.SPOTLIGHT_LIGHT_PARAM.target.position.z * (1 - progress) + box.offset.z
					)
					box.lookAt(
						this.camera.position.x + box.offset.x * 0.5,
						this.camera.position.y + box.offset.y * 0.5,
						this.camera.position.z + box.offset.z * 0.5
					);
				}

			}

			// ドミノ 更新
			for(let i = 0; i < this.boxArray.length - 1; i++){
				if(this.rotIndex[i] < this.boxArray[i].length && this.delay[i] == 0){
					const rotTarget = this.boxArray[i][this.rotIndex[i]]
					rotTarget.rotateOnAxis(new THREE.Vector3(1, 0, 0), boxMaxAngle * rotSpeed)
					rotTarget.rot += boxMaxAngle * rotSpeed
					if(rotTarget.rot / boxMaxAngle > 0.4){
						const rotNextTarget = this.boxArray[i][Math.min(this.rotIndex[i] + 1, this.boxArray[i].length - 1)]
						rotNextTarget.rotateOnAxis(new THREE.Vector3(1, 0, 0), boxMaxAngle * rotSpeed)
						rotNextTarget.rot += boxMaxAngle * rotSpeed
					}
					if(rotTarget.rot / boxMaxAngle > 0.8){
						const rotNextTarget = this.boxArray[i][Math.min(this.rotIndex[i] + 2, this.boxArray[i].length - 1)]
						rotNextTarget.rotateOnAxis(new THREE.Vector3(1, 0, 0), boxMaxAngle * rotSpeed)
						rotNextTarget.rot += boxMaxAngle * rotSpeed
					}
					if(rotTarget.rot / boxMaxAngle > 1){
						this.rotIndex[i]++
						if(this.rotIndex[i] == this.boxArray[i].length){
							this.endCount++
						}
						if(this.delay[i + 1] > 0){
							this.delay[i + 1]--
						}
					}
				}
			}
		}

    this.renderer.render(this.scene, this.camera);
  }
}