const IotDeviceDao = require("../dao/IotDeviceDao");
const GatewayBusiness = require("./GatewayBusiness");

class IotDeviceBusiness {
  async findAll() {
    return IotDeviceDao.findAll();
  }

  async findById(id) {
    const device = await IotDeviceDao.findById(id);
    if (!device) {
      throw { statusCode: 404, message: "Dispositivo não encontrado" };
    }
    return device;
  }

  async register(apiKey, devices) {
    if (!apiKey) {
      throw { statusCode: 401, message: "API key obrigatória" };
    }
    if (!Array.isArray(devices) || devices.length === 0) {
      throw { statusCode: 400, message: "Lista de dispositivos vazia" };
    }

    const gateway = await GatewayBusiness.validateApiKey(apiKey);
    if (!gateway) {
      throw { statusCode: 401, message: "API key inválida ou gateway inativo" };
    }

    const results = [];
    for (const device of devices) {
      const { name, type } = device;
      if (!name || !type) continue;

      const existing = await IotDeviceDao.findByNameTypeGateway(
        name,
        type,
        gateway.id
      );

      if (!existing) {
        const created = await IotDeviceDao.create({
          name,
          type,
          description: name,
          gateway_id: gateway.id,
        });
        results.push({ ...created, status: "created" });
      } else {
        results.push({ id: existing.id, name, type, status: "existing" });
      }
    }

    return { gateway: gateway.name, registered: results };
  }

  async update(id, { description }) {
    await this.findById(id);
    if (!description || !description.trim()) {
      throw { statusCode: 400, message: "Descrição é obrigatória" };
    }
    return IotDeviceDao.update(id, { description: description.trim() });
  }

  async delete(id) {
    const deleted = await IotDeviceDao.delete(id);
    if (!deleted) {
      throw { statusCode: 404, message: "Dispositivo não encontrado" };
    }
    return true;
  }
}

module.exports = new IotDeviceBusiness();
