import * as yup from 'yup';

export const userValidationSchema = yup.object().shape({
    email: yup.string().email('Invalid email format').required('Email is required'),

});

export const shopUpdateSchema = yup.object().shape({
    shopId: yup.string().required('Shop ID is required'),
    name: yup.string(),
    location: yup.string(),
    ownerName: yup.string(),
    pan: yup.string(),
    gstNum: yup.string(),
    localListing: yup.boolean(),
    canBeSearchable: yup.boolean(),
    category: yup.string(),
    businessCode: yup.string(),
    openTime: yup.date().nullable(),
    closeDate: yup.date().nullable(),
});