/**
 * Apple-Inspired Animations & Interactions
 */

// Navbar Scroll Effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
}

// Scroll-triggered Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all cards and stat elements
document.addEventListener('DOMContentLoaded', () => {
  // Animate cards on scroll
  const cards = document.querySelectorAll('.app-card, .stat-card, .card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    animateOnScroll.observe(card);
  });
  
  // Stagger animation for stats
  const stats = document.querySelectorAll('.stat-card');
  stats.forEach((stat, index) => {
    stat.style.animationDelay = `${index * 0.15}s`;
  });
});

// Smooth Parallax Effect
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  parallaxElements.forEach(element => {
    const speed = element.dataset.parallax || 0.5;
    element.style.transform = `translateY(${scrolled * speed}px)`;
  });
});

// Card Hover 3D Effect
const appCards = document.querySelectorAll('.app-card');
appCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) translateX(4px)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) translateX(0)';
  });
});

// Button Ripple Effect
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple styles
const style = document.createElement('style');
style.textContent = `
  .btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Number Counter Animation
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Animate stat numbers on scroll
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      const value = parseInt(entry.target.textContent);
      entry.target.textContent = '0';
      animateCounter(entry.target, value);
      entry.target.dataset.animated = 'true';
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-value').forEach(stat => {
  statObserver.observe(stat);
});

// Magnetic Button Effect
const magneticButtons = document.querySelectorAll('.btn-primary, .btn-success');
magneticButtons.forEach(button => {
  button.addEventListener('mousemove', (e) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(0, 0)';
  });
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
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

// Modal Entrance Animation
const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
  modal.addEventListener('shown.bs.modal', function() {
    const modalDialog = this.querySelector('.modal-dialog');
    modalDialog.style.opacity = '0';
    modalDialog.style.transform = 'scale(0.8) translateY(-50px)';
    
    setTimeout(() => {
      modalDialog.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      modalDialog.style.opacity = '1';
      modalDialog.style.transform = 'scale(1) translateY(0)';
    }, 10);
  });
});

// Input Focus Animation
const inputs = document.querySelectorAll('.form-control');
inputs.forEach(input => {
  input.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
  });
  
  input.addEventListener('blur', function() {
    if (!this.value) {
      this.parentElement.classList.remove('focused');
    }
  });
});

// Loading State Animation
function showLoading(button) {
  const originalText = button.innerHTML;
  button.dataset.originalText = originalText;
  button.disabled = true;
  button.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    Loading...
  `;
}

function hideLoading(button) {
  button.disabled = false;
  button.innerHTML = button.dataset.originalText;
}

// Export functions for use in other scripts
window.AppleUI = {
  showLoading,
  hideLoading,
  animateCounter
};

// Lazy Loading for Images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Keyboard Navigation Enhancement
document.addEventListener('keydown', (e) => {
  // ESC key to close modals
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
      const bsModal = bootstrap.Modal.getInstance(openModal);
      bsModal?.hide();
    }
  }
  
  // CMD/CTRL + K for search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('search');
    searchInput?.focus();
  }
});

// Performance optimization - Debounce scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Apply debounce to scroll handlers
const debouncedScroll = debounce(() => {
  // Any expensive scroll operations go here
}, 10);

window.addEventListener('scroll', debouncedScroll);

console.log('🍎 Apple-inspired animations loaded');
