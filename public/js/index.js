/* eslint-disable no-undef */
// eslint-disable-next-line import/no-named-as-default
import updateSettings from './updateSettings.js';
import displayMap from './leaflet.js';
import { loginHandler, logoutHandler } from './login.js';
import { bookTour } from './stripe.js';
import showAlert from './alerts.js';

const name = document.getElementById('name');
const email = document.getElementById('email');
const password = document.getElementById('password');
const passwordConfirm = document.getElementById('password-confirm');
const passwordCurrent = document.getElementById('password-current');

const mapLeaflet = document.getElementById('map');
const loginForm = document.querySelector('.login-form .form');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const logoutButton = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');
const alertMessage = document.body.dataset.alert;

// To Display Map
if (mapLeaflet) {
  const locations = JSON.parse(mapLeaflet.dataset.locations);
  displayMap(locations);
}

// Login
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginHandler(email.value, password.value);
  });

if (logoutButton) logoutButton.addEventListener('click', logoutHandler);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    // console.log(userDataForm.querySelector('#photo').files[0]);
    formData.append('photo', userDataForm.querySelector('#photo').files[0]);
    formData.append('name', name.value);
    formData.append('email', email.value);

    updateSettings(formData, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = userPasswordForm.querySelector('button');
    button.textContent = 'Updating...';
    await updateSettings(
      {
        passwordCurrent: passwordCurrent.value,
        password: password.value,
        passwordConfirm: passwordConfirm.value,
      },
      'password',
    );
    button.textContent = 'save passowrd';
    passwordCurrent.value = '';
    password.value = '';
    passwordConfirm.value = '';
  });

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
    e.target.textContent = 'Book tour now!';
  });
}

if (alertMessage) {
  showAlert(alertMessage, 'success', 10000);
}
