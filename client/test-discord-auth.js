// Test Discord OAuth flow
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

console.log('Testing Discord OAuth flow...');
console.log('API_BASE_URL:', API_BASE_URL);

// Test Discord endpoint
fetch(`${API_BASE_URL}/auth/discord`, {
  method: 'GET',
  credentials: 'include',
  redirect: 'manual'
})
.then(response => {
  console.log('Discord auth response status:', response.status);
  console.log('Discord auth response headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(text => {
  console.log('Discord auth response body:', text);
})
.catch(error => {
  console.error('Discord auth error:', error);
});

// Test me endpoint
fetch(`${API_BASE_URL}/auth/me`, {
  method: 'GET',
  credentials: 'include'
})
.then(response => {
  console.log('Me endpoint response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Me endpoint response:', data);
})
.catch(error => {
  console.error('Me endpoint error:', error);
});
