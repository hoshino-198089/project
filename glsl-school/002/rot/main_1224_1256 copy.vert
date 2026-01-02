attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 uv;

uniform float ratio;
uniform float time;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform sampler2D textureUnit;

varying vec4 vColor;
varying vec2 vUv;

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
const float timeScale = 0.25;
float timeKeeper(float duration, float delay){
  float a = abs(sin(time * timeScale));
  float b = step(delay, a) * (a - delay) / duration;
  return min(1., b);
}

void main() {
  vec4 texA = texture2D(textureUnit, vec2(uv.x * 0.4999, 1. - uv.y));
  vec4 texB = texture2D(textureUnit, vec2(uv.x * 0.5 + 0.5, 1. - uv.y));
  vec3 p = vec3(position.xy * 0.5 + 0.5, position.z);
  vec3 n = normal;
  vec2 u = uv * 2. - 1.;
  p.x += abs(sin(time * 0.5)) * texA.x * ratio * 0.;

  Vec3Set r1 = rotateAroundAxis(p, n, vec3(-0.4, 0., 0.), vec3(0., 1., 0.), timeKeeper(0.25, 0.0) * 159.9, step(uv.x, 0.4));
  Vec3Set2 r2_1 = reflectAxisOffset(r1.q, r1.o, vec3(0.2, 0., 0.), vec3(0., 1., 0.));
  Vec3Set2 r3_1 = reflectAxisOffset(r1.q, r1.o, vec3(-0.9, 0., 0.), vec3(1., 1., 0.));
  Vec3Set2 r4_1 = reflectAxisOffset(r1.q, r1.o, vec3(0.05, 0., 0.), vec3(0., 1., 0.));

  Vec3Set r2 = rotateAroundAxis(r1.p, r1.n, r2_1.o, r2_1.axis, timeKeeper(0.25, 0.25) * -159.9, step(uv.x, 0.2));
  Vec3Set2 r3_2 = reflectAxisOffset(r2.q, r2.o, r3_1.o * -1., r3_1.axis);
  Vec3Set2 r4_2 = reflectAxisOffset(r2.q, r2.o, r4_1.o * -1., r4_1.axis);

  Vec3Set r3 = rotateAroundAxis(r2.p, r2.n, r3_2.o, r3_2.axis, timeKeeper(0.25, 0.5) * 159.9, step(0.5, texA.r));
  Vec3Set2 r4_3 = reflectAxisOffset(r3.q, r3.o, r4_2.o * -1., r4_2.axis);

  Vec3Set r4 = rotateAroundAxis(r3.p, r3.n, vec3(-0.45, r4_3.o.y, r4_3.o.z), vec3(0., 1., 0.), timeKeeper(0.25, 0.75) * 179.9, step(0.5, texB.r));

  gl_Position = mvpMatrix * vec4(r3.p * 2. - 1., 1.);

  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
	float diffuse = clamp(dot(normalize(r3.n), invLight), 0.1, 1.0);
	vColor = color * vec4(vec3(diffuse), 1.0);

  vUv = uv;
}


