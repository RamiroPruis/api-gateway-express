const { application } = require("express");
const express = require("express");
const { join } = require("path");
const cors = require('cors')
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');
// const { getSucursales, getReservas, postReservas } = require("./handler")
const http = require("http")

function  hashMail(mail){

  return 10
}



const checkJwt = auth({
  audience: 'TVHxbgABblE2aeYmMaw9Nswdjg5RIohL',
  issuerBaseURL: 'https://dev-rtumndobjb1mq4ay.us.auth0.com/'
});

function parseJwt (token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

// Devuelve archivos estaticos desde la carpeta public
app.use(express.static(join(__dirname, "/public")));
app.use('/css',express.static(__dirname + "public/css" ));
app.use('/js',express.static(__dirname + "public/js" ));
app.use(cors({origin: "*"}))
// Devuelve el archivo de configuracion
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});



app.get("/api/reservas",(req,res)=>{
  console.log("Estamos entrando a reservas")
  getReservas(req,res)
})


app.get("/api/sucursales",(req,res)=>{  
  console.log("Estamos entrando a sucursales")
  getSucursales(req,res)
})

app.post("/api/reservas/solicitar/:idReserva",(req,res)=>{  
  console.log("Estamos entrando a solicitar una reserva", req.params.idReserva)
  postReservas(req,res)
})

app.post("/api/reservas/confirmar/:idReserva",(req,res)=>{  
  console.log("Estamos entrando a confirmar una reserva", req.params.idReserva)
  postReservas(req,res)
})


app.delete("/api/reservas/delete/:idReserva", checkJwt, (req,res)=>{

  console.log("Estamos entrando a eliminar una reserva", req.params.idReserva)
  req.url = `http://localhost:3000/api/reservas/delete/${req.params.idReserva}`
  console.log("HOLAAAAA")
  deleteReserva(req,res)
})

app.get("/api/myReservas", checkJwt, (req,res)=>{
  let token = req.headers.authorization
  token = parseJwt(token)
  console.log("Estamos entrando a pedir mis reservas", token.email)
  const userId = hashMail(token.email)

  req.url = `http://localhost:3000/api/reservas?userId=${userId}`
  getReservas(req,res)
})





// Deriva cualquier request desconocida a index
app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "/public/index.html"));
});


// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));







const SUCURSALES_PORT = 2000;
const RESERVAS_PORT = 2001;



function getSucursales(req, res) {
    const startsApi = req.url.indexOf("/api");
    const path = req.url.substring(startsApi, req.url.length);
  
    const options = {
      host: "localhost",
      port: SUCURSALES_PORT,
      path: path,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    };
  
    const reqSucursales = http.request(options, (resSucursales) => {
      let data = [];
  
      resSucursales.on("data", (chunck) => data.push(chunck));
  
      resSucursales.on("end", () => {
        let body = JSON.parse(Buffer.concat(data).toString());
        // res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      });
    });
  
    reqSucursales.write(JSON.stringify({}));
    reqSucursales.end();
}

function deleteReserva(req,res){

  const startsApi = req.url.indexOf("/api");
  const path = req.url.substring(startsApi, req.url.length);

  const options = {
    host: "localhost",
    port: RESERVAS_PORT,
    path: path,
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
    },
  };

  const reqReservas = http.request(options, (resReservas) => {
    let data = [];

    resReservas.on("data", (chunk) => {
      data.push(chunk);
    });

    resReservas.on("end", () => {
      let body = JSON.parse(Buffer.concat(data).toString());
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    });
  });

  reqReservas.write(JSON.stringify({}));
  reqReservas.end();
}


  
function getReservas(req, res) {
    const startsApi = req.url.indexOf("/api");
    const path = req.url.substring(startsApi, req.url.length);
  
    const options = {
      host: "localhost",
      port: RESERVAS_PORT,
      path: path,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    };
  
    const reqReservas = http.request(options, (resReservas) => {
      let data = [];
  
      resReservas.on("data", (chunk) => {
        data.push(chunk);
      });
  
      resReservas.on("end", () => {
        let body = JSON.parse(Buffer.concat(data).toString());
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      });
    });
  
    reqReservas.write(JSON.stringify({}));
    reqReservas.end();
}
  
function postReservas(req, res) {
    let body = [];
    req.on("data", (chunck) => body.push(chunck));
  
    req.on("end", () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const startsApi = req.url.indexOf("/api");
      const path = req.url.substring(startsApi, req.url.length);
  
      const options = {
        host: "localhost",
        port: RESERVAS_PORT,
        path: path,
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
      };
  
  
      const reservaReq = http.request(options, (resReserva) => {
        let reservaBody = [];
        resReserva.on("data", (chunck) => reservaBody.push(chunck));
        
        resReserva.on("end", () => {
          reservaBody = JSON.parse(Buffer.concat(reservaBody).toString());
          res.writeHead(resReserva.statusCode, { "Content-Type": "application/json" });
          res.end(JSON.stringify(reservaBody));
        });
  
      });
  
      reservaReq.write(JSON.stringify(body));
      reservaReq.end();
    });
  
    req.on("error",(e)=>{
      console.log("Error",e)
    })
}
  