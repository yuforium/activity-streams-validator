import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsRFC3339, IsString, Max, Min } from 'class-validator';
import { ActivityStreams } from './activity-streams';
import { ASCollection } from './interfaces/as-collection.interface';
import { ASCollectionPage } from './interfaces/as-collection-page.interface';
import { ASObjectOrLink } from './interfaces/as-object.interface';

/**
 * @category Core
 */
class BaseObject extends ActivityStreams.object('Object') {}; // registers this as type "Object" (name can't be used as class name however)

export class Actor extends ActivityStreams.object('Actor') {};
export class Article extends ActivityStreams.object('Article') {};
export class Audio extends ActivityStreams.object('Audio') {};
export class Collection extends ActivityStreams.collection('Collection') implements ASCollection {};
export class OrderedCollection extends ActivityStreams.collection('OrderedCollection') implements ASCollection {};
export class CollectionPage extends ActivityStreams.collectionPage('CollectionPage') implements ASCollectionPage {};
export class OrderedCollectionPage extends ActivityStreams.collectionPage('OrderedCollectionPage') implements ASCollectionPage {};
export class Document extends ActivityStreams.document('Document') {};
export class Event extends ActivityStreams.object('Event') {};
export class Image extends ActivityStreams.document('Image') {};
export class Note extends ActivityStreams.object('Note') {};
export class Page extends ActivityStreams.document('Page') {};

ActivityStreams.transformer.add(Actor, Article, Audio, Collection, OrderedCollection, CollectionPage, OrderedCollectionPage, Document, Event, Image, Note, Page);

class PlaceDef {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number;
}
export class Place extends ActivityStreams.object('Place', PlaceDef) {};
ActivityStreams.transformer.add(Place);

class ProfileDef {
  @IsOptional()
  @IsString()
  @Expose({ name: 'describes' })
  describes?: ASObjectOrLink;
}
export class Profile extends ActivityStreams.object('Profile', ProfileDef) {};
ActivityStreams.transformer.add(Profile);

class RelationshipDef {
  @IsOptional()
  subject?: ASObjectOrLink;

  @IsOptional()
  object?: ASObjectOrLink;

  @IsOptional()
  relationship?: ASObjectOrLink;
}
export class Relationship extends ActivityStreams.object('Relationship', RelationshipDef) {};
ActivityStreams.transformer.add(Relationship);

class TombstoneDef {
  @IsOptional()
  @IsString()
  formerType?: string;

  @IsOptional()
  @IsRFC3339()
  deleted?: string;
}
export class Tombstone extends ActivityStreams.object('Tombstone', TombstoneDef) {};
ActivityStreams.transformer.add(Tombstone);

export class Video extends ActivityStreams.document('Video', class {}) {};
ActivityStreams.transformer.add(Video);

export { BaseObject as Object };