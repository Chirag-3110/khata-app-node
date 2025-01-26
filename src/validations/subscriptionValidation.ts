import * as yup from 'yup';

export const subscriptionValidationSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    name: yup.string().required('Name is required'),
    validTill: yup.string().required('Valid Till date is required'),
    description: yup.string().required('Description is required'),
    price: yup.string().required('Price is required'),
});

export const subscriptionUpdateValidationSchema = yup.object({
  purchaseDate: yup.date().required('Purchase date is required').typeError('Invalid date format'),
  endDate: yup.date().required('End date is required').typeError('Invalid date format'),
  type: yup.string().required('Type is required'),
  subscriptionId: yup.string().required('Subscription Id is required'),
});