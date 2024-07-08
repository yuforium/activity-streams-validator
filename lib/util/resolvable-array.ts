import { ActivityStreams } from '../activity-streams';

export class ResolvableArray<T extends ActivityStreams.ASResolvable> extends Array<T> {
  constructor(...args: T[]) {
    super(...args);
  }

  async resolve(customResolver?: ActivityStreams.ResolveHandler) {
    return await Promise.all(
      this.map(async (item) => {
        if (typeof item.resolve !== 'function') {
          return item;
        }
        return await item.resolve(customResolver);
      })
    );
  }
}
