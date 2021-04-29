precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_image_size;
varying vec2 v_image_pos;

float convolve3x3(mat3 kernel, mat3 patch) {
  float result = 0.0;
  for (int ix = 0; ix < 3; ix++) {
    for (int iy = 0; iy < 3; iy++) {
      result = result + kernel[ix][iy] * patch[ix][iy];
    }
  }
  return result;
}

float convolve(mat3 kernel, mat3 patch[3]) {

  // Convolve each color channel separately
  return length(vec3(
    convolve3x3(kernel, patch[0]),
    convolve3x3(kernel, patch[1]),
    convolve3x3(kernel, patch[2])
  ));
}

mat3 outer_product(vec3 c, vec3 r) {
  mat3 goal;
  for (int i =0; i<3; i++) {
      goal[i] = r*c[i];
  }
  return goal;
}

vec3 sample_rgb(float dx, float dy) {
  return texture2D(u_image, v_image_pos+vec2(dx,dy)).rgb;
}

void main() {
  mat3 patch[3];
  vec3 blend = vec3(1,2,1);
  vec3 sharpen = vec3(-1,0,1);
  // generate X and Y kernels
  mat3 x_kernel = outer_product(blend, sharpen);
  mat3 y_kernel = outer_product(sharpen, blend);
  // Use a fractional coordinate system
  vec2 u = vec2(1./u_image_size.x, 1./u_image_size.y);

  // Get colors of 3x3 patch
  for (int ix = 0; ix < 3; ix++) {
    for (int iy = 0; iy < 3; iy++) {
      vec3 ixiy_color = sample_rgb(float(ix)*u.x, float(iy)*u.y);
      // All three color channels
      patch[0][ix][iy] = ixiy_color.r;
      patch[1][ix][iy] = ixiy_color.g;
      patch[2][ix][iy] = ixiy_color.b;
    }
  }

  // Show the mixed XY contrast
  float edgeX = convolve(x_kernel, patch);
  float edgeY = convolve(y_kernel, patch);
  float mixed = length(vec2(edgeX,edgeY));

  gl_FragColor = vec4(vec3(mixed),1);
}
