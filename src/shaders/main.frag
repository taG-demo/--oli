precision mediump float;

//uniform vec2  u_center;
//uniform vec2  u_resolution;
//uniform float u_radius;
uniform float u_t;

uniform vec2  u_resolution;
uniform sampler2D u_sampler;

const float nbDots       = 10.;

float d(vec2 o, vec2 p, float t){
  float r = sin(t / 12000.)  ;
  vec2 f = vec2( r * sin(t/1000.)/5. , r * cos(t/1000.)/5. );
  vec2 z = vec2(2., 2.);
  return 1. / distance( o + z * f, p) +.3;
}

void main(){
  vec2 p          =  gl_FragCoord.xy / u_resolution.xy;
  //float dots[nbDots];// = float(1., 3.,4.,5., .4);
  float color = 0.;
  for(float i = 0.; i < nbDots; i++){
    //dots[i] = d( vec2(0.6 - 0.1 * i, 0.1 * i), p, u_t * (1.1 * 0.5 * i) + 1000.*i);
    //position of the point
    color += d( vec2( 0.5 , 0.5), p, u_t * (1.5) + 1000.*i + 32000.) *  
      (cos(u_t/400.0) +6.0)/256.0 ; // intensity of the glow
  }
  //  float d0        = d(vec2(0.1), p, u_t + 1000.);
  //  float d1        = d(vec2(0.2,0.2), p, u_t * 0.95 + 4000.); //1. / distance( vec2(1) , p)   +4.3;
  //  float d2        = d(vec2(0.4,0.1), p, u_t * 0.90);//1. / distance( vec2(0,1) , p) +4.3;
  //  float d3        = d(vec2(.3,.3), p, u_t * 1.1);
  //  float color      = dot( vec4(d1,d2,d3,d0), vec4( (cos(u_t/400.0) +6.0)/256.0 ) ) ;


  vec3 c = vec3(1.0, 1.0, 1.) * color ;
  for(float n = 0.; n < 5.; n++){
    float decal = 0.2 * n;
    float ts = u_t/1600.;
    float w = .05  * p.x + 0.05 * ( sin(ts) + 1.)/2. ;
    float sinus = sin( p.x * 2. + ts + decal  )/ 3.;
    if( p.y > .4 + sinus  && p.y <  .4 + w + sinus ) {
      c += vec3( 
          sin(n) * 127. + 128., 
          sin(n + 1.) * 127. + 128., 
          sin(n+3.) * 127. + 128. ) / 256. * color;
      if(p.x > cos( mod(u_t / 800. + 1. , 3.) ) + 0.8 + 0.05 * sin(u_t) && p.x < cos(mod(u_t/800. + 1., 3.))+0.8 + .1 * sin(u_t) ){
          c *=  0.9;
      }

    }
  }

  //  if( mod(u_t, 300.) < 100. * cos(u_t / 100.) ){
  //  vec2 cDamier = clamp( cos(p*1000.)*10. , 0.2, .21) ;
  //  float th = cos(u_t / 1000.) * 1.3 ;
  //  float zoom = 4. +  ( cos(u_t / 1000.) + 1.) * 5.;
  //  //c = 
  //  gl_FragColor = vec4( c * (cDamier.x + cDamier.y)  ,  1.9- 
  //        (texture2D( u_sampler, mat2( cos(th), sin(th), -sin(th), cos(th))  * p * vec2(1., -1.)  * zoom + vec2(0, cos(u_t/800.) ) )).x  );

  //      gl_FragColor    = vec4(c , 1.0);
  //   }
  //    else {
  vec2 cDamier = clamp( cos(p*1000.)*10. , 0.2, .21) ;
  c *=  (cDamier.x + cDamier.y);
  gl_FragColor    = vec4(c , 1.0);
  //    }
}
