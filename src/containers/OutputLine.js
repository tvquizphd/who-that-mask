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
    const {children} = this.props;
    return (
      <div style={stl} className={cls}
        ref={(el) => {
          if (el) {
          const {width} = el.getBoundingClientRect();
            this.checkWidth(width);
          }
        }}
      >
        {children}
        <br/>
      </div>
    );
  }
}
export default OutputLine;
