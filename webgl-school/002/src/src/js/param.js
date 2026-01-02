import * as THREE from './lib/three.module.js';

export class Param {
  /**
   * カメラ
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 2000.0,
    position: new THREE.Vector3(0.0, 40.0, 200.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static CAMERA_ADD_PARAM = {
    position: { x: -55, y: 35, z: -55 },
    lookAt: { x: 0, y: -25, z: 0 }
  };
  /**
   * レンダラー
   */
  static RENDERER_PARAM = {
    clearColor: 0xffffff, // フォグを使う場合、背景をクリアする色にも注意！ @@@
    width: window.innerWidth,
    height: window.innerHeight,
  };
  /**
   * ライト
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
  };
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.1,
  };
  static SPOTLIGHT_LIGHT_PARAM = {
    color: 0xff0000,
    intensity: 20000.0,
    position: new THREE.Vector3(0, -4.5, -5.0),
    target: new THREE.Object3D(),
    distance: 0,
    angle: Math.PI / 6,
    penumbra: 0.2,
    decay: 2
  };
  /**
   * マテリアル
   */
  static MATERIAL_PARAM = {
    color: 0xffff88,
  };
  static HAIR_MATERIAL_PARAM = {
    color: 0xffffff,
    transparent: true,
    opacity: 0.2
  };
  /**
   * フォグ
   */
  static FOG_PARAM = {
    color: 0xffffff, // フォグの色
    //near: 200.0,       // フォグの掛かり始めるカメラからの距離
    //far: 400.0        // フォグが完全に掛かるカメラからの距離
    //near: 0.0,       // フォグの掛かり始めるカメラからの距離
    far: 350.0,        // フォグが完全に掛かるカメラからの距離
    initFar: 100.0        // フォグが完全に掛かるカメラからの距離
  };
  /**
   * フィールド
   */
  static FIELD_PARAM = {
    dist: 400
  }
  /**
   * ユーザー
   */
  static USER_PARAM = {
    label: 'user',
    width: 10,
    radius: 5,
    control: true,
    windForce: [],
    accumulatedWindForce: 0,
    initPos: new THREE.Vector3(0.0, 0.0, 0.0),
    accumulatedWindForceLimit: 0.5
  }
  /**
   * 走るモーション
   */
  static RUN_PARAM = {
    frame: 6,
    fullBody: [
      0,
      2,
      0,
      1,
      2,
      -1
    ],
    shoulder: [
      Math.PI / 4,
      -Math.PI / 12,
      -Math.PI / 4,
      -Math.PI / 2,
      -Math.PI / 12,
      Math.PI / 4
    ],
    elbow: [
      Math.PI / 2,
      Math.PI / 4,
      Math.PI / 3,
      Math.PI / 2,
      Math.PI / 3,
      Math.PI / 4
    ],
    elbow2: [
      0,
      Math.PI / 5,
      Math.PI / 5,
      Math.PI / 5,
      Math.PI / 5,
      0
    ],
    hip: [
      -Math.PI / 4,
      Math.PI / 6,
      Math.PI / 3,
      Math.PI / 8,
      Math.PI / 8,
      -Math.PI / 8
    ],
    knee: [
      -Math.PI / 3,
      -Math.PI / 1.5,
      -Math.PI / 2,
      -Math.PI / 12,
      -Math.PI / 3,
      -Math.PI / 12
    ]
  };
  /**
   * 踏みつけモーション
   */
  static STEPON_PARAM = {
    fullBody: [
      { x: 0, y: -2, z: 10 },
    ],
    shoulder: [
      Math.PI / 8,
    ],
    hip: [
      Math.PI / 2.5,
      Math.PI / 6,
    ],
    knee: [
      -Math.PI / 2.5,
      -Math.PI / 6,
    ],
    hipL: [
      -Math.PI / 12,
    ],
    kneeL: [
      -Math.PI / 12,
    ]
  };
  /**
   * 敵
   */
  static ENEMY_PARAM = {
    label: 'enemy',
    dir: 1,
    tracking: false,
    falling: false,
    back: false,
    lostSightTime: 0,
    width: 20,
    radius: 150,
    stopBtnColor: 0xff0000,
    count: 4,//4
    fanStrength: 1,
    initState: [
      {
        pos: new THREE.Vector3(0.0, -200.0, 0.0),
        rotY: 0,
      },
      {
        pos: new THREE.Vector3(50.0, 0.0, -120.0),
        rotY: -Math.PI / 6,
      },
      {
        pos: new THREE.Vector3(0.0, -200.0, 0.0),
        rotY: 0,
      },
      {
        pos: new THREE.Vector3(0.0, -200.0, 0.0),
        rotY: 0,
      }
    ]
  }
  /**
   * 岩
   */
  static OBJ_PARAM = {
    label: 'obj',
    dir: 0,
    width: 40,
    radius: 20,
    count: 6,
    initPos: [
      new THREE.Vector3(-30.0, 0.0, -55.0),
      new THREE.Vector3(50.0, 0.0, -10.0),
      new THREE.Vector3(-50.0, 0.0, -20.0),
      new THREE.Vector3(100.0, 0.0, 100.0),
      new THREE.Vector3(100.0, 0.0, 100.0),
      new THREE.Vector3(100.0, 0.0, 100.0)
    ]
  }
}