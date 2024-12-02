/* eslint-disable no-undef */
const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
const showAlert = (msg, type, duration = 5000, reload = false) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  setTimeout(() => {
    hideAlert();
    reload && window.location.reload();
  }, duration);
};
export default showAlert;
