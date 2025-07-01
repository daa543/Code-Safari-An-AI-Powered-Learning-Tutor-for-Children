// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Show role selection modal
  showRoleSelectionModal();
  
  // Initialize all animations
  animateContent();
  
  // Handle mobile menu toggle
  setupMobileMenu();
  
  // Handle testimonial slider
  setupTestimonialSlider();
  
  // Handle scroll events
  handleScrollEvents();
  
  // Setup role selection
  setupRoleSelection();
});

// Show role selection modal
function showRoleSelectionModal() {
  const roleModal = document.getElementById('role-selection');
  
  // Check if user has already selected a role
  const savedRole = localStorage.getItem('userRole');
  
  if (!savedRole) {
    // Show the modal with animation
    setTimeout(() => {
      roleModal.classList.add('active');
    }, 1500);
  } else {
    // Update UI with saved role
    updateRoleUI(savedRole);
  }
}

// Setup role selection functionality
function setupRoleSelection() {
  const childOption = document.getElementById('child-option');
  const parentOption = document.getElementById('parent-option');
  const roleModal = document.getElementById('role-selection');
  const switchRoleBtn = document.getElementById('switch-role-btn');
  const mobileSwitchRoleBtn = document.getElementById('mobile-switch-role-btn');
  
  // Handle child option click
  childOption.addEventListener('click', () => {
    selectRole('child');
    roleModal.classList.remove('active');
  });
  
  // Handle parent option click
  parentOption.addEventListener('click', () => {
    selectRole('parent');
    roleModal.classList.remove('active');
  });
  
  // Handle switch role button click
  switchRoleBtn.addEventListener('click', () => {
    roleModal.classList.add('active');
  });
  
  // Handle mobile switch role button click
  mobileSwitchRoleBtn.addEventListener('click', () => {
    roleModal.classList.add('active');
  });
}

// Select a role and update UI
function selectRole(role) {
  // Save role to localStorage
  localStorage.setItem('userRole', role);
  
  // Update UI
  updateRoleUI(role);
}

// Update UI based on selected role
function updateRoleUI(role) {
  const roleBadge = document.getElementById('role-badge');
  const mobileRoleBadge = document.getElementById('mobile-role-badge');
  
  if (role === 'child') {
    roleBadge.textContent = 'Explorer';
    mobileRoleBadge.textContent = 'Explorer';
    document.body.classList.remove('parent-mode');
    document.body.classList.add('child-mode');
  } else {
    roleBadge.textContent = 'Parent';
    mobileRoleBadge.textContent = 'Parent';
    document.body.classList.remove('child-mode');
    document.body.classList.add('parent-mode');
  }
}

// Create fireflies effect
function createFireflies() {
  const fireflies = document.getElementById('fireflies');
  const numberOfFireflies = 30;
  
  for (let i = 0; i < numberOfFireflies; i++) {
    const firefly = document.createElement('div');
    firefly.classList.add('floating-element');
    
    // Random position
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    
    // Random size
    const size = Math.random() * 10 + 5;
    
    // Random color (yellows and greens)
    const hue = Math.random() * 60 + 60; // 60-120 (yellow to green)
    const saturation = Math.random() * 50 + 50; // 50-100%
    const lightness = Math.random() * 20 + 80; // 80-100%
    const alpha = Math.random() * 0.4 + 0.2; // 0.2-0.6
    
    firefly.style.left = `${posX}%`;
    firefly.style.top = `${posY}%`;
    firefly.style.width = `${size}px`;
    firefly.style.height = `${size}px`;
    firefly.style.backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    
    // Add animation with random duration and delay
    animateFirefly(firefly);
    
    fireflies.appendChild(firefly);
  }
}

// Animate a single firefly
function animateFirefly(firefly) {
  const duration = Math.random() * 4 + 3; // 3-7 seconds
  const delay = Math.random() * 5; // 0-5 seconds
  
  setTimeout(() => {
    const moveX = Math.random() * 100 - 50; // -50 to 50
    const moveY = Math.random() * 100 - 50; // -50 to 50
    const newOpacity = Math.random() * 0.5 + 0.1; // 0.1 to 0.6
    
    firefly.style.transition = `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out`;
    firefly.style.transform = `translate(${moveX}px, ${moveY}px)`;
    firefly.style.opacity = newOpacity;
    
    // Continue animation
    setTimeout(() => {
      animateFirefly(firefly);
    }, duration * 1000);
  }, delay * 1000);
}

// Animate hero section content
function animateHeroSection() {
  // Typing effect for the title
  const heroTitle = document.getElementById('hero-title');
  const text = heroTitle.textContent;
  heroTitle.textContent = '';
  heroTitle.style.opacity = 1;
  
  // Create a typing animation
  let i = 0;
  const typeInterval = setInterval(() => {
    if (i < text.length) {
      heroTitle.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typeInterval);
      
      // After typing is complete, fade in the rest
      setTimeout(() => {
        document.getElementById('hero-text').style.opacity = 1;
        document.getElementById('hero-text').style.transform = 'translateY(0)';
      }, 300);
      
      setTimeout(() => {
        document.getElementById('cta-btn').style.opacity = 1;
        document.getElementById('cta-btn').style.transform = 'translateY(0)';
      }, 600);
      
      setTimeout(() => {
        document.getElementById('learn-more').style.opacity = 1;
        document.getElementById('learn-more').style.transform = 'translateY(0)';
      }, 800);
      
      setTimeout(() => {
        document.getElementById('hero-img').style.opacity = 1;
        document.getElementById('hero-img').style.transform = 'translateX(0)';
      }, 1000);
      
      setTimeout(() => {
        document.getElementById('mascot').style.opacity = 1;
        document.getElementById('mascot').style.transform = 'translateY(0)';
        animateMascot();
      }, 1200);
    }
  }, 40);
}

// Animate features section on scroll
function animateFeaturesSection() {
  const sectionTitle = document.querySelector('.features .section-title');
  const sectionSubtitle = document.querySelector('.features .section-subtitle');
  const featureCards = document.querySelectorAll('.feature-card');
  
  // Create an Intersection Observer for the section title
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionTitle.style.opacity = 1;
        sectionTitle.style.transform = 'translateY(0)';
        
        setTimeout(() => {
          sectionSubtitle.style.opacity = 1;
          sectionSubtitle.style.transform = 'translateY(0)';
        }, 300);
        
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  titleObserver.observe(sectionTitle);
  
  // Create an Intersection Observer for feature cards
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  featureCards.forEach((card, index) => {
    setTimeout(() => {
      cardObserver.observe(card);
    }, index * 100);
  });
}

// Animate testimonials section
function animateTestimonialsSection() {
  const sectionTitle = document.querySelector('.testimonials .section-title');
  const sectionSubtitle = document.querySelector('.testimonials .section-subtitle');
  const testimonials = document.querySelectorAll('.testimonial-content');
  
  // Create an Intersection Observer for the section title
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionTitle.style.opacity = 1;
        sectionTitle.style.transform = 'translateY(0)';
        
        setTimeout(() => {
          sectionSubtitle.style.opacity = 1;
          sectionSubtitle.style.transform = 'translateY(0)';
        }, 300);
        
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  titleObserver.observe(sectionTitle);
  
  // Create an Intersection Observer for testimonials
  const testimonialObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'scale(1)';
        testimonialObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  testimonials.forEach(testimonial => {
    testimonialObserver.observe(testimonial);
  });
}

// Animate CTA section
function animateCTASection() {
  const ctaTitle = document.querySelector('.cta h2');
  const ctaText = document.querySelector('.cta p');
  const ctaButton = document.querySelector('.cta .btn');
  
  // Create an Intersection Observer for the CTA section
  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        ctaTitle.style.opacity = 1;
        ctaTitle.style.transform = 'translateY(0)';
        
        setTimeout(() => {
          ctaText.style.opacity = 1;
          ctaText.style.transform = 'translateY(0)';
        }, 300);
        
        setTimeout(() => {
          ctaButton.style.opacity = 1;
          ctaButton.style.transform = 'translateY(0)';
        }, 600);
        
        ctaObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  ctaObserver.observe(ctaTitle);
}

// Animate mascot with walking effect
function animateMascot() {
  const mascot = document.getElementById('mascot');
  
  // Horizontal movement
  setInterval(() => {
    mascot.style.transform = 'translateX(10px)';
    
    setTimeout(() => {
      mascot.style.transform = 'translateX(-10px)';
    }, 1500);
  }, 3000);
}

// Setup mobile menu toggle
function setupMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
  
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
  
  // Close mobile menu when a link is clicked
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  });
}

// Setup testimonial slider
function setupTestimonialSlider() {
  const slider = document.getElementById('testimonial-slider');
  const testimonials = slider.querySelectorAll('.testimonial');
  const prevBtn = document.getElementById('prev-testimonial');
  const nextBtn = document.getElementById('next-testimonial');
  const dots = document.querySelectorAll('.dot');
  
  let currentIndex = 0;
  const totalTestimonials = testimonials.length;
  
  // Initialize slider - make all testimonials visible initially
  testimonials.forEach(testimonial => {
    testimonial.style.display = 'block';
  });
  
  // Function to update the slider position
  function updateSlider() {
    // Reset all testimonials
    testimonials.forEach((testimonial, index) => {
      if (index === currentIndex) {
        testimonial.style.display = 'block';
      } else {
        testimonial.style.display = 'none';
      }
    });
    
    // Update slider position
    slider.style.transform = `translateX(0)`;
    
    // Update active dot
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }
  
  // Initial update
  updateSlider();
  
  // Event listeners for navigation buttons
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalTestimonials) % totalTestimonials;
    updateSlider();
  });
  
  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalTestimonials;
    updateSlider();
  });
  
  // Event listeners for dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentIndex = index;
      updateSlider();
    });
  });
  
  // Auto-advance the slider every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalTestimonials;
    updateSlider();
  }, 5000);
}

// Handle scroll events
function handleScrollEvents() {
  const header = document.querySelector('header');
  
  window.addEventListener('scroll', () => {
    // Add scrolled class to header when scrolled
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Initialize all animations
function animateContent() {
  createFireflies();
  animateHeroSection();
  animateFeaturesSection();
  animateTestimonialsSection();
  animateCTASection();
}

// Handle resize events
window.addEventListener('resize', () => {
  // Refresh animations or layout if needed
});