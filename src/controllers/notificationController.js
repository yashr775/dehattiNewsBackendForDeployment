import dotenv from "dotenv";
dotenv.config();

import webpush from "web-push";
import Subscription from "../models/subscription.js";

// ✅ Configure your VAPID keys here
webpush.setVapidDetails(
    "mailto:dehaatnews@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// --- Save subscription ---
export const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const exists = await Subscription.findOne({ endpoint: subscription.endpoint });

        if (!exists) await Subscription.create(subscription);

        res.status(201).json({ message: "Subscription saved successfully!" });
    } catch (err) {
        console.error("Error saving subscription:", err);
        res.status(500).json({ error: "Failed to save subscription" });
    }
};

// --- Send Notification to all subscribers ---
export const sendNotification = async (payload) => {
    try {
        const subscriptions = await Subscription.find();
        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: "Click to read full article",
            image: payload.image,
            url: payload.url,
            icon: `${process.env.CLIENT_URL}/dehaatnews.png`,
        });

        for (const sub of subscriptions) {
            console.log("📡 Sending to:", sub.endpoint);
            try {
                await webpush.sendNotification(sub, notificationPayload);
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log("🗑️ Removing expired subscription:", sub.endpoint);
                    await Subscription.deleteOne({ _id: sub._id });
                } else {
                    console.error("Error sending notification:", err);
                }
            }
        }

        console.log("✅ Notifications sent successfully");
    } catch (err) {
        console.error("❌ Error in sendNotification:", err);
    }
};