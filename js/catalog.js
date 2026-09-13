import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

// Получаем контейнер товаров

const productsContainer = document.querySelector("#products-container");

// Получаем информацию о количестве

const productsCount = document.querySelector("#products-count");

// Количество товаров

let products = [];

// ПОЛУЧЕНИЕ ТОВАРОВ

async function getProducts() {
  try {
    const productsCollection = collection(db, "products");

    const snapshot = await getDocs(productsCollection);

    products = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    console.log("Товары:", products);

    renderProducts(products);
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);

    productsContainer.innerHTML = `
            <div class="catalog-empty">
                <h3>
                    Не удалось загрузить товары
                </h3>
                <p>
                    Попробуйте обновить страницу.
                </p>
            </div>
        `;
  }
}

// ОТОБРАЖЕНИЕ ТОВАРОВ

function renderProducts(productsList) {
  productsContainer.innerHTML = "";

  if (productsList.length === 0) {
    productsContainer.innerHTML = `
            <div class="catalog-empty">
                <h3>
                    Товары не найдены
                </h3>
                <p>
                    Попробуйте изменить параметры поиска.
                </p>
            </div>
        `;

    productsCount.textContent = "Найдено товаров: 0";

    return;
  }

  productsCount.textContent = `Найдено товаров: ${productsList.length}`;

  productsList.forEach((product) => {
    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
            <a
                href="product.html?id=${product.id}"
                class="product-card__image"
            >
                ${
                  product.image
                    ? `
                        <img
                            src="${product.image}"
                            alt="${product.name}"
                        >
                    `
                    : `
                        <span>
                            PC
                        </span>
                    `
                }
            </a>
            <div class="product-card__content">

                <span class="product-card__category">
                    ${getCategoryName(product.category)}
                </span>
                <h3 class="product-card__title">
                    ${product.name}
                </h3>
                <p class="product-card__description">
                    ${product.description || ""}
                </p>
                <div class="product-card__bottom">
                    <strong class="product-card__price">
                        ${formatPrice(product.price)}
                    </strong>
                    <button
                        class="product-card__button"
                        type="button"
                        data-product-id="${product.id}"
                    >
                        🛒
                    </button>
                </div>
            </div>
        `;
    productsContainer.appendChild(card);
  });
}

// НАЗВАНИЕ КАТЕГОРИИ

function getCategoryName(category) {
  const categories = {
    processors: "Процессор",

    videocards: "Видеокарта",

    motherboards: "Материнская плата",

    ram: "Оперативная память",

    storage: "Накопитель",

    power: "Блок питания",
  };

  return categories[category] || "Комплектующее";
}

// ФОРМАТ ЦЕНЫ

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₸";
}

getProducts();
