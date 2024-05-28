# @yuforium/activity-streams
_Activity Streams Validator and Transformer_

## Getting Started
```sh
npm i --save \
  @yuforium/activity-streams \
  class-validator class-transformer \
  reflect-metadata
```

## Using Built-In Classes
Use built in classes to do validation using class-validator:

```typescript
import 'reflect-metadata';
import { Note } from '@yuforium/activity-streams';
import { validate } from 'class-validator';

const note = new Note();

async function validateNote() {
  let errors = await validate(note);

  if (errors.length > 0) {
    console.log('the note is invalid');
  }
  else {
    console.log('the note is valid');
  }
}

note.id = 'https://yuforium.com/users/chris/note-123';

validateNote(); // the note is valid

note.id = 'invalid, id must be a valid URL';

validateNote(); // the note is invalid
```

## Defining Custom Validation Rules
You can define your own validation rules by extending the built in classes or initializing your own using one of several methods using a base type (such as a link, object, activity, or collection):

```typescript
import { Expose } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { ActivityStreams } from '@yuforium/activity-streams';
import 'reflect-metadata';


// Creates a CustomNote type class as an Activity Streams Object
class CustomNote extends ActivityStreams.object('CustomNote') {
  @Expose()
  @IsString({each: true})
  public customField: string | string[];
};

// Add this to the built-in transformer
ActivityStreams.transformer.add(CustomNote);

// new instance of CustomNote
const custom: CustomNote = ActivityStreams.transform({
  type: 'CustomNote',
  customField: 5 // invalid, must be a string
});

// will get error "each value in customField must be a string"
validate(custom).then(errors => {
  errors.forEach(error => { console.log(error) });
});
```

## Composite Transformation
In addition to supporting custom classes, multiple types may be defined and interpolated from the `transform()` method.

```typescript
import { Expose } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { ActivityStreams } from '@yuforium/activity-streams';
import 'reflect-metadata';


// Creates CustomNote class as an Activity Streams Object
class CustomNote extends ActivityStreams.object('CustomNote') {
  @Expose()
  @IsString({each: true})
  public customField: string | string[];
};

// Add this to the built in transformer
ActivityStreams.transformer.add(CustomNote);

// new instance of CustomNote
const custom = ActivityStreams.transform({
  type: 'CustomNote',
  customField: 5 // invalid, must be a string
});

// will get error "each value in customField must be a string"
validate(custom).then(errors => {
  errors.forEach(error => { console.log(error) });
});
```

## Additional Validators
The `@IsRequired()`, `@IsOneOfInstance()`, and `@IsLink()` decorators are available for use in your custom classes.  These additional decorators are used to enforce additional validation rules on your custom classes.

### Requiring Optional Fields with `@IsRequired()`
Many fields in the Activity Streams specification are optional, but you may want to make them required your own validation purposes.

Extend the classes you need and then use the `@IsRequired()` decorator for these fields.

_my-note.ts_
```typescript
import { Note, IsRequired } from '@yuforium/activity-streams';

export class MyNote extends Note {
  // content field is now required
  @IsRequired()
  public content;
}
```
_validate.ts_
```typescript
import { MyNote } from './my-note';

const note = new MyNote();

validate(note); // fails

note.content = "If you can dodge a wrench, you can dodge a ball.";

validate(note); // works
```

### Additional Validation for Specific Types with `@IsOneOfInstance()` and `@IsLink()`
The `@IsOneOfInstance()` and `@IsLink()` decorators are used to enforce additional validation rules on your custom classes.  The `@IsOneOfInstance()` decorator is used to ensure that a field is an instance of one of the provided classes, while the `@IsLink()` decorator is used to ensure that a field is a valid link or URL.

For example, using the `@IsLink()` decorator can ensure that certain fields are only references to other Activity Streams objects (such as a user) and don't require creation of a new object:

```typescript
import { Note, IsLink } from '@yuforium/activity-streams';

export class CreateNoteDto extends Note {
  @IsLink()
  public attributedTo;
}
```

## Resolving Links
ActivityStreams frequently uses link references instead for properties instead of explicitly defined data structures.  For example, the following Object contains a link reference for its `attributedTo` field:

```json
{
  "type": "Note",
  "content": "Oh, I don't think I'm a lot dumber than you think that I thought that I thought I was once.",
  "attributedTo": "https://yuforium.com/users/white-goodman"
}
```

You can resolve Links to their respective classes using the `resolve()` method on the link.

```typescript
import 'reflect-metadata';
import { ActivityStreams, Link, Note } from '../lib';

// Use the built-in HTTP resolver.  You can also define your own resolver by extending the `ActivityStreams.Resolver` class.
ActivityStreams.resolver.setNext(new ActivityStreams.HttpFetchResolver());

const l = new Link('https://yuforium.dev/users/chris');

l.resolve().then(person => console.log(person));
// Person {
//  '@context': 'https://www.w3.org/ns/activitystreams',
//  type: 'Person',
//  id: 'https://yuforium.dev/users/chris'
//}
```

Note that the `resolve()` method returns a Promise, so you will need to use `await` or `.then()` to access the resolved object.  Additionally, `resolve()` works on all of this library's built-in classes, not just `Link`, so no type checking is required to use it.
