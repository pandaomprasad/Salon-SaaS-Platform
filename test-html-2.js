const fs = require('fs');
const content = fs.readFileSync('./apps/customer-app/src/services/mapService.js', 'utf8');

// VERY crude extraction for testing
const fnString = content.substring(content.indexOf('generateMapHtml:'), content.indexOf('parseMapMessage:'));
const body = fnString.substring(fnString.indexOf('{') + 1, fnString.lastIndexOf('}'));

const markers = [{ id: '1', name: "Urban Edge's Salon", lat: 10, lng: 10, isSelected: true }];

// Evaluate it manually
const html = new Function('markersJson', 'validLat', 'validLng', 'validUserLat', 'validUserLng', 'tileUrl', body)(
  JSON.stringify(markers), 10, 10, 10, 10, '...'
);

const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

try {
  new Function('L', 'window', scriptContent);
  console.log('Script is VALID javascript!');
} catch (e) {
  console.log('Script is INVALID:', e.message);
  console.log('Script Content:');
  console.log(scriptContent.split('\n').map((l, i) => `${i+1}: ${l}`).join('\n'));
}
