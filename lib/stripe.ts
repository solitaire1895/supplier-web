import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      // No apiVersion specified: the SDK uses the version pinned to the
      // installed `stripe` package, avoiding invalid-version runtime errors.
      typescript: true,
    })
  : null;
