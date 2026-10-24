/* ==========================================================
   SUNRISE ELEMENTARY - SCRIPT
   1. Mobile menu
   2. Office open/closed status
   3. Next-event countdown
   4. Animated stats
   5. Schedule tabs
   6. Scroll animations
   7. Contact form (sent to Gmail via Web3Forms)
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


/* ---------- 2. OFFICE STATUS (Philippine time) ---------- */
const OFFICE = { open: 7.5, close: 16.5 };   // 7:30 AM to 4:30 PM, Mon to Fri
const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

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

function updateOffice() {
  const { day, hour } = manilaNow();
  const el = document.getElementById('office');
  const weekday = day >= 1 && day <= 5;
  const isOpen = weekday && hour >= OFFICE.open && hour < OFFICE.close;

  if (isOpen) {
    el.textContent = 'Office open now \u00B7 until 4:30 PM';
  } else if (weekday && hour < OFFICE.open) {
    el.textContent = 'Office closed \u00B7 opens at 7:30 AM';
  } else {
    el.textContent = 'Office closed \u00B7 opens next school day, 7:30 AM';
  }
  el.classList.toggle('open', isOpen);
}

updateOffice();
setInterval(updateOffice, 60000);


/* ---------- 3. NEXT-EVENT COUNTDOWN ---------- */
const newsCards = document.querySelectorAll('.news');
const countdown = document.getElementById('countdown');

(function () {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let next = null;

  newsCards.forEach(card => {
    const [y, m, d] = card.dataset.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = Math.round((date - startOfToday) / 86400000);

    if (days < 0) {
      card.classList.add('past');
    } else if (!next || days < next.days) {
      next = { days, title: card.querySelector('h3').textContent };
    }
  });

  if (next) {
    const when = next.days === 0 ? 'today' :
                 next.days === 1 ? 'tomorrow' : 'in ' + next.days + ' days';
    countdown.textContent = 'Next up: ' + next.title + ' ' + when;
    countdown.hidden = false;
  }
})();


/* ---------- 4. ANIMATED STATS ---------- */
const counters = document.querySelectorAll('[data-count]');

function runCounter(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + suffix;
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


/* ---------- 5. SCHEDULE TABS ---------- */
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.sched');

function selectTab(tab) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });
  panels.forEach(p => {
    p.hidden = p.id !== tab.getAttribute('aria-controls');
  });
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));

  // Arrow keys move between tabs
  tab.addEventListener('keydown', e => {
    let n = null;
    if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
    if (n) { selectTab(n); n.focus(); }
  });
});

selectTab(tabs[0]);   // without JS, all three tables simply show


/* ---------- 6. SCROLL ANIMATIONS ---------- */
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


/* ---------- 7. CONTACT FORM ---------- */
const ACCESS_KEY = '50707a22-af24-4b04-a00a-b90a838cce8b';   // Web3Forms key

const form = document.getElementById('contact-form');
const result = document.getElementById('form-result');

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (form.elements.botcheck.checked) return;   // bots tick the hidden box

  const data = new FormData(form);
  const errors = {};

  if (!data.get('name').trim()) errors.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(data.get('email'))) errors.email = 'Enter a valid email address.';
  if (!data.get('grade')) errors.grade = 'Choose a grade level.';
  if (data.get('msg').trim().length < 10) errors.msg = 'Message should be at least 10 characters.';

  ['name', 'email', 'grade', 'msg'].forEach(field => {
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
        subject: 'Sunrise Elementary inquiry: ' + data.get('name'),
        from_name: 'Sunrise Elementary Website',
        name: data.get('name'),
        email: data.get('email'),
        grade_level: data.get('grade'),
        message: data.get('msg')
      })
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message);

    result.className = 'ok';
    result.textContent = 'Thank you, ' + data.get('name') + '! The school office will reply to ' +
      data.get('email') + ' within two school days.';
    form.reset();

  } catch (err) {
    result.className = 'bad';
    result.textContent = 'Sorry, it did not send. Please check your connection and try again.';

  } finally {
    btn.disabled = false;
    btn.textContent = 'Send message';
  }
});