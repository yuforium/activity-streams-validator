import { ActivityStreams } from "./activity-streams";

/**
 * A Link describes a qualified, indirect reference to another resource that is closely related to the conceptual model of Links as established in [RFC5988]. The properties of the Link object are not the properties of the referenced resource, but are provided as hints for rendering agents to understand how to make use of the resource. For example, height and width might represent the desired rendered size of a referenced image, rather than the actual pixel dimensions of the referenced image.
 *
 * The target URI of the Link is expressed using the required href property. In addition, all Link instances share the following common set of optional properties as normatively defined by the Activity Vocabulary: id | name | hreflang | mediaType | rel | height | width
 *
 * For example, all Objects can contain an image property whose value describes a graphical representation of the containing object. This property will typically be used to provide the URL to an image (e.g. JPEG, GIF or PNG) resource that can be displayed to the user. Any given object might have multiple such visual representations -- multiple screenshots, for instance, or the same image at different resolutions. In Activity Streams 2.0, there are essentially three ways of describing such references.
 *
 * https://www.w3.org/TR/activitystreams-core/#link
 */
export class Link extends ActivityStreams.link('Link') { };
ActivityStreams.transformer.add(Link);

/**
 * A specialized Link that represents an @mention.
 *
 * https://www.w3.org/ns/activitystreams#Mention
 */
export class Mention extends ActivityStreams.link('Mention') { };
ActivityStreams.transformer.add(Mention);
