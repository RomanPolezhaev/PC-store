import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const registerForm = document.querySelector("#register-form");

const message = document.querySelector("#register-message");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector("#name").value.trim();

  const email = document.querySelector("#email").value.trim();

  const password = document.querySelector("#password").value;

  const passwordConfirm = document.querySelector("#password-confirm").value;

  if (password !== passwordConfirm) {
    message.textContent = "Пароли не совпадают";

    return;
  }

  try {
    message.textContent = "Создание аккаунта...";

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name,
    });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,

      name: name,

      email: email,

      role: "user",

      status: "active",

      createdAt: serverTimestamp(),
    });

    message.textContent = "Регистрация успешна!";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error(error);

    message.textContent = getAuthErrorMessage(error.code);
  }
});

function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "Этот email уже зарегистрирован.";

    case "auth/invalid-email":
      return "Некорректный email.";

    case "auth/weak-password":
      return "Пароль слишком слабый.";

    case "auth/network-request-failed":
      return "Ошибка сети.";

    default:
      return "Произошла ошибка регистрации.";
  }
}
