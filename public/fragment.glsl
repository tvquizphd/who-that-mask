#define TAU 6.283185307179586476925286766559
#define PI 3.1415926535897932384626433832795
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_image_size;
varying vec2 v_image_pos;

int round_float(float v) {
  if (v - float(int(v)) >= 0.5) {
    return int(v) + 1;
  }
  return int(v);
}

vec3 hsv2rgb( in vec3 c ) {
  vec3 rgb_hue = mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0);
  rgb_hue = abs(rgb_hue - 3.0) - 1.0;
  rgb_hue = clamp(rgb_hue, 0.0, 1.0);

  return c.z * mix(vec3(1.0), rgb_hue, c.y);
}

float convolve3x3(mat3 kernel, mat3 patch) {
  float result = 0.0;
  for (int ix = 0; ix < 3; ix++) {
    for (int iy = 0; iy < 3; iy++) {
      result = result + kernel[ix][iy] * patch[ix][iy];
    }
  }
  return result;
}

mat3 outer_product(vec3 c, vec3 r) {
  mat3 goal;
  for (int i =0; i<3; i++) {
      goal[i] = r*c[i];
  }
  return goal;
}

vec4 sample_offset(int dx, int dy) {
  // Use a fractional coordinate system
  vec2 u = vec2(1./u_image_size.x, 1./u_image_size.y);
  float x = clamp(v_image_pos.x + float(dx)*u.x, 0.0, 1.0);
  float y = clamp(v_image_pos.y + float(dy)*u.y, 0.0, 1.0);

  return texture2D(u_image, vec2(x,y));
}

float grayscale(vec4 v) {
  return dot(v,vec4(1./4.));
}

bool bg_at_ring(float bg_radius) {
  bool has_bg = false;
  float sample_count = 8.0;
  float sample_angle = TAU / sample_count;
  
  // loop should match sample count
  for (int i = 0; i < 8; i++) {
    int ix = round_float(bg_radius * cos(float(i) * sample_angle));
    int iy = round_float(bg_radius * sin(float(i) * sample_angle));
    has_bg = has_bg || (sample_offset(ix, iy).a < 0.5);
  }

  return has_bg;
}

float get_acute_ratio(float x, float y) {
  // Ensure vertical change >= 0, so angle is >= 0
  float positive_y = sign(y) * y;
  float signed_x = sign(y) * x;

  // Angle is from 0 to Pi
  float angle = atan(positive_y, signed_x);
  // Ratio can be from 0 to 1.0 half-turns
  return angle / PI;
}

vec4 rgb_angle_steps(float acute_ratio) {
  // 3rd of half turn
  float n_steps = 3.0;
  // Each 6th of the circle can be red, green, or blue
  float turn_6th_ratio = mod(0.5 + n_steps * acute_ratio, n_steps);
  float turn_6th_step = floor(turn_6th_ratio) / n_steps;

  // Return 3 color options based on 6th of circle
  vec3 step_rgb = hsv2rgb(vec3(turn_6th_step, 1.0, 1.0));
  return vec4(step_rgb, 1.0);
}

vec4 color_angle_steps(float grad, float acute_ratio) {

  // for testing
  return rgb_angle_steps(get_acute_ratio(v_image_pos.x - 0.5, v_image_pos.y - 0.5));

  // Return black if below threshhold
  if (grad < 0.5) {
    return vec4(vec3(0.0), 1.0);
  };

  // Return black if background is within 15px circle
  bool bg_in_9px = bg_at_ring(2.0) || bg_at_ring(3.0) || bg_at_ring(4.0);
  bool bg_in_15px = bg_in_9px || bg_at_ring(5.0) || bg_at_ring(6.0) || bg_at_ring(7.0);
  if (bg_in_15px) {
    return vec4(vec3(0.0), 1.0);
  } 

  // Return white if vertical within 4 degrees
  if (abs(0.5 - acute_ratio) < radians(4.0)) {
    return vec4(1.0);
  }

  return rgb_angle_steps(acute_ratio);
}

void main() {
  mat3 patch;
  vec3 blend = vec3(1,2,1);
  vec3 sharpen = vec3(-1,0,1);
  // generate X and Y kernels
  mat3 x_kernel = outer_product(blend, sharpen);
  mat3 y_kernel = outer_product(sharpen, blend);

  // Get grayscale of 3x3 patch
  for (int ix = 0; ix < 3; ix++) {
    for (int iy = 0; iy < 3; iy++) {
      patch[ix][iy] = grayscale(sample_offset(ix - 1, iy - 1));
    }
  }

  // Apply a sobel filter in 2D
  float edgeX = convolve3x3(x_kernel, patch);
  float edgeY = convolve3x3(y_kernel, patch);
  float grad = length(vec2(edgeX, edgeY));

  float acute_ratio = get_acute_ratio(edgeX, edgeY);
  gl_FragColor = color_angle_steps(grad, acute_ratio);
}
