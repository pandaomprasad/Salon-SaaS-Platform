require("dotenv").config();
const { getCache, setCache } = require("./src/services/cache.service");

async function runReceiverProcess() {
  console.log(`🟢 [PROCESS B - PID ${process.pid}] Starting Receiver Instance...`);

  const testKey = "salons:list:multi_instance_test";
  await setCache(testKey, { text: "Cached on Instance B" }, 300);

  const initialRead = await getCache(testKey);
  console.log(`🟢 [PROCESS B - PID ${process.pid}] Initial Local Memory Cache: ${initialRead ? 'HIT ✅' : 'MISS ❌'}`);

  // Poll local memory for 5 seconds waiting for Process A to publish invalidation
  let cleared = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const current = await getCache(testKey);
    if (!current) {
      cleared = true;
      console.log(`🟢 [PROCESS B - PID ${process.pid}] Pub/Sub event received from Process A! Local Memory Cache is now: CLEARED MISS ✅`);
      break;
    }
  }

  if (cleared) {
    process.exit(0);
  } else {
    console.error(`🔴 [PROCESS B - PID ${process.pid}] Timed out waiting for Pub/Sub invalidation.`);
    process.exit(1);
  }
}

runReceiverProcess().catch((err) => {
  console.error("Process B error:", err.message);
  process.exit(1);
});
