import { ASContext } from "../types/as-context.type";

export interface ASRoot {
  '@context'?: ASContext;
  id?: string;
  type: string | string[];

  // questionable if this should be part of the interface, using PickType on the DTOs will omit this
  // resolve(customResolver?: ActivityStreams.ResolveHandler): Promise<ASObjectOrLink>;
}
