import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

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

// One-time idempotent migration: sync local image_url values for
// Msemen (27), Baghrir (28), Harcha (29) to the production database.
// Only updates rows that still carry an external (non-local) URL.
async function runImageUrlMigration() {
  const updates: Array<{ id: number; imageUrl: string }> = [
    { id: 27, imageUrl: "/dishes/msemen.jpg" },
    { id: 28, imageUrl: "/dishes/baghrir.jpg" },
    { id: 29, imageUrl: "/dishes/harcha.jpg" },
  ];

  const client = await pool.connect();
  try {
    for (const { id, imageUrl } of updates) {
      const result = await client.query(
        `UPDATE menu_items
            SET image_url = $1
          WHERE id = $2
            AND image_url IS DISTINCT FROM $1`,
        [imageUrl, id],
      );
      if (result.rowCount && result.rowCount > 0) {
        logger.info({ id, imageUrl }, "image_url migration applied");
      }
    }
  } finally {
    client.release();
  }
}

runImageUrlMigration().catch((err) => {
  logger.error({ err }, "image_url migration failed");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
