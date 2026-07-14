import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

/** Credit limit is managed outside the customer profile form. */
export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['initialCreditLimit'] as const),
) {}
