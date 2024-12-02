import axios from 'axios';
import showAlert from './alerts.js';

export const updateSettings = async (data, type) => {
  const resource = type === 'password' ? 'updateMyPassword' : 'updateMe';

  try {
    const res = await axios.patch(`/api/v1/users/${resource}`, data);
    if (res.data.status === 'success') {
      showAlert(`${type} updated successfully`, 'success', 3000, true);
    }
  } catch (err) {
    showAlert(err.response.data.message, 'error');
  }
};
export default updateSettings;
