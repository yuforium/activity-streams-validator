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
          console.log('testing value', value);
          const isLink = isURL(value, {require_tld: false}) || isOneOfInstance(value, [Link]);
          console.log(`test of ${value} results in ${isLink ? 'true':'false'}`);
          return isLink;
        },
        defaultMessage: buildMessage((eachPrefix, args) => {
          if (args?.constraints?.[0]) {
            return eachPrefix + `$property must be an instance of Link or resolve to a valid URL.`;
          } else {
            return eachPrefix + `${IS_LINK} decorator expects and object as value, but got falsy value.`;
          }
        }, validationOptions),
      },
    },
    validationOptions
  );
}
