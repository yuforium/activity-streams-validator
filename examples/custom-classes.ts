import { Expose } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { ActivityStreams } from '../lib';
import 'reflect-metadata';


// Creates CustomNote class as an Activity Streams Object
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