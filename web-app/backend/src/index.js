const fastify = require("fastify")({ logger: true });
const bcrypt = require("bcryptjs");

// --- Plugins ---
fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/jwt"), {
  secret: process.env.JWT_SECRET || "vigiai-super-secret-key-change-in-prod",
  sign: { expiresIn: "24h" },
});

// --- Fixed user ---
const FIXED_USER = {
  id: "1",
  name: "Administrador",
  email: "adm@email.com",
  passwordHash: bcrypt.hashSync("123456", 10),
};

// --- Auth decorator ---
fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: "Token inválido ou expirado" });
  }
});

// --- Routes ---

// Health check
fastify.get("/api/health", async () => {
  return { status: "ok" };
});

// Login
fastify.post("/api/auth/login", async (request, reply) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return reply.code(400).send({ error: "Email e senha são obrigatórios" });
  }

  if (email !== FIXED_USER.email) {
    return reply.code(401).send({ error: "Credenciais inválidas" });
  }

  const valid = await bcrypt.compare(password, FIXED_USER.passwordHash);
  if (!valid) {
    return reply.code(401).send({ error: "Credenciais inválidas" });
  }

  const token = fastify.jwt.sign({
    id: FIXED_USER.id,
    email: FIXED_USER.email,
    name: FIXED_USER.name,
  });

  return { token };
});

// Current user
fastify.get(
  "/api/auth/me",
  { onRequest: [fastify.authenticate] },
  async (request) => {
    return {
      id: request.user.id,
      email: request.user.email,
      name: request.user.name,
    };
  }
);

// Cameras list (from MediaMTX API)
fastify.get(
  "/api/cameras",
  { onRequest: [fastify.authenticate] },
  async (request, reply) => {
    const mediamtxApi =
      process.env.MEDIAMTX_API || "http://localhost:9997";

    try {
      const res = await fetch(`${mediamtxApi}/v3/paths/list`);
      if (!res.ok) {
        throw new Error(`MediaMTX responded with ${res.status}`);
      }

      const data = await res.json();
      const items = data.items || [];

      const cameras = items.map((item) => ({
        id: item.name.replace(/\//g, "-"),
        name: item.name,
        path: item.name,
        ready: item.ready || false,
        sourceType: item.sourceType || "unknown",
      }));

      return { cameras };
    } catch (err) {
      fastify.log.error(err, "Failed to fetch cameras from MediaMTX");
      return reply
        .code(502)
        .send({ error: "Não foi possível conectar ao MediaMTX" });
    }
  }
);

// --- Start ---
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
