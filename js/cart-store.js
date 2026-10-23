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
}
