import { buildMessage, ValidateBy, ValidationOptions } from "class-validator";
import { Constructor } from "../util/constructor";

export const IS_ONE_OF_INSTANCE = 'isOneOfInstance';

/**
 * Checks if the value is an instance of the specified object.
 */
export function isOneOfInstance(object: unknown, targetTypeConstructors: Constructor<any>[]): boolean {
	return targetTypeConstructors.some(targetTypeConstructor => {
		return targetTypeConstructor && typeof targetTypeConstructor === 'function' && object instanceof targetTypeConstructor;
	});
}

/**
 * Checks if the value is an instance of the specified object.
 */
export function IsOneOfInstance(
  targetType: Constructor<any>|Constructor<any>[],
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_ONE_OF_INSTANCE,
      constraints: [targetType],
      validator: {
        validate: (value, args): boolean => isOneOfInstance(value, Array.isArray(args?.constraints[0]) ? args?.constraints[0] as Constructor<any>[]: [args?.constraints[0]]),
        defaultMessage: buildMessage((eachPrefix, args) => {
          if (args?.constraints[0]) {
            return eachPrefix + `$property must be an instance of ${args?.constraints[0].name as string}`;
          } else {
            return eachPrefix + `${IS_ONE_OF_INSTANCE} decorator expects and object as value, but got falsy value.`;
          }
        }, validationOptions),
      },
    },
    validationOptions
  );
}
