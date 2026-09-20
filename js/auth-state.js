import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const authContainer = document.querySelector("#auth-container");

if (authContainer) {
  onAuthStateChanged(auth, async (user) => {
    // Пользователь НЕ вошёл
    if (!user) {
      authContainer.innerHTML = `
                <a href="login.html" class="header__auth-button">
                    👤 Войти
                </a>
            `;

      return;
    }

    // Получаем документ пользователя из Firestore
    try {
      const userRef = doc(db, "users", user.uid);

      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        console.error("Документ пользователя не найден");

        return;
      }

      const userData = userSnapshot.data();

      // Если пользователь администратор
      const adminButton =
        userData.role === "admin"
          ? `
                        <a
                            href="admin.html"
                            class="header__admin-button"
                        >
                            ⚙ Админ-панель
                        </a>
                      `
          : "";

      // Показываем информацию о вошедшем пользователе
      authContainer.innerHTML = `

                ${adminButton}

                <a
                    href="profile.html"
                    class="header__auth-button"
                >
                    👤 ${userData.name}
                </a>

                <button
                    id="logout-button"
                    class="header__logout-button"
                >
                    Выйти
                </button>

            `;

      // Кнопка выхода
      const logoutButton = document.querySelector("#logout-button");

      logoutButton.addEventListener("click", async () => {
        try {
          await signOut(auth);

          window.location.href = "index.html";
        } catch (error) {
          console.error("Ошибка выхода:", error);
        }
      });
    } catch (error) {
      console.error("Ошибка получения пользователя:", error);
    }
  });
}
