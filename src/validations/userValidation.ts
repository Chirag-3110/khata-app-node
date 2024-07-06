import * as yup from 'yup';

export const userValidationSchema = yup.object().shape({
    email: yup.string().email('Invalid email format').required('Email is required'),
    documentId: yup.string().required('Document ID is required'),
});
