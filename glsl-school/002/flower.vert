attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 uv;
attribute vec3 trans;
attribute vec3 color3;

uniform float time;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform sampler2D textureUnit;

varying vec4 vColor;

vec4 angleAxis(float angle, vec3 axis) {
  axis = normalize(axis);
  float halfAngle = angle * 0.5;
  float s = sin(halfAngle);
  return vec4(axis * s, cos(halfAngle));
}

vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
  vec3 t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

struct Vec3Set {
  vec3 p;
  vec3 n;
  vec4 q;
  vec3 o;
};

struct Vec3Set2 {
  vec3 o;
  vec3 axis;
};

Vec3Set rotateAroundAxis(vec3 pos, vec3 nor, vec3 offset, vec3 axis, float angle, float judge) {
  Vec3Set vec;

  float a = radians(angle * judge);
  vec4 q = angleAxis(a, normalize(axis));
  
  pos += offset;
  vec.p = rotateVectorByQuaternion(pos, q);
  vec.p -= offset;

  vec.n = rotateVectorByQuaternion(nor, q);
  vec.n = normalize(vec.n);

  vec.q = q;
  vec.o = offset;

  return vec;
}

Vec3Set2 reflectAxisOffset(vec4 refQ, vec3 refOffset, vec3 offset, vec3 axis) {
  Vec3Set2 vec;

  offset += refOffset;
  vec.o = rotateVectorByQuaternion(offset, refQ);
  vec.o -= refOffset;
  vec.o *= -1.;
  
  vec.axis = rotateVectorByQuaternion(axis, refQ);
  vec.axis = normalize(vec.axis);

  return vec;
}

float ratioKeeper(float start, float end){
  float a = (pow(min(1., fract(trans.z + time / 5. * 1.2) * 2.), 3.) - start) / (end - start);
  return clamp(a, 0.0, 1.0);
}

const vec2 texScale = vec2(0.1249, 0.4999);
const vec2 texOffset = vec2(0.12501, 0.5);

void main() {
  vec4 texA = texture2D(textureUnit, vec2(uv.x * texScale.x, (1. - uv.y) * texScale.y));
  vec4 texB = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x, (1. - uv.y) * texScale.y));
  vec4 texC = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 2., (1. - uv.y) * texScale.y));
  vec4 texD = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 3., (1. - uv.y) * texScale.y));
  vec4 texE = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 4., (1. - uv.y) * texScale.y));
  vec4 texF = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 5., (1. - uv.y) * texScale.y));
  vec4 texG = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 6., (1. - uv.y) * texScale.y));
  vec4 texH = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 7., (1. - uv.y) * texScale.y));
  vec3 p = vec3(position.xy * 0.5 + 0.5, position.z);
  vec3 n = normal;
  vec2 u = uv * 2. - 1.;

  Vec3Set r1 = rotateAroundAxis(p, n, vec3(0., -0.5, 0.), vec3(1., -1., 0.), ratioKeeper(0., 0.5) * -170.9, step(0.5, texA.r));
  Vec3Set r2 = rotateAroundAxis(r1.p, r1.n, vec3(-1., -0.5, 0.), vec3(1., 1., 0.), ratioKeeper(0., 0.5) * -170.9, step(0.5, texB.r));
  Vec3Set r3 = rotateAroundAxis(r2.p, r2.n, vec3(0., -0.5, 0.), vec3(1., 1., 0.), ratioKeeper(0., 0.5) * 170.9, step(0.5, texC.r));
  Vec3Set r4 = rotateAroundAxis(r3.p, r3.n, vec3(-1., -0.5, 0.), vec3(-1., 1., 0.), ratioKeeper(0., 0.5) * -170.9, step(0.5, texD.r));

  Vec3Set2 r5_1 = reflectAxisOffset(r1.q, r1.o, vec3(0.125, 0., 0.), vec3(1., -1., 0.));
  Vec3Set2 r6_1 = reflectAxisOffset(r2.q, r2.o, vec3(1. - 0.125, 0., 0.), vec3(1., 1., 0.));
  Vec3Set2 r7_1 = reflectAxisOffset(r3.q, r3.o, vec3(0., 1. - 0.125, 0.), vec3(1., 1., 0.));
  Vec3Set2 r8_1 = reflectAxisOffset(r4.q, r4.o, vec3(1., 1. - 0.125, 0.), vec3(-1., 1., 0.));

  Vec3Set r5 = rotateAroundAxis(r4.p, r4.n, r5_1.o, r5_1.axis, ratioKeeper(0.3, 0.8) * 150.9, step(0.5, texE.r));
  Vec3Set r6 = rotateAroundAxis(r5.p, r5.n, r6_1.o, r6_1.axis, ratioKeeper(0.3, 0.8) * 150.9, step(0.5, texF.r));
  Vec3Set r7 = rotateAroundAxis(r6.p, r6.n, r7_1.o, r7_1.axis, ratioKeeper(0.3, 0.8) * -150.9, step(0.5, texG.r));
  Vec3Set r8 = rotateAroundAxis(r7.p, r7.n, r8_1.o, r8_1.axis, ratioKeeper(0.3, 0.8) * 150.9, step(0.5, texH.r));

  vec4 texI = texture2D(textureUnit, vec2(r8.p.x * texScale.x, (1. - r8.p.y) * texScale.y + texOffset.y));
  vec4 texJ = texture2D(textureUnit, vec2(r8.p.x * texScale.x + texOffset.x, (1. - r8.p.y) * texScale.y + texOffset.y));
  vec4 texK = texture2D(textureUnit, vec2(r8.p.x * texScale.x + texOffset.x * 2., (1. - r8.p.y) * texScale.y + texOffset.y));
  vec4 texL = texture2D(textureUnit, vec2(r8.p.x * texScale.x + texOffset.x * 3., (1. - r8.p.y) * texScale.y + texOffset.y));

  Vec3Set r9 = rotateAroundAxis(r8.p, r8.n, vec3(-0.125, 0., 0.), vec3(0., 1., 0.), ratioKeeper(0.5, 1.) * -179.9, step(0.5, texI.r));
  Vec3Set r10 = rotateAroundAxis(r9.p, r9.n, vec3(-1. + 0.125, 0., 0.), vec3(0., 1., 0.), ratioKeeper(0.5, 1.) * 179.9, step(0.5, texJ.r));
  Vec3Set r11 = rotateAroundAxis(r10.p, r10.n, vec3(0., -1. + 0.125, 0.), vec3(1., 0., 0.), ratioKeeper(0.5, 1.) * -179.9, step(0.5, texK.r));
  Vec3Set r12 = rotateAroundAxis(r11.p, r11.n, vec3(0., -0.125, 0.), vec3(1., 0., 0.), ratioKeeper(0.5, 1.) * 179.9, step(0.5, texL.r));

  Vec3Set r13 = rotateAroundAxis(r12.p, r12.n, vec3(0., -0.5, 0.), vec3(1., 0., 0.), -90., 1.);
  r13.p.y += -0.5;

  Vec3Set r14 = rotateAroundAxis(r13.p, r13.n, vec3(0., -0.5, 0.), vec3(1., 0., 0.), ratioKeeper(0., 1.) * 90., 1.);

  Vec3Set r15 = rotateAroundAxis(r14.p, r14.n, vec3(-0.5, -0.5, 0.), vec3(1., 1., 0.), ratioKeeper(0., 0.75) * 360., 1.);

  vec3 r = r15.p * 2. - 1.;
  r.x += ratioKeeper(0., 0.5) * -1.;
  r.x += ratioKeeper(0.5, 0.75) * 1.;
  r.y += ratioKeeper(0., 0.7) * 4.;
  r.y += ratioKeeper(0.7, 1.) * -4.9;
  r.xy += trans.xy;
  r.z += fract(trans.z + time / 5. * 1.2) * 50. + -25.;

  gl_Position = mvpMatrix * vec4(r, 1.);

  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;

  vec4 c = vec4(0.);
  if(0. < normal.z){
    c += color;
  }else{
    c += vec4(color3, 1.);
  }
	float diffuse = clamp(dot(normalize(r15.n), invLight), 0.5, 1.0);
	vColor = c * vec4(vec3(diffuse), 1.0);
}