import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";

const connectToMongoDB = (mongoUri) => {
    mongoose
        .connect(mongoUri, { dbName: "NewsDB" })
        .then((data) => {
            console.log(`Connected to db ${data.connection.host}`);
        })
        .catch((err) => {
            throw err;
        });
};

const hashPassword = async (adminKey) => {
    const saltRounds = 5;
    const hashedAdminKey = await bcrypt.hash(adminKey, saltRounds);

    return hashedAdminKey;
};
const getBase64 = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

const uploadToCloudinary = async (files) => {
    const promises = files.map(async (file) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(getBase64(file), (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
    });

    const result = await Promise.all(promises);

    return result.map((i) => ({
        public_id: i.public_id,
        url: i.secure_url
    }))

};

const deleteFromCloudinary = async (publicIds) => {

    const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
    const promises = ids.map((publicId) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error)
                resolve()
            })
        })
    })
    await Promise.all(promises)
}

export { connectToMongoDB, hashPassword, uploadToCloudinary, deleteFromCloudinary };
