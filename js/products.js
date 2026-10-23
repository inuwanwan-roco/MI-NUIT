// ==========================================
// 01. Cart
// ==========================================
// ------------------------------------------
// Add to Cart
// ------------------------------------------

const cartButtons = document.querySelectorAll(
    ".p-products-card__cart"
);

cartButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".p-products-card");
        const item = createCartItem(card);

        if (!item) {
            return;
        }
        try {
            saveCart(item);
            showToast("カートに追加しました");
        } catch {
            showToast("カートに追加できませんでした。保存設定をご確認ください。");
        }
    });
});

// ------------------------------------------
// Create Cart Item
// ------------------------------------------

function createCartItem(card) {
    const optionFieldset = card.querySelector(
        ".p-products-option"
    );

    const optionName = optionFieldset
        ? optionFieldset.dataset.optionName
        : "";

    const checkedOption = card.querySelector(
        'input[type="radio"]:checked'
    );

    const optionValue = checkedOption
        ? checkedOption.value
        : "";

    const quantitySelect = card.querySelector(
        ".p-products-quantity__select"
    );

    const quantity = quantitySelect
        ? Number(quantitySelect.value)
        : 1;

    if (
        card.classList.contains(
            "p-products-card--accordion"
        ) &&
        !checkedOption
    ) {

        showToast(`${optionName}を選択してください`);
        return null;
    }

    return {
        id: card.dataset.wishlistId || card.dataset.id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        image: card.dataset.image,
        optionName,
        optionValue,
        quantity
    };
}

// ==========================================
// 02. Accordion
// ==========================================
// ------------------------------------------
// Select Type
// ------------------------------------------
const accordionButtons = document.querySelectorAll(
    ".p-products-accordion__button"
);

accordionButtons.forEach((button) => {
    const content = button.nextElementSibling;
    content.inert = !button.classList.contains("is-open");
    button.addEventListener("click", () => {

        button.classList.toggle("is-open");

        content.classList.toggle("is-open");
        content.inert = !button.classList.contains("is-open");

        button.setAttribute(
            "aria-expanded",
            button.classList.contains("is-open")
        );
    });
});

// Collection filters and sorting move the original card nodes, preserving all listeners and inputs.
(() => {
    const grid = document.getElementById('shop-products');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.p-products-card')];
    const originalOrder = new Map(cards.map((card, index) => [card, index]));
    const categories = [...document.querySelectorAll('input[name="shop-category"]')];
    const sortControls = [...document.querySelectorAll('[data-products-sort]')];
    const count = document.getElementById('shop-products-count');
    const empty = document.querySelector('.p-products-empty');
    const sidebar = document.querySelector('.p-products-sidebar');
    const toggle = sidebar.querySelector('.p-products-filter__toggle');
    const panel = document.getElementById('shop-filters');
    const mobile = window.matchMedia('(max-width: 768px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nameOrder = new Intl.Collator('ja', { sensitivity: 'base', numeric: true });
    let category = 'all';
    let sort = 'recommended';
    let updateTimer;

    const apply = (animate = true) => {
        const ordered = [...cards].sort((a, b) => {
            let difference = 0;
            if (sort === 'price-asc') difference = Number(a.dataset.price) - Number(b.dataset.price);
            if (sort === 'price-desc') difference = Number(b.dataset.price) - Number(a.dataset.price);
            if (sort === 'name') difference = nameOrder.compare(a.dataset.name, b.dataset.name);
            return difference || originalOrder.get(a) - originalOrder.get(b);
        });
        let visible = 0;
        ordered.forEach(card => {
            card.hidden = category !== 'all' && card.dataset.category !== category;
            if (!card.hidden) visible++;
        });
        grid.append(...ordered);
        count.textContent = `${visible}件の商品`;
        empty.hidden = visible > 0;
        sortControls.forEach(control => { control.value = sort; });
        if (animate && !motion.matches) {
            clearTimeout(updateTimer);
            grid.classList.remove('is-updating');
            // One layout read on a user action restarts the short CSS transition.
            void grid.offsetWidth;
            grid.classList.add('is-updating');
            updateTimer = setTimeout(() => grid.classList.remove('is-updating'), 300);
        }
    };

    categories.forEach(input => {
        const total = cards.filter(card => input.value === 'all' || card.dataset.category === input.value).length;
        input.closest('label').querySelector('.p-products-filter__category-count').textContent = total;
        input.addEventListener('change', () => {
            if (!input.checked) return;
            category = input.value;
            apply();
        });
    });
    sortControls.forEach(control => {
        control.disabled = false;
        control.addEventListener('change', () => {
            sort = control.value;
            apply();
        });
    });
    sidebar.querySelector('fieldset').disabled = false;

    // An inline disclosure needs no body scroll lock or modal focus trap.
    const setOpen = (open, returnFocus = false) => {
        const expanded = !mobile.matches || open;
        if (returnFocus && mobile.matches) toggle.focus({ preventScroll: true });
        sidebar.classList.toggle('is-filter-open', mobile.matches && open);
        toggle.hidden = !mobile.matches;
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.querySelector('.p-products-filter__toggle-icon').textContent = open ? '−' : '＋';
        panel.inert = !expanded;
        panel.setAttribute('aria-hidden', String(!expanded));
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    sidebar.querySelector('[data-filter-close]').addEventListener('click', () => setOpen(false, true));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && mobile.matches && toggle.getAttribute('aria-expanded') === 'true') {
            event.preventDefault();
            setOpen(false, true);
        }
    });
    mobile.addEventListener('change', () => setOpen(false, panel.contains(document.activeElement)));
    document.body.classList.add('has-product-filters');
    setOpen(false);
    apply(false);

    // Progressive enhancement: content remains visible without JS, IO, or motion support.
    const intro = document.querySelector('.p-shop-intro');
    intro.classList.add('is-ready');
    let observer;
    const showAll = () => {
        observer?.disconnect();
        cards.forEach(card => card.classList.remove('is-reveal-pending'));
        grid.classList.remove('is-updating');
    };
    if (typeof window.IntersectionObserver === 'function' && !motion.matches) {
        observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.remove('is-reveal-pending');
                observer.unobserve(entry.target);
            });
        }, { threshold: .05, rootMargin: '0px 0px 24px 0px' });
        cards.forEach(card => {
            card.classList.add('is-reveal-pending');
            observer.observe(card);
        });
    }
    motion.addEventListener('change', () => { if (motion.matches) showAll(); });

    // WISHLIST destinations locate an existing card, without changing the collection layout.
    // A query parameter avoids competing with the browser's native hash scrolling.
    const requestedId = new URLSearchParams(window.location.search).get('product');
    const requestedCard = cards.find(card => card.dataset.wishlistId === requestedId);
    if (requestedCard) {
        const optionToggle = requestedCard.querySelector('.p-products-accordion__button');
        if (optionToggle && optionToggle.getAttribute('aria-expanded') !== 'true') optionToggle.click();
        const loaded = document.readyState === 'complete' ? Promise.resolve() :
            new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        Promise.all([loaded, document.fonts?.ready]).then(async () => {
            // The mobile filter panel collapses on initialization; wait for its
            // existing transition before measuring the product's final position.
            await new Promise(resolve => requestAnimationFrame(resolve));
            await Promise.all(panel.getAnimations().map(animation => animation.finished.catch(() => {})));
            observer?.unobserve(requestedCard);
            requestedCard.classList.remove('is-reveal-pending');
            // offsetTop excludes the reveal transform, keeping the destination stable.
            let top = 0;
            for (let node = requestedCard; node; node = node.offsetParent) top += node.offsetTop;
            const headerHeight = document.querySelector('.l-header').getBoundingClientRect().height;
            const focusTarget = requestedCard.querySelector('.p-products-card__title');
            focusTarget.tabIndex = -1;
            focusTarget.focus({ preventScroll: true });
            window.scrollTo({ top: Math.max(0, top - headerHeight - 24), behavior: motion.matches ? 'instant' : 'smooth' });
        });
    }
})();
