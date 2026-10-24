/* ==========================================================
   FRESH FIT GYM - SCRIPT
   1. Mobile menu
   2. Open/closed status
   3. Monthly / yearly pricing
   4. Join buttons fill the form
   5. Today's classes filter
   6. Animated stats
   7. Scroll animations
   8. Join form (sent to Gmail via Web3Forms)
   ========================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ---------- 1. MOBILE MENU ---------- */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});

nav.addEventListener('click', e => {
  if (e.target.closest('a')) {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});


/* ---------- 2. OPEN / CLOSED STATUS (Philippine time) ---------- */
// Hours by day (0 = Sunday), 24-hour time
const HOURS = {
  0: [7, 20], 1: [5, 23], 2: [5, 23], 3: [5, 23],
  4: [5, 23], 5: [5, 23], 6: [5, 23]
};
const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const fmt = h => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');

function manilaNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'short',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
  }).formatToParts(new Date());

  const get = type => parts.find(p => p.type === type).value;
  return {
    day: DAY_INDEX[get('weekday')],
    hour: Number(get('hour')) + Number(get('minute')) / 60
  };
}

function updateStatus() {
  const { day, hour } = manilaNow();
  const [open, close] = HOURS[day];
  const el = document.getElementById('status');
  const isOpen = hour >= open && hour < close;

  if (isOpen) {
    el.textContent = 'Open now \u00B7 until ' + fmt(close);
  } else if (hour < open) {
    el.textContent = 'Closed \u00B7 opens at ' + fmt(open);
  } else {
    el.textContent = 'Closed \u00B7 opens tomorrow at ' + fmt(HOURS[(day + 1) % 7][0]);
  }
  el.classList.toggle('open', isOpen);
}

updateStatus();
setInterval(updateStatus, 60000);


/* ---------- 3. MONTHLY / YEARLY PRICING ---------- */
const btnMonthly = document.getElementById('btn-monthly');
const btnYearly = document.getElementById('btn-yearly');
const billingSelect = document.getElementById('billing');
const amounts = document.querySelectorAll('.amount');
const pers = document.querySelectorAll('.per');

function setBilling(yearly) {
  amounts.forEach(el => {
    const monthly = Number(el.dataset.monthly);
    const price = yearly ? monthly * 10 : monthly;   // yearly = pay for 10 months
    el.textContent = 'PHP ' + price.toLocaleString('en-US');
  });
  pers.forEach(el => { el.textContent = yearly ? '/yr' : '/mo'; });

  btnMonthly.setAttribute('aria-pressed', !yearly);
  btnYearly.setAttribute('aria-pressed', yearly);
  billingSelect.value = yearly ? 'Yearly' : 'Monthly';
}

btnMonthly.addEventListener('click', () => setBilling(false));
btnYearly.addEventListener('click', () => setBilling(true));
billingSelect.addEventListener('change', () => setBilling(billingSelect.value === 'Yearly'));


/* ---------- 4. JOIN BUTTONS FILL THE FORM ---------- */
const planSelect = document.getElementById('plan');

document.querySelectorAll('.join').forEach(link => {
  link.addEventListener('click', () => {
    planSelect.value = link.dataset.plan;
    document.getElementById('e-plan').textContent = '';
  });
});


/* ---------- 5. TODAY'S CLASSES FILTER ---------- */
const btnToday = document.getElementById('btn-today');
const todayNote = document.getElementById('today-note');
const classRows = document.querySelectorAll('.classes tbody tr');

// Highlight today's classes
const todayIndex = manilaNow().day;
classRows.forEach(row => {
  const days = row.dataset.days.split(',').map(Number);
  row.classList.toggle('today', days.includes(todayIndex));
});

btnToday.addEventListener('click', () => {
  const on = btnToday.getAttribute('aria-pressed') !== 'true';
  btnToday.setAttribute('aria-pressed', on);

  let count = 0;
  classRows.forEach(row => {
    const isToday = row.classList.contains('today');
    row.hidden = on && !isToday;
    if (isToday) count++;
  });

  todayNote.hidden = !on;
  todayNote.textContent = count
    ? count + (count === 1 ? ' class' : ' classes') + ' today'
    : 'No classes today. Open gym floor only.';
});


/* ---------- 6. ANIMATED STATS ---------- */
const counters = document.querySelectorAll('[data-count]');

function runCounter(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if ('IntersectionObserver' in window && !reduceMotion) {
  const statObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(el => statObserver.observe(el));
}


/* ---------- 7. SCROLL ANIMATIONS ---------- */
const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}


/* ---------- 8. JOIN FORM ---------- */
const ACCESS_KEY = '50707a22-af24-4b04-a00a-b90a838cce8b';   // Web3Forms key

const form = document.getElementById('join-form');
const result = document.getElementById('form-result');

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (form.elements.botcheck.checked) return;   // bots tick the hidden box

  const data = new FormData(form);
  const errors = {};

  if (!data.get('name').trim()) errors.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(data.get('email'))) errors.email = 'Enter a valid email address.';
  if (!data.get('plan')) errors.plan = 'Choose a plan.';

  ['name', 'email', 'plan'].forEach(field => {
    document.getElementById('e-' + field).textContent = errors[field] || '';
  });

  if (Object.keys(errors).length) return;

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  result.className = '';
  result.textContent = '';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        subject: 'Fresh Fit Gym membership request: ' + data.get('name'),
        from_name: 'Fresh Fit Gym Website',
        name: data.get('name'),
        email: data.get('email'),
        plan: data.get('plan'),
        billing: data.get('billing'),
        message: data.get('msg') || '(no message)'
      })
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message);

    result.className = 'ok';
    result.textContent = 'Welcome, ' + data.get('name') + '! We got your ' + data.get('plan') +
      ' (' + data.get('billing').toLowerCase() + ') request and will email you to book your free assessment.';
    form.reset();
    setBilling(false);

  } catch (err) {
    result.className = 'bad';
    result.textContent = 'Sorry, it did not send. Please check your connection and try again.';

  } finally {
    btn.disabled = false;
    btn.textContent = 'Request membership';
  }
});