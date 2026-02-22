const GatewayBusiness = require("../business/GatewayBusiness");
const GatewayDao = require("../dao/GatewayDao");

async function gatewayService(fastify) {
  const auth = { onRequest: [fastify.authenticate] };

  // GET /api/gateways — lista gateways (protegido)
  fastify.get("/api/gateways", auth, async (request, reply) => {
    try {
      const gateways = await GatewayBusiness.findAll();
      return { gateways };
    } catch (err) {
      const code = err.statusCode || 500;
      return reply.code(code).send({ error: err.message });
    }
  });

  // POST /api/gateways — cria gateway (protegido), retorna api_key uma vez
  fastify.post("/api/gateways", auth, async (request, reply) => {
    try {
      const { name, organizacao_fk } = request.body || {};
      const gateway = await GatewayBusiness.create({ name, organizacao_fk });
      return reply.code(201).send({ gateway });
    } catch (err) {
      const code = err.statusCode || 500;
      return reply.code(code).send({ error: err.message });
    }
  });

  // PATCH /api/gateways/:id/toggle — ativa/desativa (protegido)
  fastify.patch("/api/gateways/:id/toggle", auth, async (request, reply) => {
    try {
      const gateway = await GatewayBusiness.toggle(request.params.id);
      return { gateway };
    } catch (err) {
      const code = err.statusCode || 500;
      return reply.code(code).send({ error: err.message });
    }
  });

  // DELETE /api/gateways/:id — remove (protegido)
  fastify.delete("/api/gateways/:id", auth, async (request, reply) => {
    try {
      await GatewayBusiness.delete(request.params.id);
      return reply.code(204).send();
    } catch (err) {
      const code = err.statusCode || 500;
      return reply.code(code).send({ error: err.message });
    }
  });

  // POST /api/gateways/auth — gateway valida sua key (público)
  fastify.post("/api/gateways/auth", async (request, reply) => {
    try {
      const { api_key, local_api_url } = request.body || {};
      const gateway = await GatewayBusiness.validateApiKey(api_key);
      if (!gateway) {
        return reply.code(401).send({ error: "API key inválida ou gateway inativo" });
      }
      if (local_api_url) {
        await GatewayDao.updateLocalApiUrl(gateway.id, local_api_url);
      }
      return { valid: true, id: gateway.id, name: gateway.name };
    } catch (err) {
      return reply.code(500).send({ error: "Erro interno" });
    }
  });

  // POST /api/gateways/mediamtx-auth — chamado pelo MediaMTX para autorizar publishers (público)
  fastify.post("/api/gateways/mediamtx-auth", async (request, reply) => {
    try {
      const { user, password, action } = request.body || {};

      // Somente publishers precisam de autenticação via API key
      // Readers (navegadores) são permitidos sem credenciais
      if (action === "read" || action === "playback") {
        return reply.code(200).send();
      }

      // Para publish, o user deve ser "gateway" e password é a API key
      if (action === "publish") {
        if (user !== "gateway") {
          return reply.code(401).send({ error: "Usuário inválido para publish" });
        }
        const gateway = await GatewayBusiness.validateApiKey(password);
        if (!gateway) {
          return reply.code(401).send({ error: "API key inválida ou gateway inativo" });
        }
        return reply.code(200).send();
      }

      // Outras ações (api) são permitidas sem restrição
      return reply.code(200).send();
    } catch (err) {
      fastify.log.error(err, "mediamtx-auth error");
      return reply.code(500).send({ error: "Erro interno" });
    }
  });
}

module.exports = gatewayService;
