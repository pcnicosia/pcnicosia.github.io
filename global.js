document.addEventListener("DOMContentLoaded", function() {
    
    // 0. CARICAMENTO DINAMICO DI NAVBAR E FOOTER (I "Mattoncini")
    const p1 = fetch('/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error("File navbar.html non trovato");
            return response.text();
        })
        .then(data => {
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer) {
                navbarContainer.innerHTML = data;
            } else {
                document.body.insertAdjacentHTML('afterbegin', data);
            }

            // --- LOGICA NAVBAR DEFINITIVA (ANTI-BLU BOOTSTRAP) ---
            let currentPage = window.location.pathname.split("/").pop();
            if (currentPage === "") currentPage = "index.html"; 
            
            // 1. Spegne TUTTI i link per azzerare la situazione
            document.querySelectorAll('.nav-link, .bottom-nav-item, .dropdown-item').forEach(el => el.classList.remove('active'));

                        // 2. Accende solo il menu giusto
            if (currentPage === "index.html") {
                // Accendi la Home sia nel menu desktop che in quello mobile
                document.querySelectorAll('a.nav-link[href="index.html"], a.bottom-nav-item[href="index.html"]').forEach(el => el.classList.add('active'));
            } else {

                // Accendi i link normali (es. Documenti, Contatti)
                document.querySelectorAll('.nav-link:not(.dropdown-toggle), .bottom-nav-item').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.includes(currentPage)) {
                        link.classList.add('active');
                    }
                });

                // IL FIX È QUI: Cerchiamo nei sottomenu, ma NON aggiungiamo .active a loro!
                document.querySelectorAll('.dropdown-item').forEach(item => {
                    const href = item.getAttribute('href');
                    if (href && href.includes(currentPage)) {
                        // Trovata la pagina! Ora cerchiamo il "Genitore" (es. Chi Siamo) e accendiamo SOLO LUI
                        const dropdownParent = item.closest('.dropdown');
                        if (dropdownParent) {
                            const toggle = dropdownParent.querySelector('.nav-link.dropdown-toggle');
                            if (toggle) toggle.classList.add('active'); // Questo diventa arancione!
                        }
                    }
                });
            }
            // --- FINE LOGICA NAVBAR ---
        })
        .catch(error => console.error('Errore nel caricamento della navbar:', error));

    const p2 = fetch('/footer.html')
        .then(response => {
            if (!response.ok) throw new Error("File footer.html non trovato");
            return response.text();
        })
        .then(data => {
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = data;
            } else {
                document.body.insertAdjacentHTML('beforeend', data);
            }
        })
        .catch(error => console.error('Errore nel caricamento del footer:', error));

    // FIX ANIMAZIONI AOS: Quando navbar e footer sono caricati, ricalcola le animazioni
    Promise.all([p1, p2]).then(() => {
        setTimeout(() => {
            if (typeof AOS !== 'undefined') {
                AOS.init({ once: true, offset: 50 });
                AOS.refresh();
            }
        }, 100);
    });

    // 1. LOGICA TEMA IMMEDIATA (Non blocca, evita sfarfallii)
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 2. NAVBAR DINAMICA (Leggera, gestisce lo scroll della navbar quando viene caricata)
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.glass-nav');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.remove('py-2');
                navbar.classList.add('py-0');
            } else {
                navbar.classList.remove('py-0');
                navbar.classList.add('py-2');
            }
        }
    });

    // 3. INIEZIONE RITARDATA (Risolve il lag)
    setTimeout(function() {
        
        // INIEZIONE STILI GLOBALI E FIX DEFINITIVO DARK MODE
        const styles = `
            html { scroll-behavior: smooth; }
            .floating-btn-global { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background-color: #25D366; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; z-index: 9999; box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3); text-decoration: none; transition: transform 0.3s; }
            .floating-btn-global:hover { transform: scale(1.15) translateY(-5px); color: white; }
            
            .floating-theme-global { position: fixed; bottom: 30px; left: 30px; width: 45px; height: 45px; background-color: var(--text-color); color: var(--bg-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999 !important; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); cursor: pointer; border: none; transition: transform 0.3s, background-color 0.3s, color 0.3s; }
            .floating-theme-global:hover { transform: scale(1.15) translateY(-5px); }

            /* MODIFICA PER IL MOBILE: TASTI ABBASSATI A 90px (QUASI ATTACCATI ALLA BARRA) */
            @media (max-width: 991px) {
                .floating-btn-global { bottom: 90px !important; right: 20px; width: 50px; height: 50px; font-size: 1.5rem; }
                .floating-theme-global { display: flex !important; bottom: 90px !important; left: 20px; width: 40px; height: 40px; }
            }

            /* =========================================
               ANTI-BUG DARK MODE (DOMA BOOTSTRAP)
               ========================================= */
            [data-theme="dark"] .text-dark { color: var(--text-color) !important; }
            [data-theme="dark"] .text-secondary { color: var(--text-light) !important; }
            [data-theme="dark"] .bg-white { background-color: var(--card-bg) !important; }
            [data-theme="dark"] .bg-light { background-color: var(--secondary-bg) !important; }
            [data-theme="dark"] .border-secondary { border-color: var(--card-border) !important; }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // INIEZIONE ELEMENTI HTML
        const floatingElements = `
            <button id="globalThemeToggle" class="floating-theme-global" title="Cambia tema">
                <i class="fa-solid ${savedTheme === 'dark' ? 'fa-sun text-warning' : 'fa-moon'}"></i>
            </button>
            <a href="https://wa.me/3513633864" target="_blank" class="floating-btn-global">
                <i class="fa-brands fa-whatsapp"></i>
            </a>
        `;
        document.body.insertAdjacentHTML('beforeend', floatingElements);

        // ATTIVAZIONE BOTTONE TEMA DOPO L'INIEZIONE
        const themeToggleBtn = document.getElementById('globalThemeToggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                const iconClass = newTheme === 'dark' ? 'fa-sun text-warning' : 'fa-moon';
                this.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
            });
        }
        
    }, 150); 

});
