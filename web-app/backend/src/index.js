const fastify = require("fastify")({ logger: true });
const { testConnection, closePool } = require("./config/database");

// --- Plugins ---
fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("./plugins/auth"));

// --- Services ---
fastify.register(require("./services/AuthService"));
fastify.register(require("./services/UserService"));
fastify.register(require("./services/TokenService"));
fastify.register(require("./services/GatewayService"));
fastify.register(require("./services/OrganizationService"));
fastify.register(require("./services/IotDeviceService"));

// --- Health check ---
fastify.register(async function routes(app) {
  app.get("/api/health", async () => {
    return { status: "ok" };
  });

  app.get(
    "/api/cameras",
    { onRequest: [app.authenticate] },
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
        app.log.error(err, "Failed to fetch cameras from MediaMTX");
        return reply
          .code(502)
          .send({ error: "Não foi possível conectar ao MediaMTX" });
      }
    }
  );
});

// --- Start ---
const start = async () => {
  try {
    await testConnection();
    fastify.log.info("PostgreSQL connected");

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// --- Graceful shutdown ---
const shutdown = async () => {
  fastify.log.info("Shutting down...");
  await fastify.close();
  await closePool();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
