precision mediump float;
attribute vec2 a_position;

varying vec2 v_textureCoord;

uniform float u_t;

void main(){
  gl_Position = vec4(a_position , 0, 1);   // + vec4( cos(u_t / 1000.0), sin(u_t / 1000.0),0, 0 );
  v_textureCoord = a_position;
}
