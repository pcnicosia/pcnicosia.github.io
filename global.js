document.addEventListener("DOMContentLoaded", function() {
    
    // 1. INIEZIONE DEGLI STILI (Smooth Scroll e Grafica del Tasto WhatsApp)
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

    // =================================================================
    // 4. MODIFICHE DINAMICHE DEL PRESIDENTE (Applicate a tutte le pagine)
    // =================================================================

    // Modifica 1 e 2: Cambia nome nella Navbar e lo rende visibile su Mobile
    const navBrandSpan = document.querySelector('.navbar-brand span');
    if (navBrandSpan) {
        navBrandSpan.innerHTML = "P.A. GRUPPO VOLONTARI<br>PROTEZIONE CIVILE<br>NICOSIA O.D.V.";
        navBrandSpan.classList.remove('d-none', 'd-sm-block'); // Toglie il blocco mobile
        navBrandSpan.style.fontSize = "0.70rem";
        navBrandSpan.style.lineHeight = "1.2";
    }

    // Modifica 3: Rimuove il tasto "Diventa Volontario" dalla Navbar (PC e Mobile)
    const navBtnPC = document.querySelector('.nav-right-wing .btn-elite-outline');
    if (navBtnPC) navBtnPC.remove();
    
    const navBtnMobile = document.querySelector('#menuNav .text-center.mt-3.d-lg-none');
    if (navBtnMobile) navBtnMobile.remove();

    // Modifica 4: Cambia il nome nel Footer
    const footerTitle = document.querySelector('footer h5');
    if (footerTitle) {
        footerTitle.innerText = "P.A. Gruppo Volontari Protezione Civile Nicosia";
    }

    // Modifica 5: Rimuove il logo ANPAS piccolo dal Footer
    const footerAnpasLogo = document.querySelector('footer .d-inline-block.bg-white');
    if (footerAnpasLogo) footerAnpasLogo.remove();

});
