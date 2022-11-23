const express = require("express")
const { join } = require("path")
const app = express()

const port = 4000

app.use(express.static(join(__dirname, "public")));

app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.listen(port,()=>{
    console.log(`Escuchando en http://localhost:${port}`)
})