import { Schema, model, Document } from 'mongoose';


interface CreateAds extends Document {
    ShopId: Schema.Types.ObjectId;
    image_link: string;
    add_text: string;
    url_link: string;
    created_Date: Date;
    status: string;
    ad_StartDate: Date;
    ad_EndDate: Date;
}

const createAdsSchema = new Schema<CreateAds>({
    ShopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',  
    },
    image_link: {
        type: String,
        required: true,
    },
    add_text: {
        type: String,
        required: true,
    },
    url_link: {
        type: String,
        required: true,
    },
    created_Date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
    },
    ad_StartDate: {
        type: Date,
        required: true,
    },
    ad_EndDate: {
        type: Date,
        required: true,
    },
});

const CreateAds = model<CreateAds>('CreateAds', createAdsSchema);

export default CreateAds;
