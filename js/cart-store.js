// Shared by SHOP and WISHLIST. Keep the existing cart key and item structure.
function saveCart(item) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(cart)) throw new Error('Invalid cart data');

    // New additions use unique product IDs. Match older category-based IDs by
    // the unchanged product name as well, without rewriting saved IDs or clearing data.
    const existingItem = cart.find(product => product &&
        (product.id === item.id || product.name === item.name) &&
        product.optionName === item.optionName &&
        product.optionValue === item.optionValue);

    if (existingItem) {
        const quantity = Number(existingItem.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Invalid cart quantity');
        existingItem.quantity = quantity + item.quantity;
    } else {
        cart.push(item);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart:updated'));
}

// Reuse the existing header badge design without changing the saved cart data.
(() => {
    const badges = document.querySelectorAll('[data-cart-count]');
    if (!badges.length) return;

    const updateCount = () => {
        let count = 0;
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(cart)) {
                count = cart.reduce((total, item) => {
                    const quantity = Number(item?.quantity);
                    return total + (Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0);
                }, 0);
            }
        } catch {
            // Unavailable or invalid storage must not block shopping or overwrite data.
        }
        const text = count === 0 ? '' : count > 99 ? '99+' : String(count);
        const label = `カートを見る（${count}点）`;
        badges.forEach(badge => {
            if (badge.textContent !== text) badge.textContent = text;
            badge.hidden = count === 0;
            const link = badge.closest('a');
            if (link && link.getAttribute('aria-label') !== label) link.setAttribute('aria-label', label);
        });
    };

    updateCount();
    // Same-tab additions update immediately after a successful save.
    window.addEventListener('cart:updated', updateCount);
    // Quantity changes/removals in CART and clearing after checkout also sync across tabs.
    window.addEventListener('storage', event => {
        if (event.key === 'cart' || event.key === null) updateCount();
    });
    window.addEventListener('pageshow', updateCount);
})();
