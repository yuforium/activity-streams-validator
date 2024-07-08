import { ActivityStreams } from './activity-streams';
import { Actor } from './objects';

export class Application extends Actor {
  static readonly type = "Application";
}

export class Group extends Actor {
  static readonly type = "Group";
}

export class Organization extends Actor {
  static readonly type = "Organization";
}

export class Person extends Actor {
  static readonly type = "Person";
}

export class Service extends Actor {
  static readonly type = "Service";
}

ActivityStreams.transformer.add(Application, Group, Organization, Person, Service);
