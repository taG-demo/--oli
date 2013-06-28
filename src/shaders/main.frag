precision mediump float;

//uniform vec2  u_center;
//uniform vec2  u_resolution;
//uniform float u_radius;
uniform float u_t;

//indicates the step on which the scene is
uniform int u_step;

uniform float u_dotsVisible;
uniform float u_timeIntensity;

uniform vec2  u_resolution;
uniform sampler2D u_sampler;

uniform int u_fType;

const float nbDots       = 30.;

float d1(vec2 o, vec2 p, float t, float t0){
  float r = sin(t / 12000.)  ;
  vec2 f = vec2( r * sin(t/1000.)/5. , r * cos(t/1000.)/5. );
  vec2 z = vec2(2., 2.);
  return 1. / distance( o + z * f, p) +.3;
}

float d2(vec2 o, vec2 p, float t){
  float r = 1.; //sin(t / 12000.)  ;
  vec2 f = vec2( r * sin(t/1000.)/5. , r * cos(t/1000.)/5. );
  vec2 z = vec2(2., 2.);
  return 1. / distance( o + z * f, p) +.3;
}

float d3(vec2 o, vec2 p, float t){
  float r = sin(t / 120.)  ;
  vec2 f = vec2( r * sin(t/100.)/5. , r * cos(t/100.)/5. );
  vec2 z = vec2(0., 0.);
  return 1. / distance( o + z * f, p) +.3;
}

float d4(vec2 o, vec2 p, float t, float t0){
  float r = 1./t0 - 1.;
  vec2 f = vec2( r * sin(t/100.)/5. , r * cos(t/100.)/5. );
  vec2 z = vec2(4., 4.);
  return 1. / distance( o + z * f, p) +.3;
}


void main(){
  vec2 p          =  gl_FragCoord.xy / u_resolution.xy;
  float color = 0.;
  for(float i = 0.; i < nbDots; i++){
    //position of the point/lights
    color += (u_fType == 1 ? d1(vec2( 0.5 , 0.5), p, u_t * (1.5) + 1000.*i + 32000., u_timeIntensity) : 
             u_fType == 2 ? d2(vec2( 0.5 , 0.5), p, u_t * (1.5) + 1000.*i + 32000.) : 
             d4(vec2( 0.5 , 0.5), p, u_t * (1.5) + 1000.*i + 32000., u_timeIntensity) ) *  
      // intensity of the glow
      //(cos(u_t/400.0) +6.0)/256.0 *
      ( 0.01 + ( 1. / (100. * u_timeIntensity)) ) *
      //are they on? // Add some light over time
      min( ( max(u_dotsVisible, i ) - i  ),1.) ; 
  }
  //  float d0        = d(vec2(0.1), p, u_t + 1000.);
  //  float d1        = d(vec2(0.2,0.2), p, u_t * 0.95 + 4000.); //1. / distance( vec2(1) , p)   +4.3;
  //  float d2        = d(vec2(0.4,0.1), p, u_t * 0.90);//1. / distance( vec2(0,1) , p) +4.3;
  //  float d3        = d(vec2(.3,.3), p, u_t * 1.1);
  //  float color      = dot( vec4(d1,d2,d3,d0), vec4( (cos(u_t/400.0) +6.0)/256.0 ) ) ;


  vec3 c = vec3(1.0, 1.0, 1.) * color ;
  for(float n = 0.; n < 5.; n++){
    float decal = 0.2 * n;
    float ts = u_t/160.;
    float w = .05  * p.x + 0.05 * ( sin(ts) + 1.)/2. ;
    float sinus = sin( p.x * 2. + ts + decal  )/ 3.;
    if( p.y > .4 + sinus  && p.y <  .4 + w + sinus ) {
      c += vec3( 
          sin(n) * 127. + 128., 
          sin(n + 1.) * 127. + 128., 
          sin(n+3.) * 127. + 128. ) / 256. * color ;
//    if(p.x > cos( mod(u_t / 800. + 1. , 3.) ) + 0.8 + 0.05 * sin(u_t) && p.x < cos(mod(u_t/800. + 1., 3.))+0.8 + .1 * sin(u_t) ){
//        c *=  0.9;
//    }

    }
  }

//  if( u_step > 0 && mod(u_t, 300.) < 100. * cos(u_t / 100.) ){
//      vec2 cDamier = clamp( cos(p*1000.)*10. , 0.2, .21) ;
//      float th = cos(u_t / 1000.) * 1.3 ;
//      float zoom = 4. +  ( cos(u_t / 1000.) + 1.) * 5.;
//      gl_FragColor = vec4( c * (cDamier.x + cDamier.y)  ,  1.9- 
//            (texture2D( u_sampler, mat2( cos(th), sin(th), -sin(th), cos(th))  * p * vec2(1., -1.)  * zoom + vec2(0, cos(u_t/800.) ) )).x  );
//  }
//  else {
        vec2 cDamier = clamp( cos(p*1000.)*10. , 0.2, .21) ;
        c *=  (cDamier.x + cDamier.y);
        gl_FragColor    = vec4(c , 1.0);
//    }
}
