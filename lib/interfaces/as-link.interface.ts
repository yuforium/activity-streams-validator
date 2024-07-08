import { ActivityStreams } from "../activity-streams";
import { ASObjectOrLink } from "./as-object.interface";
import { ASRoot } from "./as-root.interface";

export interface ASLink extends ASRoot {
  href: string;
  name?: string | string[];
  hreflang?: string;
  mediaType?: string;
  rel?: string | string[];
  height?: number;
  width?: number;
}
