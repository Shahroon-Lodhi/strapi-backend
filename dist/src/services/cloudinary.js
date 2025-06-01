"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
    secure: true,
});
const uploadImageToCloudinary = async (localFilePath) => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(localFilePath, {
            folder: 'strapi_products',
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};
exports.uploadImageToCloudinary = uploadImageToCloudinary;
