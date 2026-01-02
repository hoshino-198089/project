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
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.running = false;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.previousTime = 0;
    this.timeScale = 1.0;
    this.uTime = 0.0;
    this.offsetParam = {
      building: 0,
      star: 0,
    };

    const pane = new Pane();
    pane.addBlade({
      view: 'slider',
      label: 'time-scale',
      min: 0.0,
      max: 3.0,
      value: this.timeScale,
    })
      .on('change', (v) => { this.timeScale = v.value; });

    pane.addBlade({
      view: 'slider',
      label: 'building-offset',
      min: -1.0,
      max: 1.0,
      value: this.offsetParam.building,
    })
      .on('change', (v) => { this.offsetParam.building = v.value; });

    pane.addBlade({
      view: 'slider',
      label: 'star-offset',
      min: -1.0,
      max: 1.0,
      value: this.offsetParam.star,
    })
      .on('change', (v) => { this.offsetParam.star = v.value; });

    this.uvParam = {
      building: 0,
      star: 0,
      snow: 0,
    };
    pane.addBinding(this.uvParam, 'building', { options: { color: 0, uv: 1 } })
    pane.addBinding(this.uvParam, 'star', { options: { color: 0, uv: 1 } })
    pane.addBinding(this.uvParam, 'snow', { options: { color: 0, uv: 1 } })
  }
  async load() {
    const vs = await WebGLUtility.loadFile('./main.vert');
    const fs = await WebGLUtility.loadFile('./main.frag');
    this.shaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attribute: [
        'position',
      ],
      stride: [
        3,
      ],
      uniform: [
        'resolution',
        'time',
        'buildingOffset',
        'starOffset',
        'buildingUV',
        'starUV',
        'snowUV',
      ],
      type: [
        'uniform2fv',
        'uniform1f',
        'uniform1f',
        'uniform1f',
        'uniform1f',
        'uniform1f',
        'uniform1f',
      ],
    });
  }
  setup() {
    const gl = this.gl;
    this.setupGeometry();
    this.resize();
    this.running = true;
    this.previousTime = Date.now();
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.shaderProgram.use();
    this.shaderProgram.setAttribute(this.vbo);
  }
  setupGeometry() {
    this.position = [
      -1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0,
    ];
    this.vbo = [
      WebGLUtility.createVbo(this.gl, this.position),
    ];
  }
  render() {
    const gl = this.gl;

    if (this.running === true) { requestAnimationFrame(this.render); }

    const now = Date.now();
    const time = (now - this.previousTime) / 1000;
    this.uTime += time * this.timeScale;
    this.previousTime = now;

    gl.clear(gl.COLOR_BUFFER_BIT);

    this.shaderProgram.setUniform([
      [this.canvas.width, this.canvas.height],
      this.uTime,
      this.offsetParam.building,
      this.offsetParam.star,
      this.uvParam.building,
      this.uvParam.star,
      this.uvParam.snow,
    ]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.position.length / 3);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
  }
}