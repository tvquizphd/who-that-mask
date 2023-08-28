attribute vec4 a_pos;
attribute vec2 a_image_pos;
varying vec2 v_image_pos;

void main() {
  v_image_pos = a_image_pos;
  gl_Position = a_pos;
}
