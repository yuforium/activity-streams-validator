import 'reflect-metadata';
import { IsString, validate } from 'class-validator';
import { ActivityStreams, Note } from '../lib';

// const toASObject = ActivityStreams.transform("Object");

describe('default object transformations', () => {
  it('should transform a simple object', () => {
    const obj = ActivityStreams.transform({
      type: 'Note'
    });

    expect(obj).toBeInstanceOf(Note);
  });
});

describe('object transformation', () => {
  it('plain object transforms actor', () => {
    let value: any = {
      type: 'Note'
    };

    let obj = ActivityStreams.transform(value);

    expect(obj).toBeInstanceOf(Note);

    // json['attachment'] = [
    //   {
    //     type: 'Actor',
    //     name: 'Test Actor'
    //   },
    //   {
    //     type: 'Actor',
    //     name: 'Another Actor'
    //   }
    // ]

    // obj = ActivityStreams.transform(json);

    // console.log(obj);

    // expect(obj.attachment[0]).toBeInstanceOf(Actor);
    // expect(obj.attachment[1]).toBeInstanceOf(Actor);
  });
});

describe('dynamic composition', () => {
  const transform = ActivityStreams.transform;

  class TestClass extends ActivityStreams.object('TestClass') {
    @IsString()
    testName: string | string[];
  }
  ActivityStreams.transformer.add(TestClass);

  it('should transform a composite object', async () => {
    const obj = transform({
      type: ['Note', 'TestClass'],
      testName: 'some name'
    });

    let errs = await validate(obj);

    expect(errs).toHaveLength(0);

    Object.assign(obj, {id: 'an invalid id', testName: 31337});

    errs = await validate(obj);
    expect(errs).toHaveLength(2);
    expect(errs.find(e => e.property === 'id')).toHaveProperty('constraints.isUrl');
    expect(errs.find(e => e.property === 'testName')).toHaveProperty('constraints.isString');
  });
});
