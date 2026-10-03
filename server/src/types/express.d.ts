// Tells TypeScript what `req.user` looks like after requireAuth runs.
// (Without this, the Passport typings pulled in by @types/passport-google-oauth20
// declare a conflicting `Express.User`, which breaks the production build.)
declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
    }
  }
}

export {};
