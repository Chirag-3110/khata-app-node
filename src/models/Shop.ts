import { Schema, model, Document } from 'mongoose';
import { string } from 'yup';

interface Coordinates {
    type: string; 
    coordinates: [number, number]; 
}

interface Shop extends Document {
    name: string;
    status: boolean;
    location: string;
    ownerName: string;
    pan: string;
    gstNum: string; 
    openTime: Date;
    closeDate: Date;
    localListing: boolean;
    canBeSearchable: boolean;
    user: Schema.Types.ObjectId;
    coordinates: Coordinates;
    createdAt: Date;
    updatedAt: Date;
    isSubscribed:boolean;
    subscriptionType:string;
    subPurchaseDate:Date,
    subExpireDate:Date,
    subscriptionId: Schema.Types.ObjectId
    category:string,
    businessCode:string,
    shopProfilePic:string,
    shopImages:string[],
    ratings:Number,
    customDueDate:string,
    city:string,
    zipCode:string
}

const shopSchema = new Schema<Shop>({
    name: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
    },
    location: {
        type: String,
    },
    ownerName: {
        type: String,
        required: true,
    },
    pan: {
        type: String,
    },
    gstNum: { 
        type: String,
    },
    openTime: {
        type: Date,
        required: true,
    },
    closeDate: {
        type: Date,
        required: true,
    },
    localListing: {
        type: Boolean,
        required: true,
    },
    canBeSearchable: {
        type: Boolean,
        default: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    },
    coordinates: {
        type: {
            type: String, 
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    isSubscribed:{
        type:Boolean,
        default:false
    },
    subscriptionType:{
        type:String
    },
    subPurchaseDate:{
        type:Date,
        default:Date.now()
    },
    subExpireDate:{
        type:Date,
        default:Date.now()
    },
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'subscription',
    },
    category:{
        type:String
    },
    businessCode: {
        type:String
    },
    shopProfilePic: {
        type:String
    },
    shopImages:[{
        type:String
    }],
    ratings:{
        type:Number,
        default:0
    },
    customDueDate:{
        type:String,
    },
    city:{
        type:String,
    },
    zipCode:{
        type:String,
    }
});

shopSchema.index({ coordinates: '2dsphere' });

const Shop = model<Shop>('shop', shopSchema);

export default Shop;
