import { ClassTransformOptions, Expose, plainToInstance, Transform, TransformationType, TransformFnParams, TransformOptions } from "class-transformer";
import { IsInt, IsMimeType, IsNotEmpty, IsNumber, IsObject, IsPositive, IsRFC3339, IsString, IsUrl, Min } from "class-validator";
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
import { ASRoot } from "./interfaces/as-root.interface";

/**
 * Base collection of ActivityStreams objects.
 */
export namespace ActivityStreams {
  /**
   * Interface for any class that can be transformed into an ActivityStreams object.
   * Currently there are no requirements, but they may be added in the future.
   */
  export interface ASTransformable { };

  export interface ASConstructor<T> extends Constructor<T> {
    type: string | string[];
  };

  export interface ASResolvable {
    resolve(_resolver?: ActivityStreams.ResolveHandler): Promise<ASObjectOrLink>;
  }

  /**
   * Interface for the resolver.  This is a chain of responsibility pattern.
   */
  export interface ResolveHandler {
    setNext(handler: ResolveHandler): ResolveHandler;
    handle(request: string): Promise<ASObject | ASLink | string>;
  }

  /**
   * Base resolver class, which implementations can extend to create their own resolvers.
   */
  export abstract class Resolver implements ResolveHandler {
    private next: ResolveHandler;

    setNext(handler: ResolveHandler): ResolveHandler {
      this.next = handler;
      return handler;
    }

    async handle(request: string): Promise<ASObject | ASLink | string> {
      if (this.next) {
        return this.next.handle(request);
      }

      return request;
    }
  }

  /**
   * A simple HTTP fetch resolver that uses fetch to resolve URLs.
   */
  export class HttpFetchResolver extends Resolver {
    async handle(href: string) {
      try {
        const response = await fetch(href, {headers: {'Accept': 'application/json'}});

        if (response.status !== 200) {
          throw new Error(`Failed to resolve ${href}`);
        }

        return transform(await response.json());
      }
      catch (e) {
        return super.handle(href);
      }
    }
  }

  class DefaultResolver extends Resolver { }

  /**
   * An array of Resolvers that are used to resolve URLs.
   */
  export const resolver: Resolver = new DefaultResolver();

  /**
   * Default registered types.  When new types are added via the ActivityStreams.object() or ActivityStreams.link() methods, they are
   * added to this list of types which are used by ActivityStreams.transformer
   */
  export const transformerTypes: {[k: string]: Constructor<ASTransformable>} = {};

  export interface TransformerOptions {
    /**
     * Convert text links to Link objects when transforming.
     */
    convertTextToLinks?: boolean;
    composeWithMissingConstructors?: boolean;
    enableCompositeTypes?: boolean,
    alwaysReturnValueOnTransform?: boolean;
  }

  export class Transformer {
    protected composites: {[k: symbol]: Constructor<ASTransformable>} = {};
    protected options: TransformerOptions = {
      convertTextToLinks: true,
      composeWithMissingConstructors: true,
      enableCompositeTypes: true,
      alwaysReturnValueOnTransform: false
    };

    /**
     * @param types A list of types to use for transforming objects.  If not provided, the default transformerTypes are used.
     * @param options Options for the transformer.
     */
    constructor(protected types?: {[k: string]: Constructor<ASTransformable>}, options?: TransformerOptions) {
      if (types === undefined) {
        this.types = Object.assign({}, transformerTypes);
      }
      Object.assign(this.options, options);
    }

    add(...constructors: ASConstructor<{type: string | string[]}>[]) {
      constructors.forEach(ctor => (this.types as any)[ctor.type as string] = ctor);
    }

    transform(
      {value, options}: {value: {type: string | string[], [k: string]: any}, options?: ClassTransformOptions}
    ): any {
      options = Object.assign({excludeExtraneousValues: true, exposeUnsetFields: false}, options);

      if (Array.isArray(value)) {
        const a: ASRoot[] = [];
        value.forEach(v => a.push(this.transform({value: v, options})));
        return a;
      }

      if (typeof value === 'string' && this.options.convertTextToLinks && this.types && this.types['Link']) {
        const link = new this.types['Link'](value);
        return link;
      }

      if (typeof value !== 'object') {
        return  this.options.alwaysReturnValueOnTransform ? value : undefined;
      }

      if (typeof value.type === 'string') {
        if (this.types && this.types[value.type]) {
          return plainToInstance(this.types[value.type], value, options);
        }

        if (this.options.alwaysReturnValueOnTransform) {
          return value;
        }

        return undefined;
      }
      else if (Array.isArray(value.type) && this.options.enableCompositeTypes) {
        const types = value.type.filter(t => (this.types || {})[t]);
        const symbol = Symbol.for(types.join('-'));

        if (!types.length) {
          return this.options.alwaysReturnValueOnTransform ? value : undefined;
        }

        let ctor = this.composites[symbol];

        if (ctor) {
          return plainToInstance(ctor, value, options);
        }
        else {
          const ctors = types.map((t) => {return (this.types || {})[t]});
          const cls = this.composeClass(...ctors);

          this.composites[symbol] = cls;

          if (!this.options.composeWithMissingConstructors && ctors.length !== types.length) {
            return this.options.alwaysReturnValueOnTransform ? value : undefined;
          }

          return plainToInstance(cls, value, options);
        }
      }
      else {
        return this.options.alwaysReturnValueOnTransform ? value : undefined;
      }
    }

    // this is broken
    // see https://stackoverflow.com/questions/61779822/class-validator-decorators-on-typescript-mixin-classes for possible solution
    protected composeClass(...constructors: Constructor<any>[]): Constructor<any> {
      return constructors.reduce((prev: Constructor<any>, curr: Constructor<any>) => {
        const combined = class extends prev { };
        const instance = new curr;

        Reflect.ownKeys(instance).forEach(name => {
          Reflect.defineProperty(
            combined.prototype,
            name,
            Reflect.getOwnPropertyDescriptor(instance, name) || Object.create(null)
          );
        });

        return combined;
      }, class {});
    }

    protected mixinClass(target: Constructor<any>, source: Constructor<any>): Constructor<any> {
      const cls = class extends target { };

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

  /**
   * The built in ActivityStreams transformer.  This is used by the ActivityStreams.transform() method, and can be used to transform a plain object to any of the built-in ActivityStreams classes for validation.
   */
  export const transformer = new Transformer(transformerTypes);

  /**
   * A built-in function that uses the {@link ActivityStreams.transformer} to transform a plain object to an ActivityStreams object.
   * @param value Object
   * @returns ASContructor<ASLink | ASObject>
   */
  export function transform(value: {type: string | string[], [k: string]: any}): any {
    return transformer.transform({value, options: {exposeUnsetFields: false}});
  }

  function root<TBase extends Constructor<ASTransformable>>(baseType: string, Base?: TBase | undefined): Constructor<any> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsRoot extends Base {
      _asmeta: {
        baseType: string
      }

      constructor(...args: any[]) {
        super(...args);

        Object.defineProperties(this, {
          _asmeta: {
            value: {
              baseType: baseType
            },
            enumerable: false,
            writable: false
          }
        });
      }
    }

    return ActivityStreamsRoot;
  }

  /**
   * Create a new class based on the ActivityStreams Link type.
   *
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASLink>
   */
  export function link<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASLink & ASResolvable> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsLink extends root('link', Base) implements ASLink {
      static readonly type = namedType;

      /**
       * The resolved object, if the link has been resolved.
       */
      constructor(...args: any[]) {
        super(...args);

        const [initValues] = args;

        if (typeof initValues === 'string') {
          this.href = initValues;
          this._asmeta._href_only = true;
        }
        else {
          Object.assign(this, initValues);
          this._asmeta._href_only = false;
        }
      }

      /**
       * Resolves the link and returns the resolved object.
       * @param customResolver A custom resolver to use for this link.  Runs even if the Link had been previously resolved.
       */
      async resolve(customResolver?: ResolveHandler) {
        if (this.href === undefined) {
          throw new Error('Link href is not set');
        }

        this._asmeta._resolved = await (customResolver || resolver).handle(this.href);

        return this._asmeta._resolved;
      }

      toJSON() {
        const {_resolved, _href_only} = this._asmeta;

        if (_resolved && typeof _resolved !== 'string') {
          return transform(_resolved);
        }

        if (_href_only) {
          return this.href;
        }

        return _resolved || this;
      }

      toString() {
        if (this._asmeta._href_only) {
          return this.href;
        }

        return super.toString();
      }

      @IsString({each: true})
      @IsOptional()
      @Expose()
      '@context'?: string | string[] = 'https://www.w3.org/ns/activitystreams';

      @IsString()
      @IsNotEmpty()
      @Expose()
      type: string = namedType;

      @IsString()
      @IsUrl()
      @Expose()
      href: string;

      @IsString()
      @IsOptional()
      @Expose()
      id?: string;

      @IsString()
      @IsOptional()
      @Expose()
      name?: string | string[];

      @IsString()
      @IsOptional()
      @Expose()
      hreflang?: string;

      @IsString()
      @IsOptional()
      @IsMimeType()
      @Expose()
      mediaType?: string;

      @IsString()
      @IsOptional()
      @Expose()
      rel?: string|string[];

      @IsOptional()
      @IsNumber()
      @IsInt()
      @IsPositive()
      @Expose()
      height?: number;

      @IsOptional()
      @IsNumber()
      @IsInt()
      @IsPositive()
      @Expose()
      width?: number;
    }

    return ActivityStreamsLink;
  }

  export class PublicLink extends link('Link') { };

  export const linkTransformOptions = {
    transformLinks: true,
    type: 'Link'
  };

  function linkTransformFn(params: TransformFnParams): any {
    const {type, value} = params;

    if (Array.isArray(value)) {
      return value.map(v => linkTransformFn({...params, value: v}));
    }

    /**
     * If the value is an object and has a _asmeta.baseType of 'link', return the value as a JSON object.  This will return the resolved value if the link has been resolved.
     */
    if (type === TransformationType.CLASS_TO_PLAIN && typeof value === 'object') {
      if (value._asmeta?.baseType === 'link') {
        return params.value.toJSON();
      }
      if (value._asmeta?.baseType === 'object') {
        return value;
      }
    }

    return transformer.transform(params);
  };

  /**
   * A built-in decorator that uses the {@link ActivityStreams.transformer} to transform a plain object to an ActivityStreams object, and also transforms any links to the {@link ActivityStreamsLink} class.
   */
  export function LinkTransform(opts: TransformOptions = {}): PropertyDecorator {
    return Transform(linkTransformFn, opts);
  }

  /**
   * Create a new class based on the ActivityStreams Object type.
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASObject>
   */
  export function object<TBase extends Constructor<ASTransformable> = Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASObject & ASResolvable> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsObject extends root('object', Base) implements ASObject {
      static readonly type: string | string[] = namedType;

      async resolve(_resolver?: ResolveHandler): Promise<any> {
        return this;
      }

      @IsString()
      @IsOptional()
      '@context'?: string | string[] = 'https://www.w3.org/ns/activitystreams';

      @IsString({each: true})
      @IsNotEmpty()
      @IsNotEmptyArray()
      @Expose()
      type: string | string[] = namedType;

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
      @LinkTransform()
      public attachment?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * Identifies one or more entities to which this object is attributed. The attributed entities might not be Actors. For instance, an object might be attributed to the completion of another activity.
       * https://www.w3.org/ns/activitystreams#attributedTo
       */
      @IsOptional()
      @Expose()
      @LinkTransform()
      public attributedTo?: ASObjectOrLink | ASObjectOrLink[];

      /**
       * Identifies one or more entities that represent the total population of entities for which the object can considered to be relevant.
       *
       * https://www.w3.org/ns/activitystreams#audience
       */
      @IsOptional()
      @Expose()
      @LinkTransform()
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
      @LinkTransform()
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
      @LinkTransform()
      generator?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      icon?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      image?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      inReplyTo?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      location?: ASObjectOrLink | ASObjectOrLink[];;

      @IsOptional()
      @Expose()
      @LinkTransform()
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
      @LinkTransform()
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
      @LinkTransform()
      tag?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @IsString()
      @IsRFC3339()
      @Expose()
      updated?: string;

      @IsOptional()
      @Expose()
      @LinkTransform()
      url?: ASLink | string | (ASLink | string)[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      to?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      bto?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
      cc?: ASObjectOrLink | ASObjectOrLink[];

      @IsOptional()
      @Expose()
      @LinkTransform()
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

  /**
   * Create a new class based on the ActivityStreams Document type.
   *
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASDocument>
   */
  export function document<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASDocument> {
    return class ActivityStreamsDocument extends object(namedType, Base) implements ASDocument { };
  }

  /**
   * Create a new class based on the ActivityStreams Activity type.
   *
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASActivity>
   */
  export function activity<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASActivity> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsActivity extends object(namedType, Base) implements ASActivity {
      @IsOptional()
      @Expose()
      @LinkTransform()
      actor?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      @LinkTransform()
      object?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      @LinkTransform()
      target?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      @LinkTransform()
      result?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      @LinkTransform()
      origin?: ASObjectOrLink;

      @IsOptional()
      @Expose()
      @LinkTransform()
      instrument?: ASObjectOrLink;
    }

    return ActivityStreamsActivity;
  }

  /**
   * Create a new class based on the ActivityStreams IntransitiveActivity type.
   *
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASIntransitiveActivity>
   */
  export function intransitiveActivity<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASIntransitiveActivity> {
    if (Base === undefined) {
      Base = class {} as TBase;
    }

    class ActivityStreamsIntransitiveActivity extends activity(namedType, Base) implements ASIntransitiveActivity {
    }

    return ActivityStreamsIntransitiveActivity;
  }

  /**
   * Create a new class based on the ActivityStreams Collection type.
   *
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASCollection>
   */
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
      @LinkTransform()
      current?: ASCollectionPage | ASLink | string

      @Expose()
      @IsOptional()
      @LinkTransform()
      first?: ASCollectionPage | ASLink | string

      @Expose()
      @IsOptional()
      @LinkTransform()
      last?:  ASCollectionPage | ASLink | string

      @Expose()
      @IsOptional()
      items: ASObjectOrLink[];
    }

    return ActivityStreamsCollection;
  }

  /**
   * Create a new class based on the ActivityStreams CollectionPage type.
   *
   * @param namedType The name of the type to create, which will equal to the value of the type property.
   * @param Base Base class to derive from.  Defaults to ASTransformable.
   * @returns ASConstructor<ASCollectionPage>
   */
  export function collectionPage<TBase extends Constructor<ASTransformable>>(namedType: string, Base?: TBase | undefined): ASConstructor<ASCollectionPage> {
    class ActivityStreamsCollectionPage extends collection(namedType, Base) {
      @Expose()
      @IsOptional()
      @LinkTransform()
      partOf?: ASCollection | ASLink;

      @Expose()
      @IsOptional()
      @LinkTransform()
      next?: ASCollectionPage | ASLink;

      @Expose()
      @IsOptional()
      @LinkTransform()
      prev?: ASCollectionPage | ASLink;
    }

    return ActivityStreamsCollectionPage;
  }
}
