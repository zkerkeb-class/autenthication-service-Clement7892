import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import config from ".";
import User from "../models/user.model";

import { logger } from "../utils/logger";
import { generateSalt, hashPassword } from "../utils/password.utils";

const GOOGLE_CLIENT_ID = config.google.clientId;
const GOOGLE_CLIENT_SECRET = config.google.clientSecret;
const CALLBACK_URL = config.google.callback;

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info("Google authentication callback received");
        logger.info(`Profile email: ${profile.emails?.[0]?.value}`);

        let user = await User.findOne({ email: profile.emails?.[0]?.value });

        if (user) {
          logger.info(`Utilisateur existant trouvé: ${user.email}`);
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Création d'un mot de passe aléatoire pour l'utilisateur Google
        const randomPassword = `google_${profile.id}_${Date.now()}`;
        const salt = generateSalt();
        const hashedPassword = hashPassword(randomPassword, salt);

        const newUser = new User({
          email: profile.emails?.[0]?.value,
          password: hashedPassword,
          role: "user",
          active: true,
          provider: "google",
          lastLogin: new Date()
        });

        await newUser.save();
        logger.info(
          `Nouvel utilisateur créé via Google OAuth: ${newUser.email}`
        );

        return done(null, newUser);
      } catch (error) {
        logger.error("Erreur lors de l'authentification Google", error);
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
