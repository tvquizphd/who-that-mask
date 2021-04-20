import { Component } from 'react';

class OutputChar extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const oldChar = this.props.children;
    const newChar = nextProps.children;
    return oldChar !== newChar;
  }

  render() {
    const {children} = this.props;
    return children;
  }
}
export default OutputChar;
