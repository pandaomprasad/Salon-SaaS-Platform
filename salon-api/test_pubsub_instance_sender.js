require("dotenv").config();
const { fork } = require("child_process");
const path = require("path");
const { delCachePattern } = require("./src/services/cache.service");

async function runMultiInstanceTest() {
  console.log(`🔵 [PROCESS A - PID ${process.pid}] Starting Sender Instance...`);

  // Spawn Process B as a separate independent Node process
  const processB = fork(path.join(__dirname, "test_pubsub_instance_receiver.js"), [], {
    stdio: "inherit",
  });

  // Give Process B 2 seconds to connect to Redis and populate its in-memory cache
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`🔵 [PROCESS A - PID ${process.pid}] Executing delCachePattern('salons:list:*') and publishing to Redis 'cache:invalidate'...`);
  await delCachePattern("salons:list:*");

  // Wait for Process B to exit and verify exit code
  processB.on("exit", (code) => {
    if (code === 0) {
      console.log("✅ ACCEPTANCE CRITERIA PASSED! Process A (PID " + process.pid + ") published invalidation event over Redis Pub/Sub, causing Process B (distinct PID) to clear its in-memory cache!");
      process.exit(0);
    } else {
      console.error("❌ ACCEPTANCE CRITERIA FAILED! Process B exited with error.");
      process.exit(1);
    }
  });
}

runMultiInstanceTest().catch((err) => {
  console.error("Process A error:", err.message);
  process.exit(1);
});
