// ============================================================================
// AMOR NAS ESTRELAS - LÓGICA INTERATIVA, JOGO ARCADE E CARTA 3D
// ============================================================================

(function () {
  "use strict";

  const cfg = window.AMOR_CONFIG || {};

  // --------------------------------------------------------------------------
  // 1. EFEITOS SONOROS MÁGICOS (Web Audio API - Zero dependências externas)
  // --------------------------------------------------------------------------
  const SoundFX = {
    ctx: null,
    enabled: true,
    scaleIndex: 0,
    // Escala pentatônica maior romântica (Dó, Ré, Mi, Sol, Lá, Dó5, Ré5, Mi5)
    notes: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51],

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    },

    playTone(freq, type = "sine", duration = 0.35, volume = 0.12, delay = 0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    },

    playHeartCatch() {
      const note = this.notes[this.scaleIndex % this.notes.length];
      this.scaleIndex++;
      this.playTone(note, "sine", 0.38, 0.13, 0);
      this.playTone(note * 1.5, "triangle", 0.25, 0.05, 0.04);
    },

    playGoldenCatch() {
      const chord = [783.99, 987.77, 1174.66, 1567.98];
      chord.forEach((freq, idx) => {
        this.playTone(freq, "triangle", 0.45, 0.11, idx * 0.055);
      });
    },

    playMagnetCatch() {
      const notes = [659.25, 880, 1174.66, 1318.51];
      notes.forEach((freq, idx) => {
        this.playTone(freq, "sine", 0.4, 0.1, idx * 0.05);
      });
    },

    playRunawayDodge() {
      this.playTone(340, "sine", 0.14, 0.09, 0);
      this.playTone(480, "sine", 0.16, 0.09, 0.06);
    },

    playVictoryFanfare() {
      const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      melody.forEach((freq, idx) => {
        this.playTone(freq, "triangle", 0.65, 0.13, idx * 0.09);
      });
    },

    playEnvelopeOpen() {
      const harp = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
      harp.forEach((freq, idx) => {
        this.playTone(freq, "sine", 0.8, 0.11, idx * 0.075);
      });
    }
  };

  // --------------------------------------------------------------------------
  // 2. PREENCHIMENTO DE DADOS DA CONFIGURAÇÃO
  // --------------------------------------------------------------------------
  function applyConfiguration() {
    setText("el-nome-dela", cfg.nomeDela || "Meu Amor");
    setText("preview-greeting", "Para " + (cfg.nomeDela || "Meu Amor"));
    setText("el-subtitulo-inicial", cfg.subtituloInicial);
    setText("el-texto-introducao", cfg.textoIntroducao);
    setText("el-pergunta-brincadeira", cfg.perguntaBrincadeira);
    setText("el-botao-sim", cfg.botaoSimInicial);
    setText("el-botao-nao", cfg.botaoNaoFujão);
    setText("score-target", String(cfg.metaPontosAmor || 20));
    setText("el-titulo-carta", cfg.tituloCarta);
    setText("el-despedida-carta", cfg.despedidaCarta);
    setText("el-seu-nome", cfg.seuNome);
    setText("el-legenda-contador", cfg.legendaContador);

    // Parágrafos da carta
    const bodyContainer = document.getElementById("el-paragrafos-carta");
    if (bodyContainer && Array.isArray(cfg.paragrafosCarta)) {
      bodyContainer.innerHTML = "";
      cfg.paragrafosCarta.forEach((texto, idx) => {
        const p = document.createElement("p");
        p.textContent = texto;
        p.style.animationDelay = `${0.35 + idx * 0.25}s`;
        bodyContainer.appendChild(p);
      });
    }

    // Constelação de motivos
    buildReasonsConstellation();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value) {
      el.textContent = value;
    }
  }

  // --------------------------------------------------------------------------
  // 3. CÉU ESTRELADO INTERATIVO (Otimizado para Mobile 60fps)
  // --------------------------------------------------------------------------
  let currentStep = 1;
  let rainTimeouts = [];

  function clearLoveRain() {
    while (rainTimeouts.length > 0) {
      clearTimeout(rainTimeouts.pop());
    }
    const layer = document.getElementById("floating-effects-layer");
    if (layer) {
      layer.innerHTML = "";
    }
  }

  function initStarfield() {
    const canvas = document.getElementById("starfield-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const starColors = ["#ffffff", "#fde047", "#fda4af", "#e9d5ff"];
    const stars = [];

    function createStars() {
      stars.length = 0;
      const isMobile = width < 768;
      const count = isMobile ? 35 : Math.min(75, Math.floor((width * height) / 15000));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          color: starColors[i % starColors.length],
          alpha: Math.random() * 0.7 + 0.25,
          twinkleSpeed: (Math.random() * 0.012 + 0.004) * (Math.random() < 0.5 ? 1 : -1)
        });
      }
    }

    function renderStarfield() {
      // Pausar animação do fundo enquanto o joguinho está rodando para não pesar no celular
      if (currentStep === 2) {
        requestAnimationFrame(renderStarfield);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.alpha += s.twinkleSpeed;
        if (s.alpha > 0.95) {
          s.alpha = 0.95;
          s.twinkleSpeed *= -1;
        } else if (s.alpha < 0.25) {
          s.alpha = 0.25;
          s.twinkleSpeed *= -1;
        }

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.radius * 1.6, s.radius * 1.6);
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(renderStarfield);
    }

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createStars();
    });

    createStars();
    requestAnimationFrame(renderStarfield);
  }

  // --------------------------------------------------------------------------
  // 4. NAVEGAÇÃO ENTRE TELAS E BOTÃO FUJÃO DA ETAPA 1
  // --------------------------------------------------------------------------
  function goToStep(stepNumber) {
    currentStep = stepNumber;
    // Garantir que nenhuma chuva de amor fique caindo durante o jogo ou troca de tela
    clearLoveRain();

    const screens = {
      1: document.getElementById("screen-intro"),
      2: document.getElementById("screen-game"),
      3: document.getElementById("screen-letter")
    };

    Object.keys(screens).forEach((key) => {
      const screen = screens[key];
      if (!screen) return;
      if (Number(key) === stepNumber) {
        screen.classList.add("active");
      } else {
        screen.classList.remove("active");
      }
    });

    if (stepNumber === 2) {
      ArcadeGame.start();
    } else {
      ArcadeGame.stop();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setupIntroInteractions() {
    const btnStart = document.getElementById("btn-start-game");
    const btnRunaway = document.getElementById("btn-runaway-no");
    const feedback = document.getElementById("runaway-feedback");

    const funnyMessages = [
      "Ei! Esse botão está proibido pelas estrelas!",
      "Nada disso! Você é a mulher mais linda e incrível sim!",
      "Opa! O botão fugiu porque sabe que é mentira!",
      "Nem adianta tentar, hoje só o botão do Amor funciona!",
      "As constelações confirmaram: você é perfeita!",
      "Impossível clicar aqui, meu amor por você não deixa!"
    ];
    let dodgeCount = 0;
    let currentOffsetX = 0;
    let currentOffsetY = 0;
    let lastDodgeTime = 0;

    function dodgeButton(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const now = performance.now();
      // Evita múltiplos disparos no mesmo frame, mas reage instantaneamente se o mouse chegar perto
      if (now - lastDodgeTime < 45) return;
      lastDodgeTime = now;

      SoundFX.playRunawayDodge();

      const btnRect = btnRunaway.getBoundingClientRect();
      const startRect = btnStart ? btnStart.getBoundingClientRect() : null;

      // Posição original (sem transform) do botão fujão
      const baseLeft = btnRect.left - currentOffsetX;
      const baseTop = btnRect.top - currentOffsetY;
      const btnW = btnRect.width;
      const btnH = btnRect.height;

      // Coordenadas do cursor ou toque
      let pointerX = baseLeft + currentOffsetX + btnW / 2;
      let pointerY = baseTop + currentOffsetY + btnH / 2;
      if (e) {
        if (e.touches && e.touches[0]) {
          pointerX = e.touches[0].clientX;
          pointerY = e.touches[0].clientY;
        } else if (typeof e.clientX === "number") {
          pointerX = e.clientX;
          pointerY = e.clientY;
        }
      }

      // Limites seguros dentro da janela visível
      const margin = 20;
      const minX = Math.max(-240, margin - baseLeft);
      const maxX = Math.min(240, window.innerWidth - margin - (baseLeft + btnW));
      const minY = Math.max(-220, 70 - baseTop);
      const maxY = Math.min(130, window.innerHeight - margin - (baseTop + btnH));

      let bestX = currentOffsetX;
      let bestY = currentOffsetY;
      let bestScore = -Infinity;

      // Testar 32 posições candidatas e escolher a que fica mais longe do cursor e sem cobrir o botão "Sim"
      for (let i = 0; i < 32; i++) {
        const candX = minX + Math.random() * (maxX - minX);
        const candY = minY + Math.random() * (maxY - minY);

        const candCenterX = baseLeft + candX + btnW / 2;
        const candCenterY = baseTop + candY + btnH / 2;

        const distFromPointer = Math.hypot(candCenterX - pointerX, candCenterY - pointerY);
        const distFromCurrent = Math.hypot(candX - currentOffsetX, candY - currentOffsetY);

        // Verificar se não fica em cima do botão "Prometo! Quero jogar"
        let overlapsStart = false;
        if (startRect) {
          const candLeft = baseLeft + candX;
          const candRight = candLeft + btnW;
          const candTop = baseTop + candY;
          const candBottom = candTop + btnH;

          if (
            candRight + 12 > startRect.left &&
            candLeft - 12 < startRect.right &&
            candBottom + 12 > startRect.top &&
            candTop - 12 < startRect.bottom
          ) {
            overlapsStart = true;
          }
        }

        let score = distFromPointer + distFromCurrent * 0.45;
        if (overlapsStart) score -= 1000;
        if (distFromPointer < 135) score -= 500;
        if (distFromCurrent < 90) score -= 300;

        if (score > bestScore) {
          bestScore = score;
          bestX = candX;
          bestY = candY;
        }
      }

      currentOffsetX = bestX;
      currentOffsetY = bestY;
      btnRunaway.style.transform = `translate3d(${bestX.toFixed(0)}px, ${bestY.toFixed(0)}px, 0)`;

      // Destacar ainda mais o botão "Sim" a cada tentativa
      if (btnStart) {
        const scaleBoost = Math.min(1.12, 1 + (dodgeCount + 1) * 0.02);
        btnStart.style.transform = `scale(${scaleBoost.toFixed(2)})`;
      }

      if (feedback) {
        feedback.textContent = funnyMessages[dodgeCount % funnyMessages.length];
      }
      dodgeCount++;
    }

    if (btnRunaway) {
      ["mouseenter", "mousemove", "pointerdown", "mousedown", "touchstart", "click", "focus"].forEach(
        (evtName) => {
          btnRunaway.addEventListener(evtName, dodgeButton, { passive: false });
        }
      );

      // Sensor de proximidade: antes mesmo de o mouse encostar no botão, ele já foge!
      document.addEventListener("mousemove", (e) => {
        if (currentStep !== 1) return;
        const rect = btnRunaway.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = Math.max(0, Math.abs(e.clientX - centerX) - rect.width / 2);
        const distY = Math.max(0, Math.abs(e.clientY - centerY) - rect.height / 2);
        const distanceToEdge = Math.hypot(distX, distY);

        if (distanceToEdge < 42) {
          dodgeButton(e);
        }
      });
    }

    if (btnStart) {
      btnStart.addEventListener("click", () => {
        SoundFX.playHeartCatch();
        goToStep(2);
      });
    }

    // Botão de som
    const btnAudio = document.getElementById("btn-audio-toggle");
    const iconOn = document.getElementById("icon-sound-on");
    const iconOff = document.getElementById("icon-sound-off");
    if (btnAudio) {
      btnAudio.addEventListener("click", () => {
        SoundFX.enabled = !SoundFX.enabled;
        iconOn.classList.toggle("hidden", !SoundFX.enabled);
        iconOff.classList.toggle("hidden", SoundFX.enabled);
        if (SoundFX.enabled) {
          SoundFX.playHeartCatch();
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5. JOGUINHO ARCADE: "CHUVA DE AMOR ESTELAR" (Ultra Otimizado 60fps Mobile)
  // --------------------------------------------------------------------------
  const ArcadeGame = {
    canvas: null,
    ctx: null,
    running: false,
    rafId: null,
    width: 0,
    height: 0,
    points: 0,
    targetPoints: 20,
    completed: false,
    lastSpawnTime: 0,
    keys: { left: false, right: false },
    sprites: {
      rose: null,
      gold: null,
      basket: null
    },

    catcher: {
      x: 0,
      y: 0,
      width: 96,
      height: 28,
      targetX: 0
    },

    items: [],
    particles: [],
    floatingTexts: [],

    init() {
      this.canvas = document.getElementById("game-canvas");
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d", { alpha: true });
      this.targetPoints = Number(cfg.metaPontosAmor) || 20;
      this.buildSprites();

      const container = document.getElementById("game-arena-container");
      const updatePositionFromClientX = (clientX) => {
        const rect = this.canvas.getBoundingClientRect();
        const relX = clientX - rect.left;
        this.catcher.targetX = Math.max(
          this.catcher.width / 2,
          Math.min(this.width - this.catcher.width / 2, relX)
        );
        const hint = document.getElementById("game-touch-hint");
        if (hint) hint.style.opacity = "0";
      };

      container.addEventListener("mousemove", (e) => {
        updatePositionFromClientX(e.clientX);
      });

      container.addEventListener(
        "touchmove",
        (e) => {
          if (e.touches && e.touches[0]) {
            updatePositionFromClientX(e.touches[0].clientX);
          }
        },
        { passive: true }
      );

      container.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches && e.touches[0]) {
            updatePositionFromClientX(e.touches[0].clientX);
          }
        },
        { passive: true }
      );

      window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          this.keys.left = true;
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          this.keys.right = true;
        }
      });

      window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          this.keys.left = false;
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          this.keys.right = false;
        }
      });

      window.addEventListener("resize", () => {
        if (this.running) this.resize();
      });

      const skipBtn = document.getElementById("btn-skip-game");
      if (skipBtn) {
        skipBtn.addEventListener("click", () => {
          SoundFX.playVictoryFanfare();
          this.completeGame();
        });
      }
    },

    // Pré-renderiza os corações e o cesto 1 única vez para não usar shadowBlur a cada frame
    buildSprites() {
      const makeHeartSprite = (size, fillColor, glowColor) => {
        const c = document.createElement("canvas");
        c.width = size * 2;
        c.height = size * 2;
        const g = c.getContext("2d");
        g.translate(size, size - size * 0.42);
        g.shadowColor = glowColor;
        g.shadowBlur = 6;
        g.fillStyle = fillColor;
        this.drawHeartPath(g, 0, 0, size);
        g.fill();
        return c;
      };

      this.sprites.rose = makeHeartSprite(28, "#fb7185", "#f43f5e");
      this.sprites.gold = makeHeartSprite(32, "#fde047", "#f59e0b");

      // Pré-renderizar o cesto estelar
      const bw = this.catcher.width;
      const bh = this.catcher.height;
      const bc = document.createElement("canvas");
      bc.width = bw + 16;
      bc.height = bh + 16;
      const bctx = bc.getContext("2d");
      const ox = 8;
      const oy = 8;

      const basketGrad = bctx.createLinearGradient(ox, oy, ox + bw, oy);
      basketGrad.addColorStop(0, "#ec4899");
      basketGrad.addColorStop(0.5, "#fde047");
      basketGrad.addColorStop(1, "#a855f7");

      bctx.fillStyle = basketGrad;
      bctx.beginPath();
      if (bctx.roundRect) {
        bctx.roundRect(ox, oy, bw, bh, 14);
      } else {
        bctx.rect(ox, oy, bw, bh);
      }
      bctx.fill();

      bctx.fillStyle = "#171136";
      bctx.beginPath();
      if (bctx.roundRect) {
        bctx.roundRect(ox + 3, oy + 3, bw - 6, bh - 6, 11);
      } else {
        bctx.rect(ox + 3, oy + 3, bw - 6, bh - 6);
      }
      bctx.fill();

      bctx.fillStyle = "#fb7185";
      this.drawHeartPath(bctx, ox + bw / 2, oy + 6, 16);
      bctx.fill();

      this.sprites.basket = bc;
    },

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      // Em celulares usa DPR 1 para aliviar a GPU e garantir 60fps cravados
      const isMobile = window.innerWidth < 768;
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.catcher.y = this.height - 42;
      if (!this.catcher.x) {
        this.catcher.x = this.width / 2;
        this.catcher.targetX = this.width / 2;
      }
    },

    start() {
      if (!this.canvas) this.init();
      clearLoveRain();
      this.resize();
      if (this.completed) {
        this.resetScore();
      }
      this.running = true;
      this.lastSpawnTime = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        this.update(now);
        this.draw();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    },

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    },

    resetScore() {
      this.points = 0;
      this.completed = false;
      this.items = [];
      this.particles = [];
      this.floatingTexts = [];
      this.updateHUD();
    },

    spawnItem() {
      const rand = Math.random();
      let type = "rose";
      let value = 1;
      let radius = 15;
      let speed = Math.random() * 1.4 + 2.2;

      if (rand > 0.78) {
        type = "gold";
        value = 3;
        radius = 18;
        speed = Math.random() * 1.6 + 2.5;
      }

      const margin = 28;
      this.items.push({
        x: margin + Math.random() * (this.width - margin * 2),
        y: -25,
        vx: (Math.random() - 0.5) * 0.5,
        vy: speed,
        radius,
        type,
        value
      });
    },

    update(now) {
      const moveSpeed = 7;
      if (this.keys.left) {
        this.catcher.targetX = Math.max(
          this.catcher.width / 2,
          this.catcher.targetX - moveSpeed
        );
      }
      if (this.keys.right) {
        this.catcher.targetX = Math.min(
          this.width - this.catcher.width / 2,
          this.catcher.targetX + moveSpeed
        );
      }

      this.catcher.x += (this.catcher.targetX - this.catcher.x) * 0.25;

      if (now - this.lastSpawnTime > 540) {
        this.spawnItem();
        this.lastSpawnTime = now;
      }

      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        it.x += it.vx;
        it.y += it.vy;

        const hitX = Math.abs(it.x - this.catcher.x) < this.catcher.width * 0.56;
        const hitY = Math.abs(it.y - this.catcher.y) < 24;

        if (hitX && hitY) {
          this.onCatchItem(it);
          this.items.splice(i, 1);
          continue;
        }

        if (it.y > this.height + 35) {
          this.items.splice(i, 1);
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 0.04;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y -= 1.2;
        ft.life -= 0.03;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    },

    onCatchItem(item) {
      if (this.completed) return;

      this.points = Math.min(this.targetPoints, this.points + item.value);

      const phrases = cfg.frasesAoPegarCoracao || ["Eu te amo!", "Linda!", "Meu amor!"];
      let label = phrases[Math.floor(Math.random() * phrases.length)];
      let color = "#fda4af";

      if (item.type === "gold") {
        SoundFX.playGoldenCatch();
        label = "+3 " + label;
        color = "#fde047";
      } else {
        SoundFX.playHeartCatch();
      }

      const pColor = item.type === "gold" ? "#fde047" : "#fb7185";
      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7;
        const speed = Math.random() * 2.6 + 1.2;
        this.particles.push({
          x: item.x,
          y: item.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          color: pColor,
          size: 4,
          life: 1
        });
      }

      this.floatingTexts.push({
        x: Math.max(60, Math.min(this.width - 60, item.x)),
        y: item.y - 10,
        text: label,
        color,
        life: 1
      });

      this.updateHUD();

      if (this.points >= this.targetPoints && !this.completed) {
        this.completed = true;
        SoundFX.playVictoryFanfare();
        setTimeout(() => {
          this.completeGame();
        }, 700);
      }
    },

    updateHUD() {
      const pct = Math.min(100, Math.round((this.points / this.targetPoints) * 100));
      const fill = document.getElementById("love-meter-fill");
      const knob = document.getElementById("love-meter-knob");
      const badge = document.getElementById("love-percentage-badge");
      const scoreEl = document.getElementById("score-points");
      const statusEl = document.getElementById("game-status-text");
      const progressbar = document.getElementById("love-progressbar");

      if (fill) fill.style.width = `${pct}%`;
      if (knob) knob.style.left = `${pct}%`;
      if (badge) badge.textContent = `${pct}%`;
      if (scoreEl) scoreEl.textContent = String(this.points);
      if (progressbar) progressbar.setAttribute("aria-valuenow", String(pct));

      if (statusEl) {
        if (pct === 0) {
          statusEl.textContent = "Arraste o cesto luminoso para capturar os corações!";
        } else if (pct < 40) {
          statusEl.textContent = "O nosso céu já está ficando mais brilhante...";
        } else if (pct < 80) {
          statusEl.textContent = "Você está indo super bem! Quase lá, meu amor!";
        } else if (pct < 100) {
          statusEl.textContent = "Só mais um pouquinho para abrir sua carta!";
        } else {
          statusEl.textContent = "100% de Amor Alcançado! Abrindo o seu envelope...";
        }
      }
    },

    completeGame() {
      this.stop();
      goToStep(3);
    },

    drawHeartPath(ctx, x, y, size) {
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(x, y + topCurveHeight);
      ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
      ctx.bezierCurveTo(
        x - size / 2,
        y + (size + topCurveHeight) / 2,
        x,
        y + (size + topCurveHeight) / 1.45,
        x,
        y + size
      );
      ctx.bezierCurveTo(
        x,
        y + (size + topCurveHeight) / 1.45,
        x + size / 2,
        y + (size + topCurveHeight) / 2,
        x + size / 2,
        y + topCurveHeight
      );
      ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
      ctx.closePath();
    },

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      // Desenhar o Cesto Estelar via sprite pré-renderizado (0 shadowBlur por frame)
      if (this.sprites.basket) {
        ctx.drawImage(
          this.sprites.basket,
          this.catcher.x - this.sprites.basket.width / 2,
          this.catcher.y - this.sprites.basket.height / 2
        );
      }

      // Desenhar corações caindo via sprites pré-renderizados
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        const sp = it.type === "gold" ? this.sprites.gold : this.sprites.rose;
        if (sp) {
          ctx.drawImage(sp, it.x - sp.width / 2, it.y - sp.height / 2);
        }
      }

      // Desenhar partículas leves
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, p.size, p.size);
      }

      // Desenhar textos flutuantes sem shadowBlur pesado
      ctx.font = "700 14px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;
    }
  };

  // --------------------------------------------------------------------------
  // 6. ABERTURA DO ENVELOPE 3D E REVELAÇÃO DA CARTA
  // --------------------------------------------------------------------------
  let envelopeOpened = false;
  let typewriterStarted = false;

  function setupEnvelopeAndLetter() {
    const envelopeBtn = document.getElementById("envelope-3d");
    const envelopeStage = document.getElementById("envelope-stage");
    const letterOpenedView = document.getElementById("letter-opened-view");
    const btnLoveShower = document.getElementById("btn-love-shower");
    const btnReplay = document.getElementById("btn-replay-game");

    if (envelopeBtn) {
      envelopeBtn.addEventListener("click", () => {
        if (envelopeOpened) return;
        envelopeOpened = true;

        SoundFX.playEnvelopeOpen();
        envelopeBtn.classList.add("is-opening");

        const instruction = document.getElementById("envelope-instruction");
        if (instruction) {
          instruction.textContent = "Abrindo sua carta especial...";
        }

        setTimeout(() => {
          if (envelopeStage) envelopeStage.classList.add("hidden");
          if (letterOpenedView) letterOpenedView.classList.remove("hidden");
          startFeaturedQuoteTypewriter();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 1650);
      });
    }

    if (btnLoveShower) {
      btnLoveShower.addEventListener("click", () => {
        SoundFX.playVictoryFanfare();
        const isMobile = window.innerWidth < 768;
        spawnGlobalHeartBurst(isMobile ? 55 : 90);
      });
    }

    if (btnReplay) {
      btnReplay.addEventListener("click", () => {
        SoundFX.playHeartCatch();
        clearLoveRain();
        envelopeOpened = false;
        typewriterStarted = false;
        if (envelopeBtn) envelopeBtn.classList.remove("is-opening");
        if (envelopeStage) envelopeStage.classList.remove("hidden");
        if (letterOpenedView) letterOpenedView.classList.add("hidden");
        ArcadeGame.resetScore();
        goToStep(2);
      });
    }
  }

  function startFeaturedQuoteTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;

    const quoteEl = document.getElementById("el-frase-destaque");
    if (!quoteEl) return;

    const fullText =
      cfg.fraseDestaque ||
      "“Em um universo inteiro de bilhões de estrelas, o meu olhar sempre vai procurar o seu.”";

    quoteEl.textContent = "";
    let index = 0;

    function typeNext() {
      if (index <= fullText.length) {
        quoteEl.textContent = fullText.slice(0, index);
        index++;
        setTimeout(typeNext, 28);
      }
    }

    typeNext();
  }

  // --------------------------------------------------------------------------
  // 7. CONSTELAÇÃO DE MOTIVOS
  // --------------------------------------------------------------------------
  function buildReasonsConstellation() {
    const nav = document.getElementById("stars-reasons-nav");
    const titleEl = document.getElementById("reason-title");
    const textEl = document.getElementById("reason-text");
    const reasons = Array.isArray(cfg.motivosQueTeAmo) ? cfg.motivosQueTeAmo : [];

    if (!nav || reasons.length === 0) return;
    nav.innerHTML = "";

    function selectReason(idx) {
      const buttons = nav.querySelectorAll(".star-reason-btn");
      buttons.forEach((b, i) => b.classList.toggle("active", i === idx));
      if (titleEl) titleEl.textContent = reasons[idx].titulo;
      if (textEl) textEl.textContent = reasons[idx].texto;
    }

    reasons.forEach((reason, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "star-reason-btn" + (idx === 0 ? " active" : "");
      btn.setAttribute("aria-label", `Motivo ${idx + 1}: ${reason.titulo}`);
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" />
        </svg>
      `;
      btn.addEventListener("click", () => {
        SoundFX.playHeartCatch();
        selectReason(idx);
      });
      nav.appendChild(btn);
    });

    selectReason(0);
  }

  // --------------------------------------------------------------------------
  // 8. CHUVA INTENSA DE CORAÇÕES E "EU TE AMO!" (SOMENTE NA TELA DA CARTA)
  // --------------------------------------------------------------------------
  function spawnGlobalHeartBurst(count = 60) {
    // Nunca soltar a chuva global se estiver na tela do jogo
    if (currentStep === 2) return;

    const layer = document.getElementById("floating-effects-layer");
    if (!layer) return;

    clearLoveRain();

    const basePhrases = cfg.frasesAoPegarCoracao || [];
    const rainPhrases = [
      "Eu te amo!",
      "Eu te amo muito!",
      "Amor da minha vida!",
      "Minha princesa!",
      "Você é tudo pra mim!",
      "Para sempre nós!",
      ...basePhrases
    ];
    const heartColors = ["#fb7185", "#f43f5e", "#fde047", "#f472b6", "#e879f9"];

    for (let i = 0; i < count; i++) {
      const tId = setTimeout(() => {
        if (currentStep === 2) return;
        const item = document.createElement("div");
        const showPhrase = i % 2 === 0;
        item.className = "floating-love-item" + (showPhrase ? " has-pill" : "");

        const leftPct = Math.random() * 90 + 3;
        const duration = (Math.random() * 2.0 + 2.4).toFixed(2);
        const swayMid = `${((Math.random() - 0.5) * 70).toFixed(0)}px`;
        const swayEnd = `${((Math.random() - 0.5) * 90).toFixed(0)}px`;
        const rotMid = `${((Math.random() - 0.5) * 20).toFixed(0)}deg`;
        const rotEnd = `${((Math.random() - 0.5) * 26).toFixed(0)}deg`;

        item.style.left = `${leftPct}%`;
        item.style.fontSize = showPhrase ? "0.92rem" : "1.15rem";
        item.style.setProperty("--fall-duration", `${duration}s`);
        item.style.setProperty("--sway-mid", swayMid);
        item.style.setProperty("--sway-end", swayEnd);
        item.style.setProperty("--rot-mid", rotMid);
        item.style.setProperty("--rot-end", rotEnd);

        const color = heartColors[i % heartColors.length];
        const heartSize = showPhrase ? 16 : 22;
        const text = showPhrase ? rainPhrases[i % rainPhrases.length] : "";

        item.innerHTML = `
          <svg width="${heartSize}" height="${heartSize}" viewBox="0 0 24 24" fill="${color}">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          ${text ? `<span>${text}</span>` : ""}
        `;

        layer.appendChild(item);
        const removeId = setTimeout(() => {
          item.remove();
        }, Number(duration) * 1000 + 150);
        rainTimeouts.push(removeId);
      }, i * 50);
      rainTimeouts.push(tId);
    }
  }

  // Inicialização geral quando o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", () => {
    applyConfiguration();
    initStarfield();
    setupIntroInteractions();
    ArcadeGame.init();
    setupEnvelopeAndLetter();
  });
})();
