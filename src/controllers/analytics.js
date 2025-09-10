import { google } from "googleapis";
import { GA4_PROPERTYID } from "../../app.js";
import { parseRow } from "../utils/features.js";

// Set up Google Auth
const auth = new google.auth.GoogleAuth({
    keyFile: "service-account.json", // path to your downloaded JSON key
    scopes: "https://www.googleapis.com/auth/analytics.readonly",
});

const analyticsData = google.analyticsdata("v1beta");

export const GetAnalyticsData = async (req, res) => {
    try {
        const authClient = await auth.getClient();
        const response = await analyticsData.properties.runReport({
            auth: authClient,
            property: `properties/${GA4_PROPERTYID}`,
            requestBody: {
                dimensions: [{ name: "date" }],
                metrics: [
                    { name: "activeUsers" },
                    { name: "newUsers" },
                    { name: "sessions" },
                    { name: "screenPageViews" },
                    { name: "bounceRate" },
                    { name: "averageSessionDuration" },
                ],
                dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            },
        });

        const rows = response?.data?.rows;
        // Defensive: handle missing, empty, or malformed rows
        if (Array.isArray(rows) && rows.length > 0) {
            const transformedRows = rows.map(parseRow);
            res.json(transformedRows);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};
