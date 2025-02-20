import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToMongoDB, hashPassword } from "./src/utils/features.js";
import userRoute from "./src/routes/admin.js";
import postsRoute from "./src/routes/post.js"
import sponsorsRoute from "./src/routes/sponsor.js"
import { v2 as cloudinary } from "cloudinary";
import morgan from "morgan";
import NodeCache from "node-cache";

dotenv.config({ path: "./.env" });

const app = express();


const PORT = process.env.PORT;
export let AdminPassKey;

export const jwtSecret = process.env.JWT_SECRET;
export const TTL = process.env.TIME_TO_LIVE;
export const envMode = process.env.NODE_ENV || "PRODUCTION";
const mongoUri = process.env.MONGO_URI;
export const myCache = new NodeCache();

console.log(process.env.CLIENT_URL)

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:4173",
        process.env.CLIENT_URL,
    ],
    credentials: true,
};



app.use(cors(corsOptions));
app.use(morgan("dev"))
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

const initializeServer = async () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUD_API_KEY,
            api_secret: process.env.CLOUD_API_SECRET,
        });
        AdminPassKey = await hashPassword(process.env.ADMIN_PASS_KEY);

        await connectToMongoDB(mongoUri);

        app.use("/api/v1/user", userRoute);
        app.use("/api/v1/posts", postsRoute)
        app.use("/api/v1/sponsors", sponsorsRoute)

        app.listen(PORT, () => {
            console.log(`App is listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error initializing server:", error);
    }
};

initializeServer();
