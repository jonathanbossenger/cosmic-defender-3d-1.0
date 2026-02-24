const HIGH_SCORE_KEY = 'cosmic-defender-highscore';
const GAME_URL = 'https://jonathanbossenger.github.io/cosmic-defender-3d/';

export class Screens {
  constructor() {
    this.el = {
      loading: document.getElementById('loading-screen'),
      loadingFill: document.getElementById('loading-fill'),
      menu: document.getElementById('menu-screen'),
      pause: document.getElementById('pause-screen'),
      gameover: document.getElementById('gameover-screen'),
      finalScore: document.getElementById('final-score'),
      finalStats: document.getElementById('final-stats'),
      newHighScore: document.getElementById('new-high-score'),
      menuHighScore: document.getElementById('menu-high-score'),
      controlsHint: document.getElementById('controls-hint'),
    };

    // Buttons
    this.btnPlay = document.getElementById('btn-play');
    this.btnHow = document.getElementById('btn-how');
    this.btnResume = document.getElementById('btn-resume');
    this.btnQuit = document.getElementById('btn-quit');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnMenu = document.getElementById('btn-menu');

    // Share buttons
    this.shareButtons = {
      twitter: document.getElementById('share-twitter'),
      bluesky: document.getElementById('share-bluesky'),
      mastodon: document.getElementById('share-mastodon'),
      linkedin: document.getElementById('share-linkedin'),
      facebook: document.getElementById('share-facebook'),
      instagram: document.getElementById('share-instagram'),
      tiktok: document.getElementById('share-tiktok'),
    };

    this.highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    this._showingControls = false;
    this._shareListeners = {};
  }

  // Callbacks
  onPlay = null;
  onResume = null;
  onQuit = null;
  onRestart = null;
  onMenu = null;

  init() {
    this.btnPlay.addEventListener('click', () => {
      if (this.onPlay) this.onPlay();
    });

    this.btnHow.addEventListener('click', () => {
      this._showingControls = !this._showingControls;
      this.el.controlsHint.style.color = this._showingControls ? '#aab' : '#445';
    });

    this.btnResume.addEventListener('click', () => {
      if (this.onResume) this.onResume();
    });

    this.btnQuit.addEventListener('click', () => {
      if (this.onQuit) this.onQuit();
    });

    this.btnRestart.addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });

    this.btnMenu.addEventListener('click', () => {
      if (this.onMenu) this.onMenu();
    });

    this._updateHighScoreDisplay();
  }

  _updateHighScoreDisplay() {
    if (this.highScore > 0) {
      this.el.menuHighScore.textContent = `HIGH SCORE: ${this.highScore.toLocaleString()}`;
    } else {
      this.el.menuHighScore.textContent = '';
    }
  }

  _buildShareText(stats) {
    const score = (stats.score || 0).toLocaleString();
    return `🚀 I scored ${score} in Cosmic Defender 3D! Wave ${stats.wave} reached, ${stats.kills} enemies destroyed. Can you beat me? ${GAME_URL} #CosmicDefender`;
  }

  _openShareWindow(url) {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  _showCopyFeedback(btn, success) {
    const COPY_FEEDBACK_DURATION = 2000;
    const original = btn.textContent;
    btn.textContent = success ? 'Copied!' : 'Failed';
    btn.classList.toggle('copied', success);
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, COPY_FEEDBACK_DURATION);
  }

  _copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      this._showCopyFeedback(btn, true);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      let success = false;
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (_) {
        // execCommand not available
      }
      this._showCopyFeedback(btn, success);
    });
  }

  _setupShareButtons(stats) {
    const text = this._buildShareText(stats);
    const pageUrl = encodeURIComponent(GAME_URL);
    const encodedText = encodeURIComponent(text);

    const handlers = {
      twitter: () => this._openShareWindow(`https://twitter.com/intent/tweet?text=${encodedText}`),
      bluesky: () => this._openShareWindow(`https://bsky.app/intent/compose?text=${encodedText}`),
      mastodon: () => this._openShareWindow(`https://mastodon.social/share?text=${encodedText}`),
      linkedin: () => this._openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}&summary=${encodedText}`),
      facebook: () => this._openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${encodedText}`),
      instagram: () => this._copyToClipboard(text, this.shareButtons.instagram),
      tiktok: () => this._copyToClipboard(text, this.shareButtons.tiktok),
    };

    // Remove old listeners before attaching new ones
    for (const [key, btn] of Object.entries(this.shareButtons)) {
      if (this._shareListeners[key]) {
        btn.removeEventListener('click', this._shareListeners[key]);
      }
      this._shareListeners[key] = handlers[key];
      btn.addEventListener('click', handlers[key]);
    }

    // Update Instagram/TikTok labels to hint clipboard behaviour
    this.shareButtons.instagram.title = 'Copy score text to clipboard';
    this.shareButtons.tiktok.title = 'Copy score text to clipboard';
  }

  setLoadingProgress(pct) {
    this.el.loadingFill.style.width = pct + '%';
  }

  showLoading() {
    this._hideAll();
    this.el.loading.classList.remove('hidden');
  }

  showMenu() {
    this._hideAll();
    this._updateHighScoreDisplay();
    this.el.menu.classList.remove('hidden');
  }

  showPause() {
    this.el.pause.classList.remove('hidden');
  }

  hidePause() {
    this.el.pause.classList.add('hidden');
  }

  showGameOver(stats) {
    this._hideAll();
    this.el.gameover.classList.remove('hidden');

    const score = stats.score || 0;
    this.el.finalScore.textContent = score.toLocaleString();

    // Stats
    this.el.finalStats.innerHTML = [
      `Wave Reached: ${stats.wave}`,
      `Enemies Killed: ${stats.kills}`,
      `Accuracy: ${stats.accuracy.toFixed(1)}%`,
      `Highest Combo: ${stats.highestCombo}x`,
    ].join('<br>');

    // High score check
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      this.el.newHighScore.classList.remove('hidden');
    } else {
      this.el.newHighScore.classList.add('hidden');
    }

    this._setupShareButtons(stats);
  }

  _hideAll() {
    this.el.loading.classList.add('hidden');
    this.el.menu.classList.add('hidden');
    this.el.pause.classList.add('hidden');
    this.el.gameover.classList.add('hidden');
  }

  hideAll() {
    this._hideAll();
  }
}
