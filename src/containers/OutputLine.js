import React, { Component } from 'react';

class OutputLine extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const {canRender} = nextProps;
    return canRender;
  }

  checkWidth(clientWidth) {
    const {id, enqueueLineUpdate} = this.props;
    enqueueLineUpdate(id, clientWidth);
  }

  render() {
    const {cls, stl} = this.props;
    const {line} = this.props;
    const text = line.map(({char}) => {
      if (char === ' ') {
        return ' ';
      }
      return char;
    }).join('') + '\n';

    return (
      <div style={stl} className={cls}
        ref={(el) => {
          if (el) {
            const {width} = el.getBoundingClientRect();
            this.checkWidth(width);
          }
        }}
      >
      {text}
      </div>
    );
  }
}
export default OutputLine;
