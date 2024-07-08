import { ASCollectionPage } from "./as-collection-page.interface";
import { ASLink } from "./as-link.interface";
import { ASObject } from "./as-object.interface";

export interface ASCollection extends ASObject {
  totalItems?: number;
  current?: ASCollectionPage | ASLink | string;
  first?: ASCollectionPage | ASLink | string;
  last?: ASCollectionPage | ASLink | string;
  items: (ASObject | ASLink | string)[];
}
