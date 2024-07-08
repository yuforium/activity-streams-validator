import { validate, ValidationError } from 'class-validator';
import 'reflect-metadata';
import { ActivityStreams, Note } from "../lib";

describe('basic id validation', () => {
  class GenericObject extends ActivityStreams.object('Object') { };

  it('should pass basic validation', async () => {
    let obj;
    let err: ValidationError | undefined;
    let errors: ValidationError[];

    // test with a simple object
    obj = Object.assign(new GenericObject(),{id: 'https://yuforium.com/users/chris/note-123'});
    expect(await validate(obj)).toHaveLength(0);

    // a new note should have a valid id
    obj.id = 'this is an invalid id';
    errors = await validate(obj);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isUrl).toBe('id must be a URL address');

    // int should not be allowed for type
    Object.assign(obj, {id: 5});
    err = (await validate(obj)).find(e => e.property === 'id');
    expect(err?.constraints?.isUrl).toBe('id must be a URL address');
    expect(err?.constraints?.isString).toBe('id must be a string');

    // array should not be allowed for type
    Object.assign(obj, {id: ['https://yuforium.com/users/chris/note-123']});
    err = (await validate(obj)).find(e => e.property === 'id');
    expect(err?.constraints?.isUrl).toBe('id must be a URL address');
    expect(err?.constraints?.isString).toBe('id must be a string');
  });
});

describe('basic type validation', () => {
  class GenericObject extends ActivityStreams.object('GenericObject') { };

  it('should pass basic validation', async () => {
    let obj;
    let errors: ValidationError[];
    let err: ValidationError | undefined;

    obj = new GenericObject();
    errors = await validate(obj);
    expect(errors).toHaveLength(0);

    obj.type = "Object";
    errors = await validate(obj);
    expect(errors).toHaveLength(0);

    obj.type = ["Object", "test:Object"];
    errors = await validate(obj);
    expect(errors).toHaveLength(0);

    obj.type = [];
    err = (await validate(obj)).find(e => e.property === 'type');
    expect(err?.constraints?.isNotEmptyArray).toBe('type must have at least one element when specified as array');
  });
});
