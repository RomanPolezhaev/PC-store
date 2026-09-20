import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const profileForm = document.querySelector("#profile-form");

const nameInput = document.querySelector("#profile-name");

const emailInput = document.querySelector("#profile-email");

const roleInput = document.querySelector("#profile-role");

const statusInput = document.querySelector("#profile-status");

const message = document.querySelector("#profile-message");

const ordersContainer = document.querySelector("#orders-container");

let currentUser = null;

// ============================================
// ПРОВЕРКА АВТОРИЗАЦИИ
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";

    return;
  }

  currentUser = user;

  await loadProfile();

  subscribeToOrders();
});

// ============================================
// ЗАГРУЗКА ПРОФИЛЯ
// ============================================

async function loadProfile() {
  try {
    const userRef = doc(db, "users", currentUser.uid);

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      message.textContent = "Профиль не найден.";

      return;
    }

    const userData = snapshot.data();

    nameInput.value = userData.name || "";

    emailInput.value = userData.email || currentUser.email;

    roleInput.value = userData.role || "user";

    statusInput.value = userData.status || "active";
  } catch (error) {
    console.error(error);

    message.textContent = "Не удалось загрузить профиль.";
  }
}

// ============================================
// СОХРАНЕНИЕ ИМЕНИ
// ============================================

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newName = nameInput.value.trim();

  if (!newName) {
    message.textContent = "Введите имя.";

    return;
  }

  try {
    const userRef = doc(db, "users", currentUser.uid);

    await updateDoc(userRef, {
      name: newName,
    });

    message.textContent = "Профиль сохранён.";

    setTimeout(() => {
      message.textContent = "";
    }, 3000);
  } catch (error) {
    console.error(error);

    message.textContent = "Не удалось сохранить профиль.";
  }
});

// ============================================
// ИСТОРИЯ ЗАКАЗОВ
// ============================================

function subscribeToOrders() {
  const ordersRef = collection(db, "orders");

  const ordersQuery = query(ordersRef, where("userId", "==", currentUser.uid));

  onSnapshot(
    ordersQuery,
    (snapshot) => {
      ordersContainer.innerHTML = "";

      if (snapshot.empty) {
        ordersContainer.innerHTML = `
                    <p>
                        У вас пока нет заказов.
                    </p>
                `;

        return;
      }

      const orders = [];

      snapshot.forEach((document) => {
        orders.push({
          id: document.id,
          ...document.data(),
        });
      });

      // Новые заказы сверху
      orders.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;

        const dateB = b.createdAt?.toMillis?.() || 0;

        return dateB - dateA;
      });

      orders.forEach((order) => {
        const element = document.createElement("article");

        element.className = "order-card";

        const date = order.createdAt?.toDate
          ? order.createdAt.toDate().toLocaleString("ru-RU")
          : "Дата неизвестна";

        element.innerHTML = `

                    <div class="order-card__header">

                        <strong>
                            Заказ #${order.id}
                        </strong>

                        <span class="order-card__status">
                            ${escapeHtml(order.status || "new")}
                        </span>

                    </div>


                    <p>
                        Дата: ${date}
                    </p>


                    <p class="order-card__total">

                        ${formatPrice(order.total)}

                    </p>

                `;

        ordersContainer.appendChild(element);
      });
    },
    (error) => {
      console.error(error);

      ordersContainer.innerHTML = `
                <p>
                    Не удалось загрузить историю заказов.
                </p>
            `;
    },
  );
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(price || 0) + " ₸";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
