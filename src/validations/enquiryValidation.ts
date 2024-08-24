import * as yup from 'yup';

export const enquiryValidationSchema = yup.object().shape({
  category: yup.string().required('Category ID is required'),
  description: yup.string().required('Description is required'),
  venderId: yup.string().required('Vender ID is required')
});