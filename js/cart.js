// ==========================================
// 01. Cart
// ==========================================

// ------------------------------------------
// Initialize
// ------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
});

// ------------------------------------------
// Get Cart
// ------------------------------------------

function getCart() {
    return JSON.parse(
        localStorage.getItem("cart")
    ) || [];
}

// ------------------------------------------
// Render Cart
// ------------------------------------------

function renderCart() {
    const cart = getCart();
    const cartList =
        document.querySelector(
            ".p-cart__list"
        );

    cartList.innerHTML = "";
    if (cart.length === 0) {
        cartList.innerHTML = createEmptyCart();
    } else {

        cart.forEach((item) => {
            cartList.innerHTML +=
            createCartCard(item);
        });
    }
    updateSummary(cart);
}

// ------------------------------------------
// Create Cart Card
// ------------------------------------------

function createCartCard(item) {
    return `
        <article class="p-cart-card">
            <div class="p-cart-card__image">
                <img src="${item.image}"
                    alt="${item.name}">
            </div>
            <div class="p-cart-card__body">
                <h3 class="p-cart-card__title">
                    ${item.name}
                </h3>
                ${
                    item.optionName
                        ? `
                    <p class="p-cart-card__option">
                        ${item.optionName}：
                        ${item.optionValue}
                    </p>
                        `
                        : ""
                }
            <p class="p-cart-card__price">
                ¥${item.price.toLocaleString()}
            </p>
            <div class="p-cart-card__quantity">
                <button
                    class="p-cart-card__quantity-btn"
                    data-action="decrease"
                    data-id="${item.id}"
                    data-option-name="${item.optionName}"
                    data-option="${item.optionValue}">
                    −
                </button>
                <span class="p-cart-card__quantity-value">
                    ${item.quantity}
                </span>
                <button
                    class="p-cart-card__quantity-btn"
                    data-action="increase"
                    data-id="${item.id}"
                    data-option-name="${item.optionName}"
                    data-option="${item.optionValue}">
                    ＋
                </button>
            </div>
        </div>
        <button
            class="p-cart-card__remove"
            data-id="${item.id}"
            data-option-name="${item.optionName}"
            data-option="${item.optionValue}">
            <i class="fa-solid fa-trash"></i>
        </button>
        </article>
    `;
}

// ------------------------------------------
// Empty Cart
// ------------------------------------------

function createEmptyCart() {
    return `
        <div class="p-cart-empty">
            <i class="fa-solid fa-bag-shopping
                    p-cart-empty__icon"></i>
            <h3 class="p-cart-empty__title">
                Your cart is empty
            </h3>
            <p class="p-cart-empty__text">
                現在カートに商品はありません。
            </p>
            <a
                href="shop.html"
                class="c-button
                        c-button--primary">
                商品一覧を見る
            </a>
        </div>
    `;
}

// ------------------------------------------
// Update Summary
// ------------------------------------------

function updateSummary(cart) {
    const totalQuantity = cart.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    const totalPrice = cart.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);

    const shipping = totalPrice >= 5000 ? 0 : 550;

    document.getElementById("cart-count").textContent =
        `${totalQuantity}点`;

    document.getElementById("cart-subtotal").textContent =
        `¥${totalPrice.toLocaleString()}`;

    document.getElementById("cart-shipping").textContent =
        shipping === 0
            ? "無料"
            : `¥${shipping.toLocaleString()}`;

    document.getElementById("cart-shipping-message").textContent =
        shipping === 0
            ? "送料無料"
            : "5,000円以上のお買い上げで送料無料";

    document.getElementById("cart-total").textContent =
        `¥${(totalPrice + shipping).toLocaleString()}`;

}

// ------------------------------------------
// Update Quantity
// ------------------------------------------

function updateQuantity(id, optionName, optionValue, action) {
    const cart = getCart();
    const item = cart.find((product) => {

        return (
            product.id === id &&
            product.optionName === optionName &&
            product.optionValue === optionValue
        );
    });

    if (!item) return;
    if (action === "increase") {
        item.quantity++;
    }

    if (action === "decrease" && item.quantity > 1) {
        item.quantity--;
    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );
    renderCart();
}

// ------------------------------------------
// Quantity Button
// ------------------------------------------

document.addEventListener("click", (event) => {
    const quantityButton = event.target.closest(
        ".p-cart-card__quantity-btn"
    );

    if (quantityButton) {
        updateQuantity(
            quantityButton.dataset.id,
            quantityButton.dataset.optionName,
            quantityButton.dataset.option,
            quantityButton.dataset.action
        );

        return;
    }

    const removeButton = event.target.closest(
        ".p-cart-card__remove"
    );
    if (removeButton) {
        removeItem(
            removeButton.dataset.id,
            removeButton.dataset.optionName,
            removeButton.dataset.option
        );
    }
});

// ------------------------------------------
// Remove Item
// ------------------------------------------

function removeItem(id, optionName, optionValue) {
    const cart = getCart().filter((product) => {
        return !(
            product.id === id &&
            product.optionName === optionName &&
            product.optionValue === optionValue
        );
    });

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    renderCart();
}