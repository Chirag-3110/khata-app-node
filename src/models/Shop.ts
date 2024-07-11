import { Schema, model, Document } from 'mongoose';

interface Coordinates {
    latitude: number;
    longitude: number;
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
    subExpireDate:Date
}

const coordinatesSchema = new Schema<Coordinates>({
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
});

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
        type: coordinatesSchema,
        required: true,
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
    }
});

const Shop = model<Shop>('shop', shopSchema);

export default Shop;
