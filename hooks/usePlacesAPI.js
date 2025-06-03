import { GOOGLE_PLACES_API_KEY } from '../apiKeys';

export const fetchPlacePredictions = async (input, location = null, radiusKm = 5, types = '') => {
  const endpoint = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
  const radius = radiusKm * 1000;
  const params = new URLSearchParams({
    input,
    key: GOOGLE_PLACES_API_KEY,
    radius: radius.toString(),
    ...(location && { location: `${location.lat},${location.lng}` }),
    ...(types && { types }),
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  const data = await response.json();

  if (data.status !== 'OK') throw new Error(data.error_message || 'Failed to fetch predictions');

  return data.predictions;
};

export const fetchPlaceDetails = async (placeId) => {
  const endpoint = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_PLACES_API_KEY,
    fields: 'name,geometry,formatted_address,place_id,types,rating,price_level',
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  const data = await response.json();

  if (data.status !== 'OK') throw new Error(data.error_message || 'Failed to fetch place details');

  return data.result;
};
