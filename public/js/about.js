// This should be saved as about.js in your JS directory

document.addEventListener("DOMContentLoaded", function () {
  // Testimonials Slider
  const testimonials = document.querySelectorAll(".testimonial");
  const dots = document.querySelectorAll(".testimonial-dots .dot");
  let currentTestimonial = 0;

  // Initialize dots click event
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      changeTestimonial(index);
    });
  });

  // Function to change testimonial
  function changeTestimonial(index) {
    testimonials[currentTestimonial].classList.remove("active");
    dots[currentTestimonial].classList.remove("active");

    currentTestimonial = index;

    testimonials[currentTestimonial].classList.add("active");
    dots[currentTestimonial].classList.add("active");
  }

  // Auto-rotate testimonials
  setInterval(() => {
    let nextTestimonial = (currentTestimonial + 1) % testimonials.length;
    changeTestimonial(nextTestimonial);
  }, 5000);

  // Mobile menu functionality (if not already handled in index.js)
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("active");
    });
  }
});
