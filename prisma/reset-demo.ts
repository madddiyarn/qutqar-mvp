import { cleanSystemData, disconnectCleanSystem } from "./clean-system";

cleanSystemData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectCleanSystem();
  });
