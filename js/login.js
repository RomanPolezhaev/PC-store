import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { auth } from "./firebase.js";

const loginForm = document.querySelector("#login-form");

const message = document.querySelector("#login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.querySelector("#email").value.trim();

  const password = document.querySelector("#password").value;

  try {
    message.textContent = "Выполняется вход...";

    await signInWithEmailAndPassword(auth, email, password);

    message.textContent = "Вход выполнен!";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  } catch (error) {
    console.error(error);

    message.textContent = getLoginErrorMessage(error.code);
  }
});

function getLoginErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Неверный email или пароль.";

    case "auth/user-disabled":
      return "Этот аккаунт заблокирован.";

    case "auth/too-many-requests":
      return "Слишком много попыток. Попробуйте позже.";

    case "auth/network-request-failed":
      return "Ошибка сети.";

    default:
      return "Не удалось выполнить вход.";
  }
}
