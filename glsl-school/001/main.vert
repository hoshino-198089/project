
attribute vec3 position;
attribute vec4 color;
attribute float size;
attribute float progress;
attribute float speed;

uniform float pointScale;
uniform vec2 mouse;
uniform float time;
uniform float aspect;
uniform float umbrellaScale;
uniform float sharpness;
uniform float repelsPixelSize;

varying vec4 vColor;

void main() {
  vColor = color;

  float distX = position.x - mouse.x / (1.0 / aspect);
  float setRange = 0.03 * umbrellaScale / (abs(distX) + 0.05);

  float newY = position.y + 1.0 + fract(time + progress) * -2.0 * speed;
  float newX = position.x + sign(distX) * setRange * (1.0 - pow(1.0 - max(0.0, min(1.0, -newY + mouse.y + 0.5 + sin(time * 10.) * 0.02)), sharpness));
  float newPointSize = size * pointScale;
  
  float useX = 0.2 * umbrellaScale < abs(distX) || newPointSize < repelsPixelSize * pointScale ? position.x : newX;

  gl_Position = vec4(vec3(useX * (1.0 / aspect) + fract(time + progress) * 0.1, newY, 0.0), 1.0);
  gl_PointSize = newPointSize;
}