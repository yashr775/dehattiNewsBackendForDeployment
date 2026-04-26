import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true },
    expirationTime: { type: Date, default: null },
    keys: {
        p256dh: String,
        auth: String,
    },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;