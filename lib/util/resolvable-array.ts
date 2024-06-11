import { ActivityStreams } from '../activity-streams';

export class ResolvableArray<T extends ActivityStreams.ASResolvable> extends Array<T> {
  constructor(...args: T[]) {
    super(...args);
  }

  async resolve(customResolver?: ActivityStreams.ResolveHandler) {
    return Promise.all(
      this.map(async (item) => item.resolve(customResolver))
    );
  }
}
