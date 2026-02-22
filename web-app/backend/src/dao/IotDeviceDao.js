const { getPool } = require("../config/database");

class IotDeviceDao {
  async findAll() {
    const { rows } = await getPool().query(
      `SELECT d.id, d.name, d.type, d.description, d.gateway_id,
              g.name AS gateway_name, g.local_api_url AS gateway_local_api_url
       FROM iot_devices d
       JOIN gateways g ON g.id = d.gateway_id
       ORDER BY g.name, d.type, d.name`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await getPool().query(
      `SELECT d.id, d.name, d.type, d.description, d.gateway_id,
              g.name AS gateway_name, g.local_api_url AS gateway_local_api_url
       FROM iot_devices d
       JOIN gateways g ON g.id = d.gateway_id
       WHERE d.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByNameTypeGateway(name, type, gateway_id) {
    const { rows } = await getPool().query(
      "SELECT id FROM iot_devices WHERE name = $1 AND type = $2 AND gateway_id = $3",
      [name, type, gateway_id]
    );
    return rows[0] || null;
  }

  async create({ name, type, description, gateway_id }) {
    const { rows } = await getPool().query(
      "INSERT INTO iot_devices (name, type, description, gateway_id) VALUES ($1, $2, $3, $4) RETURNING id, name, type, description, gateway_id",
      [name, type, description, gateway_id]
    );
    return rows[0];
  }

  async update(id, { description }) {
    const { rows } = await getPool().query(
      "UPDATE iot_devices SET description = $1 WHERE id = $2 RETURNING id, name, type, description, gateway_id",
      [description, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await getPool().query(
      "DELETE FROM iot_devices WHERE id = $1",
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = new IotDeviceDao();
