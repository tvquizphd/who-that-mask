import React, { Component } from 'react';
import styles from './Output.module.css';
import OutputLine from './OutputLine';
import OutputChar from './OutputChar';

 /*
const sleep = async (ms) => {
  await ((ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  })();
}
 */

const makeNewLine = (line=[]) => {
  return {
    clientWidth: 0,
    line: line,
    copies: 0
  }
}

const makeNewLines = (num) => {
  const numRange = [...Array(num).keys()];
  return numRange.map(()=>{
    return makeNewLine([]);
  })
} 

const immutableInsert = (a, v, i) => {
  return a.map((_v, _i) => {
    return (_i === i) ? v : _v;
  })
}

const isSameOffset = (v0, v1, label) => {
  if ('offset' in v0 && 'offset' in v1) {
    return v0.offset % label.length === v1.offset % label.length;
  }
  return false;
}

const minFloor = (v0, v1) => {
  return Math.floor(Math.min(v0, v1));
}

const sameFloor = (v0, v1) => {
  return Math.floor(v0) === Math.floor(v1);
}

class Output extends Component {
  constructor(props) {
    super(props);
    const fontSize = 12;
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
      label: 'missingno',
      canRender: true,
      labelWidth: 0
    };
    this.enqueueLineUpdate = this.enqueueLineUpdate.bind(this);
    this.addCharsToLine = this.addCharsToLine.bind(this);
    this.addCharToLine = this.addCharToLine.bind(this);
    this.updateShape = this.updateShape.bind(this);
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

  isWholeLabel(line) {
    const {label} = this.state;
    const lastChar = line[line.length - 1];
    return line.length > 1 && isSameOffset(line[0], lastChar, label);
  }

  newLine(line=[]) {
    return makeNewLine(line);
  }

  newChar(offset, char=null) {
    const {label} = this.state;
    return {
      char: char === null ? (label[offset % label.length]) : char,
      offset: offset
    }
  }

  getNextOffset(line, char=null) {
    const lastIndex = line.length - 1;
    const lastChar = line[lastIndex] || this.newChar(-1, null);
    const offset = lastChar.offset + (char === null ? 1: 0);
    return offset;
  }

  getLastLine(lines) {
    const lastIndex = lines.length - 1;
    return lines[lastIndex] || this.newLine();
  }

  guessMask(i, j) {
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

    const {width} = this.getShape();
    const maxLines = this.getMaxLines();
    const {lines, label, labelWidth} = this.state;
    const {clientWidth} = lines[j];

    // Convert client coords to mask coords
    const guessCharWidth = labelWidth / label.length;
    const guessWidth = clientWidth + i * guessCharWidth;
    const x = Math.floor((guessWidth / width) * missing[0].length);
    const y = Math.floor((j / maxLines) * missing.length);
    return missing[y][x];
  }

  addCharToLineCore(lineState, char=null) {
    const {line, copies} = lineState;

    const offset = this.getNextOffset(line, char);
    const newChar = this.newChar(offset, char);
    const newLine = line.concat([newChar]);

    const finishedCopy = this.isWholeLabel(newLine);
    const newCopies = copies + (finishedCopy? 1 : 0);

    return {
      ...lineState,
      line: newLine,
      copies: newCopies
    };
  }

  addCharToLine(input, i) {
    const {lines, lineIdx, labelWidth} = input;
    const oldLineState = lines[lineIdx];
    const output = {};
    if (oldLineState && this.canLineRender(lineIdx)) {
      const space = this.guessMask(i, lineIdx) === 1 ? ' ' : null;
      const newLineState = this.addCharToLineCore(oldLineState, space);
      const {copies, clientWidth} = newLineState;
      // Track the width of a single word
      if (!labelWidth && copies === 1) {
        output.labelWidth = clientWidth;
      }
      output.lines = immutableInsert(lines, newLineState, lineIdx);
      output.allReady = false;
    }
    return { 
      ...input,
      ...output
    };
  }

  addCharsToLine(input, lineIdx) {
    const {num, lines} = input;
    const {labelWidth, allReady} = input;
    const numRange = [...Array(num).keys()];
    const output = numRange.reduce(this.addCharToLine, {
      lines,
      lineIdx,
      labelWidth,
      allReady
    });
    return {
      ...input,
      ...output
    };
  }

  onColumnUpdate() {
    return new Promise((resolve) => {
      const {lines, labelWidth} = this.state;
      const lineRange = [...lines.keys()];
      const output = lineRange.reduce(this.addCharsToLine, {
        labelWidth, lines, allReady: true, num: 1 
      });

      if (output.allReady) {
        return resolve();
      }
      this.setState({
        canRender: true,
        lines: output.lines,
        labelWidth: output.labelWidth
      }, resolve);
    });
  }

  onLineUpdate(id, clientWidth) {
    return new Promise((resolve) => {
      const {lines} = this.state;
      if (id < lines.length) {
        const newLines = lines.map((lineState, i) => {
          if (id === i) {
            return {
              ...lineState,
              clientWidth: clientWidth
            };
          }
          return lineState;
        });
        this.setState({
          canRender: false,
          lines: newLines
        }, resolve);
      }
    });
  }

  enqueueLineUpdate(id, clientWidth) {
    this.lineQueue.then(async () => {
      return await this.onLineUpdate(id, clientWidth);
    })
  }

  canLineRender(id) {
    const {lines} = this.state;
    const {width} = this.getShape();
    const lineState = lines[id];
    if (!lineState) {
      return false;
    }
    const {clientWidth} = lineState;
    const remaining = width - clientWidth;
    return remaining > 0;
  }

  updateShape() {
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

  async componentDidMount() {
    window.addEventListener('resize', this.updateShape);
    await this.onColumnUpdate();
  }

  async componentDidUpdate() {
    //await sleep(10); //sleep is easier on the eyes in dev mode
    await this.lineQueue;
    await this.onColumnUpdate();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {canRender} = nextState;
    return canRender;
  }

  render() {
    const {fontSize} = this.state;
    const {lines, labelWidth} = this.state;
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
        {lines.map(({line, copies}, i) => {
          const lineStyle ={
            top: i * fontSize
          };
          return (
            <OutputLine enqueueLineUpdate={this.enqueueLineUpdate}
              labelWidth={labelWidth} copies={copies}
              canRender={this.canLineRender(i)}
              stl={lineStyle} cls={styles.line} key={i} id={i}
            >
              {line.map(({char}, j) => {
                return (
                  <OutputChar key={j}>
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
