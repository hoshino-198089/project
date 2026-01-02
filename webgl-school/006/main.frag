precision mediump float;

uniform bool paripiFlag;
uniform float lightPower;
uniform float time;
uniform mat4 mMatrix;
uniform mat4 normalMatrix;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;

void main() {
  vec3 n = (normalMatrix * vec4(vNormal, 0.0)).xyz;

  if(!paripiFlag){

    // 点光源チャレンジ
    // 光源から全方位に拡散するイメージで、(光源 - 各頂点)で光の方向ベクトルを作成
    vec3 lightPos = vec3(0., sin(time * 0.8) * 2., 0.);

    // 何かおかしい
    // vec4 p = mvpMatrix * vec4(vPosition, 1.0);
    // 法線と同様にモデル座標変換行列のみに変更
    vec4 mPos = mMatrix * vec4(vPosition, 1.0);
    vec3 lightVec = lightPos - mPos.rgb;

    // 光が届く距離の設定があった方が自然な気がする...?
    // 光の方向ベクトルを距離にして適当に制限を作成 距離が近いと1、遠いと0になるはず
    float strength = 1. - min(1., length(lightVec) / (5.1 - lightPower));
    float d = dot(normalize(n), normalize(lightVec));
    d *= strength;

    vec4 color = vec4(vColor.rgb * d, vColor.a);
    gl_FragColor = color;

  }else{

    // 思いつきチャレンジ 光源の複製
    // modで思考 → 頂点座標も巻き込まれる...?不本意
    // floorを思考 → 光の方向ベクトルをどうにかするのでなく、グリッド間隔のオフセットでずらせる予感

    // floorで適当にグリッド作成、0.5の加算でセンタリングとても大事
    vec4 mPos = mMatrix * vec4(vPosition, 1.0);
    mPos.xz += vec2(time * 0.5);
    float ox = (floor(mPos.x * 2.) + 0.5) * 0.5;
    float oz = (floor(mPos.z * 2.) + 0.5) * 0.5;

    // 複製かつ動的な光源で処理
    vec3 lightPos = vec3(ox, 0.5, oz);
    vec3 lightVec = lightPos - mPos.xyz;

    float strength = 1. - min(1., length(lightVec) / 0.25);
    float d = dot(normalize(n), normalize(lightVec));
    d *= strength;

    // 適当に色付け
    vec3 grad = vec3(max(0., sin(time + (ox + ox * oz) * 0.3)), (sin(time * 2. + (ox + ox * oz) * 0.7)), 1.);
    vec4 color = vec4(vColor.rgb * d, vColor.a);
    color.rgb *= grad;
    color.rgb *= 1.5;
    color.rgb = pow(color.rgb, vec3(lightPower));
    gl_FragColor = color;

  }
}