function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const count = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  const cartCount = document.querySelector("#cart-count");

  if (cartCount) {
    cartCount.textContent = count;
  }
}

updateCartCount();
