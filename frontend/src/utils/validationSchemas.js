import * as yup from 'yup';

const passwordRules = yup
  .string()
  .required('Password is required')
  .matches(
    /^[A-Za-z0-9]+$/,
    'Use letters and numbers to create your password.'
  );




export const registerSchema = yup.object({
  fullName: yup.string().required('Full name is required').min(2, 'Too short'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  phone: yup
    .string()
    .matches(/^$|^[0-9]{10}$/, 'Phone must be a 10 digit number')
    .notRequired(),
  password: passwordRules,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

export const loginSchema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email'),
  password: yup.string().required('Password is required'),
});

export const forgotPasswordSchema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email'),
});

export const resetPasswordSchema = yup.object({
  newPassword: passwordRules,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});
