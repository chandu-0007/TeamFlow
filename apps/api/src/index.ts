import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "../src/Routers/Auth/auth.js"

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.get("/health-check", (_req, res) => {
    return res.status(200).json({
        message: "Server is running successfully",
    });
});

app.use("/api/auth", router);

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
});