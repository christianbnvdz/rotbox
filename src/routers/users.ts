import { readFileSync } from 'fs';
import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';

import User from '../models/user';
import usersAuthdRouter from './usersAuthd';

const PRIV_KEY = process.env.PRIVATE_KEY!;
const saltRounds = 10;
const router = express.Router();

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

function issueJwt(user: any) {
  const id = user._id;
  const expiresIn = process.env.JWT_MAX_AGE!;

  const payload = {
    sub: id,
    iat: (Date.now() / 1000),
  };

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn, algorithm: 'RS256' });

  return `Bearer ${signedToken}`;
}

async function registerUser(username: string, password: string) {
  if ((await User.find({ username })).length) throw new Error('User already exists!');
  const newUser = new User({ username, password: await hash(password) });
  await newUser.save();
}

async function verifyLogin(username: string, password: string) {
  const userQuery = await User.find({ username });
  if (!userQuery.length) throw new Error('Incorrect username or password!');
  if (!(await bcrypt.compare(password, userQuery[0].password))) throw new Error('Incorrect username or password!');
  return userQuery[0];
}

router.route('/')
  .all((req, res) => {
    res.status(403).json({ msg: 'you do not have permission to access this endpoint' });
  });

router.route('/login')
  .post(async (req, res): Promise<void> => {
    try {
      const user = await verifyLogin(req.body.username, req.body.password);
      const jwt = issueJwt(user);
      res.json({ token: jwt, userid: user._id });
    } catch (e) {
      res.status(401).json({ msg: 'incorrect username or password' });
    }
  })
  .all((req, res): void => {
    res.status(405).json({ msg: 'invalid method' });
  });

router.route('/register')
  .post(async (req, res): Promise<void> => {
    try {
      await registerUser(req.body.username, req.body.password);
      res.status(201).json({ msg: 'user successfuly created' });
    } catch (e) {
      res.status(409).json({ msg: 'user already exists' });
    }
  })
  .all((req, res): void => {
    res.status(405).json({ msg: 'invalid method' });
  });

// absolutely not restful
router.route('/authenticate')
  .get(
    passport.authenticate('jwt', { session: false }),
    (req, res): void => {
      res.status(200).json({ msg: 'valid jwt' });
    }
  );

router.use(usersAuthdRouter);

export default router;
