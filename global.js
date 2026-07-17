document.addEventListener("DOMContentLoaded", function() {
    
    // 1. INIEZIONE DEGLI STILI (Smooth Scroll e Grafica del Tasto WhatsApp)
    // Questo script inserisce il CSS direttamente nell'head di ogni pagina in automatico
    const styles = `
        html { 
            scroll-behavior: smooth; 
        }
        .floating-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background-color: #25D366;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            text-decoration: none;
        }
        .floating-btn:hover {
            transform: scale(1.15) translateY(-5px);
            color: white;
            box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // 2. INIEZIONE AUTOMATICA DEL BOTTONE WHATSAPP
    // Inserisce l'HTML del bottone in fondo al body di ogni pagina
    const whatsappHTML = `
        <a href="https://wa.me/3513633864" target="_blank" class="floating-btn">
            <i class="fa-brands fa-whatsapp"></i>
        </a>
    `;
    document.body.insertAdjacentHTML('beforeend', whatsappHTML);


    // 3. NAVBAR DINAMICA (Shrink on scroll)
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.glass-nav');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.remove('py-3');
                navbar.classList.add('py-1');
            } else {
                navbar.classList.remove('py-1');
                navbar.classList.add('py-3');
            }
        }
    });

});
