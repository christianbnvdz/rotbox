import { config } from 'dotenv';
config({ path: `${process.cwd()}/src/.env` });

import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import cors from 'cors';

import configurePassport from './passport.config';
import mainRouter from './routers/main';

configurePassport(passport);

const app = express();

app.use(cors());
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded());
app.use('/', mainRouter);

(async () => {
  await mongoose.connect(process.env.MONGODB_URL!);
  app.listen(process.env.PORT!);
})();
