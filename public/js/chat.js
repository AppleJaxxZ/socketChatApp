const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#sendLocation");

//turns on the socket on the client side thats being sent from the server-side

socket.on("message", (msg) => {
  console.log("Server Message: ", msg);
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  console.log("Message Sent from client!");
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log("Error", error);
    }
    console.log("Message Delivered!");
  });
});

$locationButton.addEventListener("click", () => {
  $locationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    socket.emit(
      "sendLocation",
      {
        latitude: lat,
        longitude: long,
      },
      () => {
        console.log("Location Shared");
        $locationButton.removeAttribute("disabled");
      }
    );
  });
});
