import { runImportCli } from "./seed.js";

runImportCli().catch((error) => {
  console.error(error);
  process.exit(1);
});
