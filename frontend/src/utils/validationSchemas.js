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
    .transform((val) => (val ? val.trim() : ''))
    .required('Phone number is required')
    .test('is-valid-phone', 'Please enter a valid 10-digit mobile number', (val) => {
      if (!val || !val.trim()) return false;
      const clean = val.replace(/[\s\-()]/g, '');
      return /^(\+91|91|0)?[6-9]\d{9}$/.test(clean);
    }),
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
