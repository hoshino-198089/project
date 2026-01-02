precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float buildingOffset;
uniform float starOffset;
uniform float buildingUV;
uniform float starUV;
uniform float snowUV;

// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

float random(in vec2 st){
  return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

// Value noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/lsf3WH
float noise(vec2 st){
  vec2 i=floor(st);
  vec2 f=fract(st);
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(random(i+vec2(0.,0.)),random(i+vec2(1.,0.)),u.x),
  mix(random(i+vec2(0.,1.)),random(i+vec2(1.,1.)),u.x),u.y);
}

mat2 rotate2d(float angle){
  return mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
}

float lines(in vec2 pos,float b){
  float scale=5.;
  pos*=scale;
  return smoothstep(0.,.5+b*.5,abs((sin(pos.x*3.1415)+b*2.))*.5);
}

const float PI=3.1415926;

float ram(vec3 v){
  return fract(sin(dot(v,vec3(1.,57.,113.))*12.9898)*43758.5453);
}

struct v2{
  vec2 uv;
  vec2 mUV;
  vec2 id;
  float step;
};

v2 sMod(vec2 uv,vec2 sp,vec2 o,vec2 sc){
  v2 v;
  vec2 nUV=uv*(1.+sp*2.)+o;
  v.uv=nUV-sp;
  v.mUV=mod(v.uv*sc,1.);
  v.id=floor(v.uv*sc);
  v.step=step(sp.x,nUV.x)*step(nUV.x,1.+sp.x)*step(sp.y,nUV.y)*step(nUV.y,1.+sp.y);
  return v;
}

vec3 drawRect(vec2 uv,vec2 s,vec3 c1,vec3 c2,float j){
  return all(lessThan(abs(uv-.5),s*.5))&&j==1.?c1:c2;
}

vec3 star(vec2 p,vec3 c){
  vec2 mP=mod(vec2(p.x-.2+starOffset*10.,abs(p.y))*vec2(10.,10.),1.);
  vec2 id=floor(vec2(p.x-.2+starOffset*10.,abs(p.y))*vec2(10.,10.));
  float r1=ram(vec3(id,1.));
  float r2=ram(vec3(id,2.));
  float r3=ram(vec3(r1,r2,1.));
  float r4=ram(vec3(r1,r2,1.5));
  float nc=(.005+r3*.01)/length(mP-.5+(vec2(r1,r2)*2.-1.)*.2);
  nc=pow(nc,1.7)*step(.8,r4);
  return mix(c+vec3(nc),mix(c,vec3(mP,1.),step(.8,r4)),starUV);
}

vec3 snow(vec2 p,vec3 c){
  vec2 s=vec2(.25,150.);
  float y=p.y+.5+sin(p.x*PI-time*.1)*.2;
  vec2 uv=vec2(p.x,abs(y));
  uv*=mat2(cos(PI*.25),-sin(PI*.25),sin(PI*.25),cos(PI*.25));
  uv.x*=s.x;
  uv=uv*.5+.5;
  vec2 mUV=mod(uv*vec2(1.,s.y),1.);
  vec2 id=floor(uv*vec2(1.,s.y));
  float r1=ram(vec3(id,.5));
  float r2=ram(vec3(id,1.));
  float r3=ram(vec3(id,1.5));
  mUV.y+=sin(time*1.+r1*PI*2.)*.05;
  float nc=step(.5+r2*.3,.06/length((mUV-vec2(fract(time*(.02+r3*.03)+r1),.5))*s.yx));
  return mix(c+vec3(nc)*mix(vec3(1.),vec3(0.,.502,1.),step(y,0.)),vec3(mUV,1.),snowUV);
}

void main(){
  vec2 p=(gl_FragCoord.xy*2.-resolution)/resolution.y*1.3;
  p.y+=.15;
  
  vec3 bc=mix(vec3(.0667,.3961,.6824),vec3(.0314,.0902,.2784),pow(abs(p.y),1.5))*step(p.y+.03,0.)+
  mix(vec3(.2431,.5608,.8),vec3(.0275,.2235,.498),pow(abs(p.y),1.5))*step(0.,p.y+.03);
  vec3 cSum=vec3(0.);
  
  vec2 uv=gl_FragCoord.xy/resolution.y;
  vec2 p1=uv.yx*3.;
  float pat=p1.x;
  p1=rotate2d(noise(p1+time*.3))*p1;
  pat=lines(p1+time*.4,.5);
  p+=pat*.01*step(p.y,0.)*(1.-pow(1.-min(1.,abs(p.y)),2.+1.*(sin(time*2.+p.x))));
  
  bc=star(p,bc);
  
  float wSum=0.;
  float l=20.;
  for(float j=0.;j<20.;j++){
    float w=pow(1.-j/l,3.);
    vec3 c=bc;
    for(float i=0.;i<3.;i++){
      vec2 p2=vec2(p.x-(2.-i)*.2+buildingOffset*(30.+i*5.),abs(p.y+(1.-smoothstep(-.01,0.,p.y))*j*2./resolution.y*1.3))*vec2(5.-i,1.);
      vec2 mP=mod(p2,1.);
      vec2 id=floor(p2);
      float r1=ram(vec3(id,id.x+i));
      float r2=ram(vec3(id,id.y+i))*2.-1.;
      float r3=ram(vec3(id,id.x+id.y+i));
      float j=step(p2.y,1.);
      vec2 o=vec2(.25+.25*r2,.05+.05*i+r1*.5);
      v2 mP2=sMod(mP,o,vec2(r2*o.x*.5,o.y-.025),vec2(1.));
      j*=mP2.step;
      c=mix(c,mix(mix(vec3(.1333,.1451,.1529),vec3(.6196,.5765,.4706),pow((-mP2.uv.x+mP2.uv.y)*.5,2.)),vec3(mP2.uv,1.),buildingUV),j);
      
      vec2 d2=abs(mP2.mUV*2.-1.)-vec2(1.);
      float dist2=max(d2.x,d2.y);
      float t=.2/pow(abs(dist2)+.001,.45);
      c+=t*vec3(.0784,.0588,.0078)*j;
      
      v2 mP3=sMod(mP2.mUV,vec2(.15,.05-(1.-r3)*.025),vec2(0.),vec2(min(10.,15.-floor(r3*10.))+(2.-i)*5.,25.+floor(r3*10.)+(2.-i)*20.));
      j*=mP3.step;
      float r4=ram(vec3(mP3.id,1.));
      float r5=step(.7-(2.-i)*.1,r4);
      vec2 size1=vec2(.5+buildingUV*.5);
      j*=r5;
      c=drawRect(mP3.mUV,size1,mix(vec3(1.),vec3(mP3.mUV,1.),buildingUV),c,j);
      
      vec2 d=abs(mP3.mUV-.5)-(size1*.5);
      float dist=length(max(d,0.));
      float glow=(.02-(2.-i)*.0095)/(dist+.01);
      c+=vec3(glow)*vec3(1.,.651,0.)*j*(1.-buildingUV);
      
      float r6=ram(vec3(mP3.id+r4,1.));
      float r7=ram(vec3(mP3.id+r4*r4,1.));
      float r8=ram(vec3(mP3.id+vec2(r6),1.));
      vec2 p3=mP3.mUV-.5;
      float rot=PI*.25;
      p3*=mat2(cos(rot),-sin(rot),sin(rot),cos(rot));
      float light=.01/abs(p3.x*p3.y);
      light=pow(light,.5);
      light*=1.-(smoothstep(0.,.9+sin(time+PI*r7)*.2,(length(p3))));
      light*=pow(max(0.,sin(time*(5.+2.*r8)+PI*r8)),2.)*1.5;
      c+=vec3(light)*mix(vec3(1.),vec3(1.,.651,0.),1.-light*.1)*j*step(p.y,0.);
      
      c=mix(c,bc,(2.-i)*.2*(.5+.5*(1.-pow(1.-p2.y,2.))));
      c=mix(c,vec3(.2235,.4627,.5725),step(i,1.)*pow(min(1.,1.-p2.y+.0125)*abs(sin(p.x*30.-.1)),5.));
      c=mix(mix(c,vec3(.9725,.62,.0745),step(i,1.)*pow(1.-p2.y+.0125,10.)*abs(sin(p.x*10.))),vec3(1.),step(i,1.)*pow(min(1.,1.-p2.y+.0125),30.));
    }
    cSum+=c*w;
    wSum+=w;
  }
  cSum/=wSum;
  
  gl_FragColor=vec4(cSum,1.);
  gl_FragColor.rgb=mix(vec3(.1373,.1098,.2157),gl_FragColor.rgb,step(.018,abs(p.y)));
  gl_FragColor.rgb+=.1/(-p.y-.02)*vec3(0.,.0275,.0431)*step(p.y,0.);
  gl_FragColor.rgb=snow(p,gl_FragColor.rgb);
  gl_FragColor.rgb=mix(vec3(.4353,.7059,.9137),gl_FragColor.rgb,smoothstep(5.,0.,pow(abs(p.x),2.)));
  float e=1.+1.*min(1.,step(p.y+.03,0.)+1.-smoothstep(10.,0.,pow(abs(p.x),3.)));
  gl_FragColor.rgb=vec3(pow(gl_FragColor.r,e),pow(gl_FragColor.g,e),pow(gl_FragColor.b,e));
  gl_FragColor.rgb=mix(gl_FragColor.rgb,(gl_FragColor.rgb+bc*(1.-snowUV)),step(p.y+.02,0.));
}