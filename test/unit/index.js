import {
  assert
} from 'chai';
import Input from '../../src/input';
import Form from '../../src/form';
import * as Index from '../../src/index';

describe("Index", function(){
  it("should export Input", function(){
    assert.equal(Input, Index.Input);
  });
  it("should export Form", function(){
    assert.equal(Form, Index.Form);
  });
});
