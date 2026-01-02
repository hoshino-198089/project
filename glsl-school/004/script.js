import { WebGLUtility, ShaderProgram } from '../lib/webgl.js';
import { WebGLMath } from '../lib/math.js';
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

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.previousTime = 0;
    this.timeScale = 1.0;
    this.uTime = 0.0;
    this.uTexPos = [0.5, 0.5]
    this.texSize = 256
    this.dirVec = [1, 0]
    this.u8 = new Uint8Array(4)

    this.stats = new Stats()
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)

    const pane = new Pane()
    pane.addBlade({
      view: 'slider',
      label: 'time-scale',
      min: 0.0,
      max: 2.0,
      value: this.timeScale,
    }).on('change', (v) => { this.timeScale = v.value; });
  }
  async load() {
    const mainVs = await WebGLUtility.loadFile('./main.vert');
    const mainFs = await WebGLUtility.loadFile('./main.frag');
    this.mainShaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: mainVs,
      fragmentShaderSource: mainFs,
      attribute: [
        'position',
        'texCoord',
      ],
      stride: [
        3,
        2,
      ],
      uniform: [
        'resolution',
        'textureUnit',
        'texSize',
        'texPos',
        'time',
      ],
      type: [
        'uniform2fv',
        'uniform1i',
        'uniform2fv',
        'uniform2fv',
        'uniform1f',
      ],
    });

    const postVs = await WebGLUtility.loadFile('./post.vert');
    const postFs = await WebGLUtility.loadFile('./post.frag');
    this.postShaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: postVs,
      fragmentShaderSource: postFs,
      attribute: [
        'position',
        'texCoord',
      ],
      stride: [
        3,
        2,
      ],
      uniform: [
        'textureUnit',
        'texSize',
      ],
      type: [
        'uniform1i',
        'uniform2fv',
      ],
    });

    const compressVs = await WebGLUtility.loadFile('./compress.vert');
    const compressFs = await WebGLUtility.loadFile('./compress.frag');
    this.compressShaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: compressVs,
      fragmentShaderSource: compressFs,
      attribute: [
        'position',
        'texCoord',
      ],
      stride: [
        3,
        2,
      ],
      uniform: [
        'textureUnit',
        'texSize',
        'texPos',
        'range',
        'stage',
      ],
      type: [
        'uniform1i',
        'uniform2fv',
        'uniform2fv',
        'uniform2fv',
        'uniform1f',
      ],
    });

    const source = './rect.png';
    this.texture = await WebGLUtility.createTextureFromFile(this.gl, source);
  }
  setup() {
    const gl = this.gl;

    this.setupGeometry();
    this.resize();
    this.previousTime = Date.now();

    this.buffers = WebGLUtility.createFramebuffer(this.gl, this.canvas.width, this.canvas.height);

    const compressSize = [
      [256, 256],
      [256, 16],
      [16, 1],
      [1, 1]
    ];
    this.compressBuffers = compressSize.map(size => WebGLUtility.createFramebuffer(this.gl, size[0], size[1]));

    gl.clearColor(0., 0., 0., 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
  }
  setupGeometry() {
    this.planePosition = [
      -1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0,
    ];
    this.planeTexCoord = [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0
    ];
    this.planeIndex = [
      0, 2, 1,
      1, 2, 3,
    ];
    this.planeVbo = [
      WebGLUtility.createVbo(this.gl, this.planePosition),
      WebGLUtility.createVbo(this.gl, this.planeTexCoord),
    ];
    this.planeIbo = WebGLUtility.createIbo(this.gl, this.planeIndex);
  }
  render() {
    this.stats.begin();
    requestAnimationFrame(this.render);

    const qtn = WebGLMath.Qtn;

    const now = Date.now();
    const time = (now - this.previousTime) / 1000;
    this.uTime += time * this.timeScale;
    this.previousTime = now;

    this.uTexPos[0] += this.dirVec[0] * time * this.timeScale * 0.5
    this.uTexPos[1] += -this.dirVec[1] * time * this.timeScale * 0.5

    this.renderMain();
    this.renderPostProcess();
    this.renderCompressProcess()

    this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.u8);

    if (0 < this.u8[3]) {
      const n = [
        this.uTexPos[0] - this.u8[0] / 255,
        this.uTexPos[1] - this.u8[1] / 255,
      ]

      if (90 < this.dVec2Rot(this.dirVec, n)) {
        const axis = this.normalize([-n[1], n[0]])
        const qRot = qtn.rotate(Math.PI, axis.concat([0]));
        const newVec = qtn.toVecIII(this.dirVec.concat([0]), qRot)
        this.dirVec = this.normalize([newVec[0], newVec[1]])
      } else {
        const addVec = [this.dirVec[0] + n[0] * 1, this.dirVec[1] + n[1] * 1]
        this.dirVec = this.normalize(addVec)
      }
    }

    this.stats.end();
  }
  renderMain() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers.framebuffer);
    gl.clearColor(0., 0., 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.mainShaderProgram.use();
    this.mainShaderProgram.setAttribute(this.planeVbo, this.planeIbo);
    this.mainShaderProgram.setUniform([
      [this.canvas.width, this.canvas.height],
      0,
      [1 / (this.texSize / this.canvas.width), 1 / (this.texSize / this.canvas.height)],
      this.uTexPos,
      this.uTime,
    ]);
    gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);
  }
  renderPostProcess() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0., 0., 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.buffers.texture);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.postShaderProgram.use();
    this.postShaderProgram.setAttribute(this.planeVbo, this.planeIbo);
    this.postShaderProgram.setUniform([
      0,
      [1, 1],
    ]);
    gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);
  }
  renderCompressProcess() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compressBuffers[0].framebuffer);
    gl.clearColor(0., 0., 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.buffers.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.gl.viewport(0, 0, 256, 256);
    this.compressShaderProgram.use();
    this.compressShaderProgram.setAttribute(this.planeVbo, this.planeIbo);
    this.compressShaderProgram.setUniform([
      0,
      [256 / this.canvas.width, 256 / this.canvas.height],
      [
        this.uTexPos[0] - (this.texSize / 2 / this.canvas.width),
        (1 - this.uTexPos[1]) - (this.texSize / 2 / this.canvas.height)
      ],
      [0, 16],
      0
    ]);
    gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compressBuffers[1].framebuffer);
    gl.clearColor(0., 0., 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.compressBuffers[0].texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.viewport(0.0, 0.0, 256, 16);
    this.compressShaderProgram.setUniform([
      0,
      [256 / 256, 16 / 256],
      [0, 0],
      [0, 1],
      1
    ]);
    gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compressBuffers[2].framebuffer);
    gl.clearColor(0., 0., 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.compressBuffers[1].texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.viewport(0.0, 0.0, 16, 1);
    this.compressShaderProgram.setUniform([
      0,
      [16 / 256, 1 / 256],
      [0, 0],
      [16, 0],
      1
    ]);
    gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compressBuffers[3].framebuffer);
    gl.clearColor(0., 0., 0., 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.compressBuffers[2].texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.viewport(0.0, 0.0, 1, 1);
    this.compressShaderProgram.setUniform([
      0,
      [16 / 256, 1 / 256],
      [0, 0],
      [1, 0],
      1
    ]);
    gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);

  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.buffers != null) {
      const gl = this.gl;
      const width = this.canvas.width;
      const height = this.canvas.height;
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.buffers.renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      gl.bindTexture(gl.TEXTURE_2D, this.buffers.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
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
  normalize(vec2) {
    const length = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1])
    if (length === 0) { return [0, 0] }
    return [vec2[0] / length, vec2[1] / length]
  }
  dVec2Rot(a, b) {
    const dot = a[0] * b[0] + a[1] * b[1]
    const lengthA = Math.sqrt(a[0] * a[0] + a[1] * a[1])
    const lengthB = Math.sqrt(b[0] * b[0] + b[1] * b[1])
    let cos = dot / (lengthA * lengthB)
    cos = Math.min(1, Math.max(-1, cos))
    return Math.acos(cos) * (180 / Math.PI)
  }
  invVec(vec2, axis) {
    const [vx, vy] = vec2
    const [ax, ay] = axis
    const rotatedX = vx - 2 * (vx * ax + vy * ay) * ax
    const rotatedY = vy - 2 * (vx * ax + vy * ay) * ay
    return [rotatedX, rotatedY]
  }
}