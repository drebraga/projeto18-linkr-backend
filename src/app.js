import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

import authRouter from './routes/auth.router.js';
import postsRouter from './routes/posts.router.js';
import trendingRoutes from './routes/trending.routes.js';
import userPage from './routes/userPage.router.js';
import sessionRefresh from './session.js';
import likeRoutes from './routes/likes.routes.js';

app.use ([
    authRouter,
    postsRouter,
    trendingRoutes,
    userPage,
    likeRoutes,
    ]);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running in port ${port}.`));

sessionRefresh(15, 2.5, 'minutes')