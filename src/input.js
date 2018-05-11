import {
  Component
} from 'react';
import ReactNative from 'react-native';

export default class Input extends Component {
  state = {
    value: this.props.value,
    dirty: false,
    runningValidators: false,
    errors: []
  }
  nextInput = this.props.nextInput;

  async validate() {
    this.setState({
      runningValidators: true
    });
    const validators = this.props.validators || [];
    const value = this.state.value;
    let errors = [];
    for (let validator of validators) {
      let result = validator(value);
      if (typeof result.then === "function") result = await result;
      errors = errors.concat(result);
    }
    await new Promise((resolve, reject) => {
      this.setState({
        runningValidators: false,
        errors
      }, resolve);
    });
    return {
      errors: errors
    };
  }

  handleReturnKey() {
    if (this.nextInput) this.nextInput.focus();
    else if (this.props.form) this.props.form.submit();
  }

  focus() {
    const scrollView = this.props.scrollView || (this.props.form && this.props.form.props.scrollView);
    if (scrollView) {
      const nodeHandle = ReactNative.findNodeHandle(this);
      const scrollViewNodeHandle = ReactNative.findNodeHandle(scrollView);
      nodeHandle.measureLayout(
        scrollViewNodeHandle,
        (x, y, width, height) => scrollView.scrollTo({
          x,
          y
        })
      );
    }
  }

  getTransformedValue(value) {
    let newValue = value;
    const transformers = this.props.transformers || [];
    for (let transformer of transformers) {
      newValue = transformer(newValue);
    }
    return newValue;
  }

  updateValue(value) {
    const newValue = this.getTransformedValue(value);
    this.setState({
      dirty: true,
      value: newValue
    });

    if (this.props.form && this.props.form.updateValue && this.props.name) {
      this.props.form.updateValue(
        this.props.name,
        newValue
      );
    }

    return this.validate();
  }
};
