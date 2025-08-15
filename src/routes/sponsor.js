import express from "express";
import {
    createSponsor,
    deleteSponsor,
    getAllSponsors,
    getLimitedSponsors,
} from "../controllers/sponsor.js";
import { multiUpload } from "../middleware/multer.js";
import { adminOnly } from "../middleware/auth.js";

const app = express();

app.get("/getSponsors", getAllSponsors);
app.post("/getLimitedSponsors", getLimitedSponsors)
app.post("/createSponsors", adminOnly, multiUpload, createSponsor);
app.delete("/:sponsorId", deleteSponsor);

export default app;
