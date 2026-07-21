document.addEventListener("DOMContentLoaded", function() {
    
    // 1. INIEZIONE DEGLI STILI BASE E WHATSAPP PER LE VECCHIE PAGINE
    const styles = `
        html { scroll-behavior: smooth; }
        
        /* Stili di emergenza per WhatsApp sulle vecchie pagine */
        .floating-btn-global {
            position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background-color: #25D366; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; z-index: 1000; box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3); text-decoration: none; transition: transform 0.3s;
        }
        .floating-btn-global:hover { transform: scale(1.15) translateY(-5px); color: white; }
        
        @media (max-width: 991px) {
            .floating-btn-global { bottom: 100px !important; right: 20px; width: 50px; height: 50px; font-size: 1.5rem; }
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 2. INIEZIONE INTELLIGENTE DI WHATSAPP
    // Se la pagina NON ha già il bottone fluttuante (come succede nelle vecchie pagine), lo aggiunge.
    if (!document.querySelector('.floating-btn')) {
        const whatsappHTML = `
            <a href="https://wa.me/3513633864" target="_blank" class="floating-btn-global">
                <i class="fa-brands fa-whatsapp"></i>
            </a>
        `;
        document.body.insertAdjacentHTML('beforeend', whatsappHTML);
    }

    // 3. NAVBAR DINAMICA (Si restringe leggermente quando scorri la pagina)
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
