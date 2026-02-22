const { getPool } = require("../config/database");

class GatewayDao {
  async findAll() {
    const result = await getPool().query(
      `SELECT g.id, g.name, g.api_key_prefix, g.active, g.created_at, g.last_seen_at,
              g.organizacao_fk, g.local_api_url, o.description AS organization_description
       FROM gateways g
       LEFT JOIN organizations o ON o.id = g.organizacao_fk
       ORDER BY g.created_at DESC`
    );
    return result.rows;
  }

  async findById(id) {
    const result = await getPool().query(
      `SELECT g.id, g.name, g.api_key_hash, g.api_key_prefix, g.active, g.created_at, g.last_seen_at,
              g.organizacao_fk, g.local_api_url, o.description AS organization_description
       FROM gateways g
       LEFT JOIN organizations o ON o.id = g.organizacao_fk
       WHERE g.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async create({ name, api_key_hash, api_key_prefix, organizacao_fk }) {
    const result = await getPool().query(
      "INSERT INTO gateways (name, api_key_hash, api_key_prefix, organizacao_fk) VALUES ($1, $2, $3, $4) RETURNING id, name, api_key_prefix, active, created_at, organizacao_fk",
      [name, api_key_hash, api_key_prefix, organizacao_fk]
    );
    return result.rows[0];
  }

  async setActive(id, active) {
    const result = await getPool().query(
      `UPDATE gateways SET active = $1 WHERE id = $2
       RETURNING id, name, api_key_prefix, active, created_at, last_seen_at, organizacao_fk`,
      [active, id]
    );
    return result.rows[0] || null;
  }

  async updateLastSeen(id) {
    await getPool().query(
      "UPDATE gateways SET last_seen_at = NOW() WHERE id = $1",
      [id]
    );
  }

  async updateLocalApiUrl(id, url) {
    await getPool().query(
      "UPDATE gateways SET local_api_url = $1 WHERE id = $2",
      [url, id]
    );
  }

  async delete(id) {
    const result = await getPool().query(
      "DELETE FROM gateways WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rows[0] || null;
  }

  async findAllWithHash() {
    const result = await getPool().query(
      "SELECT id, name, api_key_hash, active FROM gateways WHERE active = true"
    );
    return result.rows;
  }
}

module.exports = new GatewayDao();
