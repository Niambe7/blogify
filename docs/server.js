const express = require("express");
const swagger = require("./swagger");

const app = express();
app.use(express.json());

app.use(swagger);

app.listen(3000, () => {
  console.log("Swagger disponible sur http://localhost:3000/docs");
});
