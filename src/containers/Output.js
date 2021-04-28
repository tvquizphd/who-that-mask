import React, { Component } from 'react';
import debounce from 'debounce-async';
import styles from './Output.module.css';
import OutputLine from './OutputLine';
import OutputChar from './OutputChar';
import {
  constMapInsert, constListReplace
} from '../functions/ConstUpdaters';

/*
const sleep = async (ms) => {
  return await ((ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  })();
}*/
const MAGIC_HEIGHT = 950;
const MAX_WIDTH = 450;

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

const minFloor = (v0, v1) => {
  return Math.floor(Math.min(v0, v1));
}

const sameFloor = (v0, v1) => {
  return Math.floor(v0) === Math.floor(v1);
}

const indexLabel = (label, offset) => {
  return label[offset % label.length];
}

const debounceAsync = (fn, t) => {
  const debounced = debounce(fn, t);
  return async function(...args) {
    return await new Promise((resolve)=>{
      debounced.apply(this, args)
        .then((result)=>{resolve(result)})
        .catch(()=>{resolve(null)});
    });
  }
}

class Output extends Component {
  constructor(props) {
    super(props);
    const fontSize = 16;
    const [w, h] = this.props.readMaskShape();
    const idealHeight = MAGIC_HEIGHT;
    const {innerWidth, innerHeight} = window;
    const idealWidth = Math.floor(idealHeight * w / h);
    const initialHeight = minFloor(idealHeight, innerHeight); 
    const lines = makeNewLines(Math.floor(initialHeight / fontSize));
    this.state = {
      lines,
      fontSize,
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
    const {fontSize} = this.state;
    const {height} = this.getShape();
    return Math.floor(height / fontSize);
  }

  newLine(line=[]) {
    return makeNewLine(line);
  }

  newChar({offset=-1, char='?'}) {
    // Offset of -1 means hidden
    return {
      offset: offset,
      char: char
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
    const label = this.getLabel();
    const {alignment, space} = this.props;
    const offset = (()=>{
      if (alignment === 'column' && increment > 0) {
        const {char} = readLastChar(lineState) || {};
        if (char === space) {
          return this.getNextOffsetByColumn(lineState, increment);
        }
      }
      return this.getNextOffset(lineState, increment);
    })();
    const char = indexLabel(label, offset);
    return this.newChar({offset, char});
  }

  getLastLine(lines) {
    return lines.slice(-1)[0] || this.newLine();
  }

  getRatios(elWidth, lineIdx) {
    const maxLines = this.getMaxLines();
    const {width} = this.getShape();
    return {
      widthRatio: elWidth / width,
      heightRatio: (lineIdx + 0.5) / maxLines
    };
  }

  checkRatios(elWidth, lineIdx) {
    const {widthRatio, heightRatio} = this.getRatios(elWidth, lineIdx);
    if (widthRatio > 1 || heightRatio > 1) {
      return false;
    }
    return true;
  }

  readMask(input) {
    const {readMaskPixel, readMaskShape} = this.props;
    const {lineState, lineIdx} = input;
    const {elWidth} = lineState;
    if (!this.checkRatios(elWidth, lineIdx)) {
      return null;
    }
    const ratios = this.getRatios(elWidth, lineIdx);
    const [maskWidth, maskHeight] = readMaskShape();
    const {widthRatio, heightRatio} = ratios;

    // Convert element coords to mask coords
    const x = Math.floor(widthRatio * maskWidth);
    const y = Math.floor(heightRatio * maskHeight);

    // Return correct character
    if (readMaskPixel(x,y)) {
      const {space} = this.props;
      return this.newChar({
        offset: this.getNextOffset(lineState, 0),
        char: space
      });
    }
    return this.getNextChar(lineState, 1);
  }

  addCharToLine(input, i) {
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

    const nextChar = this.readMask(input);
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

  addCharsToLine(input, lineState, lineIdx) {
    const {num, lines, hiddenChars} = input;
    // Line is ready to go
    if (!this.canLineRender(lineState)) {
      return input;
    }

    const numRange = [...Array(num).keys()];
    const output = numRange.reduce(this.addCharToLine, {
      iMax: num - 1, done: false, lineState, lineIdx,
      hiddenChars: hiddenChars
    });

    return {
      ...input,
      allReady: false,
      hiddenChars: output.hiddenChars,
      lines: constListReplace(lines, lineIdx, output.lineState),
    };
  }

  listHiddenChars() {
    const {space} = this.props;
    const label = this.getLabel();
    const {widthMap} = this.state;
    const neededChars = label.split('').concat([space]);
    return neededChars.reduce((hiddenLine, char) => {
      if (widthMap.has(char)) {
        return hiddenLine;
      }
      return [
        this.newChar({
          char: char,
          offset: -1
        }),
        ...hiddenLine
      ];
    }, []);
  }

  onColumnUpdate() {
    return new Promise((resolve) => {
      const {lines} = this.state;
      const output = lines.reduce(this.addCharsToLine, {
        hiddenChars: this.listHiddenChars(),
        num: this.props.stepSize,
        allReady: true,
        lines
      });

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
    const {maxWidth, maxHeight, fontSize} = this.state;
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
      const numLines = Math.floor(height / fontSize);
      this.setState({
        canRender: true,
        lines: makeNewLines(numLines)
      });
    });
  }

  // debounced
  async resetLines() {
    const {readMaskShape} = this.props;
    const {lines, idealHeight} = this.state;
    const [w, h] = readMaskShape();
    await this.lineQueue;
    this.setState({
      canRender: true,
      lines: makeNewLines(lines.length),
      idealWidth: Math.floor(idealHeight * w / h)
    });
  }

  async componentDidMount() {
    window.addEventListener('resize', async() => {
      await this.updateShape();
    });
    await this.onColumnUpdate();
  }

  async componentDidUpdate() {
    //await sleep(1); //sleep helps debug in dev mode
    await this.lineQueue;
    await this.onColumnUpdate();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const propsList = [
      'alignment', 'label', 'space', 'stepSize'
    ]
    // Redraw completely if props change
    const mustReset = propsList.map((p)=> {
      return this.props[p] !== nextProps[p];
    }).some(x => !!x);
    if (mustReset) {
      this.resetLines();
      return false;
    }
    const {canRender} = nextState;
    return canRender;
  }

  render() {
    const {fontSize} = this.state;
    const {lines} = this.state;
    const {width, height} = this.getShape();

    const outlineStyle = {
      fontSize: `${fontSize}px`,
    };
    const centerStyle = {
      'width': `${width}px`,
      'height': `${height}px`
    };

    const outline = (
      <div style={outlineStyle} className={styles.outline}>
        {lines.map((lineState, i) => {
          const lineStyle ={
            top: i * fontSize
          };
          return (
            <OutputLine enqueueLineUpdate={this.enqueueLineUpdate}
              canRender={this.canLineRender(lineState)}
              stl={lineStyle} cls={styles.line} key={i} id={i}
            >
              {lineState.line.map(({char}, ii) => {
                return (
                  <OutputChar key={ii}>
                    {char}
                  </OutputChar>
                );
              })}
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
