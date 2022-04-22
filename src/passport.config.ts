import { Strategy, ExtractJwt } from 'passport-jwt';
import { readFileSync } from 'fs';

import User from './models/user';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.PUBLIC_KEY!,
  algorithms: ['RS256'],
};

const strategy = new Strategy(options, async (payload, done) => {
  try {
    const user = await User.findOne({ _id: payload.sub });

    if (user) return done(null, user);

    return done(null, false);
  } catch (e) {
    return done(e, false);
  }
});

function configurePassport(passport: any) {
  passport.use(strategy);
}

export default configurePassport;
