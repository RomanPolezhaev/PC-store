import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const adminUser = document.querySelector("#admin-user");

const logoutButton = document.querySelector("#logout-button");

const productForm = document.querySelector("#product-form");

const productId = document.querySelector("#product-id");

const productName = document.querySelector("#product-name");

const productBrand = document.querySelector("#product-brand");

const productCategory = document.querySelector("#product-category");

const productPrice = document.querySelector("#product-price");

const productStock = document.querySelector("#product-stock");

const productRating = document.querySelector("#product-rating");

const productImage = document.querySelector("#product-image");

const productDescription = document.querySelector("#product-description");

const productSubmit = document.querySelector("#product-submit");

const productMessage = document.querySelector("#product-message");

const cancelEdit = document.querySelector("#cancel-edit");

const productsTable = document.querySelector("#products-table");

const usersTable = document.querySelector("#users-table");

let currentUser = null;

// ============================================
// ПРОВЕРКА АДМИНИСТРАТОРА
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";

    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);

    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      window.location.href = "index.html";

      return;
    }

    const userData = userSnapshot.data();

    if (userData.role !== "admin") {
      alert("У вас нет доступа к админ-панели.");

      window.location.href = "index.html";

      return;
    }

    if (userData.status === "blocked") {
      alert("Ваш аккаунт заблокирован.");

      await signOut(auth);

      window.location.href = "login.html";

      return;
    }

    adminUser.textContent = `Вы вошли как администратор: ${userData.name}`;

    // После успешной проверки запускаем админку
    subscribeToProducts();

    subscribeToUsers();
  } catch (error) {
    console.error(error);

    adminUser.textContent = "Ошибка проверки доступа.";
  }
});

// ============================================
// ТОВАРЫ — REAL-TIME
// ============================================

function subscribeToProducts() {
  const productsRef = collection(db, "products");

  onSnapshot(
    productsRef,
    (snapshot) => {
      productsTable.innerHTML = "";

      if (snapshot.empty) {
        productsTable.innerHTML = `
                    <tr>
                        <td colspan="5">
                            Товаров пока нет.
                        </td>
                    </tr>
                `;

        return;
      }

      snapshot.forEach((document) => {
        const product = document.data();

        const row = document.createElement("tr");

        row.innerHTML = `

                    <td>
                        ${escapeHtml(product.name || "Без названия")}
                    </td>

                    <td>
                        ${getCategoryName(product.category)}
                    </td>

                    <td>
                        ${formatPrice(product.price)}
                    </td>

                    <td>
                        ${product.stock ?? 0}
                    </td>

                    <td>

                        <div class="admin-actions">

                            <button
                                data-edit="${document.id}"
                            >
                                Изменить
                            </button>

                            <button
                                class="btn-danger"
                                data-delete="${document.id}"
                            >
                                Удалить
                            </button>

                        </div>

                    </td>

                `;

        productsTable.appendChild(row);
      });

      addProductButtonListeners();
    },
    (error) => {
      console.error(error);

      productsTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Не удалось загрузить товары.
                    </td>
                </tr>
            `;
    },
  );
}

// ============================================
// ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ
// ============================================

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productData = {
    name: productName.value.trim(),

    brand: productBrand.value.trim(),

    category: productCategory.value,

    price: Number(productPrice.value),

    stock: Number(productStock.value),

    rating: Number(productRating.value) || 0,

    image: productImage.value.trim(),

    description: productDescription.value.trim(),

    updatedAt: serverTimestamp(),
  };

  try {
    // РЕДАКТИРОВАНИЕ

    if (productId.value) {
      const productRef = doc(db, "products", productId.value);

      await updateDoc(productRef, productData);

      showProductMessage("Товар успешно изменён.");
    }

    // ДОБАВЛЕНИЕ
    else {
      productData.createdAt = serverTimestamp();

      await addDoc(collection(db, "products"), productData);

      showProductMessage("Товар успешно добавлен.");
    }

    resetProductForm();
  } catch (error) {
    console.error(error);

    showProductMessage("Ошибка сохранения товара.");
  }
});

// ============================================
// КНОПКИ ТОВАРОВ
// ============================================

function addProductButtonListeners() {
  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      editProduct(button.dataset.edit);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteProduct(button.dataset.delete);
    });
  });
}

// ============================================
// РЕДАКТИРОВАНИЕ ТОВАРА
// ============================================

async function editProduct(id) {
  try {
    const productRef = doc(db, "products", id);

    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) {
      return;
    }

    const product = snapshot.data();

    productId.value = id;

    productName.value = product.name || "";

    productBrand.value = product.brand || "";

    productCategory.value = product.category || "processors";

    productPrice.value = product.price ?? 0;

    productStock.value = product.stock ?? 0;

    productRating.value = product.rating ?? 0;

    productImage.value = product.image || "";

    productDescription.value = product.description || "";

    productSubmit.textContent = "Сохранить изменения";

    cancelEdit.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error(error);
  }
}

// ============================================
// УДАЛЕНИЕ
// ============================================

async function deleteProduct(id) {
  const confirmed = confirm("Вы действительно хотите удалить этот товар?");

  if (!confirmed) {
    return;
  }

  try {
    await deleteDoc(doc(db, "products", id));

    showProductMessage("Товар удалён.");
  } catch (error) {
    console.error(error);

    showProductMessage("Ошибка удаления товара.");
  }
}

// ============================================
// ОТМЕНА РЕДАКТИРОВАНИЯ
// ============================================

cancelEdit.addEventListener("click", resetProductForm);

function resetProductForm() {
  productForm.reset();

  productId.value = "";

  productRating.value = "0";

  productSubmit.textContent = "Добавить товар";

  cancelEdit.hidden = true;
}

// ============================================
// ПОЛЬЗОВАТЕЛИ — REAL-TIME
// ============================================

function subscribeToUsers() {
  const usersRef = collection(db, "users");

  onSnapshot(
    usersRef,
    (snapshot) => {
      usersTable.innerHTML = "";

      if (snapshot.empty) {
        usersTable.innerHTML = `
                    <tr>
                        <td colspan="5">
                            Пользователей нет.
                        </td>
                    </tr>
                `;

        return;
      }

      snapshot.forEach((document) => {
        const user = document.data();

        const isCurrentUser = document.id === currentUser.uid;

        const row = document.createElement("tr");

        row.innerHTML = `

                    <td>
                        ${escapeHtml(user.name || "Без имени")}
                    </td>

                    <td>
                        ${escapeHtml(user.email || "")}
                    </td>

                    <td>

                        <select
                            class="admin-select"
                            data-role-user="${document.id}"
                            ${isCurrentUser ? "disabled" : ""}
                        >

                            <option
                                value="user"
                                ${user.role === "user" ? "selected" : ""}
                            >
                                user
                            </option>

                            <option
                                value="admin"
                                ${user.role === "admin" ? "selected" : ""}
                            >
                                admin
                            </option>

                        </select>

                    </td>

                    <td>

                        <select
                            class="admin-select"
                            data-status-user="${document.id}"
                            ${isCurrentUser ? "disabled" : ""}
                        >

                            <option
                                value="active"
                                ${user.status !== "blocked" ? "selected" : ""}
                            >
                                active
                            </option>

                            <option
                                value="blocked"
                                ${user.status === "blocked" ? "selected" : ""}
                            >
                                blocked
                            </option>

                        </select>

                    </td>

                    <td>

                        ${
                          isCurrentUser
                            ? "Текущий аккаунт"
                            : `
                                    <button
                                        data-save-user="${document.id}"
                                        class="btn btn-primary"
                                    >
                                        Сохранить
                                    </button>
                                  `
                        }

                    </td>

                `;

        usersTable.appendChild(row);
      });

      addUserButtonListeners();
    },
    (error) => {
      console.error(error);

      usersTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Не удалось загрузить пользователей.
                    </td>
                </tr>
            `;
    },
  );
}

// ============================================
// СОХРАНЕНИЕ ПОЛЬЗОВАТЕЛЯ
// ============================================

function addUserButtonListeners() {
  document.querySelectorAll("[data-save-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.dataset.saveUser;

      const roleSelect = document.querySelector(`[data-role-user="${userId}"]`);

      const statusSelect = document.querySelector(
        `[data-status-user="${userId}"]`,
      );

      try {
        await updateDoc(doc(db, "users", userId), {
          role: roleSelect.value,

          status: statusSelect.value,
        });

        alert("Данные пользователя обновлены.");
      } catch (error) {
        console.error(error);

        alert("Не удалось изменить пользователя.");
      }
    });
  });
}

// ============================================
// ВЫХОД
// ============================================

logoutButton.addEventListener("click", async () => {
  await signOut(auth);

  window.location.href = "index.html";
});

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function showProductMessage(text) {
  productMessage.textContent = text;

  setTimeout(() => {
    productMessage.textContent = "";
  }, 3000);
}

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(price || 0) + " ₸";
}

function getCategoryName(category) {
  const categories = {
    processors: "Процессоры",

    videocards: "Видеокарты",

    motherboards: "Материнские платы",

    ram: "Оперативная память",

    storage: "Накопители",

    power: "Блоки питания",
  };

  return categories[category] || category || "Другое";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
