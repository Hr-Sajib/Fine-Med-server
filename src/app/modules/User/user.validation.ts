import { z } from 'zod';
import { UserModel } from './user.model';

const createUserValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        invalid_type_error: 'Email must be a string',
        required_error: 'Email is required',
      })
      .email({ message: 'Invalid email format' })
      .trim()
      .toLowerCase(),

    password: z
      .string({
        invalid_type_error: 'Password must be a string',
        required_error: 'Password is required',
      })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(20, { message: 'Password cannot be more than 20 characters' }),
   
    address: z
      .string({
        invalid_type_error: 'Address must be a string',
        required_error: 'Address is required',
      })
      .max(200, { message: 'Address cannot be more than 200 characters' })
      .default('Bangladesh'),

      phone: z
      .string({
        invalid_type_error: 'Phone must be a string',
        required_error: 'Phone number is required',
      })
      .min(10, { message: 'Phone number must be at least 10 digits long' })
      .regex(/^01\d{9}$/, { message: 'Phone number must start with "01.." and be 11 digits long' })
      .trim()
      .refine(
        async (phone) => {
          const user = await UserModel.isUserExistsByPhone(phone);
          return !user; // Return true if phone does not exist (valid)
        },
        {
          message: 'Phone number already exists',
        }
      ),

    name: z
      .string({
        invalid_type_error: 'Name must be a string',
        required_error: 'Name is required',
      })
      .min(1, { message: 'Name must be at least 1 character long' })
      .max(50, { message: 'Name cannot be more than 50 characters' })
      .trim(),

    passwordChangedAt: z
      .date({
        invalid_type_error: 'PasswordChangedAt must be a valid date',
      })
      .optional(),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        invalid_type_error: 'Email must be a string',
      })
      .email({ message: 'Invalid email format' })
      .trim()
      .toLowerCase()
      .optional(),

    phone: z
      .string({
        invalid_type_error: 'Phone must be a string',
      })
      .min(10, { message: 'Phone number must be at least 10 digits long' })
      .regex(/^01\d{9}$/, { message: 'Phone number must start with "01.." and be 11 digits long' })
      .trim()
      .optional(),

    name: z
      .string({
        invalid_type_error: 'Name must be a string',
      })
      .min(1, { message: 'Name must be at least 1 character long' })
      .max(50, { message: 'Name cannot be more than 50 characters' })
      .trim()
      .optional(),

    role: z
      .string({
        invalid_type_error: 'Role must be a string',
      })
      .refine((val) => ['admin', 'customer'].includes(val), {
        message: 'Role must be either "admin" or "customer"',
      })
      .optional(),

    isDeleted: z
      .boolean({
        invalid_type_error: 'isDeleted must be a boolean',
      })
      .optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
};