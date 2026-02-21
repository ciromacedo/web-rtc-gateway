exports.up = async (pgm) => {
  pgm.createTable("iot_devices", {
    id: { type: "serial", primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    type: { type: "varchar(50)", notNull: true },
    description: { type: "text", notNull: true },
    gateway_id: {
      type: "uuid",
      notNull: true,
      references: '"gateways"',
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint(
    "iot_devices",
    "iot_devices_name_type_gateway_unique",
    "UNIQUE (name, type, gateway_id)"
  );
};

exports.down = async (pgm) => {
  pgm.dropTable("iot_devices");
};
