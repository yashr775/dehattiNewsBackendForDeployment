import mongoose from "mongoose";
import { TryCatch } from "../middleware/error.js";
import { Posts } from "../models/posts.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/features.js";
import { myCache } from "../../app.js";
import { TTL } from "../../app.js";
import PDFDocument from "pdfkit";
import fetch from "node-fetch";
import path from "path";

const createPost = TryCatch(async (req, res) => {
    const { title, description, category } = req.body;

    const photos = req.files;

    if (!photos) return new Error("Please upload photos", 400);

    if (!title || !description || !category)
        return new Error("Please enter all fields");

    const photosUrl = await uploadToCloudinary(photos);

    const post = await Posts.create({
        title,
        description,
        category,
        photos: photosUrl,
    });
    myCache.del("allPosts");
    return res
        .status(201)
        .json({ success: true, message: "Post created successfully" });
});

const getAllPosts = TryCatch(async (req, res, next) => {
    const cachedPosts = myCache.get("allPosts");
    if (cachedPosts) {
        return res.status(200).json({ success: true, posts: cachedPosts });
    }
    const posts = await Posts.find({}).sort({ createdAt: -1 });
    myCache.set("allPosts", posts, TTL);
    return res.status(200).json({ success: true, posts });
});

const getSinglePost = TryCatch(async (req, res, next) => {
    const { postId } = req.params;

    const cachedPost = myCache.get(`post_${postId}`);

    if (cachedPost) {
        return res.status(200).json({ success: true, post: cachedPost });
    }

    const post = await Posts.findById(postId);

    if (!post) return next(new Error("Post dees not Exist", 400));

    myCache.set(`post_${postId}`, post, TTL);

    return res.status(200).json({ success: true, post });
});

const deleteImage = TryCatch(async (req, res, next) => {
    const { imageId, postId } = req.query;
    const objectId = new mongoose.Types.ObjectId(postId);

    const post = await Posts.findById(objectId);

    if (!post) return next(new Error("Post not found", 404));

    await deleteFromCloudinary(imageId);

    post.photos = post.photos.filter((i) => i.public_id !== imageId);

    await post.save();
    myCache.del("allPosts");
    myCache.del(`post_${postId}`);
    return res
        .status(200)
        .json({ success: true, message: "Image deleted successfully" });
});

const updatePost = TryCatch(async (req, res, next) => {
    const { postId } = req.params;

    const { title, description } = req.body;

    const photos = req.files;

    const post = await Posts.findById(postId);

    if (!post) return next(new Error("Post not found", 404));

    if (title) {
        post.title = title;
    }

    if (description) {
        post.description = description;
    }

    if (photos && photos.length > 0) {
        const ids = await uploadToCloudinary(photos);
        post.photos.push(...ids);
    }

    await post.save();
    myCache.del("allPosts");
    myCache.del(`post_${postId}`);
    return res
        .status(200)
        .json({ success: true, message: "Post updated successfully" });
});

const deletePost = TryCatch(async (req, res, next) => {
    const { postId } = req.params;
    myCache.del("allPosts");
    myCache.del(`post_${postId}`);
    const post = await Posts.findById(postId);

    if (!post) return next(new Error("Post does not exist", 400));
    const ids = post.photos.map((i) => i.public_id);
    await deleteFromCloudinary(ids);
    await Posts.deleteOne({ _id: postId });
    myCache.del("allPosts");
    myCache.del(`post_${postId}`);
    return res
        .status(200)
        .json({ success: true, message: "post deleted successfully" });
});

const downloadPost = TryCatch(async (req, res, next) => {
    const { date } = req.query;

    if (!date) {
        return next(new Error("Please provide a date", 400));
    }

    // Convert the date to a start and end range for the query
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0); // Start of the day

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999); // End of the day

    // Fetch posts from the database for the given date
    const posts = await Posts.find({
        createdAt: { $gte: startDate, $lte: endDate },
    });

    if (posts.length === 0) {
        return next(new Error("No posts found for the given date", 404));
    }

    // Create a PDF document
    const doc = new PDFDocument();
    const filename = `posts_${date}.pdf`;

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Load a Hindi-supported font
    const fontPath = path.resolve("fonts/NotoSansDevanagari.ttf"); // Update the path to your font file
    doc.registerFont("HindiFont", fontPath);

    // Use the Hindi font for the document
    doc.font("HindiFont");

    // Loop through each post and add it to the PDF
    for (const post of posts) {
        // Add the first image if available
        if (post.photos && post.photos.length > 0) {
            const imageUrl = post.photos[0].url; // Use the URL directly from the post

            try {
                // Fetch the image from the URL
                const imageResponse = await fetch(imageUrl);
                const imageBuffer = await imageResponse.buffer();

                // Add the image to the PDF
                doc.image(imageBuffer, {
                    fit: [250, 250], // Adjust image size
                    align: "center",
                    valign: "center",
                });

                // Manually move the cursor down after adding the image
                const imageHeight = 250; // Height of the image
                const padding = 20; // Additional padding
                doc.y += imageHeight + padding; // Move the cursor down
            } catch (error) {
                console.error("Error fetching image:", error);
                doc.text("Unable to load image", { align: "center" });
            }
        }

        // Add title and description
        doc.fontSize(18).text(` ${post.title}`, { underline: true });
        doc.moveDown(); // Add space after the title
        doc.fontSize(12).text(`${post.description}`);
        doc.moveDown(2); // Add 2 lines of space after the description

        // Add a separator between posts
        doc.addPage();
    }

    // Finalize the PDF and end the response
    doc.end();
});

export {
    createPost,
    getAllPosts,
    getSinglePost,
    deleteImage,
    deletePost,
    updatePost,
    downloadPost,
};
