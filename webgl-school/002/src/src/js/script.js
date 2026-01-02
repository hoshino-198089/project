import * as THREE from './lib/three.module.js';
import { User } from './user.js';
import { Enemy } from './enemy.js';
import { Obj } from './obj.js';
import { Collision } from './collision.js';
import { Param } from './param.js';
import { gsap } from "gsap";

window.addEventListener('DOMContentLoaded', async () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  await app.load();
  app.render();
}, false);

class ThreeApp {
  constructor(wrapper) {
    const color = new THREE.Color(Param.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(Param.RENDERER_PARAM.width, Param.RENDERER_PARAM.height);
    wrapper.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();

    // フォグ
    this.scene.fog = new THREE.Fog(Param.FOG_PARAM.color, Param.FOG_PARAM.near, Param.FOG_PARAM.initFar);

    // カメラ
    this.camera = new THREE.PerspectiveCamera(Param.CAMERA_PARAM.fovy, Param.CAMERA_PARAM.aspect, Param.CAMERA_PARAM.near, Param.CAMERA_PARAM.far);
    this.camera.position.copy(Param.CAMERA_PARAM.position);
    this.camera.lookAt(Param.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(Param.DIRECTIONAL_LIGHT_PARAM.color, Param.DIRECTIONAL_LIGHT_PARAM.intensity);
    this.directionalLight.position.copy(Param.DIRECTIONAL_LIGHT_PARAM.position);
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(Param.AMBIENT_LIGHT_PARAM.color, Param.AMBIENT_LIGHT_PARAM.intensity);
    this.scene.add(this.ambientLight);

    // マテリアル
    this.material = new THREE.MeshLambertMaterial(Param.MATERIAL_PARAM);

    // キー入力
    this.keyFlag = [false, false, false, false]
    document.addEventListener('keydown', (e) => {
      if (e.key === 'w' && !this.keyFlag[0]) { this.keyFlag[0] = true }
      if (e.key === 's' && !this.keyFlag[1]) { this.keyFlag[1] = true }
      if (e.key === 'a' && !this.keyFlag[2]) { this.keyFlag[2] = true }
      if (e.key === 'd' && !this.keyFlag[3]) { this.keyFlag[3] = true }
    })

    document.addEventListener('keyup', (e) => {
      if (e.key === 'w' && this.keyFlag[0]) { this.keyFlag[0] = false }
      if (e.key === 's' && this.keyFlag[1]) { this.keyFlag[1] = false }
      if (e.key === 'a' && this.keyFlag[2]) { this.keyFlag[2] = false }
      if (e.key === 'd' && this.keyFlag[3]) { this.keyFlag[3] = false }
    })

    this.gameState = 'init'
    this.pauseFlag = false

    // 床を作成
    const cylinderGeometry = new THREE.CylinderGeometry(Param.FIELD_PARAM.dist, Param.FIELD_PARAM.dist, 1, 32)
    const floor = new THREE.Mesh(cylinderGeometry, this.material)
    this.scene.add(floor)

    this.btn = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1.5, 32), new THREE.MeshPhongMaterial({ color: Param.ENEMY_PARAM.stopBtnColor }))
    this.scene.add(this.btn)

    // 衝突判定対象の配列を作成
    this.collision_array = []

    // 敵キャラの配列を作成
    this.Enemy_array = []
    for (let i = 0; i < Param.ENEMY_PARAM.count; i++) {
      this.Enemy_array.push(new Enemy(this.scene, this.collision_array, i))
    }
    this.enemyFanStrength = Param.ENEMY_PARAM.fanStrength

    // オブジェの配列を作成
    this.Obj_array = []
    this.objMaterial = new THREE.MeshLambertMaterial(Param.MATERIAL_PARAM);
    for (let i = 0; i < Param.OBJ_PARAM.count; i++) {
      this.Obj_array.push(new Obj(this.scene, this.objMaterial, this.collision_array, i))
    }

    // ユーザーを作成
    this.User = new User(this.scene, this.collision_array)
    this.user = this.collision_array[this.collision_array.length - 1]

    window.addEventListener('click', () => {
      if (this.gameState == 'playing') { this.User.stepOnMotion(this.btn.position) }
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.gameState == 'playing') { this.User.stepOnMotion(this.btn.position) }
    })

    // 衝突判定
    this.collision = new Collision(this.collision_array)

    //html,cssでの適当なぼや用の変数
    this.fogAlpha = 0
    this.fogOffset = 0

    this.gameoverTxt = document.querySelector('#gameover')
    this.gameclearTxt = document.querySelector('#gameclear')
    this.fogWrap = document.querySelector('#fog')
    this.fogImg = document.querySelectorAll('#fog>div>div')

    document.querySelector('#startBtn').addEventListener('click', () => {
      if (this.gameState == 'init') {
        this.gameState = 'playing'
        this.scene.fog.far = Param.FOG_PARAM.far
        this.user.accumulatedWindForce = 0
        this.user.windForce = 0
        this.Enemy_array.forEach(function (Enemy) {
          Enemy.outside()
        })
        this.Obj_array.forEach(function (Obj) {
          Obj.posUpdate()
        })
        gsap.to('#init', {
          autoAlpha: 0,
          duration: 1,
          ease: 'power2.out'
        })
      }
    })

    document.querySelector('#retryBtn').addEventListener('click', () => {
      this.pauseFlag = false
      gsap.to(this.gameoverTxt, {
        autoAlpha: 0,
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
          this.gameState = 'playing'
          this.Enemy_array.forEach(function (Enemy) {
            Enemy.patrol()
          })
        }
      })
      this.User.reset()
      //this.gameState = 'playing'
      this.Obj_array.forEach(function (Obj) {
        Obj.posUpdate()
      })
    })


    // タッチ入力
    let padFlag = false
    let padOrigin = { x: 0, y: 0 }
    let touchStartTime = 0
    window.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now()
      padFlag = true
      padOrigin.x = e.touches[0].clientX
      padOrigin.y = e.touches[0].clientY
    })

    window.addEventListener('touchmove', (e) => {
      if (padFlag) {
        let dx = e.touches[0].clientX - padOrigin.x
        let dy = e.touches[0].clientY - padOrigin.y
        let radian = Math.atan2(dy, dx) + Math.PI * 2
        let rot = radian * 180 / Math.PI % 360
        let margin = Math.min(40, Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)))

        if (margin >= 40) {
          this.keyFlag[1] = rot >= 45 && rot < 135 ? true : false
          this.keyFlag[0] = rot >= 225 && rot < 315 ? true : false
          this.keyFlag[2] = rot >= 135 && rot < 225 ? true : false
          this.keyFlag[3] = rot >= 315 || rot < 45 ? true : false
        } else {
          this.keyFlag = [false, false, false, false]
        }
      }
    })

    window.addEventListener('touchend', () => {
      const touchDuration = Date.now() - touchStartTime
      if (touchDuration <= 200) {
        if (this.gameState == 'playing') { this.User.stepOnMotion(this.btn.position) }
      }

      if (padFlag) {
        this.keyFlag = [false, false, false, false]
        padFlag = false
      }
    })

    // 軸ヘルパー
    //const axesBarLength = 500.0;
    //this.axesHelper = new THREE.AxesHelper(axesBarLength);
    //this.axesHelper.position.y = 2
    //this.scene.add(this.axesHelper);

    // this のバインド
    this.render = this.render.bind(this);

    // 時間
    this.progressTime = 0;
    this.lastFrameTime = performance.now();

    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }
  async load() {
    const loader = new THREE.TextureLoader();
    //const texturePaths = ['./floor.webp', './hair.webp', './obj.webp'];
    const texturePaths = ['img/coast_sand_rocks_02_disp_4k.png', 'img/obj.webp'];

    const texturePromises = texturePaths.map((path, index) => {
      return new Promise((resolve) => {
        loader.load(path, (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          if (index == 0) {
            texture.repeat.set(15, 15);
          } else {
            texture.repeat.set(4, 4);
          }
          resolve(texture);
        });
      });
    });

    const textures = await Promise.all(texturePromises);
    this.material.map = textures[0];
    this.objMaterial.map = textures[1];
  }
  render() {
    requestAnimationFrame(this.render);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 100;
    this.progressTime += deltaTime
    this.lastFrameTime = currentTime;

    if (this.pauseFlag) {
      this.Enemy_array.forEach((Enemy) => {
        Enemy.pause()
      })
    }

    this.Enemy_array.forEach((Enemy) => {
      Enemy.fanON(deltaTime, this.enemyFanStrength)
    })

    if (this.user.stepOnJudge && this.gameState != 'clear') {
      this.btn.position.y = 1.5
      this.gameState = 'clear'
      this.pauseFlag = true
      gsap.to(this.gameclearTxt, {
        autoAlpha: 1,
        duration: 2,
        delay: 1,
        ease: 'power2.out'
      })
      this.Enemy_array.forEach((Enemy) => {
        Enemy.lightOff()
      })
    }

    if (this.gameState == 'init') {
      // ユーザーを更新
      this.User.runMotion(this.progressTime / 1.3, 1, [true, false, false, false]);

      // 敵を更新
      this.Enemy_array.forEach((Enemy) => {
        Enemy.swingMode(this.progressTime / 2)
      })
    }
    else if (this.gameState == 'playing') {
      this.fogWrap.style.opacity = 0.75 - this.fogAlpha

      if (this.keyFlag[0]) { this.fogAlpha += deltaTime / 60 }
      else { this.fogAlpha -= deltaTime / 100 }
      this.fogAlpha = Math.min(0.25, Math.max(0, this.fogAlpha))

      if (this.keyFlag[2]) {
        this.fogOffset -= deltaTime * 50
        this.fogImg.forEach((elem, index) => {
          elem.style.backgroundPositionX = this.fogOffset + 300 * index + 'px'
        })
      }
      if (this.keyFlag[3]) {
        this.fogOffset += deltaTime * 50
        this.fogImg.forEach((elem, index) => {
          elem.style.backgroundPositionX = this.fogOffset + 300 * index + 'px'
        })
      }

      // ユーザーを更新
      this.User.move(this.progressTime, deltaTime, this.keyFlag);

      // 全ての敵キャラを更新
      this.Enemy_array.forEach((Enemy) => {
        Enemy.fallCheckAndTrackingMode({ x: this.user.position.x, z: this.user.position.z }, this.progressTime)
        Enemy.swingMode(this.progressTime)
      })

      //ユーザーの落下判定
      if (Math.sqrt(this.user.position.x ** 2 + this.user.position.z ** 2) > Param.FIELD_PARAM.dist) {
        console.log(Math.sqrt(this.user.position.x ** 2 + this.user.position.z ** 2))
        this.pauseFlag = true
        this.gameState = 'gameover'
        this.User.fallDown()
        gsap.to(this.gameoverTxt, {
          autoAlpha: 1,
          duration: 2,
          delay: 1,
          ease: 'power2.out'
        })
      }

      //衝突判定
      this.user.windForce = []
      for (let i = 0; i < this.collision_array.length; i++) {
        for (let j = i + 1; j < this.collision_array.length; j++) {
          const collisionResult = this.collision.check(i, j)
          if (collisionResult != undefined) {
            if (collisionResult == "back") {
              this.Enemy_array[i].back(i, j)
              if (j < this.Enemy_array.length) { this.Enemy_array[j].back(j, i) }
            }
            else if (collisionResult == "tracking") { this.Enemy_array[i].tracking() }
          }
        }
      }

      //風の蓄積、死亡時は配列の先頭の子を参考にぶっ飛び
      if (this.user.windForce.length == 0) {
        this.user.accumulatedWindForce = Math.max(0, this.user.accumulatedWindForce - 0.001)
      } else {
        this.user.accumulatedWindForce += 0.001 * this.user.windForce.length
        if (this.user.accumulatedWindForce > Param.USER_PARAM.accumulatedWindForceLimit) {
          this.pauseFlag = true
          this.gameState = 'gameover'
          this.User.blowOff(this.user.windForce[0])
          gsap.to(this.gameoverTxt, {
            autoAlpha: 1,
            duration: 2,
            delay: 0.5,
            ease: 'power2.out'
          })
        }
      }
      this.User.fanON(deltaTime)
    }
    else if (this.gameState == 'gameover') {
      this.User.fanON(deltaTime, 'gameover')
    }
    else if (this.gameState == 'clear') {
      this.enemyFanStrength = Math.max(0, this.enemyFanStrength - deltaTime * 0.02)
    }

    if (this.gameState != 'clear') {
      // ボタンの位置を更新
      this.btn.position.copy(this.collision_array[0].position)
      this.btn.position.x += Math.sin(this.collision_array[0].rotation.y) * -6.3
      this.btn.position.y += 2.5
      this.btn.position.z += Math.cos(this.collision_array[0].rotation.y) * -6.3
    }

    // カメラの更新
    if (this.gameState == 'init') {
      this.camera.position.copy(new THREE.Vector3(15, 13, 22));
      this.camera.lookAt(new THREE.Vector3(8, 4, 0));
    } else {
      if (Math.sqrt(this.user.position.x * this.user.position.x + this.user.position.z * this.user.position.z) < Param.FIELD_PARAM.dist * 1.1) {
        this.camera.position.x = this.user.position.x + Math.sin(this.user.rotation.y) * Param.CAMERA_ADD_PARAM.position.x
        this.camera.position.y = this.user.position.y + Param.CAMERA_ADD_PARAM.position.y
        this.camera.position.z = this.user.position.z + Math.cos(this.user.rotation.y) * Param.CAMERA_ADD_PARAM.position.z
        this.camera.lookAt(new THREE.Vector3(this.user.position.x, this.camera.position.y + Param.CAMERA_ADD_PARAM.lookAt.y, this.user.position.z));
      }
    }

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}