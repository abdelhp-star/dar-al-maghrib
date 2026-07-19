import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// One-time admin password reset — runs when ADMIN_PASSWORD_RESET_HASH is set.
// Remove this block (and the env var) after the first successful production boot.
const resetHash = process.env["ADMIN_PASSWORD_RESET_HASH"];
if (resetHash) {
  try {
    const result = await db
      .update(usersTable)
      .set({ passwordHash: resetHash })
      .where(eq(usersTable.email, "admin@daralmaghrib.com"))
      .returning({ id: usersTable.id, email: usersTable.email });
    if (result.length > 0) {
      logger.info({ email: result[0].email }, "Admin password reset applied from ADMIN_PASSWORD_RESET_HASH");
    } else {
      logger.warn("ADMIN_PASSWORD_RESET_HASH set but no matching admin user found");
    }
  } catch (err) {
    logger.error({ err }, "Failed to apply admin password reset");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
