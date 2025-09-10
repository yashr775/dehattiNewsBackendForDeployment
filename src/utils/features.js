import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { imagekit } from "../../app.js";

dotenv.config({ path: "../../.env" });

// MongoDB Connection
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

// Hash Password
const hashPassword = async (adminKey) => {
    const saltRounds = 5;
    return await bcrypt.hash(adminKey, saltRounds);
};

// Initialize ImageKit


// Convert File to Base64
const getBase64 = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

// Upload to ImageKit
const uploadToImageKit = async (files) => {
    try {
        const uploadPromises = files.map(async (file) => {
            const result = await imagekit.upload({
                file: getBase64(file),
                fileName: file.originalname,
                folder: "/uploads",
            });

            return {
                public_id: result.fileId, // ✅ ImageKit uses fileId instead of public_id
                url: result.url,
            };
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

// Delete from ImageKit
const deleteFromImageKit = async (publicIds) => {
    try {
        const ids = Array.isArray(publicIds) ? publicIds : [publicIds];

        const deletePromises = ids.map(async (fileId) => {
            await imagekit.deleteFile(fileId);
        });

        await Promise.all(deletePromises);
    } catch (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
    }
};

// Util to convert YYYYMMDD to YYYY-MM-DD
const formatDate = (yyyymmdd) => {
    return (
        yyyymmdd.slice(0, 4) +
        "-" +
        yyyymmdd.slice(4, 6) +
        "-" +
        yyyymmdd.slice(6, 8)
    );
}

const parseRow = (row) => {
    const [
        { value: date },
    ] = row.dimensionValues;

    const [
        { value: activeUsers },
        { value: newUsers },
        { value: sessions },
        { value: screenPageViews },
        { value: bounceRate },
        { value: averageSessionDuration },
    ] = row.metricValues;

    return {
        date: formatDate(date),
        activeUsers: Number(activeUsers),
        newUsers: Number(newUsers),
        sessions: Number(sessions),
        screenPageViews: Number(screenPageViews),
        bounceRate: Number(parseFloat(bounceRate).toFixed(3)),
        averageSessionDuration: Number(parseFloat(averageSessionDuration).toFixed(1)),
    };
};


export {
    connectToMongoDB,
    hashPassword,
    uploadToImageKit,
    deleteFromImageKit,
    parseRow,
    formatDate
};
