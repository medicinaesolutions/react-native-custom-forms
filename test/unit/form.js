import React, {
  Component
} from 'react';
import {
  View
} from 'react-native';
import {
  assert
} from 'chai';
import * as sinon from 'sinon';
import Form from '../../src/form';
import TestRenderer from 'react-test-renderer';

class InputMock extends Component {
  state = {
    errors: this.props.errors || []
  }
  render() {
    return null;
  }
  validate() {
    return {
      errors: []
    }
  }
}

describe('Form', function() {
  describe("#constructor", function() {
    it("should initialize with default parameters", function() {
      const form = TestRenderer.create(<Form />).root.instance;
      assert.deepEqual({
        data: {},
        dirty: false,
        errors: []
      }, form.state);
      assert.equal(form.childCounter, 0);
      assert.isTrue(form.injectedChildren instanceof Map);
    });
    it("should initialize with data from props", function() {
      const form = TestRenderer.create(<Form data={{a: 1}} />).root.instance;
      assert.deepEqual({
        data: {
          "a": 1
        },
        dirty: false,
        errors: []
      }, form.state);
      assert.equal(form.childCounter, 0);
      assert.isTrue(form.injectedChildren instanceof Map);
    });
  });

  describe("#updateValue", function() {
    it("should add new value", function() {
      const form = TestRenderer.create(<Form />).root.instance;
      const mock = sinon.mock(form);
      mock.expects("setState").once().withExactArgs(sinon.match({
        data: {
          foo: "bar"
        },
        dirty: true,
        errors: []
      }));
      form.updateValue("foo", "bar");
      mock.verify();
    });
    it("should update value", function() {
      const form = TestRenderer.create(<Form data={{"foo": "boo"}} />).root.instance;
      const mock = sinon.mock(form);
      mock.expects("setState").once().withExactArgs(sinon.match({
        data: {
          foo: "bar"
        },
        dirty: true,
        errors: []
      }));
      form.updateValue("foo", "bar");
      mock.verify();
    });
  });

  describe("#injectPropInChildren", function() {
    it("should ignore children without injectForm prop", function() {
      const testRenderer = TestRenderer.create(
        <Form>
          {null}
          <InputMock />
        </Form>
      );
      const form = testRenderer.root.instance;
      const child = testRenderer.root.findByType(InputMock);
      assert.isUndefined(child.props.form);
    });
    it("should add prop to children with injectForm prop", function() {
      const testRenderer = TestRenderer.create(
        <Form>
          <InputMock injectForm />
        </Form>
      );
      const form = testRenderer.root.instance;
      const child = testRenderer.root.findByType(InputMock);
      assert.equal(child.props.form, form);
    });
    it("should add prop with recursion and fill values", function() {
      const testRenderer = TestRenderer.create(
        <Form data={{"foo":"bar"}}>
          <View>
            <InputMock name="foo" injectForm />
          </View>
        </Form>
      );
      const form = testRenderer.root.instance;
      const child = testRenderer.root.findByType(InputMock);
      assert.equal(child.props.form, form);
    });
  });
  describe('#runAllValidations()', function() {
    it('should run all validators and return true if no validator fails', async function() {
      const testRenderer = TestRenderer.create(
        <Form>
          <View>
            <InputMock injectForm />
          </View>
        </Form>
      );
      const form = testRenderer.root.instance;
      const child = testRenderer.root.findByType(InputMock).instance;
      const childMock = sinon.mock(child);
      childMock.expects("validate").once().resolves({
        errors: []
      });
      assert.isTrue(await form.runAllValidations());
      childMock.verify();
    });
    it('should run all validators and return false if a validator fails', async function() {
      const testRenderer = TestRenderer.create(
        <Form>
          <View>
            <InputMock injectForm />
          </View>
        </Form>
      );
      const form = testRenderer.root.instance;
      const child = testRenderer.root.findByType(InputMock).instance;
      const childMock = sinon.mock(child);
      childMock.expects("validate").once().resolves({
        errors: ["mock"]
      });
      assert.isFalse(await form.runAllValidations());
      childMock.verify();
    });
    it('should run all validators and return false if an input already has errors', async function() {
      const testRenderer = TestRenderer.create(
        <Form>
          <View>
            <View injectForm />
            <InputMock injectForm errors={["mock"]} />
          </View>
        </Form>
      );
      const form = testRenderer.root.instance;
      const child = testRenderer.root.findByType(InputMock).instance;
      const childMock = sinon.mock(child);
      childMock.expects("validate").never();
      assert.isFalse(await form.runAllValidations());
      childMock.verify();
    });
  });
  describe('#submit()', function() {
    it('should stop on any validation error', async function() {
      const testRenderer = TestRenderer.create(<Form />);
      const form = testRenderer.root.instance;
      const formMock = sinon.mock(form);
      formMock.expects("runAllValidations")
        .once()
        .resolves(false);
      formMock.expects("setState").never();
      await form.submit();
      formMock.verify();
    });
    it('should work without onSubmit', async function() {
      const testRenderer = TestRenderer.create(<Form />);
      const form = testRenderer.root.instance;
      const formMock = sinon.mock(form);
      formMock.expects("runAllValidations")
        .once()
        .resolves(false);
      formMock.expects("setState").never();
      await form.submit();
      formMock.verify();
    });
    it('should run onSubmit if exists without state updates if no error', async function() {
      const handler = sinon.stub();
      handler.returns({});
      const testRenderer = TestRenderer.create(<Form onSubmit={(state)=>handler(state)}></Form>);
      const form = testRenderer.root.instance;
      const formMock = sinon.mock(form);
      formMock.expects("runAllValidations")
        .once()
        .resolves(true);
      formMock.expects("setState").never();
      await form.submit();
      formMock.verify();
      assert.isTrue(handler.called);
    });
    it('should run onSubmit if exists with state updates on error', async function() {
      const handler = sinon.stub();
      handler.returns(Promise.resolve({
        errors: ["mock"]
      }));
      const testRenderer = TestRenderer.create(<Form onSubmit={(state)=>handler(state)} />);
      const form = testRenderer.root.instance;
      const formMock = sinon.mock(form);
      formMock.expects("runAllValidations")
        .once()
        .resolves(true);
      formMock.expects("setState")
        .once()
        .withArgs(sinon.match({
          errors: ["mock"]
        }));
      await form.submit();
      formMock.verify();
      assert.isTrue(handler.called);
    });
  });
});
