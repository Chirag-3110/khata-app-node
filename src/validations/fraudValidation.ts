import * as yup from 'yup';

export const fraudValidationSchema = yup.object().shape({
    // transaction: yup.string().required('Transaction ID is required'),
    fraudAddedByUserId: yup.string().required('Fraudst add user ID is required'),
    fraudsterId: yup.string().required('Fraudster ID is required')
});