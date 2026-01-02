precision mediump float;
uniform vec2 resolution;
uniform sampler2D textureUnit;
uniform vec2 texSize;
uniform vec2 texPos;
uniform float time;
varying vec2 vTexCoord;

void main() {
  vec2 p = (gl_FragCoord.xy / resolution) * 2. - 1.;
  float repetition = mod(p.y * 4., 10.) - 5.;
  float sinA = sin(time + p.y * 3.) * 0.1;
  float sinB = sin(time * 4. + p.y * 10.) * 0.1;
  float sinC = abs(fract(p.y - time * 0.5) - 0.5) * 0.5;
  float sinD = sin(time * 4. + p.y * 2.) * 0.1;
  float sinE = sin(-time + p.x * 3.) * 0.1;
  float sinF = sin(-time * 4. + p.x * 10.) * 0.1;
  float sinG = abs(fract(p.x - -time * 0.5) - 0.5) * 0.5;
  float sinH = sin(-time * 4. + p.x * 2.) * 0.1;
  vec3 color = vec3(0., step(0.7, abs(p.x + (sinA + sinB) * step(p.x, 0.) + (sinC + sinD) * step(0., p.x))), 0.);
  color.g += step(0.7, abs(p.y + (sinE + sinF) * step(p.y, 0.) + (sinG + sinH) * step(0., p.y)));

  float rot = time * 2.;
  vec2 uv = (vTexCoord - texPos) * texSize*mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) + vec2(0.5);
  uv.y = 1. - uv.y;

  float inBounds = all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0))) ? 1.0 : 0.0;
  vec4 samplerColor = texture2D(textureUnit, uv);
  samplerColor.rgb *= inBounds;

  gl_FragColor = vec4(color, 1.) + samplerColor;
}