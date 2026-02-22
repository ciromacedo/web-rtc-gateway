exports.up = async (pgm) => {
  pgm.addColumns("gateways", { local_api_url: { type: "text" } });
};

exports.down = async (pgm) => {
  pgm.dropColumns("gateways", ["local_api_url"]);
};
