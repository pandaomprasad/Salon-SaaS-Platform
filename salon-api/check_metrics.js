const http = require("http");

console.log("🔍 Checking /metrics availability on http://localhost:6969/metrics ...");

const req = http.get("http://localhost:6969/metrics", (res) => {
  console.log(`✅ HTTP Status: ${res.statusCode}`);
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("📊 /metrics response snippet:\n", data.substring(0, 400));
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.log("⚠️ Local server on 6969 is not currently listening:", err.message);
  console.log("💡 We will start a dedicated API server instance on port 6969 for the load test.");
  process.exit(0);
});
