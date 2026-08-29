const validateEnvSecrets = () => {
  // Dummy test-only secret values used strictly when NODE_ENV === 'test' to prevent test suite crashes
  if (process.env.NODE_ENV === 'test') {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "a82bd1297e68c412e88a912f71120023a129037418b76c82736b6b712163901f";
  }

  const requiredSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = requiredSecrets.filter(
    (key) => !process.env[key] || process.env[key].trim() === ''
  );

  if (missing.length > 0) {
    console.error(`🚨 FATAL SERVER STARTUP ERROR: Missing required environment secrets: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Fallback EMAIL_VERIFICATION_SECRET safely to JWT_ACCESS_SECRET if unset, eliminating hardcoded string literals
  if (!process.env.EMAIL_VERIFICATION_SECRET) {
    process.env.EMAIL_VERIFICATION_SECRET = process.env.JWT_ACCESS_SECRET;
  }
};

module.exports = validateEnvSecrets;
