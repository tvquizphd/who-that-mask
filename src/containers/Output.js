import React, { Component } from 'react';
import {
  debounceAsync
}from '../functions/Async';
import styles from './Output.module.css';
import OutputLine from './OutputLine';
import {
  constMapInsert, constListReplace
} from '../functions/ConstUpdaters';

const MAGIC_HEIGHT = 950;

function TextException(message) {
  this.name = 'TextException';
  this.message = message;
}

const makeNewLine = (line=[]) => {
  return {
    numRenders: 0,
    elWidthDiff: 0,
    elWidth: 0,
    line: line
  }
}

const makeNewLines = (num) => {
  const numRange = [...Array(num).keys()];
  return numRange.map(()=>{
    return makeNewLine([]);
  })
} 

const readLastChar = (lineState) => {
  const {line} = lineState;
  return line.slice(-1)[0];
}

const copyWidthMap = (widthMap, char, elWidthDiff) => {
  if (char && elWidthDiff !== 0 && !widthMap.has(char)) {
    return constMapInsert(widthMap, char, Math.abs(elWidthDiff));
  }
  return widthMap;
}

const maxRound = (...args) => {
  return Math.round(Math.max(...args));
}

const minRound = (...args) => {
  return Math.round(Math.min(...args));
}

const minFloor = (...args) => {
  return Math.floor(Math.min(...args));
}

const sameFloor = (v0, v1) => {
  return Math.floor(v0) === Math.floor(v1);
}

const takeRatios = (params) => {
  const {
    elWidth, width, lineIdx, maxLines
  } = params;
  return {
    widthRatio: elWidth / width,
    heightRatio: lineIdx / maxLines
  };
}

const boundArtChar = (params) => {
  const {artWidthMap, h} = params;
  const {width, maxLines} = params;
  const {elWidth, lineIdx} = params;
  const {maskWidth, maskHeight} = params;
  const {widthRatio, heightRatio} = takeRatios({
    elWidth, width, lineIdx, maxLines
  });
  const x = minRound(widthRatio * maskWidth, maskWidth - 1);
  const y = minRound(heightRatio * maskHeight, maskHeight - 1);
  return {
    x, y, h,
    artWidthMap
  };
}

const indexLabel = (label, offset) => {
  return label[offset % label.length];
}

class Output extends Component {
  constructor(props) {
    super(props);
    const fontSize = 16 * 1; //TODO
    const lineHeight = 16 * 1; //TODO
    const [w, h] = this.props.readMaskShape();
    const idealHeight = MAGIC_HEIGHT;
    const {innerWidth, innerHeight} = window;
    const idealWidth = Math.floor(idealHeight * w / h);
    const initialHeight = minFloor(idealHeight, innerHeight); 
    const lines = makeNewLines(Math.floor(initialHeight / lineHeight));
    this.state = {
      lines,
      fontSize,
      lineHeight,
      idealWidth,
      idealHeight,
      maxWidth: Math.floor(innerWidth),
      maxHeight: Math.floor(innerHeight),
      canRender: true,
      widthMap: new Map()
    };
    this.updateShape = debounceAsync(this.updateShape, 333).bind(this);
    this.resetLines = debounceAsync(this.resetLines, 333).bind(this);
    this.enqueueLineUpdate = this.enqueueLineUpdate.bind(this);
    this.addCharsToLine = this.addCharsToLine.bind(this);
    this.addCharToLine = this.addCharToLine.bind(this);
    this.lineQueue = Promise.resolve(true);
  }

  getShape() {
    const [w, h] = this.props.readMaskShape();
    const {idealWidth, idealHeight} = this.state;
    const {maxWidth, maxHeight} = this.state;
    const output = {
      width: minFloor(idealWidth, maxWidth),
      height: minFloor(idealHeight, maxHeight)
    };
    const ratio_width = Math.floor(output.height * w / h);
    const ratio_height = Math.floor(output.width * h / w);
    if (ratio_width < output.width) {
      return {
        ...output,
        width: ratio_width 
      }
    }
    if (ratio_height < output.height) {
      return {
        ...output,
        height: ratio_height
      }
    }
    return output;
  }

  getMaxLines() {
    const {lineHeight} = this.state;
    const {height} = this.getShape();
    return Math.floor(height / lineHeight);
  }

  newLine(line=[]) {
    return makeNewLine(line);
  }

  newChar({offset=-1, char='?', art=false}) {
    // Offset of -1 means hidden
    return {
      offset: offset,
      char: char,
      art: art
    };
  }

  getLabel() {
    return this.props.label || '?';
  }

  getNextOffsetByColumn(lineState, increment) {
    const {elWidth} = lineState;
    const {width} = this.getShape();
    const {widthMap} = this.state;
    const label = this.getLabel();
    const maxRange = [...Array(width).keys()];
    const {prior} = maxRange.reduce((result, off) => {
      const {done, prior, sumWidth} = result;
      const offWidth = widthMap.get(indexLabel(label, off)) || 0;
      if (done || sumWidth + offWidth > elWidth + offWidth/2) {
        return {done: true, prior, sumWidth};
      }
      return {
        prior: off,
        done: false,
        sumWidth: sumWidth + offWidth
      }
    }, {
      prior: -1,
      sumWidth: 0,
      done: false
    });
    return Math.max(prior + increment, 0);
  }

  getNextOffset(lineState, increment) {
    const {offset} = readLastChar(lineState) || {
      offset: -1
    };
    return Math.max(offset + increment, 0);
  }

  getNextChar(lineState, increment) {
    const {alignment} = this.props;
    const label = this.getLabel();
    const offset = (()=>{
      // Column alignment must jump characters after a space
      if (alignment === 'column' && increment > 0) {
        const {art} = readLastChar(lineState) || {};
        if (art === true) {
          return this.getNextOffsetByColumn(lineState, increment);
        }
      }
      // Otherwise, we just increment the next character
      return this.getNextOffset(lineState, increment);
    })();
    const char = indexLabel(label, offset);
    return this.newChar({
      offset, char, art: false
    });
  }

  getLastLine(lines) {
    return lines.slice(-1)[0] || this.newLine();
  }

  getRatios(elWidth, lineIdx) {
    const maxLines = this.getMaxLines();
    const {width} = this.getShape();
    return takeRatios({
      elWidth, width, lineIdx, maxLines
    });
  }

  checkRatios(elWidth, lineIdx) {
    const {
      widthRatio, heightRatio
    } = this.getRatios(elWidth, lineIdx);
    if (widthRatio > 1 || heightRatio > 1) {
      return false;
    }
    return true;
  }

  getArtCharWidths(widthMap, maskWidth) {
    const {artKernels} = this.props;
    try {
      return new Map(Object.keys(artKernels).map(
        (char) => {
          const elWidth = widthMap.get(char) || 0;
          const {widthRatio} = this.getRatios(elWidth, 0);
          const w = widthRatio * maskWidth;
          if (!w) {
            throw new TextException(`Unknown char width`);
          }
          return [char, {
            w: maxRound(1, w)
          }];
        }
      ));
    }
    catch (err) {
      console.error(err);
      return new Map([]);
    }
  }

  getArtCharBounder() {
    const {widthMap} = this.state;
    const {readMaskShape} = this.props;
    const {width} = this.getShape();
    const maxLines = this.getMaxLines();
    const [maskWidth, maskHeight] = readMaskShape();
    const lineRatio = this.getRatios(0, 1).heightRatio;
    const h = Math.max(1, Math.floor(lineRatio * maskHeight));
    const artWidthMap = this.getArtCharWidths(widthMap, maskWidth);
    
    // Return a function to scale coordinates
    const bounder = (elWidth, lineIdx) => {
      return boundArtChar({
        ...{width, maxLines}, // Input shape
        ...{maskWidth, maskHeight}, // Output shape
        ...{artWidthMap, h}, // Constant values
        ...{elWidth, lineIdx} // Coordinates
      });
    };
    return bounder;
  }

  async readMask(input) {
    const {readMaskPixel} = this.props;
    const {readArtPixel} = this.props;
    const {lineState, lineIdx} = input;
    const {elWidth} = lineState;
    if (!this.checkRatios(elWidth, lineIdx)) {
      return null;
    }

    // Convert element coords to mask coords
    const {x, y, h, artWidthMap} = input.artCharBounder(
      elWidth, lineIdx
    );

    // Return correct character
    if (readMaskPixel(x,y)) {

      const artChar = await readArtPixel(artWidthMap, h, x, y);

      return this.newChar({
        offset: this.getNextOffset(lineState, 0),
        char: artChar,
        art: true
      });
    }
    return this.getNextChar(lineState, 1);
  }

  async addCharToLine(input, i) {
    if (input.done) {
      return input;
    }

    const {lineState, hiddenChars} = input;
    if (hiddenChars.length > 0 && lineState.line.length > 0) {
      return {
        ...input,
        done: true,
        lineState: {
          ...lineState,
          line: lineState.line.concat([
            hiddenChars.slice(-1)[0]
          ]),
        },
        hiddenChars: hiddenChars.slice(0,-1)
      };
    }

    const nextChar = await this.readMask(input);
    if (nextChar === null) {
      return input;
    }
    const {char} = nextChar;
    const {lineIdx, iMax} = input;
    const {elWidth} = lineState;
    const {widthMap} = this.state;
    const charWidth = widthMap.get(char) || 0;
    const nextWidth = elWidth + charWidth;
    const inBounds = this.checkRatios(nextWidth, lineIdx);
    if (!inBounds) {
      return {
        ...input,
        done: true
      }
    }

    const done = [
      i === iMax, // final character estimate
      charWidth < 1 // no valid character estimate
    ].some(x=>x);

    return {
      ...input,
      lineState: {
        ...lineState,
        line: lineState.line.concat([nextChar]),
        elWidth: (done ? elWidth : nextWidth)
      },
      done
    };
  }

  async addCharsToLine(input, lineState, lineIdx) {
    const {num, lines, hiddenChars} = input;
    // Line is ready to go
    if (!this.canLineRender(lineState)) {
      return input;
    }

    const numRange = [...Array(num).keys()];
    const output = await numRange.reduce(async (prior, i) => {
        return this.addCharToLine(await prior, i);
      }, Promise.resolve({
        iMax: num - 1, done: false, lineState, lineIdx,
        artCharBounder: input.artCharBounder,
        hiddenChars: hiddenChars
      })
    );

    return {
      ...input,
      allReady: false,
      hiddenChars: output.hiddenChars,
      lines: constListReplace(lines, lineIdx, output.lineState),
    };
  }

  listHiddenChars() {
    const {artKernels} = this.props;
    const label = this.getLabel();
    const {widthMap} = this.state;
    // Compute a list of all chars that must be rendered
    return Object.keys(artKernels).reduce((l0, char) => {
      if (widthMap.has(char)) {
        return l0;
      }
      return [
        this.newChar({
          char: char, offset: -1, art: true
        })
      ].concat(l0);
    }, label.split('').reduce((l0, char) => {
      if (widthMap.has(char)) {
        return l0;
      }
      return [
        this.newChar({
          char: char, offset: -1, art: false
        })
      ].concat(l0);
    }, []));
  }

  onColumnUpdate() {
    return new Promise(async (resolve) => {
      const {lines} = this.state;

      const output = await lines.reduce(async (prior, l, i) => {
          return this.addCharsToLine(await prior, l, i);
        }, Promise.resolve({
          artCharBounder: this.getArtCharBounder(),
          hiddenChars: this.listHiddenChars(),
          allReady: true,
          num: 100,
          lines
        })
      );

      if (output.allReady) {
        return this.setState({
          canRender: false,
        }, resolve);
      }
      return this.setState({
        canRender: true,
        lines: output.lines,
      }, resolve);
    });
  }

  updateLine(lineState, elWidth) {
    const {width} = this.getShape();
    const {numRenders} = lineState;
    const {offset} = readLastChar(lineState) || {
      offset: 0
    };
    // If at end of line or hidden character
    if (elWidth > width || offset < 0) {
      // We will measure a negative element width
      return {
        ...lineState,
        line: lineState.line.slice(0, -1),
        elWidthDiff: lineState.elWidth - elWidth
      };
    }
    return {
      ...lineState,
      elWidth: elWidth,
      numRenders: numRenders + 1,
      elWidthDiff: elWidth - lineState.elWidth
    };
  }

  onLineUpdate(id, elWidth) {
    return new Promise((resolve) => {
      const {lines, widthMap} = this.state;
      if (id < lines.length) {
        const {char} = readLastChar(lines[id]) || {};
        const lineState = this.updateLine(lines[id], elWidth);
        const {elWidthDiff} = lineState;
        this.setState({
          widthMap: copyWidthMap(widthMap, char, elWidthDiff),
          lines: constListReplace(lines, id, lineState),
          canRender: false
        }, resolve);
      }
    });
  }

  enqueueLineUpdate(id, elWidth) {
    this.lineQueue.then(async () => {
      return await this.onLineUpdate(id, elWidth);
    })
  }

  canLineRender(lineState) {
    if (!lineState) {
      return false;
    }
    const {numRenders, elWidthDiff} = lineState;
    const endReached = (
      numRenders >= 2 && (elWidthDiff === 0)
    );
    return !endReached;
  }

  // debounced
  async updateShape() {
    const newState = {};
    const oldShape = this.getShape();
    const {maxWidth, maxHeight, lineHeight} = this.state;
    const {innerWidth, innerHeight} = window;

    if (!sameFloor(maxWidth, innerWidth)) {
      newState.maxWidth = Math.floor(innerWidth);
    }
    if (!sameFloor(maxHeight, innerHeight)) {
      newState.maxHeight = Math.floor(innerHeight);
    }
    this.setState(newState, async () => {
      const {height, width} = this.getShape();
      // No need to redraw output if the shape has not changed
      if (oldShape.height === height && oldShape.width === width) {
        return;
      }
      await this.lineQueue;
      const numLines = Math.floor(height / lineHeight);
      this.setState({
        canRender: true,
        lines: makeNewLines(numLines)
      });
    });
  }

  // debounced
  async resetLines() {
    const {readMaskShape} = this.props;
    const {idealHeight} = this.state;
    const [w, h] = readMaskShape();
    await this.lineQueue;
    this.setState({
      canRender: false,
      idealWidth: Math.floor(idealHeight * w / h)
    }, () => {
      const {lineHeight} = this.state;
      const {height} = this.getShape();
      const numLines = Math.floor(height / lineHeight);
      this.setState({
        canRender: true,
        lines: makeNewLines(numLines),
      });
    });
  }

  async componentDidMount() {
    window.addEventListener('resize', async() => {
      await this.updateShape();
    });
    await this.onColumnUpdate();
  }

  async componentDidUpdate() {
    await this.lineQueue;
    await this.onColumnUpdate();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const propsList = [
      'label', 'artKernels', 'alignment'
    ]
    // Redraw completely if props change
    const mustReset = propsList.map((p)=> {
      return this.props[p] !== nextProps[p];
    }).some(x => !!x);
    if (mustReset) {
      this.resetLines();
      return false;
    }
    // Only update if can render
    const {canRender} = nextState;
    return canRender;
  }

  render() {
    const {lines} = this.state;
    const {fontSize, lineHeight} = this.state;
    const {width, height} = this.getShape();

    const outlineStyle = {
      fontSize: `${fontSize}px`,
      lineHeight: `${lineHeight}px`,
    };
    const centerStyle = {
      'width': `${width}px`,
      'height': `${height}px`
    };

    const outline = (
      <div style={outlineStyle} className={styles.outline}>
        {lines.map((lineState, i) => {
          const lineStyle ={
            top: i * lineHeight
          };
          const {line} = lineState;
          return (
            <OutputLine enqueueLineUpdate={this.enqueueLineUpdate}
              canRender={this.canLineRender(lineState)}
              stl={lineStyle} cls={styles.line}
              line={line} key={i} id={i}
            >
            </OutputLine>
          );
        })}
      </div>
    );
    return (
      <div className={styles.grid}>
        <div></div>
        <div style={centerStyle}>
          {outline}
        </div>
        <div></div>
      </div>
    )
  }
}
export default Output;
