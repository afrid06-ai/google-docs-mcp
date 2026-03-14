#!/usr/bin/env node
/**
 * Insert TensorFlow content at top of interview doc (black bg + white text).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DOC_ID = process.argv[2] || "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

const TENSORFLOW_CONTENT = `

TENSORFLOW — Overview & Key Concepts

What: TensorFlow is an open-source ML framework by Google for building and training neural networks and other ML models.

Key Concepts:
- Tensors: Multi-dimensional arrays (vectors, matrices, etc.)
- Graphs: Define computation as a DAG of operations
- Sessions / Eager mode: Execute the graph

APIs:
- Keras (tf.keras): High-level API for quick model building
- Low-level: tf.Tensor, tf.constant, tf.Variable, tf.function

Example (tf.keras):

import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(x_train, y_train, epochs=5)

Use cases: Image classification, NLP, recommender systems, time series, production ML pipelines.

`;

async function main() {
  if (!existsSync(CREDENTIALS) || !existsSync(TOKEN)) {
    console.error("Missing credentials.json or token.json. Run: node auth.js");
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDENTIALS, "utf8"));
  const oauth = new google.auth.OAuth2(
    creds.installed.client_id,
    creds.installed.client_secret,
    creds.installed.redirect_uris[0]
  );
  oauth.setCredentials(JSON.parse(readFileSync(TOKEN, "utf8")));
  const docs = google.docs({ version: "v1", auth: oauth });

  const { insertBlockAtTop } = await import("./append-utils.js");
  await insertBlockAtTop(docs, DOC_ID, TENSORFLOW_CONTENT);

  console.log("Inserted TensorFlow section at top.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
