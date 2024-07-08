import { IsOptional } from "class-validator";
import { ActivityStreams } from "./activity-streams";
import { ASObjectOrLink } from "./interfaces";

/**
 * @category Core
 */
export class Activity extends ActivityStreams.activity('Activity') {};

/**
 * @category Core
 */
export class IntransitiveActivity extends ActivityStreams.intransitiveActivity('IntransitiveActivity') {};


/**
 * Indicates that the {@link ASActivity.actor | actor} accepts the object. The target property can be used in certain circumstances to indicate the context into which the object has been accepted.
 * @category Activities
 */
export class Accept extends ActivityStreams.activity('Accept') {};

/**
 * Indicates that the actor has added the object to the target. If the target property is not explicitly specified, the target would need to be determined implicitly by context. The origin can be used to identify the context from which the object originated.
 * @category Activities
 */
export class Add extends ActivityStreams.activity('Add') {};

/**
 * Indicates that the actor is calling the target's attention the object.
 * The origin typically has no defined meaning.
 * @category Activities
 */
export class Announce extends ActivityStreams.activity('Announce') {};

/**
 * An IntransitiveActivity that indicates that the actor has arrived at the location. The origin can be used to identify the context from which the actor originated. The target typically has no defined meaning.
 * @category Activities
 */
export class Arrive extends ActivityStreams.intransitiveActivity('Arrive') {};

/**
 * @category Activities
 */
export class Ignore extends ActivityStreams.activity('Ignore') {};

/**
 * @category Activities
 */
export class Block extends Ignore {};

/**
 * @category Activities
 */
export class Create extends ActivityStreams.activity('Create') {};

/**
 * @category Activities
 */
export class Delete extends ActivityStreams.activity('Delete') {};

/**
 * @category Activities
 */
export class Dislike extends ActivityStreams.activity('Dislike') {};

/**
 * @category Activities
 */
export class Follow extends ActivityStreams.activity('Follow') {};

/**
 * @category Activities
 */
export class Offer extends ActivityStreams.activity('Offer') {};

/**
 * @category Activities
 */
export class Invite extends Offer {};

/**
 * @category Activities
 */
export class Join extends ActivityStreams.activity('Join') {};

/**
 * @category Activities
 */
export class Leave extends ActivityStreams.activity('Leave') {};

/**
 * @category Activities
 */
export class Like extends ActivityStreams.activity('Like') {};

/**
 * @category Activities
 */
export class Listen extends ActivityStreams.activity('Listen') {};

/**
 * @category Activities
 */
export class Move extends ActivityStreams.activity('Move') {};


class QuestionDef {
  @IsOptional()
  oneOf?: ASObjectOrLink | ASObjectOrLink[];

  @IsOptional()
  anyOf?: ASObjectOrLink | ASObjectOrLink[];

  @IsOptional()
  closed?: boolean | string | ASObjectOrLink | ASObjectOrLink[];
}
/**
 * @category Activities
 */
export class Question extends ActivityStreams.intransitiveActivity('Question', QuestionDef) {};

/**
 * @category Activities
 */
export class Reject extends ActivityStreams.activity('Reject') {};

/**
 * Indicates that the actor has read the object.
 * @category Activities
 */
 export class Read extends ActivityStreams.activity('Read') {};

/**
 * Indicates that the actor is removing the object. If specified, the origin indicates the context from which the object is being removed.
 * @category Activities
 */
export class Remove extends ActivityStreams.activity('Remove') {};

/**
 * A specialization of Reject in which the rejection is considered tentative.
 * @category Activities
 */
export class TentativeReject extends ActivityStreams.activity('TentativeReject') {};

/**
 * A specialization of Accept indicating that the acceptance is tentative.
 * @category Activities
 */
export class TentativeAccept extends ActivityStreams.activity('TentativeAccept') {};

/**
 * Indicates that the actor is traveling to target from origin. Travel is an IntransitiveObject whose actor specifies the direct object. If the target or origin are not specified, either can be determined by context.
 * @category Activities
 */
export class Travel extends ActivityStreams.intransitiveActivity('Travel') {};

/**
 * Indicates that the actor is undoing the object. In most cases, the object will be an Activity describing some previously performed action (for instance, a person may have previously "liked" an article but, for whatever reason, might choose to undo that like at some later point in time).
 *
 * The target and origin typically have no defined meaning.
 * @category Activities
 */
export class Undo extends ActivityStreams.activity('Undo', class {}) {};

/**
 * Indicates that the actor has updated the object. Note, however, that this vocabulary does not define a mechanism for describing the actual set of modifications made to object.
 *
 * The target and origin typically have no defined meaning.
 * @category Activities
 */
export class Update extends ActivityStreams.activity('Update', class {}) {};

/**
 * Indicates that the actor has viewed the object.
 * @category Activities
 */
export class View extends ActivityStreams.activity('View', class {}) {};

// [Accept, Add, Announce, Arrive, Block, Create, Delete, Dislike, Follow, Ignore, Invite, Join, Leave, Like, Listen, Move, Offer, Question, Read, Reject, Remove, TentativeAccept, TentativeReject, Travel, Undo, Update, View]
// .forEach(constructor => ActivityStreams.register(constructor));