precision mediump float;
uniform sampler2D textureUnit;
uniform vec2 texSize;
uniform vec2 texPos;
uniform vec2 range;
uniform float stage;
varying vec2 vTexCoord;

void main() {
  vec2 p = vTexCoord * texSize + texPos;
  float inBounds = all(greaterThanEqual(p, vec2(0.0))) && all(lessThanEqual(p, vec2(1.0))) ? 1.0 : 0.0;
  vec4 samplerColor = vec4(0.);

  float c = 0.;
  for (float i = 0.; i < 16.; i++) {
      vec4 tex = vec4(0.);
      vec2 p2 = p;
    if(range.x == 0.){
      p2 -= vec2(0., 16. / 256. * i * texSize.y);
      tex += texture2D(textureUnit, p2) * step(gl_FragCoord.y, range.y);
    }else{
      p2 += vec2(256. / 256. * i * texSize.x, 0.);
      tex += texture2D(textureUnit, p2) * step(gl_FragCoord.x, range.x);
    }

    if(stage == 0.){
      float check = step(1., tex.r * tex.g);
      samplerColor.rg += p2 * check;
      c += check;
    }else{
      float check = step(0.001, tex.r + tex.g);
      samplerColor += tex * check;
      c += check;
    }
  }
  samplerColor /= c;
  samplerColor.rgb *= inBounds;

  gl_FragColor = vec4(samplerColor.rgb, c * 0.05);
}