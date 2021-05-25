import React, { Component } from 'react';
import {
  debounceAsync, sleepAsync
} from '../functions/Async';

function SobelImageException(message, source='') {
  this.name = 'SobelImageException';
  this.message = message;
  this.source = source;
}

const SEC = 1000;
const VEC2 = 2; // a 2D point in X,Y
const BOX4 = 4; // 4 points in X,Y
const BOX8 = VEC2 * BOX4; // 8

class SobelFilter extends Component {

  constructor(props) {
    super(props)
    this.pos = 'a_pos';
    this.image_pos = 'a_image_pos';
    this.image_size = 'u_image_size';
    this.canvasRef = React.createRef();
    this.state = {
      program: null,
      buffer: null
    };
    this.initWebgl = debounceAsync(
      this.initWebgl, SEC / 100
    ).bind(this);
    this.readPixels = debounceAsync(
      this.readPixels, SEC / 100
    ).bind(this);
  }

  async initWebgl(source) {
    if (!source || !source.height | !source.width) {
      const err = !source? 'No image source' : 'Invalid image shape';
      throw new SobelImageException(err, source);
    }
    if (!this.gl) {
      throw new SobelImageException('No webgl context', 'canvas');
    }
    // Match canvas shape to image shape
    this.gl.canvas.width = source.width;
    this.gl.canvas.height = source.height;
    this.gl.viewport(0, 0, source.width, source.height);
    // Load the shaders when ready and return the promise
    const [vert, frag] = await Promise.all([
      fetch(this.props.vertex).then(x => x.text()),
      fetch(this.props.fragment).then(x => x.text())
    ]);
    const program = this.toProgram(new Map([
      ['VERTEX_SHADER', vert],
      ['FRAGMENT_SHADER', frag]
    ]));
    return await new Promise((resolve) => {
      this.setState({
        buffer: this.initBuffers(program),
        program: program,
      }, resolve);
    });
  }

  // Link shaders from strings
  toProgram(fileMap) {
    const gl = this.gl;
    const program = gl.createProgram();

    const validate = function(verb,noun,object,key='') {
      const step_status = gl[`${verb}_STATUS`];
      const get_log = gl[`get${noun}InfoLog`];
      const get_result = gl[`get${noun}Parameter`];
      if (!get_result.call(gl, object, step_status)){
        throw new SobelImageException(
          `${get_log.call(gl, object)}`, `${verb} ${noun} ${key}` 
        );
      }
      return object;
    }
    // 1st is vertex; 2nd is fragment
    fileMap.forEach((source,key) => {
      const shader = gl.createShader(gl[key]);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      validate('COMPILE','Shader',shader,key);
    });
    gl.linkProgram(program);
    return validate('LINK','Program',program);
  }
  // Load data to the buffers
  initBuffers(program) {
    const {gl} = this;
    gl.useProgram(program);

    const pos = [
      -1, 1, -1, -1,
      1, 1, 1, -1
    ];
    const pos_image =  [
      0, 1, 0, 0,
      1, 1, 1, 0
    ];
    const buffer = new Float32Array(pos.concat(pos_image));

    // Set uniform values
    const image_size = gl.getUniformLocation(program, this.image_size);
    gl.uniform2f(image_size, gl.canvas.height, gl.canvas.width);

    // Bind position and texture buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    return buffer;
  }

  locateVertices(name, i) {
    const {gl} = this;
    const bitdepth = this.state.buffer.BYTES_PER_ELEMENT;
    const args = [
      gl.getAttribLocation(this.state.program, name),
      VEC2, gl.FLOAT, 0, VEC2*bitdepth, i*BOX8*bitdepth
    ];
    gl.enableVertexAttribArray(args[0]);
    gl.vertexAttribPointer.apply(gl, args);
  }

  // Load source to texture
  drawWebgl(source) {
    const {gl} = this;

    // Set glsl attributes
    this.locateVertices(this.pos, 0);
    this.locateVertices(this.image_pos, 1);

    // Set Texture for GLSL
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // Get texture
    this.tex = {
      texImage2D: [gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE],
    };

    // Set texture filters
    [
      [gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.gl.NEAREST],
      [gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.gl.NEAREST]
    ].forEach((x) => {
      gl.texParameteri(...x);
    });
    // Set the image texture
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
      gl.UNSIGNED_BYTE, source
    );

    // Draw the four vertices
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, BOX4);

    return this.gl.canvas;
  }

  async readPixels(x,y,w,h) {
    const {gl} = this;
    const {source} = this.props;
    const {buffer, program} = this.state;
    const pixels = new Uint8Array(w*h*4);
    if (!gl) {
      throw new SobelImageException('No webgl context', 'canvas');
    }
    if (!source) {
      throw new SobelImageException('No image source', 'canvas');
    }
    if (!buffer || !program) {
      throw new SobelImageException('No webgl program', 'canvas');
    }
    this.drawWebgl(source);
    gl.readPixels(
      x, y, w, h,
      gl.RGBA, gl.UNSIGNED_BYTE,
      pixels
    ); 
    if (pixels.every(x=> x===0)) {
      throw new SobelImageException('Empty webgl buffer', 'canvas');
    }

    return pixels;
  }

  async readAllPixels() {
    while (true) {
      try {
        const {canvas} = this.gl;
        const [x,y,w,h] = [0, 0, canvas.width, canvas.height];
        const pixels = await this.readPixels(x,y,w,h);
        if (pixels === null) {
          throw new SobelImageException('canceled');  
        }
        return {
          width: w,
          height: h,
          pixels
        }
      }
      catch (err) {
        if (err.message !== 'canceled') {
          console.error(err);
        }
        await sleepAsync(SEC);
      }
    }
  }

  componentDidMount() {
    this.gl = this.canvasRef.current.getContext('webgl');
  }

  componentDidUpdate(prevProps) {
    const {source} = this.props;
    if (!prevProps.source && source) {
      this.initWebgl(source).catch((err) => {
        if (err instanceof SobelImageException) {
          this.setState({fatalError: true});
          return console.error(`${err.source}:\n${err.message}`);
        }
        console.error(err);
      });
    }
  }

  render() {
    return (
      <canvas id="sobel-filter-canvas" ref={this.canvasRef}> 
      </canvas>
    );
  }
};


export default SobelFilter;
