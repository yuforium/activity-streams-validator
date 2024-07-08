import { ASCollection } from "./as-collection.interface";
import { ASLink } from "./as-link.interface";

export interface ASCollectionPage extends ASCollection {
  partOf?: ASLink | ASCollection | string;
  next?: ASLink | ASCollection | string;
  prev?: ASLink | ASCollection | string;
}
