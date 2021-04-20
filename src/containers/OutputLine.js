import React, { Component } from 'react';

class OutputLine extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const {ready} = this.props;
    const newReady = nextProps.ready;
    return !(ready && newReady);
  }

  checkWidth(clientWidth) {
    const {id, ready, fullWidth} = this.props;
    if (ready) {
      return;
    }
    const {onLineReady, addChars} = this.props;
    const remaining = fullWidth - clientWidth;
    if (remaining > 0) {
      const {labelWidth, copies} = this.props;
      const initial = copies < 1 || labelWidth < 1;
      const final = labelWidth > 1 && remaining < labelWidth;
      if (initial || final) {
        addChars(1, clientWidth);
      }
      else {
        addChars(Math.floor(remaining / labelWidth), clientWidth);
      }
    }
    else {
      onLineReady(id);
    }
  }

  render() {
    const {cls, stl} = this.props;
    const {children} = this.props;
    return (
      <div style={stl} className={cls}
        ref={(el) => {
          if (el) {
            this.checkWidth(el.clientWidth);
          }
        }}
      >
        {children}
      </div>
    );
  }
}
export default OutputLine;
