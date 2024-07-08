import 'reflect-metadata';
import { ActivityStreams, Link, Note } from '../lib';

ActivityStreams.resolver.setNext(new ActivityStreams.HttpFetchResolver());

const l = new Link('https://yuforium.dev/users/chris');

l.resolve().then((a) => {
  console.log(a);
});

// l.resolve().then(r => {
//   console.log('the resolved', r);
// });
