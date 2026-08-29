const { getCache, setCache, invalidateCatalogCache } = require('./src/services/cache.service');

async function testCacheInvalidation() {
  console.log("🧪 Testing Cache Invalidation logic...");

  // 1. Populate cache keys
  const testKey1 = "salons:list:all:brahmapur:all:1:10";
  const testKey2 = "branch:services:650000000000000000000001:all";
  const testData1 = { salons: [{ name: "Test Salon 1" }] };
  const testData2 = { services: [{ name: "Haircut", price: 500 }] };

  await setCache(testKey1, testData1, 300);
  await setCache(testKey2, testData2, 300);

  // 2. Confirm cache HIT
  const read1 = await getCache(testKey1);
  const read2 = await getCache(testKey2);
  console.log("Read 1 before write:", read1 ? "HIT ✅" : "MISS ❌");
  console.log("Read 2 before write:", read2 ? "HIT ✅" : "MISS ❌");

  // 3. Perform write operation (invalidate cache)
  console.log("⚡ Simulating write endpoint call (updateService / invalidateCatalogCache)...");
  await invalidateCatalogCache({ branchId: "650000000000000000000001" });

  // 4. Verify cache MISS (key cleared)
  const postRead1 = await getCache(testKey1);
  const postRead2 = await getCache(testKey2);
  console.log("Read 1 after write (expected MISS):", postRead1 ? "STALE HIT ❌" : "CLEARED MISS ✅");
  console.log("Read 2 after write (expected MISS):", postRead2 ? "STALE HIT ❌" : "CLEARED MISS ✅");

  // 5. Simulate next read repopulating cache
  const freshData = { salons: [{ name: "Updated Test Salon" }] };
  await setCache(testKey1, freshData, 300);
  const repopulated = await getCache(testKey1);
  console.log("Read 1 repopulated after next fetch:", repopulated && repopulated.salons[0].name === "Updated Test Salon" ? "REPOPULATED FRESH DATA ✅" : "FAILED ❌");

  process.exit(0);
}

testCacheInvalidation().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
