import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";


const app = express();
const PORT = process.env.PORT || 4000;

//Connect to MongoDB
connectDB();

//Parse JSON
app.use(express.json());

//Parse cookies
app.use(cookieParser());

const allowedOrigins = ['https://completauth.vercel.app', 'http://localhost:5173']
//CORS
app.use(cors({
    origin: allowedOrigins, credentials: true,
}))

//Test api
app.get('/', (req, res) => {
    res.send('Hello World True');
})

//Auth routes
app.use('/api/auth', authRouter);

//User routes
app.use('/api/user', userRouter);

//Listen to port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

