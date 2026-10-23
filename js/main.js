
// ==========================================
// 01. UI
// ==========================================

// Toast

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    const text = toast.querySelector(".c-toast__text");

    text.textContent = message;

    toast.classList.add("is-show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        toast.classList.remove("is-show");
    }, 2000);
}

// ==========================================
// 02. Utility
// ==========================================


// Shared header: preserve page interactions while exposing mobile navigation.
document.querySelectorAll('.l-header').forEach((siteHeader) => {
    const toggle = siteHeader.querySelector('.l-header__toggle');
    const navigation = siteHeader.querySelector('.l-header__nav');
    const updateScroll = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 50);
    if (!siteHeader.classList.contains('l-header--steady')) {
        updateScroll();
        window.addEventListener('scroll', updateScroll, { passive: true });
    }
    if (!toggle || !navigation) return;
    const setOpen = (open, focusMenu = false) => {
        siteHeader.classList.toggle('is-menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
        if (open && focusMenu) navigation.querySelector('a')?.focus();
    };
    // Use the same four homepage sections on phones; keep the original PC/tablet nodes intact.
    const menu = navigation.querySelector('.l-header__menu');
    const phoneNavigation = window.matchMedia('(max-width: 768px)');
    if (menu) {
        const originalItems = [...menu.childNodes];
        const homepagePrefix = document.body.classList.contains('p-top-page') ? '' : 'index.html';
        const phoneItems = [
            ['Brand Story', 'brand'],
            ['Products', 'products'],
            ['Special Care', 'special-care'],
            ['Contact', 'contact']
        ].map(([label, section]) => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            item.className = 'l-header__item';
            link.className = 'l-header__link';
            link.href = `${homepagePrefix}#${section}`;
            link.textContent = label;
            item.append(link);
            return item;
        });
        const updateNavigation = () => {
            setOpen(false);
            // SHOP uses its authored HOME/section links at every width.
            const usePhoneItems = phoneNavigation.matches && !siteHeader.classList.contains('l-header--shop');
            menu.replaceChildren(...(usePhoneItems ? phoneItems : originalItems));
        };
        updateNavigation();
        phoneNavigation.addEventListener('change', updateNavigation);

        // Defer incoming homepage section anchors until load-time refreshes finish.
        // Removing the initial hash prevents native and scripted scrolling from competing.
        const initialHash = location.hash;
        const initialSection = document.body.classList.contains('p-top-page') &&
            phoneItems.some((item) => item.firstElementChild.getAttribute('href') === initialHash) &&
            document.getElementById(initialHash.slice(1));
        if (initialSection && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') {
            history.replaceState(history.state, '', location.pathname + location.search);
            const alignInitialSection = async () => {
                await document.fonts.ready;
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (location.hash) return; // Respect a newer navigation selected during loading.
                    history.replaceState(history.state, '', initialHash);
                    initialSection.scrollIntoView({
                        block: 'start',
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
                    });
                }));
            };
            if (document.readyState === 'complete') alignInitialSection();
            else window.addEventListener('load', alignInitialSection, { once: true });
        }
    }
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true', true));
    navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            setOpen(false);
            toggle.focus({ preventScroll: true });
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus();
        }
    });
    document.addEventListener('click', (event) => {
        if (!siteHeader.contains(event.target)) setOpen(false);
    });
    siteHeader.addEventListener('focusout', (event) => {
        if (event.relatedTarget && !siteHeader.contains(event.relatedTarget)) setOpen(false);
    });
    window.matchMedia('(max-width: 1100px)').addEventListener('change', () => setOpen(false));
});

// Shared footer TOP link: preserve smooth scrolling and honor reduced motion.
document.querySelector('.p-footer__back-to-top')?.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('.l-header__logo a')?.focus({ preventScroll: true });
    window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
});
