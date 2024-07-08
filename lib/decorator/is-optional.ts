import { ValidateIf, ValidationOptions } from "class-validator";
import { isRequiredMetadataKey } from "./is-required";

export const IS_OPTIONAL = 'activityStreamsIsRequired';

export function IsOptional(validationOptions?: ValidationOptions) {
  return function IsOptionalDecorator(prototype: Object, propertyKey: string | symbol) {
    ValidateIf((obj) => {
      if (Reflect.getMetadata(isRequiredMetadataKey, obj, propertyKey)) {
        return true;
      }
      return obj[propertyKey] !== null && obj[propertyKey] !== undefined;
    }, validationOptions)(prototype, propertyKey);
  }
}