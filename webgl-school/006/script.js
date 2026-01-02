import { WebGLUtility } from '../lib/webgl.js';
import { Vec3, Mat4 } from '../lib/math.js';
import { WebGLGeometry } from '../lib/geometry.js';
import { WebGLOrbitCamera } from '../lib/camera.js';
import { Pane } from '../lib/tweakpane-4.0.3.min.js';

window.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  app.init();
  await app.load();
  app.setupGeometry();
  app.setupLocation();
  app.start();
  app.setPane()
}, false);

class App {
  constructor() {
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
  }
  setPane() {
    const pane = new Pane();
    const parameter = {
      rotation: false,
    };
    pane.addBinding(parameter, 'rotation')
      .on('change', (v) => {
        this.setRotation(v.value);
      });
    pane.addBlade({ view: 'slider', label: 'speed', min: 0., max: 2.0, value: this.speed, })
      .on('change', (v) => { this.speed = v.value })
    pane.addBlade({ view: 'slider', label: 'lightPower', min: 0.1, max: 3.0, value: this.lightPower, })
      .on('change', (v) => { this.lightPower = v.value })
  }
  setCulling(flag) {
    const gl = this.gl;
    if (gl == null) { return; }
    if (flag === true) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }
  }
  setDepthTest(flag) {
    const gl = this.gl;
    if (gl == null) { return; }
    if (flag === true) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }
  setRotation(flag) {
    this.isRotation = flag;
  }
  init() {
    this.canvas = document.getElementById('webgl-canvas');
    this.gl = WebGLUtility.createWebGLContext(this.canvas);
    this.speed = 1
    this.lightPower = 2

    const cameraOption = {
      distance: 5.0,
      min: 1.0,
      max: 10.0,
      move: 2.0,
    };
    this.camera = new WebGLOrbitCamera(this.canvas, cameraOption);
    this.camera.position[1] = 5
    this.camera.defaultPosition[1] = 5

    this.resize();

    window.addEventListener('resize', this.resize, false);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  load() {
    return new Promise(async (resolve, reject) => {
      const gl = this.gl;
      if (gl == null) {
        const error = new Error('not initialized');
        reject(error);
      } else {
        const VSSource = await WebGLUtility.loadFile('./main.vert');
        const FSSource = await WebGLUtility.loadFile('./main.frag');
        const vertexShader = WebGLUtility.createShaderObject(gl, VSSource, gl.VERTEX_SHADER);
        const fragmentShader = WebGLUtility.createShaderObject(gl, FSSource, gl.FRAGMENT_SHADER);
        this.program = WebGLUtility.createProgramObject(gl, vertexShader, fragmentShader);
        resolve();
      }
    });
  }
  setupGeometry() {
    const row = 32;
    const column = 16;
    const innerRadius = 0.4;
    const outerRadius = 0.8;
    const color = [1.0, 1.0, 1.0, 1.0];
    this.torusGeometry = WebGLGeometry.torus(
      row,
      column,
      innerRadius,
      outerRadius,
      color,
    );

    this.torusVBO = [
      WebGLUtility.createVBO(this.gl, this.torusGeometry.position),
      WebGLUtility.createVBO(this.gl, this.torusGeometry.normal),
      WebGLUtility.createVBO(this.gl, this.torusGeometry.color),
    ];
    this.torusIBO = WebGLUtility.createIBO(this.gl, this.torusGeometry.index);
  }
  setupLocation() {
    const gl = this.gl;
    this.attributeLocation = [
      gl.getAttribLocation(this.program, 'position'),
      gl.getAttribLocation(this.program, 'normal'),
      gl.getAttribLocation(this.program, 'color'),
    ];
    this.attributeStride = [
      3,
      3,
      4,
    ];
    this.uniformLocation = {
      paripiFlag: gl.getUniformLocation(this.program, 'paripiFlag'),
      lightPower: gl.getUniformLocation(this.program, 'lightPower'),
      time: gl.getUniformLocation(this.program, 'time'),
      mMatrix: gl.getUniformLocation(this.program, 'mMatrix'),
      mvpMatrix: gl.getUniformLocation(this.program, 'mvpMatrix'),
      normalMatrix: gl.getUniformLocation(this.program, 'normalMatrix'),
    };
  }
  setupRendering() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width / 2, this.canvas.height);
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  start() {
    this.prevTime = Date.now();
    this.time = 0.0;
    this.isRendering = true;
    this.render();
  }
  stop() {
    this.isRendering = false;
  }
  render() {
    const gl = this.gl;

    if (this.isRendering === true) requestAnimationFrame(this.render)

    this.time += (Date.now() - this.prevTime) * 0.001 * this.speed
    this.prevTime = Date.now()

    this.setupRendering();

    const rotateAxis = Vec3.create(0.0, 1.0, 0.0);
    const m = this.isRotation === true ?
      Mat4.rotate(Mat4.identity(), this.time, rotateAxis) :
      Mat4.identity();

    const v = this.camera.update();
    const fovy = 45;
    const aspect = window.innerWidth / 2 / window.innerHeight;
    const near = 0.1
    const far = 10.0;
    const p = Mat4.perspective(fovy, aspect, near, far);

    const vp = Mat4.multiply(p, v);
    const mvp = Mat4.multiply(vp, m);

    const normalMatrix = Mat4.transpose(Mat4.inverse(m));

    // 左側を描画
    gl.useProgram(this.program);
    gl.uniform1i(this.uniformLocation.paripiFlag, false);
    gl.uniform1f(this.uniformLocation.lightPower, 3.1 - this.lightPower);
    gl.uniform1f(this.uniformLocation.time, this.time);
    gl.uniformMatrix4fv(this.uniformLocation.mMatrix, false, m);
    gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
    gl.uniformMatrix4fv(this.uniformLocation.normalMatrix, false, normalMatrix);
    WebGLUtility.enableBuffer(gl, this.torusVBO, this.attributeLocation, this.attributeStride, this.torusIBO);
    gl.drawElements(gl.TRIANGLES, this.torusGeometry.index.length, gl.UNSIGNED_SHORT, 0);

    // 右側を描画
    gl.viewport(this.canvas.width / 2, 0, this.canvas.width / 2, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform1i(this.uniformLocation.paripiFlag, true);
    gl.uniform1f(this.uniformLocation.lightPower, 3.1 - this.lightPower);
    gl.uniform1f(this.uniformLocation.time, this.time);
    gl.uniformMatrix4fv(this.uniformLocation.mMatrix, false, m);
    gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
    gl.uniformMatrix4fv(this.uniformLocation.normalMatrix, false, normalMatrix);
    WebGLUtility.enableBuffer(gl, this.torusVBO, this.attributeLocation, this.attributeStride, this.torusIBO);
    gl.drawElements(gl.TRIANGLES, this.torusGeometry.index.length, gl.UNSIGNED_SHORT, 0);
  }
}