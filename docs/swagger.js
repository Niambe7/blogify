const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const express = require("express");
const path = require("path");

const app = express();

const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;
