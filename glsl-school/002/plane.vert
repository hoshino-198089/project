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

const float timeScale = 13.75;
float timeKeeper(float duration, float delay){
  float a = abs(sin(time * timeScale));
  float b = step(delay, a) * (a - delay) / duration;
  return min(1., b);
}

float ratioKeeper(float start, float end){
  float a = (ratio - start) / (end - start);
  return clamp(a, 0.0, 1.0);
}

const float texR = 0.124999;
const float texS = 0.125;

void main() {
  vec4 texA = texture2D(textureUnit, vec2(uv.x * texR, 1. - uv.y));
  vec4 texB = texture2D(textureUnit, vec2(uv.x * texR + texS, 1. - uv.y));
  vec3 p = vec3(position.xy * 0.5 + 0.5, position.z);
  vec3 n = normal;
  vec2 u = uv * 2. - 1.;

  Vec3Set r1 = rotateAroundAxis(p, n, vec3(0., -0.5, 0.), vec3(1., -1., 0.), ratioKeeper(0., 0.25) * -179.9, step(0.5, texA.r));

  Vec3Set r2 = rotateAroundAxis(r1.p, r1.n, vec3(-1., -0.5, 0.), vec3(1., 1., 0.), ratioKeeper(0., 0.25) * -179.9, step(0.5, texB.r));

  vec4 texC = texture2D(textureUnit, vec2(r2.p.x * texR + texS * 2., 1. - r2.p.y));
  Vec3Set r3 = rotateAroundAxis(r2.p, r2.n, vec3(-0.5, 0., 0.), vec3(-0.415, 1., 0.), ratioKeeper(0.25, 0.5) * 179.9, step(0.1, texC.r));

  vec4 texD = texture2D(textureUnit, vec2(r3.p.x * texR + texS * 3., 1. - r3.p.y));
  Vec3Set r4 = rotateAroundAxis(r3.p, r3.n, vec3(-0.5, 0., 0.), vec3(0.415, 1., 0.), ratioKeeper(0.25, 0.5) * -179.9, step(0.1, texD.r));

  vec4 texE = texture2D(textureUnit, vec2(r4.p.x * texR + texS * 4., 1. - r4.p.y));
  Vec3Set r5 = rotateAroundAxis(r4.p, r4.n, vec3(-0.5, 0., 0.), vec3(-0.2, 1., 0.), ratioKeeper(0.5, 0.75) * (timeKeeper(1., 0.) * 4. + 88.), step(0.1, texE.r));

  vec4 texF = texture2D(textureUnit, vec2(r5.p.x * texR + texS * 5., 1. - r5.p.y));
  Vec3Set r6 = rotateAroundAxis(r5.p, r5.n, vec3(-0.5, 0., 0.), vec3(0.2, 1., 0.), ratioKeeper(0.5, 0.75) * (timeKeeper(1., 0.) * -4. + -88.), step(0.1, texF.r));

  Vec3Set r7 = rotateAroundAxis(r6.p, r6.n, vec3(-0.5, 0., 0.), vec3(0., 1., 0.), ratioKeeper(0.75, 1.) * (timeKeeper(1.0, 0.) * -2. + -172.9), step(uv.x, 0.5));

  Vec3Set r8 = rotateAroundAxis(r7.p, r7.n, vec3(0., -0.5, 0.), vec3(1., 0., 0.), ratioKeeper(0.75, 1.) * 90., 1.);

  Vec3Set r9 = rotateAroundAxis(r8.p, r8.n, vec3(-0.5, -0.5, 0.), vec3(0., 0., 1.), ratioKeeper(0.75, 1.) * (timeKeeper(1.0, 0.) * 2. + 89.), 1.);

  gl_Position = mvpMatrix * vec4(r9.p * 2. - 1., 1.);

  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
	float diffuse = clamp(dot(normalize(r9.n), invLight), 0.5, 1.0);
	vColor = color * vec4(vec3(diffuse), 1.0);
}