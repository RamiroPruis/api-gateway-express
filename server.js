const { application } = require("express");
const express = require("express");
const { join } = require("path");
const app = express();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');


const jwtCheck = auth({

  audience: 'http://localhost:3000/api',
  issuerBaseURL: 'https://dev-rtumndobjb1mq4ay.us.auth0.com/'
});

// Devuelve archivos estaticos desde la carpeta public
app.use(express.static(join(__dirname, "public")));

// Devuelve el archivo de configuracion
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});



app.get("/api/reservas",jwtCheck,(req,res)=>{
  console.log("hola")
  res.write(JSON.stringify({msg: "Estas autenticado"}))
  res.end()
})


// Deriva cualquier request desconocida a index
app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "/public/index.html"));
});


// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));