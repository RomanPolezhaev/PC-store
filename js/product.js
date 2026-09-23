import {
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

const productContainer = document.querySelector("#product-container");

// Получаем ID товара из URL
const urlParams = new URLSearchParams(window.location.search);

const productId = urlParams.get("id");

if (!productId) {
  productContainer.innerHTML = `
        <div class="product-error">
            <h2>Товар не найден</h2>

            <p>
                В адресе страницы отсутствует ID товара.
            </p>

            <a href="catalog.html">
                Вернуться в каталог
            </a>
        </div>
    `;
} else {
  loadProduct(productId);
}

function loadProduct(id) {
  const productRef = doc(db, "products", id);

  // Используем realtime-обновление
  onSnapshot(
    productRef,

    (snapshot) => {
      if (!snapshot.exists()) {
        productContainer.innerHTML = `
                    <div class="product-error">
                        <h2>Товар не найден</h2>

                        <p>
                            Возможно, товар был удалён.
                        </p>

                        <a href="catalog.html">
                            Вернуться в каталог
                        </a>
                    </div>
                `;

        return;
      }

      const product = snapshot.data();

      renderProduct(snapshot.id, product);
    },

    (error) => {
      console.error(error);

      productContainer.innerHTML = `
                <div class="product-error">
                    <h2>Ошибка загрузки товара</h2>
                    <p>Попробуйте обновить страницу.</p>
                </div>
            `;
    },
  );
}

function renderProduct(id, product) {
  const stock = Number(product.stock) || 0;

  const rating = Number(product.rating) || 0;

  productContainer.innerHTML = `

        <div class="product__image-wrapper">

            <img
                src="${escapeHtml(product.image || "")}"
                alt="${escapeHtml(product.name || "Товар")}"
                class="product__image"
                onerror="this.style.display='none'"
            >

        </div>


        <div class="product__info">

            <div class="product__category">
                ${getCategoryName(product.category)}
            </div>


            <h1 class="product__title">
                ${escapeHtml(product.name || "Без названия")}
            </h1>


            <div class="product__brand">
                Производитель:
                <strong>
                    ${escapeHtml(product.brand || "Не указан")}
                </strong>
            </div>


            <div class="product__rating">
                ⭐ ${rating.toFixed(1)} / 5
            </div>


            <p class="product__description">
                ${escapeHtml(
                  product.description || "Описание товара отсутствует.",
                )}
            </p>


            <div class="product__price">
                ${formatPrice(product.price)}
            </div>


            <div class="product__stock">

                ${stock > 0 ? `В наличии: ${stock} шт.` : "Нет в наличии"}

            </div>


            <div class="product__buy">

                <input
                    type="number"
                    id="product-quantity"
                    class="product__quantity"
                    min="1"
                    max="${stock}"
                    value="1"
                    ${stock === 0 ? "disabled" : ""}
                >


                <button
                    id="add-to-cart"
                    class="product__button"
                    ${stock === 0 ? "disabled" : ""}
                >
                    🛒 Добавить в корзину
                </button>

            </div>


            <div
                id="product-message"
                class="product__message"
            ></div>

        </div>
    `;

  const button = document.querySelector("#add-to-cart");

  const quantityInput = document.querySelector("#product-quantity");

  if (button) {
    button.addEventListener("click", () => {
      const quantity = Number(quantityInput.value);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
        showMessage("Укажите корректное количество.");

        return;
      }

      addToCart(id, product, quantity);
    });
  }
}

function addToCart(id, product, quantity) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id,

      name: product.name,

      brand: product.brand || "",

      price: Number(product.price) || 0,

      image: product.image || "",

      stock: Number(product.stock) || 0,

      quantity,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  showMessage("Товар добавлен в корзину!");

  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const count = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  const cartCount = document.querySelector("#cart-count");

  if (cartCount) {
    cartCount.textContent = count;
  }
}

function showMessage(message) {
  const element = document.querySelector("#product-message");

  if (!element) return;

  element.textContent = message;

  setTimeout(() => {
    element.textContent = "";
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

updateCartCount();
