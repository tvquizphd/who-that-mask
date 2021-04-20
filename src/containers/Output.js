import React, { Component } from 'react';
import styles from './Output.module.css';
import OutputLine from './OutputLine';
import OutputChar from './OutputChar';

const makeNewLine = (line=[]) => {
  return {
    ready: false,
    line: line,
    copies: 0
  }
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
    const SHAPE = [450, 950];
    const {innerWidth, innerHeight} = window;
    this.state = {
      maxHeight: minFloor(SHAPE[1], innerHeight),
      maxWidth: minFloor(SHAPE[0], innerWidth),
      idealHeight: SHAPE[1],
      idealWidth: SHAPE[0],
      fontSize: 12,
      lines: [makeNewLine()],
      label: 'missingno',
      labelWidth: 0
    };
    this.onLineReady = this.onLineReady.bind(this);
    this.updateShape = this.updateShape.bind(this);
    this.addChars = this.addChars.bind(this);
  }

  updateShape() {
    const newState = {}
    const {maxWidth, maxHeight} = this.state;
    const {innerWidth, innerHeight} = window;

    if (!sameFloor(maxWidth, innerWidth)) {
      newState.maxWidth = Math.floor(innerWidth);
    }
    if (!sameFloor(maxHeight, innerHeight)) {
      newState.maxHeight = Math.floor(innerHeight);
    }
    this.setState(newState);
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

  addCharToLine(lineState, char=null) {
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

  addChars(num, clientWidth) {
    const {lines} = this.state;
    let missing = [
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

    const guessMask = (i) => {
      const {label, labelWidth} = this.state;
      const guessCharWidth = labelWidth / label.length;
      const guessWidth = clientWidth + i * guessCharWidth;
      const x = Math.floor((guessWidth / width) * missing[0].length);
      const y = Math.floor(((lines.length - 1) / maxLines) * missing.length);
      return missing[y][x];
    }

    const numRange = [...Array(num).keys()];
    const {lastLine, labelWidth} = numRange.reduce((output, i) => {
      const space = guessMask(i) === 1 ? ' ' : null;
      const lastLine = this.addCharToLine(output.lastLine, space);
      const labelWidth = output.labelWidth || (
        lastLine.copies === 1 ? clientWidth : null
      );
      return {
        labelWidth,
        lastLine
      };
    }, {
      labelWidth: this.state.labelWidth,
      lastLine: this.getLastLine(lines)
    });
    const newLines = lines.slice(0,-1).concat([lastLine]);
    this.setState({
      lines: newLines,
      labelWidth
    })
  }

  addLines(num=1) {
    if (num!==1) {
      console.error('Cannot add multiple lines yet');
      return;
    }
    const numRange = [...Array(num).keys()];
    const {lines} = numRange.reduce((output) => {
      // TODO... only works for num=1
      const lastLine = this.getLastLine(output.lines)
      const offset = this.getNextOffset(lastLine.line);

      const newLines = output.lines.concat([
        this.newLine([
          this.newChar(offset, null)
        ])
      ]);
      return {
        lines: newLines
      };
    }, {
      lines: this.state.lines
    });
    this.setState({
      lines: lines
    })
  }

  onLineReady(id) {
    const {lines} = this.state;
    if (id < lines.length) {
      const newLines = lines.map((line, i) => {
        if (id === i) {
          return {
            ...line,
            ready: true
          };
        }
        return line;
      });
      this.setState({
        lines: newLines
      });
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateShape);

    this.timer = setInterval(() => {
      const {lines} = this.state;
      const maxLines = this.getMaxLines();
      const {ready} = this.getLastLine(lines);
      if (ready && lines.length < maxLines) {
        this.addLines(1);
      }
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
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
        {lines.map(({line, copies, ready}, i) => {
          const lineStyle ={
            top: i * fontSize
          };
          return (
            <OutputLine addChars={this.addChars} onLineReady={this.onLineReady}
              labelWidth={labelWidth} fullWidth={width}
              copies={copies} ready={ready}
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
