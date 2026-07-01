import { MongoClient, ObjectId } from 'mongodb';

// ── Singleton: reutiliza la conexión entre requests del mismo isolate ──
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(mongoUri) {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('cameci');

  cachedClient = client;
  cachedDb = db;

  console.log('✅ Conexión exitosa a MongoDB Atlas');
  return { client, db };
}

/**
 * Obtiene la instancia de la base de datos 'cameci'.
 * @param {object} env - El objeto de environment del Worker (contiene MONGO_URI).
 */
export async function getDb(env) {
  const { db } = await connectToDatabase(env.MONGO_URI);
  return db;
}

/**
 * Obtiene una colección de la base de datos.
 * @param {object} env - El objeto de environment del Worker.
 * @param {string} name - Nombre de la colección (ej. 'propiedads', 'mensajes').
 */
export async function getCollection(env, name) {
  const db = await getDb(env);
  return db.collection(name);
}

export { ObjectId };
