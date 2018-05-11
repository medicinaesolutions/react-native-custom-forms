import React from 'react';
import ReactNative from 'react-native';
import {
  assert
} from 'chai';
import * as sinon from 'sinon';
import Input from '../../src/input';
import TestRenderer from 'react-test-renderer';

class TestInput extends Input {
  render() {
    return null;
  }
}

describe('Input', function() {
  describe('#constructor()', function() {
    it('should set default state values', function() {
      const input = TestRenderer.create(<TestInput />).root.instance;
      const state = input.state;

      assert.isUndefined(input.nextInput);
      assert.isObject(state);
      assert.isUndefined(state.value);
      assert.isFalse(state.dirty);
      assert.isFalse(state.runningValidators);
      assert.isArray(state.errors);
      assert.isEmpty(state.errors);
    });
    it('should set values from props', function() {
      const input = TestRenderer.create(<TestInput value="abc" nextInput="mock" />).root.instance;
      const state = input.state;

      assert.equal(input.nextInput, "mock");
      assert.isObject(state);
      assert.equal(state.value, "abc");
      assert.isFalse(state.dirty);
      assert.isFalse(state.runningValidators);
      assert.isArray(state.errors);
      assert.isEmpty(state.errors);
    });
  });

  describe('#validate()', function() {
    it('should work with no validators', async function() {
      const input = TestRenderer.create(<TestInput />).root.instance;
      const validation = await input.validate();
      assert.isObject(validation);
      assert.isArray(validation.errors);
      assert.isEmpty(validation.errors);
    });
    it('should work with synchronous validators returning errors', async function() {
      const validator = sinon.stub();
      validator.withArgs("abc").returns(["Error"]);
      validator.throws(new Error("Wrong value"));

      const input = TestRenderer.create(<TestInput value="abc" validators={[validator]}/>).root.instance;
      const validation = await input.validate();

      assert.isObject(validation);
      assert.isArray(validation.errors);
      assert.deepEqual(validation.errors, ["Error"]);
    });
    it('should work with synchronous validators returning no errors', async function() {
      const validator = sinon.stub();
      validator.withArgs("abc").returns([]);
      validator.throws(new Error("Wrong value"));

      const input = TestRenderer.create(<TestInput value="abc" validators={[validator]}/>).root.instance;
      const validation = await input.validate();

      assert.isObject(validation);
      assert.isArray(validation.errors);
      assert.isEmpty(validation.errors);
    });
    it('should work with asynchronous validators returning errors', async function() {
      const validator = sinon.stub();
      validator.withArgs("abc").resolves(["Error"]);
      validator.throws(new Error("Wrong value"));

      const input = TestRenderer.create(<TestInput value="abc" validators={[validator]}/>).root.instance;
      const validation = await input.validate();

      assert.isObject(validation);
      assert.isArray(validation.errors);
      assert.deepEqual(validation.errors, ["Error"]);
    });
    it('should work with asynchronous validators returning no errors', async function() {
      const validator = sinon.stub();
      validator.withArgs("abc").resolves([]);
      validator.throws(new Error("Wrong value"));

      const input = TestRenderer.create(<TestInput value="abc" validators={[validator]}/>).root.instance;
      const validation = await input.validate();

      assert.isObject(validation);
      assert.isArray(validation.errors);
      assert.isEmpty(validation.errors);
    });
    it('should update state when the validation starts and ends', async function() {
      const validator = sinon.stub();
      let resolveValidator = null;
      validator.withArgs("abc").returns(new Promise((resolve, reject) => resolveValidator = resolve));
      validator.throws(new Error("Wrong value"));

      const input = TestRenderer.create(<TestInput value="abc" validators={[validator]}/>).root.instance;
      const validation = input.validate();
      assert.isTrue(input.state.runningValidators);
      resolveValidator([]);
      await validation;
      assert.isFalse(input.state.runningValidators);
    });
  });

  describe('#handleReturnKey()', function() {
    it('should do nothing without next input or form', function() {
      const input = TestRenderer.create(<TestInput />).root.instance;
      const state = input.state;
      input.handleReturnKey();
    });
    it('should submit without next input', function() {
      const form = {
        submit: sinon.spy()
      };

      const input = TestRenderer.create(<TestInput form={form} />).root.instance;
      const state = input.state;
      input.handleReturnKey();
      assert.isTrue(form.submit.calledOnce);
    });
    it('should focus on next input', function() {
      const nextInput = {
        focus: sinon.spy()
      };

      const input = TestRenderer.create(<TestInput nextInput={nextInput} />).root.instance;
      const state = input.state;
      input.handleReturnKey();
      assert.isTrue(nextInput.focus.calledOnce);
    });
  });

  describe('#focus()', function() {
    let sandbox;

    beforeEach(function() {
      sandbox = sinon.createSandbox();
    });

    it('should scroll if has scrollView', function() {
      let form = {
        props: {
          scrollView: {
            ...<div />,
            scrollTo: () => null
          }
        }
      };

      const testRenderer = TestRenderer.create(
        <TestInput form={form} />
      );
      const input = testRenderer.root.instance;

      const stub = sandbox.stub(ReactNative, "findNodeHandle");
      stub.returns({
        measureLayout: (node, onSuccess) => onSuccess(0, 0, 0, 0)
      });

      const mock = sinon.mock(form.props.scrollView);
      mock.expects("scrollTo")
        .once();
      input.focus();
      mock.verify();
    });

    it('should do nothing if has no scrollView', function() {
      const testRenderer = TestRenderer.create(
        <TestInput />
      );
      const input = testRenderer.root.instance;

      const spy = sandbox.spy(ReactNative, "findNodeHandle");

      input.focus();
      assert.isTrue(spy.notCalled);
    });

    afterEach(function() {
      sandbox.restore();
    });
  });

  describe('#getTransformedValue()', function() {
    it('should return same value if no transformers', function() {
      const testRenderer = TestRenderer.create(
        <TestInput />
      );
      const input = testRenderer.root.instance;
      assert.equal("abc", input.getTransformedValue("abc"))
    });
    it('should run transformers in order', function() {
      const transformers = [
        (t) => t + "1",
        (t) => t + "2",
        (t) => t + "3"
      ];
      const testRenderer = TestRenderer.create(
        <TestInput transformers={transformers} />
      );
      const input = testRenderer.root.instance;
      assert.equal("abc123", input.getTransformedValue("abc"))
    });
  });

  describe('#updateValue()', function(){
    it('should update state, update form, run transformers and validate', async function(){
      const form = {
        updateValue: () => null
      };
      const testRenderer = TestRenderer.create(
        <TestInput form={form} name="mock" transformers={[(t) => "boo"]} />
      );
      const input = testRenderer.root.instance;
      const mock = sinon.mock(input);
      mock.expects("getTransformedValue").once().withExactArgs("value").returns("boo");
      mock.expects("setState").once().withExactArgs(sinon.match({
        dirty: true,
        value: "boo"
      }));
      const formMock = sinon.mock(form);
      formMock.expects("updateValue").once().withExactArgs("mock", "boo");
      mock.expects("validate").once().withExactArgs().resolves({
          errors: []
      });

      await input.updateValue("value");

      mock.verify();
      formMock.verify();
    });
    it('should update state, run transformers and validate', async function(){
      const testRenderer = TestRenderer.create(
        <TestInput name="mock" transformers={[(t) => "boo"]} />
      );
      const input = testRenderer.root.instance;
      const mock = sinon.mock(input);
      mock.expects("getTransformedValue").once().withExactArgs("value").returns("boo");
      mock.expects("setState").once().withExactArgs(sinon.match({
        dirty: true,
        value: "boo"
      }));
      mock.expects("validate").once().withExactArgs().resolves({
          errors: []
      });

      await input.updateValue("value");

      mock.verify();
    })
  });
});
