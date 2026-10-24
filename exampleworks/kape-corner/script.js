/* ==========================================================
   KAPE CORNER - SCRIPT
   1. Mobile menu
   2. Open/closed status + today's hours
   3. Menu filter
   4. Scroll animations
   5. Reservation form (sent to Gmail via Web3Forms)
   ========================================================== */

/* ---------- 1. MOBILE MENU ---------- */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});

// Close the menu after tapping a link
nav.addEventListener('click', e => {
  if (e.target.closest('a')) {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});


/* ---------- 2. OPEN / CLOSED STATUS ---------- */
// Opening hours by day (0 = Sunday), in 24-hour time
const HOURS = {
  0: [8, 18], 1: [7, 21], 2: [7, 21], 3: [7, 21],
  4: [7, 21], 5: [7, 21], 6: [7, 21]
};
const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const fmt = h => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');

// Always use café time (Philippines), whatever the visitor's timezone
function cafeNow() {
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
  const { day, hour } = cafeNow();
  const [open, close] = HOURS[day];
  const badge = document.getElementById('status');
  const isOpen = hour >= open && hour < close;

  if (isOpen) {
    badge.textContent = 'Open now \u00B7 until ' + fmt(close);
  } else if (hour < open) {
    badge.textContent = 'Closed \u00B7 opens at ' + fmt(open);
  } else {
    badge.textContent = 'Closed \u00B7 opens tomorrow at ' + fmt(HOURS[(day + 1) % 7][0]);
  }
  badge.classList.toggle('open', isOpen);

  // Highlight today's row in the hours table
  document.querySelectorAll('.hours tr').forEach(row => {
    row.classList.toggle('today', Number(row.dataset.day) === day);
  });
}

updateStatus();
setInterval(updateStatus, 60000);   // keep it fresh


/* ---------- 3. MENU FILTER ---------- */
const chips = document.querySelectorAll('.chip');
const items = document.querySelectorAll('.item');

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', c === chip));

    const cat = chip.dataset.cat;
    items.forEach(item => {
      item.hidden = cat !== 'all' && item.dataset.cat !== cat;
    });
  });
});


/* ---------- 4. SCROLL ANIMATIONS ---------- */
const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);   // animate once, then stop watching
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));   // old browsers: just show
}


/* ---------- 5. RESERVATION FORM ---------- */
const ACCESS_KEY = '50707a22-af24-4b04-a00a-b90a838cce8b';   // Web3Forms key

const form = document.getElementById('reserve-form');
const dateInput = document.getElementById('date');
const result = document.getElementById('form-result');

// Block past dates
const today = new Date().toLocaleDateString('en-CA');   // YYYY-MM-DD
dateInput.min = today;

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (form.elements.botcheck.checked) return;   // bots tick the hidden box

  const data = new FormData(form);
  const errors = {};

  if (!data.get('name').trim()) errors.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(data.get('email'))) errors.email = 'Enter a valid email address.';
  if (!data.get('date')) errors.date = 'Pick a date.';
  else if (data.get('date') < today) errors.date = 'Pick today or a later date.';

  ['name', 'email', 'date'].forEach(field => {
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
        subject: 'Kape Corner reservation: ' + data.get('name'),
        from_name: 'Kape Corner Website',
        name: data.get('name'),
        email: data.get('email'),
        date: data.get('date'),
        guests: data.get('guests'),
        message: data.get('msg') || '(no notes)'
      })
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message);

    result.className = 'ok';
    result.textContent = 'Thank you, ' + data.get('name') + '! We got your request for ' +
      data.get('date') + ' (' + data.get('guests') + ') and will confirm by email.';
    form.reset();

  } catch (err) {
    result.className = 'bad';
    result.textContent = 'Sorry, it did not send. Please check your connection and try again.';

  } finally {
    btn.disabled = false;
    btn.textContent = 'Request reservation';
  }
});