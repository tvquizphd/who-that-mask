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
