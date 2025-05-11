import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./config/config";
import { User } from "./schema/user";


// Configure the Google strategy for use by Passport
console.log("Google Client ID:", GOOGLE_CLIENT_ID);
console.log("Google Client Secret:", GOOGLE_CLIENT_SECRET);
console.log("Google Callback URL:", GOOGLE_CALLBACK_URL);
passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0].value;
                const name = profile.displayName;
                const googleId = profile.id;

                if (!email || !googleId) {
                    return done(null, false, { message: "Invalid Google account" });
                }

                let user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({ name, email, googleId, role: "user" });
                }

                return done(null, user);
            } catch (error: any) {
                return done(error); 
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); 
    } catch (error) {
        done(error, null); 
    }
});
