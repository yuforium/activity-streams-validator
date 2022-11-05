import { ClassTransformOptions, Expose, plainToInstance, Transform } from "class-transformer";
import { registerDecorator, getMetadataStorage, IsInt, IsMimeType, IsNotEmpty, IsNumber, IsObject, IsPositive, IsRFC3339, IsString, IsUrl, Min, ValidateIf, ValidateNested } from "class-validator";
import { IsOptional } from "./decorator/is-optional";
import { ASLink } from "./interfaces/as-link.interface";
import { ASObject, ASObjectOrLink } from "./interfaces/as-object.interface";
import { ASCollection } from "./interfaces/as-collection.interface";
import { Constructor } from "./util/constructor";
import { ASActivity } from "./interfaces/as-activity.interface";
import { ASCollectionPage } from "./interfaces/as-collection-page.interface";
import { ASDocument } from "./interfaces/as-document.interface";
import { ASIntransitiveActivity } from "./interfaces/as-intransitive-activity.interface";
import { ContentMap } from "./util/content-map";
import { IsNotEmptyArray } from "./util/is-not-empty-array";

/**
 * Base collection of ActivityStreams objects.
 */
export namespace ActivityStreams {
  /**
   * Interface for any class that can be transformed into an ActivityStreams object.
   * At this time there are no requirements, but they may be added in the future.
   */
  export interface ASTransformable {
  };

  export interface ASConstructor<T> extends Constructor<T> {
    type: string;
  };

  /**
   * Default registered types.  When new types are added via the ActivityStreams.object() or ActivityStreams.link() methods, they are
   * added to this list of types which are used by ActivityStreams.transformer
   */
  export const transformerTypes: {[k: string]: Constructor<ASTransformable>} = {};

  export interface TransformerOptions {
    composeWithMissingConstructors?: boolean;
  }

  // This can live anywhere in your codebase:
  function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
            Object.create(null)
        );
      });
    });

    return derivedCtor;
  }

  export class Transformer {
    protected composites: {[k: symbol]: Constructor<ASTransformable>} = {};

    constructor(protected types: {[k: string]: Constructor<ASTransformable>} = {}, options?: TransformerOptions) { }

    add(...constructors: ASConstructor<{type: string | string[]}>[]) {
      constructors.forEach(ctor => this.types[ctor.type] = ctor);
    }

    transform({value, options}: {value: {type: string | string[], [k: string]: any}, options?: ClassTransformOptions}): any {
      if (Array.isArray(value)) {
        return value.map(v => this.transform({value: v, options}));
      }

      if (typeof value !== 'object') {
        return value;
      }

      if (typeof value.type === 'string') {
        const cls = this.types[value.type];

        if (this.types[value.type]) {
          return plainToInstance(this.types[value.type], value, options);
        }

        return value;
      }
      else if (Array.isArray(value.type)) {
        const types = value.type.filter(t => this.types[t]);
        const symbol = Symbol.for(types.join('-'));

        let ctor = this.composites[symbol];

        if (ctor) {
          return plainToInstance(ctor, value, options);
        }
        else {
          const copiedTypes = types.slice();
          const ctors = types.map((t) => {return this.types[t]});
          const cls = this.composeClass(...ctors);

          this.composites[symbol] = cls;

          return plainToInstance(cls, value, options);
        }
      }
      else {
        return value;
      }
    }

    protected getCompositeClass(...types: string[]) {
    }

    protected composeClass(...constructors: Constructor<any>[]) {
      return constructors.reduce((prev: Constructor<any>, curr: Constructor<any>) => {
        return this.mixinClass(prev, curr);
      }, class {});
    }

    protected mixinClass(target: Constructor<any>, source: Constructor<any>): Constructor<any> {
      const cls = class extends target {
      }

      Object.getOwnPropertyNames(source.prototype).forEach((name) => {
        Object.defineProperty(
          cls.prototype,
          name,
          Object.getOwnPropertyDescriptor(source.prototype, name) || Object.create(null)
        );
      });

      return cls;
    }
  }

  export const transformer = new Transformer(transformerTypes);

  export function transform(value: {type: string | string[], [k: string]: any}): any {
    return transformer.transform({value, options: {exposeUnsetFields: false}});
  }

  export function link<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASLink> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsLink extends Base implements ASLink {
      static readonly type = namedType;

      @IsString()
      @IsNotEmpty()
      @Expose()
      type: string = namedType;

      @IsString()
      @IsUrl()
      href: string;

      @IsString()
      @IsOptional()
      id?: string;

      @IsString()
      @IsOptional()
      name?: string|string[];

      @IsString()
      @IsOptional()
      hreflang?: string;

      @IsString()
      @IsOptional()
      @IsMimeType()
      mediaType?: string;

      @IsString()
      @IsOptional()
      rel?: string|string[];

      @IsOptional()
      @IsNumber()
      @IsInt()
      @IsPositive()
      height?: number;

      @IsOptional()
      @IsNumber()
      @IsInt()
      @IsPositive()
      width?: number;
    }

    return ActivityStreamsLink;
  }

  export function object<TBase extends Constructor<ASTransformable> = Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASObject> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsObject extends Base implements ASObject {
      static readonly type = namedType;

      @IsString({each: true})
      @IsNotEmpty()
      @IsNotEmptyArray()
      @Expose()
      type: string = namedType;

      @IsString()
      @IsUrl()
      @IsOptional()
      @IsNotEmpty()
      @Expose()
      id?: string;

      /**
       * Identifies a resource attached or related to an object that potentially requires special handling. The intent is to provide a model that is at least semantically similar to attachments in email.
       * https://www.w3.org/ns/activitystreams#attachment
       */
      @IsOptional()
      @Expose()
      @Transform(params => transformer.transform(params))
      public attachment?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * Identifies one or more entities to which this object is attributed. The attributed entities might not be Actors. For instance, an object might be attributed to the completion of another activity.
       * https://www.w3.org/ns/activitystreams#attributedTo
       */
      @IsOptional()
      @Expose()
      public attributedTo?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * Identifies one or more entities that represent the total population of entities for which the object can considered to be relevant.
       *
       * https://www.w3.org/ns/activitystreams#audience
       */
      @IsOptional()
      @Expose()
      audience?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * The content or textual representation of the Object encoded as a JSON string. By default, the value of content is HTML. The mediaType property can be used in the object to indicate a different content type.
       *
       * The content may be expressed using multiple language-tagged values.
       *
       * https://www.w3.org/ns/activitystreams#content
       */
      @IsString()
      @Expose()
      @IsOptional()
      content?: string | string[];

      /**
       * Identifies the context within which the object exists or an activity was performed.
       *
       * The notion of "context" used is intentionally vague. The intended function is to serve as a means of grouping objects and activities that share a common originating context or purpose. An example could be all activities relating to a common project or event.
       *
       * https://www.w3.org/ns/activitystreams#context
       */
      @IsOptional()
      @Expose()
      context?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * The content or textual representation of the Object encoded as a JSON string. By default, the value of content is HTML. The mediaType property can be used in the object to indicate a different content type.
       *
       * The content may be expressed using multiple language-tagged values.
       *
       * https://www.w3.org/ns/activitystreams#content
       */
      @IsObject()
      @IsOptional()
      @Expose()
      contentMap?: ContentMap;

      /**
       * A simple, human-readable, plain-text name for the object. HTML markup must not be included. The name may be expressed using multiple language-tagged values.
       *
       * https://www.w3.org/ns/activitystreams#name
       */
      @IsString()
      @IsOptional()
      @Expose()
      name?: string | string[];

      /**
       * A simple, human-readable, plain-text name for the object. HTML markup must not be included. The name may be expressed using multiple language-tagged values.
       *
       * https://www.w3.org/ns/activitystreams#name
       */
      @IsObject()
      @IsOptional()
      @Expose()
      nameMap?: ContentMap | ContentMap[];

      @IsOptional()
      @IsString()
      @IsRFC3339()
      @Expose()
      endTime?: string;

      @IsOptional()
      @Expose()
      generator?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      icon?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      image?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      inReplyTo?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      location?: ASObjectOrLink | ASObjectOrLink[];;

      @IsOptional()
      @Expose()
      preview?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * The date and time at which the object was published
       *
       * ```json
       * {
       *   "@context": "https://www.w3.org/ns/activitystreams",
       *   "summary": "A simple note",
       *   "type": "Note",
       *   "content": "Fish swim.",
       *   "published": "2014-12-12T12:12:12Z"
       * }
       * ```
       *
       * https://www.w3.org/ns/activitystreams#published
       */
      @IsOptional()
      @IsString()
      @IsRFC3339()
      @Expose()
      published?: string;

      @IsOptional()
      @Expose()
      replies?: ASCollection;

      @IsOptional()
      @IsString()
      @IsRFC3339()
      @Expose()
      startTime?: string;

      @IsOptional()
      @Expose()
      summary?: string|string[];

      @IsObject()
      @IsOptional()
      @Expose()
      summaryMap?: ContentMap|ContentMap[];

      /**
       * One or more "tags" that have been associated with an objects. A tag can be any kind of Object. The key difference between attachment and tag is that the former implies association by inclusion, while the latter implies associated by reference.
       *
       * https://www.w3.org/ns/activitystreams#tag
       */
      @IsOptional()
      @Expose()
      tag?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @IsString()
      @IsRFC3339()
      @Expose()
      updated?: string;

      @IsOptional()
      @Expose()
      url?: ASLink | string | (ASLink | string)[];

      @IsOptional()
      @Expose()
      to?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      bto?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      cc?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      bcc?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @IsString()
      @IsMimeType()
      @Expose()
      mediaType?: string;

      @IsOptional()
      @IsString()
      @Expose()
      duration?: string;
    };

    return ActivityStreamsObject;
  }

  export function document<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASDocument> {
    class ActivityStreamsDocument extends object(namedType, Base) implements ASDocument {
    }

    return ActivityStreamsDocument;
  }

  export function activity<TBase extends Constructor<ASTransformable>>(namedType: string, Base: TBase): ASConstructor<ASActivity> {
    class ActivityStreamsActivity extends object(namedType, Base) implements ASActivity {
      @IsOptional()
      @Expose()
      actor?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      object?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      target?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      result?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      origin?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      instrument?: ASObjectOrLink;
    }

    return ActivityStreamsActivity;
  }

  export function intransitiveActivity<TBase extends Constructor<ASTransformable>>(namedType: string, Base: TBase): ASConstructor<ASIntransitiveActivity> {
    class ActivityStreamsIntransitiveActivity extends activity(namedType, Base) implements ASIntransitiveActivity {
    }

    return ActivityStreamsIntransitiveActivity;
  }

  export function collection<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASCollection> {
    class ActivityStreamsCollection extends object(namedType, Base) implements ASCollection {
      @Expose()
      @IsOptional()
      @IsNumber()
      @IsInt()
      @Min(0)
      totalItems?: number;

      @Expose()
      @IsOptional()
      current?: ASCollectionPage | ASLink | string

      @Expose()
      @IsOptional()
      first?: ASCollectionPage | ASLink | string

      @Expose()
      @IsOptional()
      last?:  ASCollectionPage | ASLink | string

      @Expose()
      @IsOptional()
      items: ASObjectOrLink[];
    }

    return ActivityStreamsCollection;
  }

  export function collectionPage<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASCollectionPage> {
    class ActivityStreamsCollectionPage extends collection(namedType, Base) {
      @Expose()
      @IsOptional()
      partOf?: ASCollection | ASLink;

      @Expose()
      @IsOptional()
      next?: ASCollectionPage | ASLink;

      @Expose()
      @IsOptional()
      prev?: ASCollectionPage | ASLink;
    }

    return ActivityStreamsCollectionPage;
  }
}
