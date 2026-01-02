precision mediump float;

uniform float time;
uniform sampler2D textureUnit;

varying vec4 vColor;
varying vec2 vUv;

void main() {
  vec4 samplerColor = texture2D(textureUnit, vec2(vUv.x, fract(vUv.y + time / 5.)));
	gl_FragColor = vColor * 1.2 + 0.2 * vColor * samplerColor;
}