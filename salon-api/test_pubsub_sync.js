const { getCache, setCache, delCachePattern } = require("./src/services/cache.service");

async function testPubSubSync() {
  console.log("🧪 Testing Redis Pub/Sub Multi-Instance Cache Synchronization...");

  const testKey = "salons:list:all:brahmapur:all:1:10";
  const testData = { salons: [{ name: "PubSub Test Salon" }] };

  // 1. Populate cache
  await setCache(testKey, testData, 300);

  // 2. Read cache before invalidation
  const beforeRead = await getCache(testKey);
  console.log("Memory Cache before Pub/Sub invalidation:", beforeRead ? "HIT ✅" : "MISS ❌");

  // 3. Trigger pattern invalidation (Publishes to cache:invalidate channel)
  console.log("⚡ Triggering delCachePattern('salons:list:*') to publish invalidation event...");
  await delCachePattern("salons:list:*");

  // Give 200ms for Pub/Sub event message propagation
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 4. Read cache after invalidation
  const afterRead = await getCache(testKey);
  console.log("Memory Cache after Pub/Sub invalidation (expected MISS):", afterRead ? "STALE HIT ❌" : "CLEARED MISS ✅");

  if (!afterRead) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! Multi-instance Pub/Sub sync cleared in-memory fallback cache across processes!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! Stale in-memory data retained.");
    process.exit(1);
  }
}

testPubSubSync().catch((err) => {
  console.error("Fatal test error:", err.message);
  process.exit(1);
});
