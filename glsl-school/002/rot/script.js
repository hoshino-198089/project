import { WebGLUtility, ShaderProgram } from './lib/webgl.js';
import { WebGLMath } from './lib/math.js';
import { Pane } from './lib/tweakpane-4.0.0.min.js';

window.addEventListener('DOMContentLoaded', async () => {
  const app = new WebGLApp();
  window.addEventListener('resize', app.resize, false);
  app.init('webgl-canvas');
  await app.load();
  app.setup();
  app.render();
}, false);

class WebGLApp {
  constructor() {
    this.canvas = null;
    this.gl = null;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.previousTime = 0;
    this.timeScale = 1.0;
    this.uTime = 0.0;
    this.uRatio = 0.0;
    this.uMouse = [0.5, 0.5, 0];
    this.transVec = [0, 0, 0]

    const pane = new Pane();
    pane.addBlade({
      view: 'slider',
      label: 'ratio',
      min: 0.0,
      max: 40.0,
      value: this.uRatio,
    })
      .on('change', (v) => {
        this.uRatio = v.value / 40;
      });
  }
  vec3Add(v1, v2) { return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]] }
  vec3Sub(v1, v2) { return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]] }
  vec3Scale(v, s) { return [v[0] * s, v[1] * s, v[2] * s] }
  async load() {
    const vs = await WebGLUtility.loadFile('./main_1224_1256 copy.vert');
    const fs = await WebGLUtility.loadFile('./main.frag');
    this.shaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attribute: [
        'position',
        'normal',
        'color',
        'uv',
      ],
      stride: [
        3,
        3,
        4,
        2,
      ],
      uniform: [
        'ratio',
        'time',
        'mvpMatrix',
        'invMatrix',
        'lightDirection',
        'textureUnit',
      ],
      type: [
        'uniform1f',
        'uniform1f',
        'uniformMatrix4fv',
        'uniformMatrix4fv',
        'uniform3fv',
        'uniform1i',
      ],
    });

    const source = './texJ.jpg';
    this.texture = await WebGLUtility.createTextureFromFile(this.gl, source);
  }
  setup() {
    this.setupGeometry();
    this.resize();
    this.running = true;
    this.previousTime = Date.now();

    this.gl.clearColor(200 / 255, 249 / 255, 214 / 255, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }
  setupGeometry() {
    const data = this.plane(1, 1, 128, 128, [116 / 255, 29 / 255, 127 / 255, 1], [117 / 255, 188 / 255, 224 / 255, 1])
    this.position = data.p
    this.normarl = data.n
    this.color = data.c
    this.indices = data.i
    this.uv = data.t

    this.vbo = [
      WebGLUtility.createVbo(this.gl, this.position),
      WebGLUtility.createVbo(this.gl, this.normarl),
      WebGLUtility.createVbo(this.gl, this.color),
      WebGLUtility.createVbo(this.gl, this.uv),
    ];
    this.ibo = WebGLUtility.createIbo(this.gl, this.indices)
  }
  render() {
    const gl = this.gl;
    const m4 = WebGLMath.Mat4;
    const v3 = WebGLMath.Vec3;

    requestAnimationFrame(this.render);

    const now = Date.now();
    const time = (now - this.previousTime) / 1000;
      this.uTime += time * this.timeScale;
    this.previousTime = now;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const m = m4.identity();
    const inv = m4.inverse(m)

    const eye = v3.create(0, 0, 4);
    const center = v3.create(0.0, 0.0, 0.0);
    const upDirection = v3.create(0.0, 1.0, 0.0);
    const v = m4.lookAt(eye, center, upDirection);

    const fovy = 60;
    const aspect = this.canvas.width / this.canvas.height;
    const near = 0.1;
    const far = 30.0;
    const p = m4.perspective(fovy, aspect, near, far);

    const vp = m4.multiply(p, v);
    this.inv_vp = m4.inverse(vp)

    const mvp = m4.multiply(vp, m);

    this.shaderProgram.use();
    this.shaderProgram.setAttribute(this.vbo, this.ibo);
    this.shaderProgram.setUniform([
      this.uRatio,
      this.uTime,
      mvp,
      inv,
      [5.0, 5.0, 3.0],
      0,
    ]);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
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
    if (!this.gl.getExtension('OES_standard_derivatives')) {
      console.log('OES_standard_derivatives is not supported')
      return
    }
    this.gl.enable(this.gl.CULL_FACE);
  }
  plane(width = 1, height = 1, widthSegments = 1, heightSegments = 1, colorF, colorB) {
    let pos = [], nor = [], col = [], st = [], idx = [];

    const width_half = width / 2;
    const height_half = height / 2;
    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;
    const segment_width = width / gridX;
    const segment_height = height / gridY;

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segment_height - height_half;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segment_width - width_half;
        pos.push(x * 2, -y * 2, 0);
        nor.push(0, 0, 1);
        col.push(colorF[0], colorF[1], colorF[2], colorF[3]);
        st.push(ix / gridX);
        st.push(1 - (iy / gridY));
      }
    }

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segment_height - height_half;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segment_width - width_half;
        pos.push(x * 2, -y * 2, 0);
        nor.push(0, 0, -1);
        col.push(colorB[0], colorB[1], colorB[2], colorB[3]);
        st.push(ix / gridX);
        st.push(1 - (iy / gridY));
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = (ix + 1) + gridX1 * (iy + 1);
        const d = (ix + 1) + gridX1 * iy;
        idx.push(a, b, d);
        idx.push(b, c, d);
      }
    }

    const offset = pos.length / 3 / 2;
    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy + offset;
        const b = ix + gridX1 * (iy + 1) + offset;
        const c = (ix + 1) + gridX1 * (iy + 1) + offset;
        const d = (ix + 1) + gridX1 * iy + offset;
        idx.push(a, d, b);
        idx.push(b, d, c);
      }
    }

    return { p: pos, n: nor, c: col, t: st, i: idx };
  }
}