attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 uv;
attribute vec3 trans;

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

float ratioKeeper(float start, float end){
  float a = (pow(min(1., fract(trans.z + time / 5. * 1.2) * 2.), 3.) - start) / (end - start);
  // float a = (ratio - start) / (end - start);
  return clamp(a, 0.0, 1.0);
}

const vec2 texScale = vec2(0.249999, 1.);
const vec2 texOffset = vec2(0.25, 0.);

void main() {
  vec4 texA = texture2D(textureUnit, vec2(uv.x * texScale.x, (1. - uv.y) * texScale.y));
  vec4 texB = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x, (1. - uv.y) * texScale.y));
  vec4 texC = texture2D(textureUnit, vec2(uv.x * texScale.x + texOffset.x * 2., (1. - uv.y) * texScale.y));
  vec3 p = vec3(position.xy * 0.5 + 0.5, position.z);
  vec3 n = normal;
  vec2 u = uv * 2. - 1.;

  p += trans * 0.;

  Vec3Set r1 = rotateAroundAxis(p, n, vec3(0., -0.63, 0.), vec3(0.5, -0.13, 0.), ratioKeeper(0., 0.5) * -179.9, step(0.5, texA.r));
  Vec3Set r2 = rotateAroundAxis(r1.p, r1.n, vec3(-0.5, -0.5, 0.), vec3(-0.14, 0.5, 0.), ratioKeeper(0.5, 1.) * -177.9, step(0.5, texB.r));
  Vec3Set r3 = rotateAroundAxis(r2.p, r2.n, vec3(-0.5, -0.5, 0.), vec3(0.5, 0.5, 0.), ratioKeeper(0.5, 1.) * -177.9, step(0.5, texC.r));
  Vec3Set r4 = rotateAroundAxis(r3.p, r3.n, vec3(-0.5, -0.5, 0.), vec3(0., 0., 1.), ratioKeeper(0.5, 1.) * 15., 1.);
  Vec3Set r5 = rotateAroundAxis(r4.p, r4.n, vec3(0., -0.5, 0.), vec3(1., 0., 0.), -90., 1.);
  r5.p.y += -0.5;

  Vec3Set r6 = rotateAroundAxis(r5.p, r5.n, vec3(0., -0.5, 0.), vec3(1., 0., 0.), ratioKeeper(0., 1.) * 90., 1.);
  Vec3Set r7 = rotateAroundAxis(r6.p, r6.n, vec3(-0.5, -0.5, 0.), vec3(0., 1., 0.), ratioKeeper(0., 0.75) * 360., 1.);

  vec3 r = r7.p * 2. - 1.;
  r.y += ratioKeeper(0., 0.7) * 0.5;
  r.y += ratioKeeper(0.7, 1.) * -3.3;

  r.xy += trans.xy;
  r.z += fract(trans.z + time / 5. * 1.2) * 50. + -25.;

  gl_Position = mvpMatrix * vec4(r, 1.);

  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
	float diffuse = clamp(dot(normalize(r7.n), invLight), 0.5, 1.0);
	vColor = color * vec4(vec3(diffuse), 1.0);
}