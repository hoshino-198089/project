
import { WebGLUtility, ShaderProgram } from '../lib/webgl.js';
import { Pane } from '../lib/tweakpane-4.0.0.min.js';

window.addEventListener('DOMContentLoaded', async () => {
  const app = new WebGLApp();
  window.addEventListener('resize', app.resize, false);
  app.init('webgl-canvas');
  await app.load();
  app.setup();
  app.render();
}, false);

class WebGLApp {
  /**
   * @constructor
   */
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.running = false;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.uPointSize = 0.4;
    this.uMouse = [0.0, 0.0];
    this.uTime = 0
    this.uAspect = (window.innerWidth / window.innerHeight) / 1.84
    this.count = 0
    this.uUmbrellaScale = 1
    this.uSharpness = 3
    this.uRepelsPixelSize = 2
    this.progressTime = 0
    this.lastFrameTime = performance.now()

    const pane = new Pane();
    pane.addBlade({
      view: 'slider',
      label: 'point-size',
      min: 0.0,
      max: 1.0,
      value: this.uPointSize,
    })
      .on('change', (v) => { this.uPointSize = v.value; });

    pane.addBlade({
      view: 'slider',
      label: 'umbrella-scale',
      min: 0.5,
      max: 3.0,
      value: this.uUmbrellaScale,
    })
      .on('change', (v) => { this.uUmbrellaScale = v.value; });

    pane.addBlade({
      view: 'slider',
      label: 'sharpness',
      min: 1.0,
      max: 5.0,
      value: this.uSharpness,
    })
      .on('change', (v) => { this.uSharpness = v.value; });

    pane.addBlade({
      view: 'slider',
      label: 'repels-pixel-size',
      min: 0.1,
      max: 8.0,
      value: this.uRepelsPixelSize,
    })
      .on('change', (v) => { this.uRepelsPixelSize = v.value; });

    this.smoothPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    this.xTo = gsap.quickTo(this.smoothPointer, "x", {
      duration: 0.5,
      ease: "power3",
      onUpdate: () => {
        const x = this.smoothPointer.x / window.innerWidth;
        const y = this.smoothPointer.y / window.innerHeight;
        const signedX = x * 2.0 - 1.0;
        const signedY = y * 2.0 - 1.0;

        this.uMouse[0] = signedX;
        this.uMouse[1] = -signedY;
      }
    })
    this.yTo = gsap.quickTo(this.smoothPointer, "y", { duration: 0.5, ease: "power3" })

    window.addEventListener('pointermove', (mouseEvent) => {
      this.xTo(mouseEvent.pageX)
      this.yTo(mouseEvent.pageY)
    }, false);
  }
  /**
   * シェーダやテクスチャ用の画像など非同期で読み込みする処理を行う。
   * @return {Promise}
   */
  async load() {
    const vs = await WebGLUtility.loadFile('./main.vert');
    const fs = await WebGLUtility.loadFile('./main.frag');
    this.shaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attribute: [
        'position',
        'color',
        'size',
        'progress',
        'speed',
      ],
      stride: [
        3,
        4,
        1,
        1,
        1,
      ],
      uniform: [
        'pointScale',
        'mouse',
        'time',
        'aspect',
        'umbrellaScale',
        'sharpness',
        'repelsPixelSize'
      ],
      type: [
        'uniform1f',
        'uniform2fv',
        'uniform1f',
        'uniform1f',
        'uniform1f',
        'uniform1f',
        'uniform1f',
      ],
    });
  }
  setup() {
    this.setupGeometry();
    this.resize();
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.running = true;
  }
  setupGeometry() {
    this.position = [];
    this.color = [];
    this.pointSize = [];
    this.progress = [];
    this.speed = [];

    const COUNT = 120;
    for (let i = 0; i < COUNT; ++i) {
      const x = i / (COUNT - 1);
      const signedX = x * 2.0 - 1.0;
      for (let j = 0; j < COUNT; ++j) {
        const y = j / (COUNT - 1);
        const signedY = y * 2.0 - 1.0;

        this.position.push(signedX, signedY, 0.0);
        this.color.push(x, y, 0.5, 1.0);
        this.pointSize.push(0.5 + (Math.random() + Math.random()) / 2 * 7.5);
        this.progress.push(Math.random());
        this.speed.push(1 + Math.random() * 3);
      }
    }

    this.vbo = [
      WebGLUtility.createVbo(this.gl, this.position),
      WebGLUtility.createVbo(this.gl, this.color),
      WebGLUtility.createVbo(this.gl, this.pointSize),
      WebGLUtility.createVbo(this.gl, this.progress),
      WebGLUtility.createVbo(this.gl, this.speed),
    ];
  }
  render() {
    const gl = this.gl;

    if (this.running === true) {
      requestAnimationFrame(this.render);
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastFrameTime) / 1000
    this.progressTime += deltaTime
    this.lastFrameTime = currentTime
    this.count++
    this.uTime = this.progressTime * 0.5

    this.shaderProgram.use();
    this.shaderProgram.setAttribute(this.vbo);
    this.shaderProgram.setUniform([
      this.uPointSize,
      this.uMouse,
      this.uTime,
      this.uAspect,
      this.uUmbrellaScale,
      this.uSharpness,
      this.uRepelsPixelSize
    ]);

    gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.uAspect = (window.innerWidth / window.innerHeight) / 1.84
  }
  /**
   * WebGL を実行するための初期化処理を行う。
   * @param {HTMLCanvasElement|string} canvas - canvas への参照か canvas の id 属性名のいずれか
   * @param {object} [option={}] - WebGL コンテキストの初期化オプション
   */
  init(canvas, option = {}) {
    if (canvas instanceof HTMLCanvasElement === true) {
      this.canvas = canvas;
    } else if (Object.prototype.toString.call(canvas) === '[object String]') {
      const c = document.querySelector(`#${canvas}`);
      if (c instanceof HTMLCanvasElement === true) {
        this.canvas = c;
      }
    }
    if (this.canvas == null) {
      throw new Error('invalid argument');
    }
    this.gl = this.canvas.getContext('webgl', option);
    if (this.gl == null) {
      throw new Error('webgl not supported');
    }
  }
}