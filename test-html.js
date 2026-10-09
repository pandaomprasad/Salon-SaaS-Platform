const { mapService } = require("./apps/customer-app/src/services/mapService.js");
const markers = [{ id: "1", name: "Urban Edge's Salon", lat: 10, lng: 10, isSelected: true }];
const html = mapService.generateMapHtml(JSON.stringify(markers), 10, 10, 10, 10);
const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
try {
  new Function("L", "window", scriptContent);
  console.log("Script is VALID javascript!");
} catch (e) {
  console.log("Script is INVALID:", e.message);
  console.log("Script Content:");
  console.log(scriptContent.split('\n').map((l, i) => `${i+1}: ${l}`).join('\n'));
}
