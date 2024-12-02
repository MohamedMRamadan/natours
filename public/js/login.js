/* eslint-disable no-undef */
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import showAlert from './alerts.js';

export const loginHandler = async (email, password) => {
  try {
    const res = await axios.post(`/api/v1/users/login`, {
      email,
      password,
    });
    if (res.data.status === 'success') {
      showAlert('Logged in successfully', 'success');
      setTimeout(() => {
        window.location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert(err.response.data.message, 'error');
  }
};

export const logoutHandler = async () => {
  try {
    const res = await axios.get(`/api/v1/users/logout`);
    if (res.data.status === 'success') {
      window.location.assign('/login'); // true to enforce reload from the server not from browser cahce
    }
  } catch (err) {
    showAlert(err.response.data.message, 'error');
  }
};
