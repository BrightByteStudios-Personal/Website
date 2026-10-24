/* ==========================================================
   BRIGHTBYTE STUDIO - SCRIPT
   Runs on every page. Handles:
   1. Dark/light theme
   2. Mobile menu
   3. Team photo fallback
   4. Quote form (contact page only), sends to Gmail
   ========================================================== */


/* ----------------------------------------------------------
   1. DARK / LIGHT THEME
   The choice is saved, so it stays the same on every page.
   ---------------------------------------------------------- */
const root = document.documentElement;

// Load the saved theme (or use light by default)
root.dataset.theme = localStorage.getItem('theme') || 'light';

// Switch theme when the Dark/Light button is clicked
document.getElementById('theme').onclick = () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
};


/* ----------------------------------------------------------
   2. MOBILE MENU
   Opens and closes the links when Menu is tapped.
   ---------------------------------------------------------- */
document.getElementById('menu').onclick = e => {
  const isOpen = document.querySelector('nav').classList.toggle('open');
  e.target.setAttribute('aria-expanded', isOpen);   // helps screen readers
};


/* ----------------------------------------------------------
   3. TEAM PHOTO FALLBACK
   If a photo file is missing, remove the broken image so the
   initials show instead.
   ---------------------------------------------------------- */
document.querySelectorAll('.avatar img, .thumb img').forEach(img => {
  const hide = () => img.remove();
  img.addEventListener('error', hide);
  if (img.complete && img.naturalWidth === 0) hide();   // already failed
});



/* ----------------------------------------------------------
   4. QUOTE FORM (only runs if the page has the form)
   Checks the fields, then sends them to Gmail through Web3Forms.
   ---------------------------------------------------------- */
const ACCESS_KEY = '50707a22-af24-4b04-a00a-b90a838cce8b';   // paste your Web3Forms key here

const form = document.getElementById('quote');

if (form) {
  form.addEventListener('submit', async e => {

    e.preventDefault();   // stop the page from reloading

    const data = new FormData(form);   // all the form answers
    const errors = {};                 // collects problems found

    // Check each required field
    if (!data.get('name').trim()) {
      errors.name = 'Please enter your name.';
    }

    if (!/^\S+@\S+\.\S+$/.test(data.get('email'))) {
      errors.email = 'Enter a valid email address.';
    }

    if (!data.get('type')) {
      errors.type = 'Choose a project type.';
    }

    if (!data.get('budget')) {
      errors.budget = 'Pick a budget range.';
    }

    // Show (or clear) the error under each field
    ['name', 'email', 'type', 'budget'].forEach(field => {
      document.getElementById('e-' + field).textContent = errors[field] || '';
    });

    // Stop here if anything is wrong
    if (Object.keys(errors).length) {
      return;
    }

    const services = data.getAll('services').join(', ') || 'None selected';
    const result = document.getElementById('result');
    const sendBtn = form.querySelector('button[type=submit]');

    // Disable the button while sending
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
      // Send the answers to Web3Forms, which emails them to you
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: 'New quote request from ' + data.get('name'),
          from_name: 'Brightbyte Website',
          name: data.get('name'),
          email: data.get('email'),
          project_type: data.get('type'),
          services: services,
          budget: data.get('budget'),
          message: data.get('msg') || '(no message)'
        })
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.message);
      }

      // Sent: show the confirmation message
      // (textContent is used for user input so typed HTML can't run)
      result.style.display = 'block';
      result.innerHTML = '<h3>Quote request sent!</h3><p id="r1"></p><p id="r2"></p>';
      document.getElementById('r1').textContent =
        `${data.get('name')}, we'll reply to ${data.get('email')} within 2 days.`;
      document.getElementById('r2').textContent =
        `Project: ${data.get('type')} | Services: ${services} | Budget: ${data.get('budget')}`;

      form.reset();   // clear the form

    } catch (err) {
      // Something went wrong (no internet, wrong key, etc.)
      result.style.display = 'block';
      result.innerHTML = '<h3>Sorry, it did not send.</h3><p>Please check your internet connection and try again.</p>';

    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send quote request';
    }
  });
}

/* ----------------------------------------------------------
   5. PROJECT CARD EFFECTS (portfolio page)
   The glow follows the mouse or finger. While a card is held
   down it gets the "pressed" class, even if you start dragging.
   ---------------------------------------------------------- */
document.querySelectorAll('.project').forEach(card => {
  const follow = e => {
    const box = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - box.left) + 'px');
    card.style.setProperty('--my', (e.clientY - box.top) + 'px');
  };
  const release = () => card.classList.remove('pressed');

  card.addEventListener('pointerenter', follow);
  card.addEventListener('pointermove', follow);
  card.addEventListener('pointerdown', e => {
    follow(e);
    card.classList.add('pressed');
  });
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);   // e.g. the page starts scrolling
  card.addEventListener('pointerleave', release);    // dragged off the card

  // Stops the browser's ghost-image drag so our effect keeps tracking
  card.addEventListener('dragstart', e => e.preventDefault());
});

/* ----------------------------------------------------------
   7. MORE ANIMATIONS
   Card glow, button ripple, theme fade, page fade, heading
   underline, table rows and the back-to-top button.
   ---------------------------------------------------------- */
(function () {

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ----- Card glow follows the pointer; card presses while held ----- */
  document.querySelectorAll('main .card:not(.wrap)').forEach(card => {
    const follow = e => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - box.left) + 'px');
      card.style.setProperty('--my', (e.clientY - box.top) + 'px');
    };
    const release = () => card.classList.remove('pressed');

    card.addEventListener('pointerenter', follow);
    card.addEventListener('pointermove', follow);
    card.addEventListener('pointerdown', e => { follow(e); card.classList.add('pressed'); });
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);   // page started scrolling
    card.addEventListener('pointerleave', release);    // dragged off the card
  });


  /* ----- Button ripple where you tap ----- */
  if (!reduce) {
    document.addEventListener('pointerdown', e => {
      const btn = e.target.closest('.btn');
      if (!btn || btn.disabled) return;

      const box = btn.getBoundingClientRect();
      const size = Math.max(box.width, box.height) * 2;
      const dot = document.createElement('span');

      dot.className = 'ripple';
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = (e.clientX - box.left - size / 2) + 'px';
      dot.style.top = (e.clientY - box.top - size / 2) + 'px';

      btn.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  }


  /* ----- Smooth cross-fade when switching dark / light ----- */
  const themeBtn = document.getElementById('theme');

  if (themeBtn && !reduce) {
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.add('theme-fade');
      setTimeout(() => document.documentElement.classList.remove('theme-fade'), 450);
    });
  }


  /* ----- Page fade when moving between pages ----- */
  if (!reduce) {
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;

      const url = new URL(a.href, location.href);
      const sameKind = ['http:', 'https:', 'file:'].includes(url.protocol) && url.protocol === location.protocol;
      if (!sameKind || url.origin !== location.origin) return;                    // skips mailto: and other sites
      if (url.pathname === location.pathname && url.search === location.search) return;   // skips #jump links

      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { location.href = a.href; }, 230);
    });

    // Back button can restore the page while it is still faded out
    window.addEventListener('pageshow', e => {
      if (e.persisted) document.body.classList.remove('leaving');
    });
  }


  /* ----- Heading underline and table rows animate when they scroll into view ----- */
  function onView(selector, pre, inClass, setup) {
    if (reduce || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(inClass);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    document.querySelectorAll(selector).forEach(el => {
      if (setup) setup(el);
      el.classList.add(pre);

      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        setTimeout(() => el.classList.add(inClass), 450);   // already on screen: play after load
      } else {
        io.observe(el);
      }
    });
  }

  onView('main h2', 'bar-pre', 'bar-in');

  onView('main table', 'rows-pre', 'rows-in', table => {
    table.querySelectorAll('tbody tr').forEach((row, i) => row.style.setProperty('--i', i));
  });


  /* ----- Back-to-top button ----- */
  const toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '&#8593;';
  document.body.appendChild(toTop);

  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

})();
/* ----------------------------------------------------------
   8. TEAM CARDS SLIDE IN
   Each card fades up when it scrolls into view, one after
   another across the row. Skipped if reduced motion is on.
   ---------------------------------------------------------- */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = document.querySelectorAll('.team-card');

  if (reduce || !cards.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('fx-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  cards.forEach(card => {
    const row = [...card.parentElement.children].indexOf(card) % 3;   // 0, 1, 2 across a row
    card.style.setProperty('--i', row);
    card.classList.add('fx');
    io.observe(card);
  });
})();

/* ----------------------------------------------------------
   9. EXTRA SCROLL EFFECTS
   - A yellow reading-progress bar at the top of the page
   - A shadow under the header once you start scrolling
   - Cards fade up one after another as they come into view
   ---------------------------------------------------------- */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('header');

  // Progress bar (its look is already in style.css as .progress)
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const done = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = 'scaleX(' + done + ')';
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Cards fade up (skipped for reduced motion; team cards have their own effect)
  if (reduce || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('sr-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('main .card:not(.team-card)').forEach(card => {
    const row = [...card.parentElement.children].indexOf(card) % 3;   // 0, 1, 2 across a row
    card.style.setProperty('--i', row);
    card.classList.add('sr');
    io.observe(card);
  });
})();