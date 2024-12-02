/* eslint-disable no-undef */
const displayMap = (locations) => {
  const map = L.map('map');
  map.scrollWheelZoom.disable();

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const bounds = [];
  locations.forEach((loc) => {
    const [lat, lng] = loc.coordinates;
    bounds.push([lng, lat]);
    const marker = L.marker([lng, lat]).addTo(map);
    marker.bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`).openPopup();
  });

  map.fitBounds(bounds, { padding: [200, 200] });
};
export default displayMap;
