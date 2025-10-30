// ============================================
// STATE MANAGEMENT (In-Memory)
// ============================================
const state = {
  sessionId: generateSessionId(),
  variant: Math.random() < 0.5 ? 'A' : 'B',
  startTime: Date.now(),
  events: [],
  leads: [],
  scrollDepths: new Set(),
  timeMilestones: new Set()
};

// Helper functions for in-memory storage
function saveLead(leadData) {
  state.leads.push(leadData);
}

function getAllLeads() {
  return state.leads;
}

function getAllEvents() {
  return state.events;
}

// Set variant on body
document.body.setAttribute('data-variant', state.variant);
console.log(`A/B Test Variant: ${state.variant}`);
console.log(`Session ID: ${state.sessionId}`);

// Update CTA text based on variant
if (state.variant === 'B') {
  document.getElementById('enterpriseCta').textContent = 'Get a Quote in 60 Seconds';
}

// ============================================
// ANALYTICS TRACKING
// ============================================
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function trackEvent(eventName, data = {}) {
  const event = {
    event: eventName,
    timestamp: new Date().toISOString(),
    variant: state.variant,
    sessionId: state.sessionId,
    ...data
  };
  
  state.events.push(event);
  console.log('📊 Event Tracked:', event);
}

// Track page view
trackEvent('page_view');

// Video debugging and error handling
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  heroVideo.addEventListener('loadeddata', () => {
    console.log('✅ Hero video loaded successfully!');
    console.log('Video info:', {
      src: heroVideo.currentSrc,
      duration: heroVideo.duration + 's',
      dimensions: heroVideo.videoWidth + 'x' + heroVideo.videoHeight
    });
    trackEvent('video_loaded');
  });
  
  heroVideo.addEventListener('error', (e) => {
    console.error('❌ Video failed to load:', e);
    console.error('Video source:', heroVideo.querySelector('source')?.src);
    trackEvent('video_error', { error: e.type });
  });
  
  heroVideo.addEventListener('canplay', () => {
    console.log('▶️ Video can play');
  });
}

// Track scroll depth
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = Math.floor((scrollTop / docHeight) * 100);
  
  [25, 50, 75, 100].forEach(milestone => {
    if (scrollPercent >= milestone && !state.scrollDepths.has(milestone)) {
      state.scrollDepths.add(milestone);
      trackEvent('scroll_depth', { depth: milestone });
    }
  });
  
  lastScrollTop = scrollTop;
});

// Track time on page
setInterval(() => {
  const timeOnPage = Math.floor((Date.now() - state.startTime) / 1000);
  [30, 60, 120].forEach(milestone => {
    if (timeOnPage >= milestone && !state.timeMilestones.has(milestone)) {
      state.timeMilestones.add(milestone);
      trackEvent('time_on_page', { seconds: milestone });
    }
  });
}, 1000);

// ============================================
// NAVIGATION
// ============================================
let lastScroll = 0;
const nav = document.getElementById('mainNav');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    if (currentScroll > lastScroll) {
      nav.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
    }
  }
  
  lastScroll = currentScroll;
});

// Smooth scroll for nav links
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      trackEvent('nav_click', { target: targetId });
    }
  });
});

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ============================================
// MODAL MANAGEMENT
// ============================================
const modals = {
  choice: document.getElementById('choiceModal'),
  enterprise: document.getElementById('enterpriseModal'),
  carrier: document.getElementById('carrierModal')
};

function openModal(modalName) {
  const modal = modals[modalName];
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    trackEvent('modal_opened', { modal: modalName });
    
    // Focus trap
    const firstInput = modal.querySelector('input, button');
    if (firstInput) firstInput.focus();
  }
}

function closeModal(modalName) {
  const modal = modals[modalName];
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    trackEvent('modal_closed', { modal: modalName });
  }
}

// Close on backdrop click
Object.keys(modals).forEach(key => {
  const backdrop = document.getElementById(`${key}Backdrop`);
  const closeBtn = document.getElementById(`${key}Close`);
  
  if (backdrop) {
    backdrop.addEventListener('click', () => closeModal(key));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(key));
  }
});

// Escape key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Object.keys(modals).forEach(key => closeModal(key));
  }
});

// ============================================
// CTA BUTTONS
// ============================================
document.getElementById('headerSignupBtn').addEventListener('click', () => {
  trackEvent('cta_clicked', { button: 'header_signup' });
  openModal('choice');
});

document.getElementById('enterpriseCta').addEventListener('click', () => {
  trackEvent('cta_clicked', { button: 'enterprise_hero', variant: state.variant });
  openModal('enterprise');
});

document.getElementById('carrierCta').addEventListener('click', () => {
  trackEvent('cta_clicked', { button: 'carrier_hero' });
  openModal('carrier');
});

// Choice modal buttons
document.getElementById('choiceEnterprise').addEventListener('click', () => {
  closeModal('choice');
  openModal('enterprise');
});

document.getElementById('choiceCarrier').addEventListener('click', () => {
  closeModal('choice');
  openModal('carrier');
});

// FAB
document.getElementById('fabBtn').addEventListener('click', () => {
  trackEvent('cta_clicked', { button: 'fab' });
  openModal('choice');
});

// ============================================
// FORM VALIDATION
// ============================================
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\s]{2,}$/;

function formatPhoneNumber(value) {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

function validateField(input) {
  const value = input.value.trim();
  const type = input.type;
  const id = input.id;
  let isValid = true;
  let errorMsg = '';
  
  if (input.hasAttribute('required') && !value) {
    isValid = false;
    errorMsg = 'This field is required';
  } else if (type === 'email' && value && !emailRegex.test(value)) {
    isValid = false;
    errorMsg = 'Please enter a valid email';
  } else if (input.hasAttribute('minlength')) {
    const minLength = parseInt(input.getAttribute('minlength'));
    if (value.length < minLength) {
      isValid = false;
      errorMsg = `Minimum ${minLength} characters required`;
    }
  } else if (id.includes('Name') && value && !nameRegex.test(value)) {
    isValid = false;
    errorMsg = 'Please enter a valid name (letters only)';
  } else if (id.includes('DOT') && value && !/^[0-9]*$/.test(value)) {
    isValid = false;
    errorMsg = 'DOT number must be numeric';
  }
  
  // Update UI
  const errorEl = document.getElementById(`${id}Error`);
  if (errorEl) {
    errorEl.textContent = errorMsg;
  }
  
  if (isValid && value) {
    input.classList.add('valid');
    input.classList.remove('invalid');
  } else if (!isValid) {
    input.classList.add('invalid');
    input.classList.remove('valid');
  } else {
    input.classList.remove('valid', 'invalid');
  }
  
  return isValid;
}

// Auto-format phone inputs
document.querySelectorAll('.phone-input').forEach(input => {
  input.addEventListener('input', (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
  });
});

// Validate on blur
document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    if (input.classList.contains('invalid')) {
      validateField(input);
    }
  });
});

// ============================================
// ENTERPRISE FORM SUBMISSION
// ============================================
const enterpriseForm = document.getElementById('enterpriseForm');
const enterpriseSubmit = document.getElementById('enterpriseSubmit');
const enterpriseSuccess = document.getElementById('enterpriseSuccess');

enterpriseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate all fields
  const inputs = enterpriseForm.querySelectorAll('.form-input[required]');
  let allValid = true;
  inputs.forEach(input => {
    if (!validateField(input)) allValid = false;
  });
  
  if (!allValid) {
    showToast('Please fill in all required fields correctly');
    return;
  }
  
  // Show loading state
  enterpriseSubmit.classList.add('loading');
  enterpriseSubmit.disabled = true;
  
  // Collect form data
  const formData = {
    name: document.getElementById('entName').value,
    email: document.getElementById('entEmail').value,
    company: document.getElementById('entCompany').value,
    phone: document.getElementById('entPhone').value,
    fleetSize: document.getElementById('entFleetSize').value,
    message: document.getElementById('entMessage').value
  };
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Store lead data
  const lead = {
    type: 'enterprise',
    timestamp: new Date().toISOString(),
    data: formData
  };
  state.leads.push(lead);
  
  console.log('💼 Enterprise Lead Submitted:', lead);
  
  trackEvent('form_submitted', { formType: 'enterprise', variant: state.variant });
  
  // Show success
  enterpriseForm.classList.add('submitted');
  enterpriseSuccess.classList.add('show');
  
  // Close modal after 3 seconds
  setTimeout(() => {
    closeModal('enterprise');
    enterpriseForm.classList.remove('submitted');
    enterpriseSuccess.classList.remove('show');
    enterpriseForm.reset();
    enterpriseSubmit.classList.remove('loading');
    enterpriseSubmit.disabled = false;
    document.querySelectorAll('.form-input').forEach(input => {
      input.classList.remove('valid', 'invalid');
    });
  }, 3000);
});

// ============================================
// CARRIER FORM SUBMISSION
// ============================================
const carrierForm = document.getElementById('carrierForm');
const carrierSubmit = document.getElementById('carrierSubmit');
const carrierSuccess = document.getElementById('carrierSuccess');

carrierForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate all fields
  const inputs = carrierForm.querySelectorAll('.form-input[required]');
  let allValid = true;
  inputs.forEach(input => {
    if (!validateField(input)) allValid = false;
  });
  
  if (!allValid) {
    showToast('Please fill in all required fields correctly');
    return;
  }
  
  // Show loading state
  carrierSubmit.classList.add('loading');
  carrierSubmit.disabled = true;
  
  // Collect form data
  const formData = {
    name: document.getElementById('carName').value,
    email: document.getElementById('carEmail').value,
    company: document.getElementById('carCompany').value,
    phone: document.getElementById('carPhone').value,
    fleetType: document.getElementById('carFleetType').value,
    vehicleCount: document.getElementById('carVehicleCount').value,
    dot: document.getElementById('carDOT').value,
    insurance: document.getElementById('carInsurance').value,
    message: document.getElementById('carMessage').value
  };
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Store lead data
  const lead = {
    type: 'carrier',
    timestamp: new Date().toISOString(),
    data: formData
  };
  state.leads.push(lead);
  
  console.log('🚚 Carrier Lead Submitted:', lead);
  
  trackEvent('form_submitted', { formType: 'carrier' });
  
  // Show success
  carrierForm.classList.add('submitted');
  carrierSuccess.classList.add('show');
  
  // Close modal after 3 seconds
  setTimeout(() => {
    closeModal('carrier');
    carrierForm.classList.remove('submitted');
    carrierSuccess.classList.remove('show');
    carrierForm.reset();
    carrierSubmit.classList.remove('loading');
    carrierSubmit.disabled = false;
    document.querySelectorAll('.form-input').forEach(input => {
      input.classList.remove('valid', 'invalid');
    });
  }, 3000);
});

// ============================================
// EMAIL CAPTURE FORM
// ============================================
const emailCaptureForm = document.getElementById('emailCaptureForm');
const emailSuccess = document.getElementById('emailSuccess');

emailCaptureForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const emailInput = document.getElementById('quickEmail');
  const email = emailInput.value.trim();
  
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email');
    return;
  }
  
  // Store email
  const lead = {
    type: 'email',
    timestamp: new Date().toISOString(),
    data: { email }
  };
  state.leads.push(lead);
  
  console.log('📧 Email Captured:', lead);
  
  trackEvent('email_captured', { email });
  
  // Show success
  emailCaptureForm.style.display = 'none';
  emailSuccess.classList.add('show');
  
  // Reset after 5 seconds
  setTimeout(() => {
    emailCaptureForm.style.display = 'flex';
    emailSuccess.classList.remove('show');
    emailInput.value = '';
  }, 5000);
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// ============================================
// NEW INTERACTIVE FEATURES
// ============================================

// Banner dismiss
const bannerCloseBtn = document.getElementById('bannerClose');
if (bannerCloseBtn) {
  bannerCloseBtn.addEventListener('click', () => {
    document.getElementById('topBanner').style.display = 'none';
    trackEvent('banner_dismissed');
  });
}

// Activity feed rotation
const activityFeed = document.getElementById('activityFeed');
const activityText = document.getElementById('activityText');
const activityClose = document.getElementById('activityClose');
if (activityFeed) {
  const feedItems = [
    'John from ABC Freight just signed up',
    'Lisa from Metro Charter just signed up',
    'Carlos from Summit Carriers just signed up',
    'Jenny from Global Freight Co. just signed up',
    'Alex from National Fleet Services just signed up',
    'Tom from Premier Logistics Group just signed up'
  ];
  let feedIdx = 0;
  const rotateFeed = () => {
    activityText.textContent = feedItems[feedIdx];
    feedIdx = (feedIdx + 1) % feedItems.length;
  };
  rotateFeed();
  setInterval(rotateFeed, 10000);
  activityClose.addEventListener('click', () => {
    activityFeed.style.display = 'none';
    trackEvent('activity_feed_dismissed');
  });
}

// Stats counters
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const isFloat = el.dataset.float === 'true' || target % 1 !== 0;
  const duration = 1500;
  const startTime = Date.now();
  const step = () => {
    const progress = Math.min((Date.now() - startTime) / duration, 1);
    const value = target * progress;
    el.textContent = isFloat ? value.toFixed(1) : Math.floor(value).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// Screenshot tabs
document.querySelectorAll('.screenshot-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.screenshot-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.screenshot-img').forEach(img => {
      img.classList.toggle('active', img.dataset.tab === target);
    });
    trackEvent('screenshot_tab_clicked', { tab: target });
  });
});

// Testimonials carousel
const testimonialCards = document.querySelectorAll('#testimonialCarousel .testimonial-card');
let testimonialIndex = 0;
function showTestimonial(i) {
  testimonialCards.forEach((card, idx) => card.classList.toggle('active', idx === i));
}
if (testimonialCards.length) {
  setInterval(() => {
    testimonialIndex = (testimonialIndex + 1) % testimonialCards.length;
    showTestimonial(testimonialIndex);
  }, 6000);
  document.getElementById('prevTestimonial').addEventListener('click', () => {
    testimonialIndex = (testimonialIndex - 1 + testimonialCards.length) % testimonialCards.length;
    showTestimonial(testimonialIndex);
  });
  document.getElementById('nextTestimonial').addEventListener('click', () => {
    testimonialIndex = (testimonialIndex + 1) % testimonialCards.length;
    showTestimonial(testimonialIndex);
  });
}

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-question');
  q.addEventListener('click', () => {
    item.classList.toggle('open');
    trackEvent('faq_opened', { question: q.textContent.trim() });
  });
});

// Countdown timer
const countdownEl = document.getElementById('countdown');
if (countdownEl) {
  const endTime = Date.now() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 45 * 60 * 1000 + 12 * 1000;
  const updateCountdown = () => {
    const diff = endTime - Date.now();
    if (diff <= 0) {
      countdownEl.textContent = 'Expired';
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    countdownEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Chat widget
const chatBubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatForm = document.getElementById('chatForm');
const chatQuick = document.getElementById('chatQuickActions');

function addChatMessage(text, sender = 'bot') {
  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatBubble) {
  chatBubble.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      trackEvent('chat_opened');
      if (!chatMessages.childElementCount) {
        setTimeout(() => addChatMessage('Hi! How can we help you today?'), 300);
      }
    }
  });
}
if (chatClose) {
  chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));
}

if (chatQuick) {
  chatQuick.addEventListener('click', (e) => {
    if (e.target.classList.contains('chat-action')) {
      const action = e.target.dataset.action;
      addChatMessage(e.target.textContent, 'user');
      setTimeout(() => addChatMessage('Thanks for reaching out! An Axle team member will be with you shortly.'), 800);
      trackEvent('chat_quick_action', { action });
    }
  });
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addChatMessage(msg, 'user');
    chatInput.value = '';
    setTimeout(() => addChatMessage('Thanks for your message! We will respond shortly.'), 800);
    trackEvent('chat_message_sent');
  });
}

// Final CTA buttons
const finalEnterprise = document.getElementById('finalEnterpriseCta');
if (finalEnterprise) finalEnterprise.addEventListener('click', () => { openModal('enterprise'); trackEvent('cta_clicked', { button: 'final_enterprise' }); });
const finalCarrier = document.getElementById('finalCarrierCta');
if (finalCarrier) finalCarrier.addEventListener('click', () => { openModal('carrier'); trackEvent('cta_clicked', { button: 'final_carrier' }); });

// ============================================
// DEBUG: Log all data
// ============================================
window.addEventListener('beforeunload', () => {
  console.log('📊 Final Analytics Data:', {
    session: state.sessionId,
    variant: state.variant,
    duration: Math.floor((Date.now() - state.startTime) / 1000) + 's',
    events: state.events.length,
    leads: state.leads.length,
    allData: state
  });
});

// Expose for debugging
window.axleState = state;