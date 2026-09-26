export default function getApiErrorMessage(error) {
  if (error?.response?.status === 401) {
    return 'Your session has expired. Sign in again to use Panorama.';
  }
  if (error?.response?.status === 403) {
    return 'You do not have access to this Panorama content.';
  }
  return 'Panorama could not load this content. Please try again later.';
}
