export class HUD {
  constructor() {
    this.el = {
      hud: document.getElementById('hud'),
      healthFill: document.getElementById('health-fill'),
      healthValue: document.getElementById('health-value'),
      shieldFill: document.getElementById('shield-fill'),
      shieldValue: document.getElementById('shield-value'),
      ammoCount: document.getElementById('ammo-count'),
      scoreVal: document.getElementById('score-val'),
      waveVal: document.getElementById('wave-val'),
      comboDisplay: document.getElementById('combo-display'),
      comboVal: document.getElementById('combo-val'),
      enemiesVal: document.getElementById('enemies-val'),
      hitMarker: document.getElementById('hit-marker'),
      damageVignette: document.getElementById('damage-vignette'),
      waveAnnounce: document.getElementById('wave-announce'),
      waveAnnounceNum: document.getElementById('wave-announce-num'),
      waveAnnounceSub: document.getElementById('wave-announce-sub'),
      reloadBar: document.getElementById('reload-bar'),
      reloadFill: document.getElementById('reload-fill'),
    };

    this.hitMarkerTimer = 0;
    this.damageVignetteTimer = 0;
    this.screenShakeAmount = 0;
    this.displayedScore = 0;
  }

  show() {
    this.el.hud.classList.remove('hidden');
  }

  hide() {
    this.el.hud.classList.add('hidden');
  }

  update(dt, state) {
    // Health
    const healthPct = (state.health / state.maxHealth) * 100;
    this.el.healthFill.style.width = healthPct + '%';
    this.el.healthValue.textContent = `${Math.round(state.health)}/${state.maxHealth}`;
    if (healthPct > 60) {
      this.el.healthFill.style.background = 'linear-gradient(90deg, #0a3, #0f4)';
      this.el.healthFill.style.boxShadow = '0 0 8px rgba(0, 255, 68, 0.6)';
    } else if (healthPct > 30) {
      this.el.healthFill.style.background = 'linear-gradient(90deg, #a60, #fa0)';
      this.el.healthFill.style.boxShadow = '0 0 8px rgba(255, 170, 0, 0.6)';
    } else {
      this.el.healthFill.style.background = 'linear-gradient(90deg, #a22, #f44)';
      this.el.healthFill.style.boxShadow = '0 0 8px rgba(255, 68, 68, 0.8)';
    }

    // Shield
    const shieldPct = (state.shield / state.maxShield) * 100;
    this.el.shieldFill.style.width = shieldPct + '%';
    this.el.shieldValue.textContent = `${Math.round(state.shield)}/${state.maxShield}`;

    // Ammo
    const ammoEl = this.el.ammoCount;
    if (state.reloading) {
      ammoEl.textContent = 'RELOADING';
      ammoEl.className = 'ammo-count reloading';
      this.el.reloadBar.classList.add('visible');
      this.el.reloadFill.style.width = (state.reloadProgress * 100) + '%';
    } else {
      ammoEl.textContent = state.ammo;
      ammoEl.className = 'ammo-count' + (state.ammo <= 5 ? ' low' : '');
      this.el.reloadBar.classList.remove('visible');
      this.el.reloadFill.style.width = '0%';
    }

    // Score (animated)
    if (this.displayedScore < state.score) {
      const diff = state.score - this.displayedScore;
      this.displayedScore += Math.ceil(diff * Math.min(1, dt * 8));
      if (this.displayedScore > state.score) this.displayedScore = state.score;
    }
    this.el.scoreVal.textContent = this.displayedScore.toLocaleString();

    // Wave
    this.el.waveVal.textContent = state.wave;

    // Enemies
    this.el.enemiesVal.textContent = state.enemyCount;

    // Combo
    if (state.combo > 1) {
      this.el.comboDisplay.classList.add('active');
      this.el.comboVal.textContent = `x${state.comboMultiplier.toFixed(1)} (${state.combo})`;
    } else {
      this.el.comboDisplay.classList.remove('active');
    }

    // Hit marker
    if (this.hitMarkerTimer > 0) {
      this.hitMarkerTimer -= dt;
      this.el.hitMarker.style.opacity = Math.max(0, this.hitMarkerTimer / 0.15);
    }

    // Damage vignette
    if (this.damageVignetteTimer > 0) {
      this.damageVignetteTimer -= dt;
      this.el.damageVignette.style.opacity = Math.max(0, this.damageVignetteTimer / 0.4);
    }

    // Screen shake
    if (this.screenShakeAmount > 0) {
      this.screenShakeAmount *= Math.pow(0.001, dt);
      if (this.screenShakeAmount < 0.01) this.screenShakeAmount = 0;
    }
  }

  showHitMarker(killed) {
    this.hitMarkerTimer = 0.15;
    this.el.hitMarker.style.opacity = 1;
    // Change color for kills
    const color = killed ? '#ff0' : '#fff';
    this.el.hitMarker.querySelectorAll('.hm-line').forEach(l => {
      l.style.background = color;
    });
  }

  showDamageVignette() {
    this.damageVignetteTimer = 0.4;
    this.el.damageVignette.style.opacity = 0.5;
  }

  addScreenShake(amount) {
    this.screenShakeAmount = Math.min(1, this.screenShakeAmount + amount);
  }

  getScreenShakeOffset() {
    if (this.screenShakeAmount <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShakeAmount * 0.02,
      y: (Math.random() - 0.5) * this.screenShakeAmount * 0.02,
    };
  }

  showWaveAnnouncement(wave, subtext) {
    this.el.waveAnnounceNum.textContent = `WAVE ${wave}`;
    this.el.waveAnnounceSub.textContent = subtext;
    this.el.waveAnnounce.classList.add('visible');

    setTimeout(() => {
      this.el.waveAnnounce.classList.remove('visible');
    }, 2000);
  }
}
