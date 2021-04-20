import React, { Fragment, Component } from 'react';

class OutputChar extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const oldChar = this.props.children;
    const newChar = nextProps.children;
    return oldChar !== newChar;
  }

  render() {
    const {children} = this.props;
    if (children === ' ') {
      return (
        <Fragment>&nbsp;</Fragment>
      );
    }
    return children;
  }
}
export default OutputChar;
