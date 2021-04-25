import React, { Component } from 'react';
import debounce from 'debounce-async';
import styles from './Output.module.css';
import OutputLine from './OutputLine';
import OutputChar from './OutputChar';

/*
const sleep = async (ms) => {
  return await ((ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  })();
}*/

const makeNewLine = (line=[]) => {
  return {
    elWidthDiff: 0,
    elWidth: 0,
    numRenders: 0,
    line: line
  }
}

const makeNewLines = (num) => {
  const numRange = [...Array(num).keys()];
  return numRange.map(()=>{
    return makeNewLine([]);
  })
} 

const copyWidthMap = (widthMap, lineState) => {
  const {line, elWidthDiff} = lineState;
  const charState = line[line.length - 1];
  const {char} = charState || {};
  if (charState && elWidthDiff > 0 && !widthMap.has(char)) {
    return constMapInsert(widthMap, char, elWidthDiff);
  }
  return widthMap;
}

const constMapInsert = (a, i, v) => {
  return new Map([ ...a, [i, v] ]);
}

const constListReplace = (a, i, v) => {
  return a.map((_v, _i) => {
    return (_i === i) ? v : _v;
  })
}

const minFloor = (v0, v1) => {
  return Math.floor(Math.min(v0, v1));
}

const sameFloor = (v0, v1) => {
  return Math.floor(v0) === Math.floor(v1);
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
    const label = 'missingno'
    const [idealWidth, idealHeight] = [450, 950];
    const {innerWidth, innerHeight} = window;
    const maxWidth = minFloor(idealWidth, innerWidth);
    const maxHeight = minFloor(idealHeight, innerHeight); 
    const lines = makeNewLines(Math.floor(maxHeight / fontSize));
    this.state = {
      lines,
      idealHeight,
      idealWidth,
      maxHeight,
      maxWidth,
      fontSize,
      widthMap: new Map(),
      label: label,
      canRender: true
    };
    this.updateShape = debounceAsync(this.updateShape, 333).bind(this);
    this.resetLines = debounceAsync(this.resetLines, 333).bind(this);
    this.enqueueLineUpdate = this.enqueueLineUpdate.bind(this);
    this.addCharsToLine = this.addCharsToLine.bind(this);
    this.addCharToLine = this.addCharToLine.bind(this);
    this.lineQueue = Promise.resolve(true);
  }

  getShape() {
    const {idealWidth, idealHeight} = this.state;
    const {maxWidth, maxHeight} = this.state;
    return {
      width: minFloor(idealWidth, maxWidth),
      height: minFloor(idealHeight, maxHeight)
    }
  }

  getMaxLines() {
    const {fontSize} = this.state;
    const {height} = this.getShape();
    return Math.floor(height / fontSize);
  }

  newLine(line=[]) {
    return makeNewLine(line);
  }

  newChar(offset, char) {
    return { offset, char };
  }

  getNextOffset(line, increment) {
    const lastIndex = line.length - 1;
    const {offset} = line[lastIndex] || {offset: -1};
    return offset + increment;
  }

  getNextChar(line, increment) {
    const {label} = this.state;
    const offset = this.getNextOffset(line, increment);
    const char = label[offset % label.length];
    return this.newChar(offset, char);
  }

  getLastLine(lines) {
    const lastIndex = lines.length - 1;
    return lines[lastIndex] || this.newLine();
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
    const {lineState, lineIdx} = input;
    const {line, elWidth} = lineState;
    if (!this.checkRatios(elWidth, lineIdx)) {
      return null;
    }
    const ratios = this.getRatios(elWidth, lineIdx);
    const {widthRatio, heightRatio} = ratios;

    const missing = [
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

    // Convert element coords to mask coords
    const x = Math.floor(widthRatio * missing[0].length);
    const y = Math.floor(heightRatio * missing.length);

    // Return correct character
    if (missing[y][x]) {
      return this.newChar(this.getNextOffset(line, 0), ' ');
    }
    return this.getNextChar(line, 1);
  }

  addCharToLine(input, i) {
    if (input.done) {
      return input;
    }
    const nextChar = this.readMask(input);
    if (nextChar === null) {
      return input;
    }
    const {char} = nextChar;
    const {lineIdx, iMax} = input;
    const {lineState, widthMap} = input;
    const {elWidth} = lineState;
    const charWidth = widthMap.get(char) || 0;
    const nextWidth = elWidth + charWidth;

    const done = [
      i === iMax, // final character estimate
      charWidth < 1, // no valid character estimate
      !this.checkRatios(nextWidth, lineIdx) // out of bounds
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
    const {num, lines, widthMap} = input;
    // Line is ready to go
    if (!this.canLineRender(lineIdx)) {
      return input;
    }
    // Line has just been backspaced 
    if (lineState.elWidthDiff < 0) {
      return {
        ...input,
        allReady: false
      };
    }

    const numRange = [...Array(num).keys()];
    const output = numRange.reduce(this.addCharToLine, {
      widthMap: copyWidthMap(widthMap, lineState),
      iMax: num - 1, done: false, lineState, lineIdx
    });

    return {
      ...input,
      allReady: false,
      widthMap: output.widthMap,
      lines: constListReplace(lines, lineIdx, output.lineState),
    };
  }

  onColumnUpdate() {
    return new Promise((resolve) => {
      const {lines, widthMap} = this.state;
      const output = lines.reduce(this.addCharsToLine, {
        widthMap: new Map([...widthMap]),
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
        widthMap: output.widthMap
      }, resolve);
    });
  }

  updateLine(lineState, elWidth) {
    const {width} = this.getShape();
    const {numRenders} = lineState;
    if (elWidth > width) {
      // We will measure a negative element width
      return {
        ...lineState,
        numRenders: numRenders + 1,
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
      const {lines} = this.state;
      if (id < lines.length) {
        const lineState = this.updateLine(lines[id], elWidth);
        this.setState({
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

  canLineRender(id) {
    const {lines} = this.state;
    const lineState = lines[id];
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
    const {lines} = this.state;
    await this.lineQueue;
    this.setState({
      canRender: true,
      lines: makeNewLines(lines.length)
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
    const {stepSize} = this.props;
    // Redraw completely if step size changes
    if (nextProps.stepSize !== stepSize) {
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
        {lines.map(({line}, i) => {
          const lineStyle ={
            top: i * fontSize
          };
          return (
            <OutputLine enqueueLineUpdate={this.enqueueLineUpdate}
              canRender={this.canLineRender(i)}
              stl={lineStyle} cls={styles.line} key={i} id={i}
            >
              {line.map(({char}, ii) => {
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
