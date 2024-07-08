import { buildMessage, isURL, ValidateBy, ValidationOptions } from "class-validator";
import { Link } from "../links";
import { isOneOfInstance } from "./is-one-of-instance";

export const IS_LINK = 'isLink';

/**
 * Checks if the value is an instance of the specified object.
 */
export function IsLink(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_LINK,
      validator: {
        validate: (value, _args): boolean => {
          return isURL(value, {require_tld: false}) || (isOneOfInstance(value, [Link]) && isURL(value.href, {require_tld: false}));
        },
        defaultMessage: buildMessage((eachPrefix, _args) => {
          return eachPrefix + `$property must be an instance of Link or resolve to a valid URL.`;
        }, validationOptions),
      },
    },
    validationOptions
  );
}
