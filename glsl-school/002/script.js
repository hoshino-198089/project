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
    this.uTime = 0.0;
    this.uRatio = 1;

    const pane = new Pane();
    pane.addBlade({
      view: 'slider',
      label: 'ratio',
      min: 0.0,
      max: 40.0,
      value: 40
    })
      .on('change', (v) => {
        this.uRatio = v.value / 40;
      });
  }
  vec3Add(v1, v2) { return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]] }
  vec3Scale(v, s) { return [v[0] * s, v[1] * s, v[2] * s] }
  async load() {
    const vs0 = await WebGLUtility.loadFile('./plane.vert');
    const fs0 = await WebGLUtility.loadFile('./plane.frag');
    this.shaderProgram0 = new ShaderProgram(this.gl, {
      vertexShaderSource: vs0,
      fragmentShaderSource: fs0,
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
    }, null);

    const vs1 = await WebGLUtility.loadFile('./ground.vert');
    const fs1 = await WebGLUtility.loadFile('./ground.frag');
    this.shaderProgram1 = new ShaderProgram(this.gl, {
      vertexShaderSource: vs1,
      fragmentShaderSource: fs1,
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
        2
      ],
      uniform: [
        'time',
        'mvpMatrix',
        'invMatrix',
        'lightDirection',
        'textureUnit'
      ],
      type: [
        'uniform1f',
        'uniformMatrix4fv',
        'uniformMatrix4fv',
        'uniform3fv',
        'uniform1i',
      ],
    }, null);

    const vs2 = await WebGLUtility.loadFile('./flower.vert');
    const fs2 = await WebGLUtility.loadFile('./flower.frag');
    this.shaderProgram2 = new ShaderProgram(this.gl, {
      vertexShaderSource: vs2,
      fragmentShaderSource: fs2,
      attribute: [
        'position',
        'normal',
        'color',
        'uv',
        'trans',
        'color3',
      ],
      stride: [
        3,
        3,
        4,
        2,
        3,
        3,
      ],
      uniform: [
        'time',
        'mvpMatrix',
        'invMatrix',
        'lightDirection',
        'textureUnit',
      ],
      type: [
        'uniform1f',
        'uniformMatrix4fv',
        'uniformMatrix4fv',
        'uniform3fv',
        'uniform1i',
      ],
    }, this.ext);

    const vs3 = await WebGLUtility.loadFile('./stem.vert');
    const fs3 = await WebGLUtility.loadFile('./stem.frag');
    this.shaderProgram3 = new ShaderProgram(this.gl, {
      vertexShaderSource: vs3,
      fragmentShaderSource: fs3,
      attribute: [
        'position',
        'normal',
        'color',
        'uv',
        'trans',
      ],
      stride: [
        3,
        3,
        4,
        2,
        3,
      ],
      uniform: [
        'time',
        'mvpMatrix',
        'invMatrix',
        'lightDirection',
        'textureUnit',
      ],
      type: [
        'uniform1f',
        'uniformMatrix4fv',
        'uniformMatrix4fv',
        'uniform3fv',
        'uniform1i',
      ],
    }, this.ext);

    this.texture0 = await WebGLUtility.createTextureFromFile(this.gl, './tex0.webp');
    this.texture1 = await WebGLUtility.createTextureFromFile(this.gl, './tex1.webp');
    this.texture2 = await WebGLUtility.createTextureFromFile(this.gl, './tex2.webp');
    this.texture3 = await WebGLUtility.createTextureFromFile(this.gl, './tex3.webp');
  }
  setup() {
    this.setupGeometry();
    this.resize();
    this.previousTime = Date.now();

    this.gl.clearColor(200 / 255, 249 / 255, 214 / 255, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture0);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1);
    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture2);
    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture3);
  }
  setupGeometry() {
    const plane0 = this.plane(1, 1, 128, 128, [116 / 255, 29 / 255, 127 / 255, 1], [117 / 255, 188 / 255, 224 / 255, 1])
    this.vbo0 = [
      WebGLUtility.createVbo(this.gl, plane0.p),
      WebGLUtility.createVbo(this.gl, plane0.n),
      WebGLUtility.createVbo(this.gl, plane0.c),
      WebGLUtility.createVbo(this.gl, plane0.t),
    ];
    this.ibo0 = WebGLUtility.createIbo(this.gl, plane0.i)
    this.iLength0 = plane0.i.length

    const plane1 = this.plane(10, 10, 2, 2, [211 / 255, 200 / 255, 166 / 255, 1], [1, 0, 0, 1])
    this.vbo1 = [
      WebGLUtility.createVbo(this.gl, plane1.p),
      WebGLUtility.createVbo(this.gl, plane1.n),
      WebGLUtility.createVbo(this.gl, plane1.c),
      WebGLUtility.createVbo(this.gl, plane1.t),
    ];
    this.ibo1 = WebGLUtility.createIbo(this.gl, plane1.i)
    this.iLength1 = plane1.i.length

    this.flowerLength = 144
    this.flowerParam = { trans: [], color: [] }
    for (let i = 0; i < this.flowerLength; i++) {
      this.flowerParam.trans.push((Math.random() - 0.5) * 40, -1., Math.random())
      const r = Math.random()
      this.flowerParam.color.push(r, Math.random(), 1 - r)
    }

    const plane2 = this.plane(1, 1, 32, 32, [1, 1, 1, 1], [0, 1, 1, 1])
    this.vbo2 = [
      WebGLUtility.createVbo(this.gl, plane2.p),
      WebGLUtility.createVbo(this.gl, plane2.n),
      WebGLUtility.createVbo(this.gl, plane2.c),
      WebGLUtility.createVbo(this.gl, plane2.t),
      WebGLUtility.createVbo(this.gl, this.flowerParam.trans),
      WebGLUtility.createVbo(this.gl, this.flowerParam.color),
    ];
    this.instance2 = [
      false,
      false,
      false,
      false,
      true,
      true,
    ];
    this.ibo2 = WebGLUtility.createIbo(this.gl, plane2.i)
    this.iLength2 = plane2.i.length

    const plane3 = this.plane(1, 1, 32, 32, [1, 1, 1, 1], [0, 1, 0, 1])
    this.vbo3 = [
      WebGLUtility.createVbo(this.gl, plane3.p),
      WebGLUtility.createVbo(this.gl, plane3.n),
      WebGLUtility.createVbo(this.gl, plane3.c),
      WebGLUtility.createVbo(this.gl, plane3.t),
      WebGLUtility.createVbo(this.gl, this.flowerParam.trans),
    ];
    this.instance3 = [
      false,
      false,
      false,
      false,
      true,
    ];
    this.ibo3 = WebGLUtility.createIbo(this.gl, plane3.i)
    this.iLength3 = plane3.i.length
  }
  render() {
    const gl = this.gl;
    const m4 = WebGLMath.Mat4;
    const v3 = WebGLMath.Vec3;

    requestAnimationFrame(this.render);

    const now = Date.now();
    const time = (now - this.previousTime) / 1000;
    if (this.uRatio === 1.) { this.uTime += time }
    this.previousTime = now;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const eyeZ = 2 + 6 * Math.abs(Math.sin(this.uTime / 10))
    const eyeA = this.vec3Scale([(Math.sin(this.uTime / 7) + Math.sin(this.uTime / 3)) / 2 * eyeZ, 6.0 + Math.sin(this.uTime / 7), eyeZ], this.uRatio)
    const eyeB = this.vec3Scale([0, 2, 4], 1 - this.uRatio)
    const eyeM = this.vec3Add(eyeA, eyeB)
    const eye = v3.create(eyeM[0], eyeM[1], eyeM[2]);
    const center = v3.create(0.0, 2.0, 0.0);
    const upDirection = v3.create(0.0, 1.0, 0.0);
    const v = m4.lookAt(eye, center, upDirection);

    const fovy = 60;
    const aspect = this.canvas.width / this.canvas.height;
    const near = 0.1;
    const far = 30.0;
    const p = m4.perspective(fovy, aspect, near, far);
    const vp = m4.multiply(p, v);

    const trans0 = this.vec3Scale([0, -2 * Math.abs(Math.sin(this.uTime / 7) + Math.sin(this.uTime / 3)) / 2, 1], this.uRatio)
    let m0 = m4.translate(m4.identity(), [trans0[0], trans0[1] + 2, trans0[2]]);
    const inv0 = m4.inverse(m0)
    const mvp0 = m4.multiply(vp, m0);
    this.shaderProgram0.use();
    this.shaderProgram0.setAttribute(this.vbo0, this.ibo0, null);
    this.shaderProgram0.setUniform([
      this.uRatio,
      this.uTime,
      mvp0,
      inv0,
      [5.0, 5.0, 3.0],
      0,
    ]);
    gl.drawElements(gl.TRIANGLES, this.iLength0, gl.UNSIGNED_SHORT, 0);

    let m1 = m4.translate(m4.identity(), [0, -1, 0]);
    const rotateAxis1 = v3.create(1.0, 0.0, 0.0)
    const rotateAngle1 = -Math.PI / 2
    m1 = m4.rotate(m1, rotateAngle1, rotateAxis1);
    const inv1 = m4.inverse(m1)
    const mvp1 = m4.multiply(vp, m1);
    this.shaderProgram1.use();
    this.shaderProgram1.setAttribute(this.vbo1, this.ibo1, null);
    this.shaderProgram1.setUniform([
      this.uTime,
      mvp1,
      inv1,
      [5.0, 5.0, 3.0],
      1
    ]);
    gl.drawElements(gl.TRIANGLES, this.iLength1, gl.UNSIGNED_SHORT, 0);

    let m2 = m4.translate(m4.identity(), [0, 0, 0.01]);
    m2 = m4.scale(m2, [0.3, 0.3, 0.3]);
    const inv2 = m4.inverse(m2)
    const mvp2 = m4.multiply(vp, m2);
    this.shaderProgram2.use();
    this.shaderProgram2.setAttribute(this.vbo2, this.ibo2, this.instance2);
    this.shaderProgram2.setUniform([
      this.uTime,
      mvp2,
      inv2,
      [5.0, 5.0, 3.0],
      2,
    ]);
    this.ext.drawElementsInstancedANGLE(gl.TRIANGLES, this.iLength2, gl.UNSIGNED_SHORT, 0, this.flowerLength);

    let m3 = m4.translate(m4.identity(), [0, 0, 0]);
    m3 = m4.scale(m3, [0.3, 0.3, 0.3]);
    const inv3 = m4.inverse(m3)
    const mvp3 = m4.multiply(vp, m3);
    this.shaderProgram3.use();
    this.shaderProgram3.setAttribute(this.vbo3, this.ibo3, this.instance3);
    this.shaderProgram3.setUniform([
      this.uTime,
      mvp3,
      inv3,
      [5.0, 5.0, 3.0],
      3,
    ]);
    this.ext.drawElementsInstancedANGLE(gl.TRIANGLES, this.iLength3, gl.UNSIGNED_SHORT, 0, this.flowerLength);
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
    this.ext;
    this.ext = this.gl.getExtension('ANGLE_instanced_arrays');
    if (this.ext == null) {
      alert('ANGLE_instanced_arrays not supported');
      return;
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