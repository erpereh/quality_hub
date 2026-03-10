// JavaScript para el menú principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quality Solutions - Menú Principal cargado');
    
    // Puedes añadir funcionalidad adicional aquí en el futuro
    // Por ejemplo: animaciones, validaciones, etc.
    
    // Ejemplo de funcionalidad básica: hover effects mejorados
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Smooth scrolling para enlaces internos si se añaden en el futuro
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});