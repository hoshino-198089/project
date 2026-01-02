attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;

varying vec4 vColor;
varying vec2 vUv;

void main() {
  gl_Position = mvpMatrix * vec4(position, 1.0);

  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
	float diffuse = clamp(dot(normalize(normal), invLight), 0.5, 1.0);
	vColor = color * vec4(vec3(diffuse), 1.0);
  vUv = uv;
}