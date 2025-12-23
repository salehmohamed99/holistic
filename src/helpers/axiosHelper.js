const axios = require("axios").default;

exports.post = async (url, data) => {
  return await axios({
    method: "POST",
    url,
    data,
    headers: { "Content-Type": "application/json" },
  });
};

exports.get = async (url) => {
  return await axios({
    method: "GET",
    url,
    headers: { "Content-Type": "application/json" },
  });
};
