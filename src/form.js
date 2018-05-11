import React, {
  Component
} from 'react';
import {
  Text,
  View
} from 'react-native';

export default class Form extends Component {
  injectedChildren = [];

  state = {
    data: this.props.data || {},
    dirty: false,
    errors: []
  };

  updateValue(key, value) {
    let newData = {
      ...this.state.data
    };
    newData[key] = value;
    this.setState({
      data: newData,
      dirty: true,
      errors: []
    });
  }

  injectPropInChildren(root) {
    let children = root.props && root.props.children;

    return React.Children.map(children, (child, i) => {
      if (child == null) return null;
      const childProps = child.props || {};

      if (!childProps.injectForm && !childProps.children) return child;

      const props = {
        children: this.injectPropInChildren(child)
      };

      if (childProps.injectForm) {
        props.form = this;
        props.ref = (ref) => {
          if (ref && ref.props && ref.props.injectForm && ref.focus){
            const lastFocusableChild = this.injectedChildren[this.injectedChildren.length - 1];
            if (lastFocusableChild && ref.focus) lastFocusableChild.nextInput = ref;
            this.injectedChildren.push(ref);
          }
        }
      }

      const name = childProps.name;

      if (this.props.data && name && !this.state.dirty && this.props.data[name]) {
        props.value = this.props.data[name];
      }

      const el = React.cloneElement(child, props);
      return el;
    });
  }

  async runAllValidations() {
    const children = Array.from(this.injectedChildren.values());
    const validity = await Promise.all(children.map(async (child) => {
      if (!child || !child.validate) return true;
      if(child.state.errors.length != 0) return false;
      const validation = await child.validate();
      return validation.errors.length == 0;
    }));
    return !validity.some((valid)=>!valid);
  }

  async submit() {
    if (!(await this.runAllValidations())) return;
    if (!this.props.onSubmit) return;

    let handlerResponse = this.props.onSubmit(this.state);
    if (handlerResponse.then) handlerResponse = await handlerResponse;
    if (handlerResponse && handlerResponse.errors) {
      this.setState({
        errors: handlerResponse.errors
      });
    }
  }

  render(){
    if(!this.props.children) return null;
    return this.injectPropInChildren(this);
  }
}
