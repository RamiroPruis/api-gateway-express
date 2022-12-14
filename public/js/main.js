const form = document.getElementById("reservas-form")
const reservaButton = document.getElementById("reserva-button")
//const eliminarReservaButton = document.getElementById("eliminar-reserva-button")
const modal = document.getElementById("myModalConfirm")
const modalError = document.getElementById("myModalError")
const modalSolicitar = document.getElementById("myModalSolicitar")
const span = document.getElementsByClassName("close")[0]
const reservaConfirm = document.getElementById("reserva-confirm")
const diaContainer = document.getElementById("reserva-dia")
document.getElementById('reserva-dia').valueAsDate = new Date();

const MARKERS_URL = "https://cartes.io/api/maps/b15857ea-d028-4563-84e7-294188a0ad7b/markers"
const MAPS_URL = "https://cartes.io/api/maps"

let auth0Client = null;
const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0Client = await auth0.createAuth0Client({
    domain: config.domain,
    clientId: config.clientId
  });
}; 

window.onload = async () => {

  await configureClient();

  // .. code ommited for brevity

  updateUI();

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0Client.handleRedirectCallback();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
};


// NEW
const updateUI = async () => { 
  const isAuthenticated = await auth0Client.isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;
  document.getElementById("btn-misReservas").style.display = isAuthenticated ? "block" : "none"
  
  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {

    const TOKEN = (await auth0Client.getIdTokenClaims()).__raw

    window.sessionStorage.setItem('token', TOKEN)

    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = await auth0Client.getTokenSilently();

    document.getElementById("ipt-user-profile").textContent = JSON.stringify(
      await auth0Client.getUser()
    );

    

    fetch("http://localhost:3000/api/reservas",{
      method: "GET",
      headers:{
        authorization:`Bearer ${TOKEN}`
      }
    })
    console.log(await auth0Client.getIdTokenClaims().__raw)
  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }


}


const logout = () => {
  auth0Client.logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
};

const login = async () => {
  await auth0Client.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.origin
    } 
  });
};


const getSucursales = async () => {
  const reqSucursales = await fetch("http://localhost:3000/api/sucursales/")
  return reqSucursales.json()
}

const createMarkers = async (res) => {

  await res.forEach(async(sucursal) => {
    const options = {
      method: "POST",
      cors: "no-cors",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat: sucursal.lat,
        lng: sucursal.lng,
        category_name :sucursal.name
      })
    }
    console.log("Creando marker, url:" + MARKERS_URL + options.body)
    const req = await fetch(MARKERS_URL, options)
    console.log(req)
  })

}

getSucursales().then((res) => {
  res.forEach((sucursal) => {
    document.querySelector(
      "#reserva-sucursal"
    ).innerHTML += `<option value=${sucursal.id}> ${sucursal.name}</option>`
  })
  createMarkers(res)
})

const getReservas = async (params) => {
  console.log("http://localhost:3000/api/reservas?" + params)
  const req = await fetch("http://localhost:3000/api/reservas?" + params)
  return req.json()
}



diaContainer.addEventListener("change", () => {
  let sucursal = document.querySelector("#reserva-sucursal").value
  let dia = document.querySelector("#reserva-dia").value
  
  getReservas(new URLSearchParams({ branchId: sucursal, userId: -1,dateTime:dia })).then(
    (res) => {
      console.log(res)
      document.querySelector("#reserva-horario").innerHTML = ""
      res.forEach(
        (reserva) =>
          (document.querySelector(
            "#reserva-horario"
          ).innerHTML += `<option value=${reserva.id}> ${new Date(
            reserva.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</option>`)
      )
    }
  )
})

form.addEventListener("submit", (ev) => {
  ev.preventDefault()
})

// eliminarReservaButton.onclick = async () => {
//   const TOKEN =  window.sessionStorage.getItem("token")
//   const options = {
//     method: 'DELETE',
//     headers:{
//       authorization:`Bearer ${TOKEN}`
//     }
//   }
//   const idReserva = 1 //Aca vamos a obtener el id a partir del html, la reserva seleccionada

//   const reqEliminarReserva = await fetch("http://localhost:3000/api/reservas/delete/" + idReserva, options)
//   console.log(reqEliminarReserva)
// }

// myReservaButton.onclick = async () => {
//   const TOKEN =  window.sessionStorage.getItem("token")
//   const options = {
//     headers:{
//       authorization:`Bearer ${TOKEN}`
//     }
//   }
//   const reqMyReservas = await fetch("http://localhost:3000/api/myReservas", options)
//   console.log(reqMyReservas)
// }



reservaButton.onclick = async () => {
  const obj = {}
  const formData = new FormData(form)
  for (const key of formData.keys()) {
    obj[key] = formData.get(key)
  }
  const idreserva = document.querySelector("#reserva-horario").value

  console.log(idreserva)

  const token = await auth0Client.getUser()

  fetch(`http://localhost:3000/api/reservas/solicitar/${idreserva}`,{

      method: 'POST',
      body:JSON.stringify(
       {
          userId: token ? hashMail(token.email) : 0,
          email:obj.email
      })
      }
     ).then(res => {
      if (res.status == 200){
        console.log(res)
        confirmarReservaBox(res.status)
      }
      else{
        myModalError("No se pudo confirmar la reserva")
      }
     })
}

function  hashMail(mail){
  let hash = 0
  for (let i=0;i<mail.length;i++){
      hash = hash + mail.charCodeAt(i)
  }
  console.log(hash)
  return hash
}

const refreshPage = () =>{
  window.parent.location = window.parent.location.href;
}


const confirmarReservaBox = (statusCode) => {

  if (statusCode == 200){
    modal.style.display = "block"

    const obj = {}
    const formData = new FormData(form)
    for (const key of formData.keys()) {
      obj[key] = formData.get(key)
    }

    let sucursalBox = document.querySelector("#reserva-sucursal")
    let sucursalName = sucursalBox.options[sucursalBox.selectedIndex].text
    obj["sucursal"] = sucursalName

    let horarioBox = document.querySelector("#reserva-horario")
    let horarioName = horarioBox.options[horarioBox.selectedIndex].text
    obj["horario"] = horarioName
    
    
    console.log(obj)

    const modalContent = document.getElementById("modal-confirm-text")

    modalContent.innerHTML = `<p><b>Email: </b> ${obj.email}</p>
    <p><b>Sucursal: </b>${obj.sucursal} </p>
    <p><b>Dia: </b> ${obj.dia}</p>
    <p><b>Horario: </b>${obj.horario} </p>`
  }
  else{
    myModalError("No se pudo confirmar la reserva")
  }
}

const solicitarReservaBox = (statusCode) => {
  if (statusCode == 200){
    modalSolicitar.style.display = "block"
  }
  else{
    myModalError("No se pudo solicitar la reserva")
  }
}

const myModalError = (mensaje) => {
  modalError.style.display = "block"
  const modalContent = document.getElementById("modal-confirm-error")
  modalContent.innerHTML = `<p>${mensaje}</p>`
}


span.onclick = function () {
  modal.style.display = "none"
}

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none"
  }
}

reservaConfirm.onclick = async () => {
  const obj = {}
  const formData = new FormData(form)
  for (const key of formData.keys()) {
    obj[key] = formData.get(key)
  }

  const token = await auth0Client.getUser()
  const idreserva = document.querySelector("#reserva-horario").value

  fetch(`http://localhost:3000/api/reservas/confirmar/${idreserva}`,{
     method:'POST',
     body: JSON.stringify({
        userId: token ? hashMail(token.email): 0,
        email: obj.email
     })
     }).then(res => {
      if (res.status == 200){
        console.log("Reserva confirmada")
        solicitarReservaBox(res.status)
      }
      else{
        myModalError("No se pudo confirmar la reserva")
      }
      
  })

  modal.style.display = "none"
}

const misReservasButton = document.getElementById("btn-misReservas")



misReservasButton.addEventListener("click",async ()=>{
    const user = await auth0Client.getUser()
    console.log(user)

    const TOKEN =  window.sessionStorage.getItem("token")
    const options = {
      headers:{
        authorization:`Bearer ${TOKEN}`
      }
    }
    const reservasBlock = document.getElementById("reservas-bar")

    if (reservasBlock.style.display === "none"){
      reservasBlock.style.display = "block" 

      const name = document.getElementById("user-nombre")
      name.innerText = user.name
      
      const reqMyReservas = await fetch("http://localhost:3000/api/myReservas", options)
      const reservas = await reqMyReservas.json()

      let html = ''
      reservas.forEach(r => {
        html += `
        <div class="row card text-white bg-dark" id="reserva-${r.id}">
        <h5 class="card-title">${new Date(r.dateTime).toLocaleDateString()}</h5>
        <p class="card-text">${new Date(r.dateTime).toLocaleTimeString()}</p>
        <button type="button" class="btn btn-danger" onclick=cancelar(${r.id})>Cancelar</button>
      </div>`
      })
      document.getElementById("mis-reservas").innerHTML = html
    } else {
      reservasBlock.style.display="none"
    }
    
    
    
})


const cancelar = async (id)=>{
  console.log(id)

  const TOKEN =  window.sessionStorage.getItem("token")
  const options = {
    method: 'DELETE',
    headers:{
      authorization:`Bearer ${TOKEN}`
    }
  }

  const reqEliminarReserva = await fetch(`http://localhost:3000/api/reservas/delete/${id}`, options)

  document.getElementById(`reserva-${id}`).style.display="none";
  console.log(reqEliminarReserva)
}