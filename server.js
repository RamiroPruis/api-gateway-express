const { application } = require("express");
const express = require("express");
const { join } = require("path");
const cors = require('cors')
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');


const checkJwt = auth({
  audience: 'TVHxbgABblE2aeYmMaw9Nswdjg5RIohL',
  issuerBaseURL: 'https://dev-rtumndobjb1mq4ay.us.auth0.com/'
});

// Devuelve archivos estaticos desde la carpeta public
app.use(express.static(join(__dirname, "/public")));
app.use('/css',express.static(__dirname + "public/css" ));
app.use('/js',express.static(__dirname + "public/js" ));
app.use(cors({origin: "*"}))
// Devuelve el archivo de configuracion
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});



app.get("/api/reservas",checkJwt,(req,res)=>{
  res.write(JSON.stringify({msg:"ESTAS AUTENTICADO INSTAA"}))
  res.end()
})


// Deriva cualquier request desconocida a index
app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "/public/index.html"));
});


// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));