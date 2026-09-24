import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

// ===============================
// ЭЛЕМЕНТЫ СТРАНИЦЫ
// ===============================

const productsContainer = document.querySelector("#products-container");
const productsCount = document.querySelector("#products-count");
const searchInput = document.querySelector("#search-input");
const minPriceInput = document.querySelector("#min-price");
const maxPriceInput = document.querySelector("#max-price");
const sortSelect = document.querySelector("#sort-select");

// ===============================
// ТОВАРЫ
// ===============================

let products = [];

// ===============================
// ПОЛУЧЕНИЕ ТОВАРОВ
// ===============================

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

    // Сразу показываем все товары
    applyFilters();

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

// ===============================
// ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ===============================

function applyFilters() {

  // Получаем значения фильтров

  const searchValue = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

 const selectedCategory = document.querySelector(
  'input[name="category"]:checked'
);

const categoryValue = selectedCategory
  ? selectedCategory.value
  : "all";
  const minPrice = minPriceInput && minPriceInput.value
    ? Number(minPriceInput.value)
    : 0;

  const maxPrice = maxPriceInput && maxPriceInput.value
    ? Number(maxPriceInput.value)
    : Infinity;

  const sortValue = sortSelect
    ? sortSelect.value
    : "default";


  // ===============================
  // ФИЛЬТРАЦИЯ
  // ===============================

  let filteredProducts = products.filter((product) => {

    // Поиск

    const name = String(product.name || "").toLowerCase();
    const description = String(product.description || "").toLowerCase();

    const matchesSearch =
      name.includes(searchValue) ||
      description.includes(searchValue);


    // Категория

    // const matchesCategory =
    //   categoryValue === "all" ||
    //   product.category === categoryValue;
const categoryMap = {
  processors: ["processors", "processor", "процессор", "процессоры"],
  videocards: ["videocards", "videocard", "видеокарта", "видеокарты"],
  motherboards: [
    "motherboards",
    "motherboard",
    "материнская плата",
    "материнские платы"
  ],
  ram: [
    "ram",
    "оперативная память",
    "оперативная память"
  ],
  storage: [
    "storage",
    "накопитель",
    "накопители"
  ],
  power: [
    "power",
    "блок питания",
    "блоки питания"
  ]
};

const productCategory = String(
  product.category || ""
).trim().toLowerCase();

const matchesCategory =
  categoryValue === "all" ||
  (
    categoryMap[categoryValue] &&
    categoryMap[categoryValue].includes(productCategory)
  );

    // Цена

    const price = Number(product.price) || 0;

    const matchesPrice =
      price >= minPrice &&
      price <= maxPrice;


    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice
    );
  });


  // ===============================
  // СОРТИРОВКА
  // ===============================

  switch (sortValue) {

    case "price-asc":
      filteredProducts.sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
      break;

    case "price-desc":
      filteredProducts.sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
      break;

    case "name-asc":
      filteredProducts.sort(
        (a, b) =>
          String(a.name).localeCompare(
            String(b.name),
            "ru"
          )
      );
      break;

    case "name-desc":
      filteredProducts.sort(
        (a, b) =>
          String(b.name).localeCompare(
            String(a.name),
            "ru"
          )
      );
      break;

    default:
      // Оставляем исходный порядок
      break;
  }


  // Показываем результат

  renderProducts(filteredProducts);
}

// ===============================
// ОТОБРАЖЕНИЕ ТОВАРОВ
// ===============================

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

    productsCount.textContent =
      "Найдено товаров: 0";

    return;
  }


  productsCount.textContent =
    `Найдено товаров: ${productsList.length}`;


  productsList.forEach((product) => {

    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
      <a
        href="product.html?id=${product.id}"
        class="product-card__link"
      >

        <div class="product-card__image">

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

        </div>


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

          </div>

        </div>

      </a>


      <button
        class="product-card__button"
        type="button"
        data-product-id="${product.id}"
        title="Добавить в корзину"
      >
        🛒
      </button>
    `;


    productsContainer.appendChild(card);
  });
}

// ===============================
// НАЗВАНИЕ КАТЕГОРИИ
// ===============================

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

// ===============================
// ФОРМАТ ЦЕНЫ
// ===============================

function formatPrice(price) {

  return new Intl.NumberFormat("ru-RU")
    .format(price) + " ₸";
}

// ===============================
// ОБРАБОТЧИКИ ФИЛЬТРОВ
// ===============================

// Поиск

if (searchInput) {

  searchInput.addEventListener(
    "input",
    applyFilters
  );

}


// Категория

const categoryFilters = document.querySelectorAll(
  'input[name="category"]'
);

categoryFilters.forEach((radio) => {
  radio.addEventListener("change", applyFilters);
});

// Минимальная цена

if (minPriceInput) {

  minPriceInput.addEventListener(
    "input",
    applyFilters
  );

}


// Максимальная цена

if (maxPriceInput) {

  maxPriceInput.addEventListener(
    "input",
    applyFilters
  );

}


// Сортировка

if (sortSelect) {

  sortSelect.addEventListener(
    "change",
    applyFilters
  );

}


// ===============================
// ЗАПУСК
// ===============================

getProducts();