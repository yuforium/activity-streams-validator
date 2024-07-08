import { buildMessage, isURL, ValidateBy, ValidationOptions } from "class-validator";
import { Constructor } from "../util/constructor";
import { isOneOfInstance } from "./is-one-of-instance";

export const IS_ONE_OF_INSTANCE_OR_URL = 'isOneOfInstanceOrUrl';

/**
 * Checks if the value is an instance of the specified object.
 */
export function IsOneOfInstanceOrUrl(
  targetType: Constructor<any>|Constructor<any>[],
  validationOptions?: ValidationOptions
): PropertyDecorator {
  const targetTypes = Array.isArray(targetType) ? targetType : [targetType];
  return ValidateBy(
    {
      name: IS_ONE_OF_INSTANCE_OR_URL,
      constraints: targetTypes,
      validator: {
        validate: (value, args): boolean => {
          return isURL(value) || isOneOfInstance(value, Array.isArray(args?.constraints[0]) ? args?.constraints[0] as Constructor<any>[]: [args?.constraints[0]]);
        },
        defaultMessage: buildMessage((eachPrefix, args) => {
          if (args?.constraints[0]) {
            return eachPrefix + `$property must be an instance of ${targetTypes.map(t => t.name).join('|')}`;
          } else {
            return eachPrefix + `${IS_ONE_OF_INSTANCE_OR_URL} decorator expects and object as value, but got falsy value.`;
          }
        }, validationOptions),
      },
    },
    validationOptions
  );
}
