import React, { Component } from 'react';
import Output from './Output.js';

class UrlOutput extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.missing = [
      [0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,0,0,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0],
    ];
    this.readMaskPixel = this.readMaskPixel.bind(this);
    this.readMaskShape = this.readMaskShape.bind(this);
  }

  readMaskPixel(x,y) {
    return !!this.missing[y][x];
  }

  readMaskShape() {
    return [
      this.missing[0].length, 
      this.missing.length
    ];
  }

  render() {
    const {alignment} = this.props;
    return (
      <Output space=' ' stepSize={100}
        readMaskShape={this.readMaskShape}
        readMaskPixel={this.readMaskPixel}
        alignment={alignment}
        label='Missing url! '
      >
      </Output>
    )
  }
}
export default UrlOutput;
