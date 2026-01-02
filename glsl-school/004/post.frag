precision mediump float;
uniform sampler2D textureUnit;
uniform vec2 texSize;
varying vec2 vTexCoord;

void main() {
  vec2 p = vTexCoord;
  p.y = 1. - p.y;
  p *= texSize;
  vec4 samplerColor = texture2D(textureUnit, p);
  gl_FragColor = samplerColor;
}