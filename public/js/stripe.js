/* eslint-disable no-undef */
import axios from 'axios';
import showAlert from './alerts.js';

const stripe = Stripe(
  'pk_test_51PWyb9BRMyyncLsnaCIp4PjOxcrDU1KozWDy7lLDPEXRVfIcXqX9J6hTWwGsi0BbZSe88LVk3MfH5pFEgBWPF3Kn00Vf7iesH6',
);

// eslint-disable-next-line import/prefer-default-export
export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from an api
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`,
    );
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert(err, 'error');
  }
};
