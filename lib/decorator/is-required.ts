export const isRequiredMetadataKey = Symbol('activityStreamsIsRequired');

export function IsRequired() {
  return Reflect.metadata(isRequiredMetadataKey, true);
}
