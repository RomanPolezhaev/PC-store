import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { auth, db } from "./firebase.js";

const cartItemsElement = document.querySelector("#cart-items");

const cartTotalElement = document.querySelector("#cart-total");

const cartTotalFinalElement = document.querySelector("#cart-total-final");

const checkoutButton = document.querySelector("#checkout-button");

const checkoutMessage = document.querySelector("#checkout-message");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

renderCart();

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  const cart = getCart();

  if (cart.length === 0) {
    cartItemsElement.innerHTML = `
            <div class="empty-cart">

                <h2>
                    Корзина пуста
                </h2>

                <p>
                    Добавьте товары из каталога.
                </p>

                <a href="catalog.html">
                    Перейти в каталог
                </a>

            </div>
        `;

    updateTotal([]);

    checkoutButton.disabled = true;

    return;
  }

  checkoutButton.disabled = false;

  cartItemsElement.innerHTML = "";

  cart.forEach((item) => {
    const element = document.createElement("article");

    element.className = "cart-item";

    element.innerHTML = `

            <img
                src="${escapeHtml(item.image || "")}"
                alt="${escapeHtml(item.name)}"
                class="cart-item__image"
                onerror="this.style.display='none'"
            >


            <div>

                <h3 class="cart-item__name">
                    ${escapeHtml(item.name)}
                </h3>


                <div class="cart-item__brand">
                    ${escapeHtml(item.brand || "")}
                </div>


                <div class="cart-item__price">
                    ${formatPrice(item.price)}
                </div>

            </div>


            <div class="cart-item__controls">

                <div>

                    <button
                        class="quantity-button"
                        data-minus="${item.id}"
                    >
                        −
                    </button>


                    <span class="quantity-value">
                        ${item.quantity}
                    </span>


                    <button
                        class="quantity-button"
                        data-plus="${item.id}"
                    >
                        +
                    </button>

                </div>


                <button
                    class="remove-button"
                    data-remove="${item.id}"
                >
                    🗑 Удалить
                </button>

            </div>

        `;

    cartItemsElement.appendChild(element);
  });

  addListeners();

  updateTotal(cart);
}

function addListeners() {
  document.querySelectorAll("[data-minus]").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.minus, -1);
    });
  });

  document.querySelectorAll("[data-plus]").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.plus, 1);
    });
  });

  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(button.dataset.remove);
    });
  });
}

function changeQuantity(id, change) {
  const cart = getCart();

  const item = cart.find((item) => item.id === id);

  if (!item) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    removeFromCart(id);

    return;
  }

  if (item.stock && newQuantity > item.stock) {
    showCheckoutMessage(`Доступно только ${item.stock} шт.`);

    return;
  }

  item.quantity = newQuantity;

  saveCart(cart);

  renderCart();

  updateCartCount();
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);

  saveCart(cart);

  renderCart();

  updateCartCount();
}

function updateTotal(cart) {
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),

    0,
  );

  const formatted = formatPrice(total);

  cartTotalElement.textContent = formatted;

  cartTotalFinalElement.textContent = formatted;
}

checkoutButton.addEventListener("click", checkout);

async function checkout() {
  const cart = getCart();

  if (cart.length === 0) {
    return;
  }

  if (!currentUser) {
    showCheckoutMessage("Для оформления заказа войдите в аккаунт.");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

    return;
  }

  checkoutButton.disabled = true;

  checkoutButton.textContent = "Оформление...";

  try {
    const total = cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),

      0,
    );

    const orderItems = cart.map((item) => ({
      productId: item.id,

      name: item.name,

      price: Number(item.price),

      quantity: Number(item.quantity),
    }));

    await addDoc(collection(db, "orders"), {
      userId: currentUser.uid,

      items: orderItems,

      total,

      status: "new",

      createdAt: serverTimestamp(),
    });

    localStorage.removeItem("cart");

    updateCartCount();

    cartItemsElement.innerHTML = `
            <div class="empty-cart">

                <h2>
                    Заказ оформлен!
                </h2>

                <p>
                    Спасибо за покупку.
                    Заказ сохранён в личном кабинете.
                </p>

                <a href="profile.html">
                    Перейти в личный кабинет
                </a>

            </div>
        `;

    updateTotal([]);

    checkoutButton.disabled = true;

    checkoutButton.textContent = "Заказ оформлен";
  } catch (error) {
    console.error("Ошибка оформления заказа:", error);

    showCheckoutMessage("Не удалось оформить заказ.");

    checkoutButton.disabled = false;

    checkoutButton.textContent = "Оформить заказ";
  }
}

function updateCartCount() {
  const cart = getCart();

  const count = cart.reduce(
    (sum, item) => sum + Number(item.quantity),

    0,
  );

  const element = document.querySelector("#cart-count");

  if (element) {
    element.textContent = count;
  }
}

function showCheckoutMessage(message) {
  checkoutMessage.textContent = message;

  setTimeout(() => {
    checkoutMessage.textContent = "";
  }, 3000);
}

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

updateCartCount();
