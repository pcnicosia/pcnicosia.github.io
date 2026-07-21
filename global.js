document.addEventListener("DOMContentLoaded", function() {
    
    // 1. INIEZIONE STILI GLOBALI (WhatsApp, Tema e Navbar)
    const styles = `
        html { scroll-behavior: smooth; }
        
        /* Stili per il bottone di WhatsApp Globale */
        .floating-btn-global {
            position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background-color: #25D366; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; z-index: 9999; box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3); text-decoration: none; transition: transform 0.3s;
        }
        .floating-btn-global:hover { transform: scale(1.15) translateY(-5px); color: white; }
        
        /* Stili per il bottone del Tema Globale (Luna/Sole) */
        .floating-theme-global {
            position: fixed; bottom: 30px; left: 30px; width: 45px; height: 45px; background-color: var(--text-color); color: var(--bg-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999 !important; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); cursor: pointer; border: none; transition: transform 0.3s, background-color 0.3s, color 0.3s;
        }
        .floating-theme-global:hover { transform: scale(1.15) translateY(-5px); }

        /* Adattamento Mobile dei pulsanti fluttuanti */
        @media (max-width: 991px) {
            .floating-btn-global { bottom: 110px !important; right: 20px; width: 50px; height: 50px; font-size: 1.5rem; }
            .floating-theme-global { display: flex !important; bottom: 110px !important; left: 20px; width: 40px; height: 40px; }
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 2. INIEZIONE ELEMENTI HTML
    const floatingElements = `
        <button id="globalThemeToggle" class="floating-theme-global" title="Cambia tema">
            <i class="fa-solid fa-moon"></i>
        </button>
        <a href="https://wa.me/3513633864" target="_blank" class="floating-btn-global">
            <i class="fa-brands fa-whatsapp"></i>
        </a>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingElements);


    // 3. LOGICA DARK/LIGHT MODE GLOBALE BLINDATA
    const themeToggleBtn = document.getElementById('globalThemeToggle');
        
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const iconClass = theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon';
        if (themeToggleBtn) themeToggleBtn.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
    }

    // CARICA SEMPRE LIGHT AL PRIMO AVVIO IGNORANDO IL SISTEMA
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('light'); 
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    if(themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    // 4. NAVBAR DINAMICA
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
});
