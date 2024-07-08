import { registerDecorator, ValidationOptions, ValidationDecoratorOptions } from "class-validator";

export function IsNotEmptyArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotEmptyArray',
      target: object.constructor,
      propertyName,
      options: Object.assign({
        message: `${propertyName} must have at least one element when specified as array`,
        validationOptions
      }),
      validator: {
        validate(value: any, args: any) {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return true;
        }
      }
    } as ValidationDecoratorOptions);
  }
}