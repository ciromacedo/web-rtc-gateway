const IotDeviceBusiness = require("../business/IotDeviceBusiness");

async function iotDeviceService(fastify) {
  const auth = { onRequest: [fastify.authenticate] };

  // POST /api/iot-devices/register — chamado pelo gateway ao iniciar (público, auth via api_key)
  fastify.post("/api/iot-devices/register", async (request, reply) => {
    try {
      const { api_key, devices } = request.body || {};
      const result = await IotDeviceBusiness.register(api_key, devices);
      return reply.code(200).send(result);
    } catch (err) {
      return reply
        .code(err.statusCode || 500)
        .send({ error: err.message || "Erro interno" });
    }
  });

  // GET /api/iot-devices — lista todos os dispositivos (protegido)
  fastify.get("/api/iot-devices", auth, async () => {
    return IotDeviceBusiness.findAll();
  });

  // GET /api/iot-devices/:id — busca por id (protegido)
  fastify.get("/api/iot-devices/:id", auth, async (request, reply) => {
    try {
      return await IotDeviceBusiness.findById(Number(request.params.id));
    } catch (err) {
      return reply
        .code(err.statusCode || 500)
        .send({ error: err.message || "Erro interno" });
    }
  });

  // PUT /api/iot-devices/:id — atualiza somente descrição (protegido)
  fastify.put("/api/iot-devices/:id", auth, async (request, reply) => {
    try {
      const device = await IotDeviceBusiness.update(
        Number(request.params.id),
        request.body
      );
      return device;
    } catch (err) {
      return reply
        .code(err.statusCode || 500)
        .send({ error: err.message || "Erro interno" });
    }
  });

  // DELETE /api/iot-devices/:id — remove (protegido)
  fastify.delete("/api/iot-devices/:id", auth, async (request, reply) => {
    try {
      await IotDeviceBusiness.delete(Number(request.params.id));
      return reply.code(204).send();
    } catch (err) {
      return reply
        .code(err.statusCode || 500)
        .send({ error: err.message || "Erro interno" });
    }
  });
}

module.exports = iotDeviceService;
