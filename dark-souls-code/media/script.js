// media/script.js
const app = document.getElementById('app');
const TEXT = app.getAttribute('data-text');
const PREFIX = 'email-sent-';

const showText = () => {
  const container = document.createElement('div');
  container.classList.add(`${PREFIX}screen`);

  const bg = document.createElement('div');
  bg.classList.add(`${PREFIX}bg`);

  const title = document.createElement('span');
  title.classList.add(`${PREFIX}title`);
  title.innerText = TEXT;

  const glow = document.createElement('span');
  glow.classList.add(`${PREFIX}glow`);
  glow.innerText = TEXT;

  container.appendChild(bg);
  container.appendChild(glow);
  container.appendChild(title);

  document.body.appendChild(container);

  // Fallback: Try playing audio via JS if HTML autoplay was blocked
  const audio = document.getElementById('souls-audio');
  if (audio) {
    audio.volume = 0.8;
    audio.play().catch((e) => console.log('Audio autoplay prevented:', e));
  }
};

showText();
