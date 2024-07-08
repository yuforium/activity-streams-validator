import { ActivityStreams } from '../lib';
import 'reflect-metadata';

class Duck extends ActivityStreams.object('Duck') {
  public quack() {
    console.log('quack!');
  }
}

class Yeti extends ActivityStreams.object('Yeti') {
  public roar() {
    console.log('roar!');
  }
}

/**
 * Add the newly created classes to built-in ActivityStreams transformer.
 *
 * You can also create your own transformer and add the classes to it.
 */
ActivityStreams.transformer.add(Duck, Yeti);

const duckYeti = ActivityStreams.transform({
  type: ['Duck', 'Yeti'],
  id: 'https://yuforium.com/the-infamous-duck-yeti'
});

duckYeti.quack(); // quack!
duckYeti.roar(); // roar!