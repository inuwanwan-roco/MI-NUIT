(() => {
    'use strict';

    // Save IDs only. SHOP markup remains the source of names, prices and images.
    // The cart's storage key and legacy data-id values are intentionally untouched.
    const storageKey = 'mi_nuit_wishlist_v1';
    const notice = document.getElementById('wishlist-status');
    const list = document.querySelector('.p-wishlist__list');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const renderedCards = new Map();
    const removalTimers = new Map();
    let canPersist = true;
    let catalog = new Map();
    let selected = new Set();

    function storageUnavailable() {
        canPersist = false;
        if (notice) {
            notice.textContent = 'お気に入りを保存できません。変更はこのページ内のみ反映されます。ブラウザの保存設定をご確認ください。';
            notice.hidden = false;
        }
    }

    function readSavedIds() {
        if (!canPersist) return new Set(selected);
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id))) {
                throw new Error('Invalid wishlist data');
            }
            return new Set(value);
        } catch {
            storageUnavailable();
            return new Set(selected);
        }
    }

    function getCatalog(root) {
        const products = new Map();
        root.querySelectorAll('.p-products-card').forEach(card => {
            // Keep saved IDs stable and independent of both links and legacy cart IDs.
            const id = card.dataset.wishlistId;
            if (!id || !/^[a-z0-9-]+$/.test(id) || products.has(id)) {
                throw new Error('Product wishlist IDs must be unique');
            }
            products.set(id, {
                id,
                name: card.dataset.name,
                price: Number(card.dataset.price),
                priceText: card.querySelector('.p-products-card__price').textContent.trim(),
                image: card.dataset.image
            });
        });
        if (!products.size) throw new Error('No products found');
        return products;
    }

    function updateButton(button, product) {
        const active = selected.has(product.id);
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute('aria-label', `${product.name}をお気に入り${active ? 'から解除' : 'に登録'}`);
        button.title = active ? 'お気に入りから解除' : 'お気に入りに登録';
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-solid', active);
        icon.classList.toggle('fa-regular', !active);
        if (!active) button.classList.remove('is-added');
    }

    function createButton(product) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'c-wishlist-toggle';
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-heart';
        icon.setAttribute('aria-hidden', 'true');
        button.append(icon);
        updateButton(button, product);
        button.addEventListener('animationend', () => button.classList.remove('is-added'));
        button.addEventListener('click', () => {
            // Re-read before changing one item so another tab's changes are preserved.
            selected = readSavedIds();
            const adding = !selected.has(product.id);
            if (adding) selected.add(product.id);
            else selected.delete(product.id);
            if (canPersist) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify([...selected]));
                } catch {
                    storageUnavailable();
                }
            }
            refresh();
            if (adding) button.classList.add('is-added');
        });
        return button;
    }

    function createCard(product) {
        const card = document.createElement('article');
        card.className = 'p-wishlist-card';
        card.dataset.wishlistId = product.id;
        const visual = document.createElement('div');
        visual.className = 'p-wishlist-card__image';
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.name;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => {
            image.hidden = true;
            const placeholder = document.createElement('span');
            placeholder.className = 'p-wishlist-card__image-notice';
            placeholder.textContent = '画像を準備中です';
            visual.append(placeholder);
        }, { once: true });
        visual.append(image);
        const body = document.createElement('div');
        body.className = 'p-wishlist-card__body';
        const heading = document.createElement('h2');
        heading.className = 'p-wishlist-card__title';
        heading.textContent = product.name;
        const price = document.createElement('p');
        price.className = 'p-wishlist-card__price';
        price.textContent = product.priceText;
        body.append(heading, price);
        card.append(visual, createButton(product), body);
        return card;
    }

    function updateEmptyState() {
        document.querySelector('.p-wishlist__empty').hidden = renderedCards.size > 0;
    }

    function renderWishlist() {
        const products = [...selected].map(id => catalog.get(id)).filter(Boolean);
        const ids = new Set(products.map(product => product.id));
        document.querySelector('.p-wishlist__count').textContent = `${products.length}件のお気に入り`;

        for (const [id, card] of renderedCards) {
            if (ids.has(id) || removalTimers.has(id)) continue;
            if (card.contains(document.activeElement)) {
                const remaining = [...renderedCards].find(([otherId]) => ids.has(otherId));
                if (remaining) remaining[1].querySelector('button').focus({ preventScroll: true });
                else {
                    const title = document.getElementById('wishlist-title');
                    title.tabIndex = -1;
                    title.focus({ preventScroll: true });
                }
            }
            card.inert = true;
            card.classList.add('is-removing');
            const remove = () => {
                card.remove();
                renderedCards.delete(id);
                removalTimers.delete(id);
                updateEmptyState();
            };
            if (reducedMotion.matches) remove();
            else removalTimers.set(id, window.setTimeout(remove, 250));
        }
        for (const product of products) {
            let card = renderedCards.get(product.id);
            if (removalTimers.has(product.id)) {
                clearTimeout(removalTimers.get(product.id));
                removalTimers.delete(product.id);
                card.inert = false;
                card.classList.remove('is-removing');
            }
            if (!card) {
                card = createCard(product);
                renderedCards.set(product.id, card);
                list.append(card);
            }
            updateButton(card.querySelector('button'), product);
        }
        updateEmptyState();
    }

    function refresh() {
        document.querySelectorAll('.p-products-card[data-wishlist-id]').forEach(card => {
            const button = card.querySelector('.c-wishlist-toggle');
            if (button) updateButton(button, catalog.get(card.dataset.wishlistId));
        });
        if (list && catalog.size) renderWishlist();
    }

    async function loadWishlist() {
        const section = document.querySelector('.p-wishlist__content');
        const loading = document.querySelector('.p-wishlist__loading');
        const error = document.querySelector('.p-wishlist__error');
        section.setAttribute('aria-busy', 'true');
        loading.hidden = false;
        error.hidden = true;
        try {
            // Read current SHOP data rather than duplicate product information or save stale prices.
            const response = await fetch('shop.html');
            if (!response.ok) throw new Error('Unable to load SHOP');
            const html = new DOMParser().parseFromString(await response.text(), 'text/html');
            catalog = getCatalog(html);
            refresh();
        } catch {
            error.hidden = false;
        } finally {
            loading.hidden = true;
            section.setAttribute('aria-busy', 'false');
        }
    }

    selected = readSavedIds();
    if (list) {
        document.querySelector('.p-wishlist__retry').addEventListener('click', loadWishlist);
        loadWishlist();
    } else {
        catalog = getCatalog(document);
        document.querySelectorAll('.p-products-card').forEach(card => {
            card.append(createButton(catalog.get(card.dataset.wishlistId)));
        });
    }
    // Synchronize pages opened in other tabs, including an explicit storage clear.
    window.addEventListener('storage', event => {
        if (event.key === storageKey || event.key === null) {
            selected = readSavedIds();
            refresh();
        }
    });
    // Re-read on back/forward cache restoration, without changing scroll position.
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            selected = readSavedIds();
            refresh();
        }
    });
})();
