import 'reflect-metadata';
import { Note } from '../lib';
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
