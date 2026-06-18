/* ================= game.js - Hip Dog Run ================= */

// ==========================================
// 1. SÍNTESE DE ÁUDIO NATIVA (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }


  // Inicializa o AudioContext apenas após interação do usuário (exigência dos navegadores)
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Som de Pulo (Bloop ascendente suave)
  playJump() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Som de Coleta Positiva (Arpejo alegre ascendente em Tríade de Dó Maior)
  playCollect() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const duration = 0.06;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * duration;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.1, time);
      gain.gain.linearRampToValueAtTime(0.01, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // Som de Colisão Negativa (Grito de erro descendente com distorção ruidosa)
  playHit() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Som principal: Choro do cachorro ("Caim!")
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine'; // Sine produz um som mais parecido com um assobio vocal/choro
    
    // Modulação de Frequência para imitar o "Caaa-im" (Sobe rápido, desce afinando)
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.35);

    // Envelope de Volume: ataque rápido e fade out progressivo
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    // Efeito de ruído/poeira curto
    try {
      const bufferSize = this.ctx.sampleRate * 0.15; // 0.15 segundos
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 400;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.15);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.15);
    } catch (e) {
      // Fallback silencioso se o buffer falhar
    }
  }

  // Som de Evolução / Level Up (Fanfarra sintetizada triunfante)
  playLevelUp() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Duas notas em harmonia brilhante
    const playTone = (freq, delay, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + dur);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.linearRampToValueAtTime(0.01, time + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    };

    playTone(261.63, 0, 0.2);     // C4
    playTone(392.00, 0.1, 0.25);  // G4
    playTone(523.25, 0.2, 0.4);   // C5
    playTone(659.25, 0.2, 0.4);   // E5 (acorde maior brilhante)
  }
}

const sounds = new SoundFX();

// ==========================================
// 2. SISTEMA DE PARTÍCULAS
// ==========================================
class Particle {
  constructor(x, y, color, isGood) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() * 2 - 1) * (isGood ? 4 : 3);
    this.vy = (Math.random() * -3 - (isGood ? 2 : 1));
    this.radius = Math.random() * (isGood ? 4 : 5) + 2;
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.015;
    this.gravity = 0.1;
    this.isGood = isGood;
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;

    if (this.isGood) {
      // Desenha pequenas estrelas brilhantes para coisas boas
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          this.x + this.radius * Math.cos((18 + i * 72) * Math.PI / 180),
          this.y + this.radius * Math.sin((18 + i * 72) * Math.PI / 180)
        );
        ctx.lineTo(
          this.x + (this.radius / 2) * Math.cos((54 + i * 72) * Math.PI / 180),
          this.y + (this.radius / 2) * Math.sin((54 + i * 72) * Math.PI / 180)
        );
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Partículas redondas de poeira para coisas ruins
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ==========================================
// 2.5. CLASSE DE TEXTO FLUTUANTE
// ==========================================
class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.vy = -1.5;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';

    // Contorno do texto
    ctx.strokeStyle = 'rgba(17, 24, 39, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);

    // Preenchimento
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ==========================================
// 3. CLASSE DO CACHORRO (ENTITY)
// ==========================================
class Dog {
  constructor(canvasHeight) {
    this.groundY = canvasHeight - 65; // Nível estável do chão
    this.x = 80;
    this.y = this.groundY;
    this.width = 90;
    this.height = 90;
    this.vy = 0;
    this.gravity = 0.65;
    this.jumpPower = -15.5;
    this.isJumping = false;

    // Animação de sprite
    this.TOTAL_FRAMES = 38;        // dog-run tem frames 1-38
    this.frameIndex = 0;           // Frame atual da corrida (0-37)
    this.frameTimer = 0;           // Acumulador para troca de frame
    this.spritesLoaded = false;
    this.sprites = [];             // Frames de corrida

    // Frames de salto
    this.JUMP_FRAMES = 5;          // dog-run-jump tem: frames 10-14 (5 arquivos)
    this.jumpFrameIndex = 0;
    this.jumpFrameTimer = 0;
    this.jumpSprites = [];
    this.jumpSpritesLoaded = false;
    this.jumpAnimDone = false;     // true quando chegou ao último frame do salto

    this._loadSprites();

    // Animação de corrida (compatibilidade)
    this.legAngle = 0;
    this.runSpeedModifier = 0.22;
    this.tailWagAngle = 0;

    this.stage = 'Filhote'; // Filhote, Jovem, Adulto saudável, Campeão
  }

  // Remove o fundo xadrez/branco dos sprites via BFS a partir das bordas.
  // Detecta pixels "cinza" (R≈G≈B) com luminosidade alta — captura AMBAS as
  // cores do xadrez (cinza claro ~#CCCCCC e cinza escuro ~#999999) sem afetar
  // a pelagem colorida do cachorro (que tem alta variação entre canais RGB).
  // Retorna um HTMLCanvasElement pronto para uso em drawImage().
  _removeBackground(img) {
    const offscreen = document.createElement('canvas');
    offscreen.width = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, 0, 0);

    const w = offscreen.width;
    const h = offscreen.height;
    const imageData = offCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Pixel é fundo se:
    //   1. já é transparente, OU
    //   2. é "cinza" (max(|R-G|,|G-B|,|R-B|) < 30) E luminoso (R > 110)
    // Isso captura os dois tons do xadrez enquanto preserva cores reais do sprite.
    function isBg(idx) {
      const a = data[idx + 3];
      if (a < 10) return true;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      return maxDiff < 30 && r > 110;
    }

    // BFS a partir de todos os pixels de borda
    const visited = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) {
      queue.push(x);
      queue.push((h - 1) * w + x);
    }
    for (let y = 1; y < h - 1; y++) {
      queue.push(y * w);
      queue.push(y * w + w - 1);
    }

    while (queue.length > 0) {
      const pos = queue.pop();
      if (visited[pos]) continue;
      visited[pos] = 1;
      const idx = pos * 4;
      if (!isBg(idx)) continue;
      data[idx + 3] = 0; // torna transparente
      const x = pos % w;
      const y = Math.floor(pos / w);
      if (x > 0) queue.push(pos - 1);
      if (x < w - 1) queue.push(pos + 1);
      if (y > 0) queue.push(pos - w);
      if (y < h - 1) queue.push(pos + w);
    }

    offCtx.putImageData(imageData, 0, 0);

    // Otimização: Escalar a imagem para um tamanho menor antes de usá-la no jogo.
    // Isso evita o overhead de desenhar uma imagem gigante e reduzi-la a cada frame.
    const targetWidth = 250;
    const scale = targetWidth / w;
    const targetHeight = Math.floor(h * scale);

    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = targetWidth;
    smallCanvas.height = targetHeight;
    const smallCtx = smallCanvas.getContext('2d');

    // Configurações para manter a suavidade na redução
    smallCtx.imageSmoothingEnabled = true;
    smallCtx.imageSmoothingQuality = 'high';
    smallCtx.drawImage(offscreen, 0, 0, targetWidth, targetHeight);

    return smallCanvas; // Retornamos o canvas menor otimizado
  }

  _loadSprites() {
    // --- Sprites de corrida (dog-run: frames 1-38) ---
    let runLoaded = 0;
    for (let i = 1; i <= this.TOTAL_FRAMES; i++) {
      this.sprites.push(null); // placeholder
      const idx = i - 1;
      const img = new Image();
      img.src = `sprite/dog-run/dog-run (${i}).png`;
      img.onload = () => {
        this.sprites[idx] = this._removeBackground(img);
        runLoaded++;
        if (runLoaded === this.TOTAL_FRAMES) this.spritesLoaded = true;
      };
      img.onerror = () => { runLoaded++; };
    }

    // --- Sprites de salto (dog-run-jump: frames 10-14 = 5 arquivos) ---
    let jumpLoaded = 0;
    for (let i = 10; i <= 14; i++) {
      this.jumpSprites.push(null); // placeholder
      const jIdx = i - 10;
      const img = new Image();
      img.src = `sprite/dog-run-jump/dog-run (${i}).png`;
      img.onload = () => {
        this.jumpSprites[jIdx] = this._removeBackground(img);
        jumpLoaded++;
        if (jumpLoaded === this.JUMP_FRAMES) this.jumpSpritesLoaded = true;
      };
      img.onerror = () => { jumpLoaded++; };
    }
  }

  jump() {
    if (!this.isJumping) {
      this.vy = this.jumpPower;
      this.isJumping = true;
      this.jumpFrameIndex = 0;  // sempre começa do frame 0 ao pular
      this.jumpFrameTimer = 0;  // reseta o timer de troca
      this.jumpAnimDone = false; // reseta flag de animação concluída
      sounds.playJump();
    }
  }

  update(speed) {
    // Aplicar física de gravidade
    this.vy += this.gravity;
    this.y += this.vy;

    // Verificar colisão com o chão
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.isJumping = false;
    }

    // Avançar frame de animação
    if (!this.isJumping) {
      // No chão: cicla frames de corrida em velocidade constante (independente da speed do jogo)
      this.jumpFrameIndex = 0;
      this.jumpAnimDone = false;
      this.frameTimer++;
      const FRAME_SPEED = 4; // troca de frame a cada 4 updates — fixo, não muda com a velocidade
      if (this.frameTimer >= FRAME_SPEED) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % this.TOTAL_FRAMES;
      }
      this.legAngle += speed * this.runSpeedModifier;
      this.tailWagAngle = Math.sin(this.legAngle * 1.5) * 0.3;
    } else {
      // No ar: avança frames de salto uma vez e trava no último
      if (!this.jumpAnimDone) {
        this.jumpFrameTimer++;
        const jumpFrameSpeed = 3; // troca de frame a cada 3 updates
        if (this.jumpFrameTimer >= jumpFrameSpeed) {
          this.jumpFrameTimer = 0;
          if (this.jumpFrameIndex < this.JUMP_FRAMES - 1) {
            this.jumpFrameIndex++;
          } else {
            this.jumpAnimDone = true; // chegou ao último frame — congela aqui
          }
        }
      }
      // jumpFrameIndex permanece no último frame até pousar
      this.tailWagAngle = -0.4;
    }
  }

  // Retorna a escala de tamanho baseada no estágio
  _getSizeScale() {
    if (this.stage === 'Jovem') return 1.3;
    if (this.stage === 'Adulto saudável') return 1.5;
    if (this.stage === 'Campeão da Mobilidade' || this.stage === 'Mestre da Agilidade' || this.stage === 'Lenda Canina' || this.stage === 'Explorador da Floresta' || this.stage === 'Surfista da Praia') return 1.7;
    return 1.1; // Filhote
  }

  draw(ctx) {
    const sizeScale = this._getSizeScale();
    const spriteW = this.width * sizeScale;
    const spriteH = this.height * sizeScale;

    // Posição base no canvas: fundo do sprite fica em groundY + 10 (patas no chão)
    const drawX = this.x;
    const drawY = this.groundY - spriteH + 10;  // +10 ajusta espaço transparente inferior
    const currentDrawY = this.isJumping ? (this.y - spriteH + 10) : drawY;

    ctx.save();

    // 1. Sombra elíptica no chão
    const shadowOpacity = Math.max(0.08, 0.35 - (this.groundY - this.y) / 130);
    const shadowScaleX = Math.max(0.5, 1 - (this.groundY - this.y) / 200);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.beginPath();
    ctx.ellipse(
      drawX + spriteW * 0.45,
      this.groundY + 14,
      spriteW * 0.38 * shadowScaleX,
      6,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // 2. Escolher sprite e frame corretos
    let spriteArray, frameIdx;

    if (this.isJumping && this.jumpSprites.length > 0) {
      // No ar: usa sprites de salto
      spriteArray = this.jumpSprites;
      frameIdx = this.jumpFrameIndex % this.jumpSprites.length;
    } else {
      // No chão: usa sprites de corrida
      spriteArray = this.sprites;
      frameIdx = this.frameIndex % Math.max(1, this.sprites.length);
    }

    const sprite = spriteArray[frameIdx];

    // Canvas offscreen (resultado de _removeBackground) ou Image carregada
    if (sprite instanceof HTMLCanvasElement) {
      ctx.drawImage(sprite, drawX, currentDrawY, spriteW, spriteH);
    } else if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, drawX, currentDrawY, spriteW, spriteH);
    }

    ctx.restore();
  }
}

// Preload Cat Sprites
const catSprites = {
  normal: { walk: [], scared: [] },
  preto: { walk: [], scared: [] },
  branco: { walk: [], scared: [] }
};

for (let i = 1; i <= 10; i++) {
  let imgN = new Image(); imgN.src = `sprite/gato-andando/gato-andando (${i}).png?v=3`;
  let imgP = new Image(); imgP.src = `sprite/gato-andando-preto/gato-andando (${i}).png?v=3`;
  let imgB = new Image(); imgB.src = `sprite/gato-andando-branco/gato-andando (${i}).png?v=3`;
  catSprites.normal.walk.push(imgN);
  catSprites.preto.walk.push(imgP);
  catSprites.branco.walk.push(imgB);
}
for (let i = 23; i <= 51; i++) {
  let num = String(i).padStart(3, '0');
  let imgN = new Image(); imgN.src = `sprite/gato-assustado/ezgif-frame-${num}.png?v=3`;
  let imgP = new Image(); imgP.src = `sprite/gato-assustado-preto/ezgif-frame-${num}.png?v=3`;
  let imgB = new Image(); imgB.src = `sprite/gato-assustado-branco/ezgif-frame-${num}.png?v=3`;
  catSprites.normal.scared.push(imgN);
  catSprites.preto.scared.push(imgP);
  catSprites.branco.scared.push(imgB);
}


// Preload Tronco Fixo
const troncoImg = new Image();
troncoImg.src = `sprite/tronco.png?v=1`;

// Preload Osso e Bife
const ossoImg = new Image();
ossoImg.src = `sprite/app/osso.png?v=1`;
const bifeImg = new Image();
bifeImg.src = `sprite/app/bife.png?v=1`;

// Preload Bola Sprites
const ballSprites = [];
const ballFrames = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
for (let i of ballFrames) {
  let num = String(i).padStart(3, '0');
  let img = new Image();
  img.src = `sprite/bola-quicando/ezgif-frame-${num}.png?v=6`;
  ballSprites.push(img);
}

// ==========================================
// 4. CLASSE DE ITENS E OBSTÁCULOS
// ==========================================
class GameItem {
  constructor(canvasWidth, canvasHeight, data) {
    this.name = data.name;
    this.emoji = data.emoji;
    this.isGood = data.isGood;
    this.color = data.color;
    this.penalty = data.penalty || 0;
    this.points = data.points || 10;

    // Configuração de coordenadas
    this.width = 44;
    this.height = 44;
    this.x = canvasWidth + 50;
    this.scale = 1.0;

    // Altura de spawn: Cacto, Gato, Bola e Tronco sempre no chão, sem bolha
    if (this.name === 'Cacto' || this.name === 'Gato' || this.name === 'Bola' || this.name === 'Tronco') {
      this.y = canvasHeight - 65; // Nível do chão
      this.isOnRoad = true;
      if (this.name === 'Cacto' && Math.random() < 0.4) {
        this.scale = 1.5 + Math.random() * 0.6; // Entre 1.5x e 2.1x maior
      }
      if (this.name === 'Gato') {
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.isScared = false;

        const catTypes = ['normal', 'preto', 'branco'];
        this.catColor = catTypes[Math.floor(Math.random() * catTypes.length)];

        // Física para pulo aleatório
        this.groundY = canvasHeight - 65;
        this.vy = 0;
        this.gravity = 0.55;
        this.isJumping = false;
        this.jumpCooldown = Math.floor(Math.random() * 60) + 30;
      }

      if (this.name === 'Bola') {
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.isOnRoad = true;
      }

      if (this.name === 'Tronco') {
        this.isOnRoad = true;
        this.scale = 1.0;
      }
    } else {
      const spawnHigh = data.alwaysHigh || Math.random() < 0.35;
      this.y = spawnHigh ? canvasHeight - 220 : canvasHeight - 65;
      this.isOnRoad = false;
    }
  }

  update(speed) {
    if (this.name === 'Gato') {
      this.x -= (speed + 2.5); // Gato corre ativamente em direção ao cachorro

      // Lógica de pulo aleatório
      if (!this.isJumping) {
        this.jumpCooldown--;
        // Só tenta pular se não estiver assustado (opcional) para não estragar a animação de susto, ou pode pular assustado também.
        if (this.jumpCooldown <= 0 && Math.random() < 0.4) {
          this.isJumping = true;
          this.vy = -(8 + Math.random() * 5); // Pulo aleatório (um pouco mais alto/baixo)
          this.jumpCooldown = Math.floor(Math.random() * 90) + 50; // Tempo até o próximo pulo
        }
      } else {
        this.vy += this.gravity;
        this.y += this.vy;

        if (this.y >= this.groundY) {
          this.y = this.groundY;
          this.vy = 0;
          this.isJumping = false;
        }
      }
    } else if (this.name === 'Bola') {
      this.x -= (speed * 0.65); // Bola aparece de forma mais lenta
    } else {
      this.x -= speed;
    }
  }

  draw(ctx, dog, isPaused = false) {
    ctx.save();

    if (!this.isOnRoad) {
      // Remover shadowBlur pesado que causa lentidão

      // Círculo base Glassmorphic
      ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Desenhar Emoji do Item
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000000'; // Reseta o fillStyle para opaco total
    ctx.font = this.isOnRoad ? `${Math.floor(36 * this.scale)}px Arial` : '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let emojiY = this.y;
    if (this.isOnRoad) {
      emojiY -= 15 * this.scale; // Ajuste visual para apoiar o emoji maior no chão
    }

    if (this.name === 'Gato') {
      if (!isPaused) {
        this.frameTimer++;
      }

      // Checar distância pro dog para mudar estado
      let distanceToDog = 9999;
      if (dog) {
        distanceToDog = this.x - dog.x; // Distância horizontal
      }

      // Assusta se chegar a menos de 280px
      if (distanceToDog > 0 && distanceToDog < 280) {
        this.isScared = true;
      }

      let currentArray = this.isScared ? catSprites[this.catColor].scared : catSprites[this.catColor].walk;
      let frameSpeed = this.isScared ? 2 : 3;

      if (this.frameTimer > frameSpeed) {
        this.frameTimer = 0;
        this.frameIndex++;
        if (this.frameIndex >= currentArray.length) {
          if (this.isScared) {
            this.frameIndex = currentArray.length - 1; // Trava no último frame do susto
          } else {
            this.frameIndex = 0; // Loop na caminhada
          }
        }
      }

      let img = currentArray[this.frameIndex];
      if (img && img.complete && img.naturalWidth > 0) {
        let scale = 0.45; // Escala ideal para imagens de 250px
        let sw = img.naturalWidth * scale;
        let sh = img.naturalHeight * scale;

        ctx.drawImage(img, this.x - sw / 2, this.y - sh + 20, sw, sh);
      }
    } else if (this.name === 'Bola') {
      if (!isPaused) {
        this.frameTimer++;
      }
      let currentArray = ballSprites;
      let frameSpeed = 9; // <--- AQUI: Animação bem mais lenta (quanto maior, mais lento)

      if (this.frameTimer > frameSpeed) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % currentArray.length;
      }

      let img = currentArray[this.frameIndex];
      if (img && img.complete && img.naturalWidth > 0) {
        let scale = 0.22; // Escala ajustada para ficar proporcional ao cachorro
        let sw = img.naturalWidth * scale;
        let sh = img.naturalHeight * scale;
        // As imagens já tem a altura do pulo no frame, basta colar próximo ao chão
        ctx.drawImage(img, this.x - sw / 2, this.y - sh + 15, sw, sh);
      }
    } else if (this.name === 'Tronco') {
      if (troncoImg && troncoImg.complete && troncoImg.naturalWidth > 0) {
        let scale = 0.22; // Escala da imagem do tronco
        let sw = troncoImg.naturalWidth * scale;
        let sh = troncoImg.naturalHeight * scale;
        ctx.drawImage(troncoImg, this.x - sw / 2, this.y - sh + 20, sw, sh);
      }
    } else if (this.name === 'Super Osso' && ossoImg && ossoImg.complete && ossoImg.naturalWidth > 0) {
      let maxSize = 32;
      let aspect = ossoImg.naturalWidth / ossoImg.naturalHeight;
      let sw = aspect > 1 ? maxSize : maxSize * aspect;
      let sh = aspect > 1 ? maxSize / aspect : maxSize;
      ctx.drawImage(ossoImg, this.x - sw / 2, this.y - sh / 2, sw, sh);
    } else if (this.name === 'Bife Premium' && bifeImg && bifeImg.complete && bifeImg.naturalWidth > 0) {
      let maxSize = 34;
      let aspect = bifeImg.naturalWidth / bifeImg.naturalHeight;
      let sw = aspect > 1 ? maxSize : maxSize * aspect;
      let sh = aspect > 1 ? maxSize / aspect : maxSize;
      ctx.drawImage(bifeImg, this.x - sw / 2, this.y - sh / 2, sw, sh);
    } else {
      ctx.fillText(this.emoji, this.x, emojiY);
    }

    if (!this.isOnRoad) {
      // Rótulo Educativo (Texto explicativo embaixo do item)
      ctx.fillStyle = this.color;
      ctx.font = '800 9px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(this.name.toUpperCase(), this.x, this.y + 36);
    }

    ctx.restore();
  }

  // Detecção de colisão circular otimizada
  collidesWith(dog) {
    // Centro visual do cão: usa a posição real do sprite desenhado
    const sizeScale = dog._getSizeScale ? dog._getSizeScale() : 0.75;
    const spriteW = dog.width * sizeScale;
    const spriteH = dog.height * sizeScale;
    const spriteTopY = dog.isJumping
      ? (dog.y - spriteH + 10)
      : (dog.groundY - spriteH + 10);

    const dogCX = dog.x + spriteW * 0.5;
    const dogCY = spriteTopY + spriteH * 0.55; // Centro ligeiramente abaixo do meio (corpo)

    // Ponto central do item
    const itemCX = this.x;
    let itemCY = this.y;
    if (this.isOnRoad && this.scale > 1.0) {
      itemCY -= 15 * (this.scale - 1); // Ajustar centro para itens maiores no chão
    }

    // Distância euclidiana com raio proporcional ao tamanho do sprite
    const dx = dogCX - itemCX;
    const dy = dogCY - itemCY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Raio de colisão generoso mas proporcional ao sprite
    return distance < (spriteW * 0.32 + 20 * this.scale);
  }
}

// Catálogo de Itens
const ITEM_POOL = [
  // Bons (Saúde ✅)
  { name: 'Peso Ideal', emoji: '⚖️', isGood: true, color: '#10b981', points: 10 },
  { name: 'Ex. Moderado', emoji: '🐕', isGood: true, color: '#10b981', points: 10 },
  { name: 'Fisioterapia', emoji: '👐', isGood: true, color: '#10b981', points: 15 },
  { name: 'Natação', emoji: '🏊', isGood: true, color: '#10b981', points: 15 },
  { name: 'Condroprotetor', emoji: '💊', isGood: true, color: '#10b981', points: 20 },
  { name: 'Consulta Vet', emoji: '🩺', isGood: true, color: '#10b981', points: 25 },
  { name: 'Super Osso', emoji: '🦴', isGood: true, color: '#f59e0b', points: 50, alwaysHigh: true },
  { name: 'Bife Premium', emoji: '🥩', isGood: true, color: '#f59e0b', points: 100, alwaysHigh: true },

  // Ruins (Perigos ❌)
  { name: 'Obesidade', emoji: '🍔', isGood: false, color: '#ef4444', penalty: 10 },
  { name: 'Sedentarismo', emoji: '🛋️', isGood: false, color: '#ef4444', penalty: 10 },
  { name: 'Ex. Excessivo', emoji: '🏋️', isGood: false, color: '#ef4444', penalty: 10 },
  { name: 'Saltos Altos', emoji: '🪜', isGood: false, color: '#ef4444', penalty: 10 },
  { name: 'Piso Liso', emoji: '💦', isGood: false, color: '#ef4444', penalty: 10 },
  { name: 'Cacto', emoji: '🌵', isGood: false, color: '#ef4444', penalty: 15 },
  { name: 'Gato', emoji: '🐈', isGood: false, color: '#ef4444', penalty: 20 },
  { name: 'Bola', emoji: '⚽', isGood: false, color: '#ef4444', penalty: 15 },
  { name: 'Tronco', emoji: '🪵', isGood: false, color: '#8B4513', penalty: 20 }
];

const GAME_TIPS = [
  "Cães com predisposição à displasia coxofemoral nunca devem saltar de sofás ou carros sem rampas adequadas.",
  "Exercícios de baixo impacto, como a natação, são a melhor forma de fortalecer os glúteos e proteger a articulação do quadril.",
  "A obesidade aumenta drasticamente a carga sobre as articulações inflamadas. Mantenha as costelas do seu cão palpáveis!",
  "Os condroprotetores (glucosamina e condroitina) ajudam a nutrir a cartilagem articular e retardam a artrose.",
  "Pisos frios e escorregadios são grandes inimigos. Espalhe tapetes emborrachados em casa para evitar escorregões nocivos."
];

// ==========================================
// 5. DIRETOR E CONTROLADOR DO JOGO
// ==========================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'START'; // START, PLAYING, LEVEL_UP, GAME_OVER

    // Elementos da Interface
    this.lifeBar = document.getElementById('lifeBar');
    this.lifeText = document.getElementById('lifeText');
    this.scoreVal = document.getElementById('scoreValue');
    this.stageVal = document.getElementById('stageValue');
    this.damageFlash = document.getElementById('damageFlash');

    // Overlays
    this.startOverlay = document.getElementById('startOverlay');
    this.levelUpOverlay = document.getElementById('levelUpOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');

    // Botões
    document.getElementById('btnStart').addEventListener('pointerdown', (e) => this.startGame(e));
    document.getElementById('btnContinue').addEventListener('pointerdown', (e) => this.resumeGame(e));
    document.getElementById('btnRestart').addEventListener('pointerdown', (e) => this.restartGame(e));

    this.btnFs = document.getElementById('btnFullscreen');
    if (this.btnFs) {
      this.btnFs.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.toggleFullscreen();
      });
    }

    // Trocar ícone quando estado de fullscreen mudar
    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenIcon(!!document.fullscreenElement);
    });

    // Criar o botão de pausa via JS para garantir que exista sem problemas de cache
    this.btnPause = document.createElement('button');
    this.btnPause.id = 'btnPause';
    this.btnPause.style.cssText = "position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 8px 20px; background: rgba(17, 24, 39, 0.85); color: #fff; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 20px; cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: bold; font-size: 1rem; backdrop-filter: blur(4px); display: none; box-shadow: 0 4px 10px rgba(0,0,0,0.5);";
    document.getElementById('canvasContainer').appendChild(this.btnPause);
    this.btnPause.addEventListener('pointerdown', (e) => this.togglePause(e));

    // Ouvir Toque Geral para Pular
    document.body.addEventListener('pointerdown', (e) => this.handleActionInput(e));
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.triggerJump();
      }
    });

    // Entidades de Jogo
    this.dog = new Dog(300);
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];

    // Estatísticas da Partida
    this.score = 0;
    this.life = 100;
    this.speed = 3.0;
    this.maxSpeed = 15.0;
    this.stage = 'Filhote';

    // Clima
    this.rainParticles = [];
    this.lightningTimer = 0;

    // Configurações de Spawn
    this.spawnTimer = 0;
    this.spawnInterval = 130; // A cada X frames

    // Efeito de Screen Shake
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Controle de Animação do Céu / Nuvens
    this.clouds = [
      { x: 100, y: 40, size: 30, speed: 0.15 },
      { x: 400, y: 60, size: 45, speed: 0.1 },
      { x: 700, y: 30, size: 25, speed: 0.2 }
    ];

    // Árvores de Fundo (Cenário Floresta)
    this.bgTrees = [
      { x: 100, scale: 0.8 },
      { x: 400, scale: 1.1 },
      { x: 700, scale: 0.9 },
      { x: 1000, scale: 1.0 },
      { x: 1300, scale: 0.7 }
    ];

    // Ajustar tamanho do Canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Loop do Jogo
    this.lastTime = 0;
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    // Configurar tamanho lógico do jogo
    this.gameWidth = parent.clientWidth;
    this.gameHeight = parent.clientHeight;
    
    // Configurar tamanho CSS real
    this.canvas.style.width = this.gameWidth + 'px';
    this.canvas.style.height = this.gameHeight + 'px';
    
    // Ajustar buffers internos para o DPR (alta resolução)
    this.canvas.width = this.gameWidth * dpr;
    this.canvas.height = this.gameHeight * dpr;
    
    // Scale do canvas para desenhar corretamente sem mudar lógica de código
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.dog) {
      this.dog.groundY = this.gameHeight - 65;
      if (this.state === 'START') {
        this.dog.y = this.dog.groundY;
      }
    }
  }

  startGame(e) {
    if (e) e.stopPropagation();
    sounds.init();

    // Inicia em tela cheia e modo horizontal automaticamente
    if (!document.fullscreenElement) {
      this.toggleFullscreen();
    }

    // Inicia a música de fundo com volume confortável (35%)
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
      bgMusic.currentTime = 0;
      bgMusic.volume = 0.35;
      bgMusic.play().catch(err => console.log("Erro ao reproduzir trilha sonora:", err));
    }

    this.startOverlay.classList.remove('active');
    this.state = 'PLAYING';
    this.score = 0;
    this.life = 100;
    this.speed = 2.5;
    this.stage = 'Filhote';
    this.dog.stage = 'Filhote';

    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.rainParticles = [];
    this.lightningTimer = 0;
    this.spawnTimer = 0;

    this.updateHUD();
    this.scoreVal.textContent = '0000';
    sounds.playCollect();
    this.btnPause.style.display = 'block';
    this.btnPause.textContent = '⏸ PAUSAR';
  }

  resumeGame(e) {
    if (e) e.stopPropagation();
    this.levelUpOverlay.classList.remove('active');
    this.state = 'PLAYING';

    // Efeito de recuperação leve ao evoluir
    this.life = Math.min(100, this.life + 15);
    this.updateHUD();
    this.btnPause.style.display = 'block';
    this.btnPause.textContent = '⏸ PAUSAR';
  }

  restartGame(e) {
    if (e) e.stopPropagation();
    this.gameOverOverlay.classList.remove('active');

    // Reseta a música de fundo
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }

    // Reseta o estado do jogo e retorna para o menu inicial (fase Filhote)
    this.state = 'START';
    this.score = 0;
    this.life = 100;
    this.speed = 2.5;
    this.stage = 'Filhote';
    this.dog.stage = 'Filhote';
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.rainParticles = [];
    this.lightningTimer = 0;
    this.spawnTimer = 0;

    this.updateHUD();
    this.scoreVal.textContent = '0000';
    this.startOverlay.classList.add('active');
    this.btnPause.style.display = 'none';
  }

  updateFullscreenIcon(isFullscreen) {
    if (!this.btnFs) return;
    if (isFullscreen) {
      // Ícone de "Sair da Tela Cheia" (setas apontando para dentro)
      this.btnFs.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 4 15 10 21 10"></polyline>
          <line x1="21" y1="4" x2="15" y2="10"></line>
          <polyline points="9 4 9 10 3 10"></polyline>
          <line x1="3" y1="4" x2="9" y2="10"></line>
          <polyline points="15 20 15 14 21 14"></polyline>
          <line x1="21" y1="20" x2="15" y2="14"></line>
          <polyline points="9 20 9 14 3 14"></polyline>
          <line x1="3" y1="20" x2="9" y2="14"></line>
        </svg>
      `;
    } else {
      // Ícone padrão de Tela Cheia (setas apontando para fora)
      this.btnFs.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="14" y1="10" x2="21" y2="3"></line>
          <polyline points="9 3 3 3 3 9"></polyline>
          <line x1="10" y1="10" x2="3" y2="3"></line>
          <polyline points="15 21 21 21 21 15"></polyline>
          <line x1="14" y1="14" x2="21" y2="21"></line>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="10" y1="14" x2="3" y2="21"></line>
        </svg>
      `;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        // Tenta travar a rotação no mobile para modo deitado (Landscape)
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(err => {
            console.warn(`Aviso de rotação: ${err.message}`);
          });
        }
      }).catch(err => {
        console.warn(`Erro ao tentar ativar tela cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          // Destrava a rotação ao sair da tela cheia
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        });
      }
    }
  }

  togglePause(e) {
    if (e) e.stopPropagation();
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.btnPause.textContent = '▶ CONTINUAR';
      const bgMusic = document.getElementById('bgMusic');
      if (bgMusic) bgMusic.pause();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.btnPause.textContent = '⏸ PAUSAR';
      const bgMusic = document.getElementById('bgMusic');
      if (bgMusic) bgMusic.play();
    }
  }

  handleActionInput(e) {
    // Evita pulos acidentais ao tocar em botões de overlay
    if (e.target.closest('.btn') || e.target.closest('.overlay.active') || e.target.id === 'btnPause') {
      return;
    }

    e.preventDefault();
    this.triggerJump();
  }

  triggerJump() {
    if (this.state === 'PLAYING') {
      this.dog.jump();
    }
  }

  // Loop principal coordenando delta-time
  gameLoop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.updatePhysics();
    }

    this.render();

    if (this.state === 'PAUSED') {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 36px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('JOGO PAUSADO', this.gameWidth / 2, this.gameHeight / 2);
      this.ctx.restore();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updatePhysics() {
    // 1. Atualizar o cão
    this.dog.update(this.speed);

    // 2. Incrementar a pontuação por corrida
    this.score += 0.05;
    this.scoreVal.textContent = String(Math.floor(this.score)).padStart(4, '0');

    // Aumento suave de velocidade conforme score
    let speedMult = 0.0045;
    if (this.stage === 'Mestre da Agilidade') speedMult = 0.004;

    // O multiplicador deve ser o mesmo da penúltima fase para manter a velocidade!
    if (this.stage === 'Lenda Canina' || this.stage === 'Explorador da Floresta' || this.stage === 'Surfista da Praia') speedMult = 0.004;

    // Trava o score usado para o cálculo de velocidade para não ficar impossível
    // Mantém a velocidade constante a partir de 1800 pontos (mesma da penúltima fase)
    let effectiveScore = Math.min(this.score, 1800);
    this.speed = Math.min(this.maxSpeed, 2.5 + (effectiveScore * speedMult));

    // 3. Controle de Níveis (Progressão)
    this.checkEvolution();

    // 4. Mover Nuvens de Fundo
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed + (this.speed * 0.02);
      if (cloud.x + cloud.size * 2 < 0) {
        cloud.x = this.gameWidth + Math.random() * 100;
        cloud.y = Math.random() * 70 + 20;
      }
    });

    // 4.5. Mover Árvores de Fundo se estiver na Floresta
    if (this.stage === 'Explorador da Floresta') {
      this.bgTrees.forEach(tree => {
        tree.x -= this.speed * 0.5; // Efeito parallax
        if (tree.x + 150 < 0) {
          tree.x = this.gameWidth + Math.random() * 200;
          tree.scale = 0.7 + Math.random() * 0.5; // Variar tamanho a cada reset
        }
      });
    }

    // 5. Spawn procedimental de Itens / Obstáculos
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      // Escolher um item aleatório do catálogo
      let randomItemData = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];

      const forbiddenBolaStages = ['Filhote', 'Jovem', 'Adulto saudável', 'Explorador da Floresta'];
      const forbiddenTroncoStages = ['Filhote', 'Jovem', 'Surfista da Praia'];

      // Remove Cacto na Praia, Bola nas fases proibidas e Tronco nas fases proibidas
      while (
        (this.stage === 'Surfista da Praia' && randomItemData.name === 'Cacto') ||
        (forbiddenBolaStages.includes(this.stage) && randomItemData.name === 'Bola') ||
        (forbiddenTroncoStages.includes(this.stage) && randomItemData.name === 'Tronco')
      ) {
        randomItemData = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      }

      // Override na fase da floresta para colocar o tronco mais vezes
      if (this.stage === 'Explorador da Floresta' && Math.random() < 0.35) {
        randomItemData = { name: 'Tronco', emoji: '🪵', isGood: false, points: 0, penalty: 20, color: '#8B4513' };
      }

      // Override na fase da praia para colocar a bola
      if (this.stage === 'Surfista da Praia' && Math.random() < 0.4) {
        randomItemData = { name: 'Bola', emoji: '', isGood: false, points: 0, penalty: 30, color: '#ef4444' };
      }

      this.items.push(new GameItem(this.gameWidth, this.gameHeight, randomItemData));

      // Ajustar intervalo de spawn de acordo com velocidade
      let baseInterval = 140;
      let minInterval = 90;
      if (this.stage === 'Mestre da Agilidade') { baseInterval = 100; minInterval = 50; }
      if (this.stage === 'Lenda Canina' || this.stage === 'Explorador da Floresta' || this.stage === 'Surfista da Praia') { baseInterval = 100; minInterval = 50; }
      
      let calculatedInterval = Math.max(minInterval, baseInterval - Math.floor(this.speed * 8));
      // Adicionar aleatoriedade de -30% a +40% no intervalo para deixar o espaçamento orgânico
      let randomOffset = Math.floor(Math.random() * (calculatedInterval * 0.7)) - Math.floor(calculatedInterval * 0.3);
      this.spawnInterval = Math.max(minInterval - 20, calculatedInterval + randomOffset);
    }

    // 6. Atualizar e colidir itens
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(this.speed);

      // Colisão de itens
      if (item.collidesWith(this.dog)) {
        this.handleCollision(item);
        this.items.splice(i, 1);
        continue;
      }

      // Remover itens fora da tela
      if (item.x < -80) {
        this.items.splice(i, 1);
      }
    }

    // 7. Atualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 7.5. Atualizar Textos Flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update();
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 8. Decair Tremedeira de tela
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
    }

    // 8.5. Atualizar Clima (Chuva e Raios)
    if (this.stage === 'Mestre da Agilidade' || this.stage === 'Lenda Canina') {
      if (Math.random() < 0.4) {
        this.rainParticles.push({
          x: Math.random() * this.gameWidth + 200,
          y: -10,
          vy: 15 + Math.random() * 10,
          vx: -3 - Math.random() * 3,
          length: 15 + Math.random() * 20
        });
      }
      for (let i = this.rainParticles.length - 1; i >= 0; i--) {
        const rp = this.rainParticles[i];
        rp.x += rp.vx;
        rp.y += rp.vy;
        if (rp.y > this.gameHeight) {
          this.rainParticles.splice(i, 1);
        }
      }
      if (this.stage === 'Lenda Canina') {
        if (this.lightningTimer > 0) this.lightningTimer--;
        else if (Math.random() < 0.015) {
          this.lightningTimer = 15 + Math.random() * 10;
        }
      }
    }

    // 9. Verificar condição de vitória (máximo de 6000 pontos)
    if (this.score >= 6000) {
      this.triggerGameOver(true);
    }
  }

  // Tratamento de colisões com os itens
  handleCollision(item) {
    if (item.isGood) {
      // Coleta Positiva
      this.score += item.points;
      this.life = Math.min(100, this.life + 12);
      sounds.playCollect();
      this.createParticlesBurst(item.x, item.y, '#10b981', true);
      this.triggerFlashEffect(false);

      // Criar texto flutuante com a pontuação ganha
      this.floatingTexts.push(new FloatingText(item.x, item.y - 20, `+${item.points}`, '#10b981'));
    } else {
      // Impacto Negativo
      this.life = Math.max(0, this.life - 25);
      this.score = Math.max(0, this.score - item.penalty);

      // Desaceleração temporária
      this.speed = Math.max(2.0, this.speed - 0.8);

      sounds.playHit();
      this.createParticlesBurst(item.x, item.y, '#ef4444', false);

      // Criar texto flutuante com a pontuação perdida
      this.floatingTexts.push(new FloatingText(item.x, item.y - 20, `-${item.penalty}`, '#ef4444'));

      // Efeitos Visuais e Físicos Extra no Celular!
      this.triggerScreenShake(18, 6);
      this.triggerFlashEffect(true);

      // Ativar Vibração Física se estiver no Celular
      if (navigator.vibrate) {
        navigator.vibrate(150);
      }
    }

    this.updateHUD();

    // Testar se morreu
    if (this.life <= 0) {
      this.triggerGameOver(false);
    }
  }

  triggerFlashEffect(isDanger) {
    this.damageFlash.style.backgroundColor = isDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.15)';
    this.damageFlash.style.opacity = '1';
    setTimeout(() => {
      this.damageFlash.style.opacity = '0';
    }, 120);
  }

  triggerScreenShake(duration, intensity) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  createParticlesBurst(x, y, color, isGood) {
    const qty = isGood ? 12 : 15;
    for (let i = 0; i < qty; i++) {
      this.particles.push(new Particle(x, y, color, isGood));
    }
  }

  checkEvolution() {
    let targetStage = 'Filhote';
    let eduMsg = '';
    let hasEvolved = false;

    if (this.score >= 5000 && this.stage !== 'Surfista da Praia') {
      targetStage = 'Surfista da Praia';
      eduMsg = "A areia exige mais das articulações, mas seu Cão Surfista está preparado! Graças aos cuidados contínuos, ele curte a praia com total saúde e energia.";
      hasEvolved = true;
    } else if (this.score >= 4000 && this.score < 5000 && this.stage !== 'Explorador da Floresta') {
      targetStage = 'Explorador da Floresta';
      eduMsg = "Desbravando trilhas e obstáculos naturais! A prevenção fez do seu cão um Explorador da Floresta imbatível e cheio de vigor.";
      hasEvolved = true;
    } else if (this.score >= 2500 && this.score < 4000 && this.stage !== 'Lenda Canina') {
      targetStage = 'Lenda Canina';
      eduMsg = "Uma verdadeira Lenda Canina! Seu cachorro provou que com prevenção e cuidado é possível desafiar os limites do tempo sem comprometer a saúde articular.";
      hasEvolved = true;
    } else if (this.score >= 1500 && this.score < 2500 && this.stage !== 'Mestre da Agilidade') {
      targetStage = 'Mestre da Agilidade';
      eduMsg = "Incrível! Manter esse ritmo com exercícios sem impacto fez seu cão virar um Mestre da Agilidade, com quadris fortes e saudáveis.";
      hasEvolved = true;
    } else if (this.score >= 450 && this.score < 1500 && this.stage !== 'Campeão da Mobilidade') {
      targetStage = 'Campeão da Mobilidade';
      eduMsg = "Sensacional! Com fisioterapia, exercícios adequados e visitas frequentes ao veterinário, seu amiguinho viverá livre de dores coxofemorais!";
      hasEvolved = true;
    } else if (this.score >= 250 && this.score < 450 && this.stage !== 'Adulto saudável') {
      targetStage = 'Adulto saudável';
      eduMsg = "A prevenção é a melhor amiga! Manter o peso ideal do cão e usar condroprotetores (Glucosamina e Condroitina) evita o desgaste precoce das articulações.";
      hasEvolved = true;
    } else if (this.score >= 100 && this.score < 250 && this.stage !== 'Jovem') {
      targetStage = 'Jovem';
      eduMsg = "A fase jovem é cheia de vigor! Exercícios de baixo impacto como caminhadas moderadas e natação fortalecem a musculatura posterior sem gerar atrito articular.";
      hasEvolved = true;
    }

    if (hasEvolved) {
      this.stage = targetStage;
      this.dog.stage = targetStage;
      this.state = 'LEVEL_UP';

      // Atualizar Badge e Mensagem Educativa
      document.getElementById('newLevelTitle').textContent = `Evoluiu para: ${targetStage}! 🎉`;
      document.getElementById('educationalMessage').textContent = eduMsg;

      // Ícone do Estágio
      const evolutionEmojiEl = document.getElementById('evolutionEmoji');
      if (targetStage === 'Jovem') evolutionEmojiEl.textContent = '🐕';
      else if (targetStage === 'Adulto saudável') evolutionEmojiEl.textContent = '🐕‍🦺';
      else if (targetStage === 'Campeão da Mobilidade') evolutionEmojiEl.textContent = '🏆';
      else if (targetStage === 'Mestre da Agilidade') evolutionEmojiEl.textContent = '⚡';
      else if (targetStage === 'Lenda Canina') evolutionEmojiEl.textContent = '🌟';
      else if (targetStage === 'Explorador da Floresta') evolutionEmojiEl.textContent = '🌲';
      else if (targetStage === 'Surfista da Praia') evolutionEmojiEl.textContent = '🌊';
      else evolutionEmojiEl.textContent = '🌟';

      this.levelUpOverlay.classList.add('active');
      this.updateHUD();
      sounds.playLevelUp();
      this.btnPause.style.display = 'none';
    }
  }

  updateHUD() {
    // Barra de Vida
    this.lifeBar.style.width = `${this.life}%`;
    this.lifeText.textContent = `${this.life}%`;

    // Cor da barra baseada no valor
    if (this.life > 50) {
      this.lifeBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
      this.lifeBar.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.5)';
    } else if (this.life > 25) {
      this.lifeBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
      this.lifeBar.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.5)';
    } else {
      this.lifeBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #f43f5e 100%)';
      this.lifeBar.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.6)';
    }

    // Estágio
    this.stageVal.textContent = this.stage;
  }

  triggerGameOver(isVictory = false) {
    this.state = 'GAME_OVER';

    // Pausa a trilha sonora ao finalizar o jogo
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
      bgMusic.pause();
    }

    const titleEl = document.querySelector('.game-over-title');
    const descEl = document.querySelector('.game-over-desc');
    const tipTitleEl = document.querySelector('.educational-card h3');
    const tipDescEl = document.getElementById('gameOverTip');

    if (isVictory) {
      this.score = 6000;
      this.scoreVal.textContent = '6000';

      titleEl.innerHTML = 'Obrigado por jogar! 🌊';
      titleEl.style.color = 'var(--primary)';
      descEl.textContent = 'Você atingiu o limite de 6000 pontos e completou a jornada suprema de mobilidade, até na areia da praia!';

      tipTitleEl.textContent = '🏆 Conquista Máxima';
      tipDescEl.textContent = 'Seu cão se tornou um Campeão da Mobilidade Supremo! Continue aplicando esses cuidados de controle de peso, exercícios moderados e consultas veterinárias na vida real.';

      sounds.playLevelUp();
    } else {
      titleEl.innerHTML = 'Fim da Corrida 💔';
      titleEl.style.color = 'var(--danger)';
      descEl.textContent = 'As articulações do seu cãozinho precisam de cuidados especiais.';

      tipTitleEl.innerHTML = '💡 Sabia que...';
      const randomTip = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)];
      tipDescEl.textContent = randomTip;

      sounds.playHit();
    }

    document.getElementById('recapScore').textContent = Math.floor(this.score);
    document.getElementById('recapLevel').textContent = this.stage;

    this.gameOverOverlay.classList.add('active');
    this.btnPause.style.display = 'none';
  }

  // ==========================================
  // 6. RENDERIZADOR GRÁFICO (Canvas 2D)
  // ==========================================
  render() {
    this.ctx.save();

    // Aplicar Screen Shake se houver
    if (this.shakeDuration > 0) {
      const dx = (Math.random() * 2 - 1) * this.shakeIntensity;
      const dy = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // 1. Limpar Tela com o Céu Dinâmico
    this.drawSkyGradient();

    // 1.5. Clarão de Raio (se houver)
    if (this.lightningTimer > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.lightningTimer / 15)})`;
      this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    }

    // 2. Desenhar Nuvens de Fundo
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    this.clouds.forEach(cloud => {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + cloud.size * 0.6, cloud.y - cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
    });

    // 3. Desenhar Montanhas de Fundo (Parallax Lento)
    this.drawMountains();

    // 3.5. Desenhar Árvores de Fundo (Cenário Floresta)
    if (this.stage === 'Explorador da Floresta') {
      this.drawBgTrees();
    }

    // 4. Desenhar o Solo / Estrada
    this.drawGround();

    // 5. Desenhar Itens
    const isPaused = this.state === 'PAUSED';
    this.items.forEach(item => item.draw(this.ctx, this.dog, isPaused));

    // 6. Desenhar Partículas
    this.particles.forEach(p => p.draw(this.ctx));

    // 6.5. Desenhar Textos Flutuantes
    this.floatingTexts.forEach(ft => ft.draw(this.ctx));

    // 7. Desenhar o Cachorro
    this.dog.draw(this.ctx);

    // 8. Desenhar Clima (Chuva/Raios) por cima
    this.drawWeather();

    this.ctx.restore();
  }

  drawSkyGradient() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);

    if (this.stage === 'Filhote') {
      // Amanhecer Pastel
      grad.addColorStop(0, '#fecdd3'); // Rosa claro
      grad.addColorStop(0.5, '#e0f2fe'); // Azul bebê
      grad.addColorStop(1, '#7dd3fc'); // Céu azul claro
    } else if (this.stage === 'Jovem') {
      // Dia Azul Brilhante
      grad.addColorStop(0, '#bae6fd'); // Azul piscina
      grad.addColorStop(0.6, '#38bdf8'); // Azul brilhante
      grad.addColorStop(1, '#0284c7'); // Azul profundo
    } else if (this.stage === 'Adulto saudável') {
      // Pôr do Sol Dourado
      grad.addColorStop(0, '#4c1d95'); // Roxo escuro
      grad.addColorStop(0.4, '#b45309'); // Dourado cobre
      grad.addColorStop(0.8, '#ea580c'); // Laranja pôr do sol
      grad.addColorStop(1, '#fed7aa'); // Creme dourado
    } else if (this.stage === 'Campeão da Mobilidade') {
      // Campeão: Céu Espacial + Aurora Green
      grad.addColorStop(0, '#0f172a'); // Azul espacial escuro
      grad.addColorStop(0.4, '#1e1b4b'); // Roxo noite indigo
      grad.addColorStop(0.8, '#064e3b'); // Aurora Green escura
      grad.addColorStop(1, '#1e293b'); // Cinza azulado chão
    } else if (this.stage === 'Mestre da Agilidade') {
      // Chuva Cinzenta
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#475569');
      grad.addColorStop(1, '#94a3b8');
    } else if (this.stage === 'Lenda Canina') {
      // Tempestade Escura (Lenda Canina)
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.4, '#0f172a');
      grad.addColorStop(0.8, '#1e293b');
      grad.addColorStop(1, '#475569');
    } else if (this.stage === 'Explorador da Floresta') {
      // Floresta Dourada
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.5, '#047857');
      grad.addColorStop(1, '#fef08a');
    } else {
      // Praia Ensolarada
      grad.addColorStop(0, '#0ea5e9');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(1, '#fde047');
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
  }

  drawBgTrees() {
    this.ctx.save();
    this.bgTrees.forEach(tree => {
      this.ctx.translate(tree.x, this.gameHeight - 65);
      this.ctx.scale(tree.scale, tree.scale);
      
      // Tronco da árvore
      this.ctx.fillStyle = '#271911'; // Marrom bem escuro
      this.ctx.fillRect(-15, -120, 30, 120);

      // Copas da árvore (pinheiro)
      this.ctx.fillStyle = '#064e3b'; // Verde escuro da floresta
      this.ctx.beginPath();
      this.ctx.moveTo(-60, -80);
      this.ctx.lineTo(0, -180);
      this.ctx.lineTo(60, -80);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(-50, -130);
      this.ctx.lineTo(0, -220);
      this.ctx.lineTo(50, -130);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(-40, -170);
      this.ctx.lineTo(0, -260);
      this.ctx.lineTo(40, -170);
      this.ctx.fill();

      this.ctx.scale(1 / tree.scale, 1 / tree.scale);
      this.ctx.translate(-tree.x, -(this.gameHeight - 65));
    });
    this.ctx.restore();
  }

  drawMountains() {
    this.ctx.save();

    let mountColor1, mountColor2;
    if (this.stage === 'Filhote') {
      mountColor1 = 'rgba(125, 211, 252, 0.45)';
      mountColor2 = 'rgba(56, 189, 248, 0.35)';
    } else if (this.stage === 'Jovem') {
      mountColor1 = 'rgba(14, 116, 144, 0.25)';
      mountColor2 = 'rgba(3, 105, 120, 0.35)';
    } else if (this.stage === 'Adulto saudável') {
      mountColor1 = 'rgba(120, 53, 4, 0.3)';
      mountColor2 = 'rgba(146, 64, 14, 0.25)';
    } else if (this.stage === 'Campeão da Mobilidade') {
      mountColor1 = 'rgba(16, 185, 129, 0.1)';
      mountColor2 = 'rgba(4, 120, 87, 0.15)';
    } else if (this.stage === 'Mestre da Agilidade') {
      mountColor1 = 'rgba(51, 65, 85, 0.4)';
      mountColor2 = 'rgba(71, 85, 105, 0.3)';
    } else if (this.stage === 'Lenda Canina') {
      mountColor1 = 'rgba(2, 6, 23, 0.5)';
      mountColor2 = 'rgba(15, 23, 42, 0.4)';
    } else if (this.stage === 'Explorador da Floresta') {
      mountColor1 = 'rgba(20, 83, 45, 0.5)';
      mountColor2 = 'rgba(22, 101, 52, 0.4)';
    } else {
      // Praia (Ilhas distantes)
      mountColor1 = 'rgba(8, 145, 178, 0.4)';
      mountColor2 = 'rgba(6, 182, 212, 0.3)';
    }

    const midY = this.gameHeight - 65;

    // Linha 1: Montanhas distantes (se movem bem devagar)
    this.ctx.fillStyle = mountColor1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, midY);
    // Gerar cumes simples
    const w = this.gameWidth;
    this.ctx.lineTo(w * 0.15, midY - 60);
    this.ctx.lineTo(w * 0.35, midY - 20);
    this.ctx.lineTo(w * 0.60, midY - 80);
    this.ctx.lineTo(w * 0.80, midY - 30);
    this.ctx.lineTo(w, midY);
    this.ctx.closePath();
    this.ctx.fill();

    // Linha 2: Colinas mais próximas
    this.ctx.fillStyle = mountColor2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, midY);
    this.ctx.quadraticCurveTo(w * 0.25, midY - 50, w * 0.5, midY - 15);
    this.ctx.quadraticCurveTo(w * 0.75, midY - 45, w, midY);
    this.ctx.lineTo(w, midY);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  drawGround() {
    this.ctx.save();

    const groundHeight = 65;
    const y = this.gameHeight - groundHeight;
    const w = this.gameWidth;

    // Solo sólido
    const groundGrad = this.ctx.createLinearGradient(0, y, 0, this.gameHeight);
    if (this.stage === 'Campeão da Mobilidade') {
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(1, '#0f172a');
    } else if (this.stage === 'Explorador da Floresta') {
      groundGrad.addColorStop(0, '#3f6212');
      groundGrad.addColorStop(1, '#166534');
    } else if (this.stage === 'Surfista da Praia') {
      groundGrad.addColorStop(0, '#fde047');
      groundGrad.addColorStop(1, '#fef08a');
    } else {
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(1, '#0f172a');
    }

    this.ctx.fillStyle = groundGrad;
    this.ctx.fillRect(0, y, w, groundHeight);

    // Linha superior de borda (grama/asfalto)
    if (this.stage === 'Surfista da Praia') {
      this.ctx.strokeStyle = '#eab308';
    } else if (this.stage === 'Explorador da Floresta') {
      this.ctx.strokeStyle = '#65a30d';
    } else {
      this.ctx.strokeStyle = this.stage === 'Campeão da Mobilidade' ? '#10b981' : '#f59e0b';
    }
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(w, y);
    this.ctx.stroke();

    // Marcações de faixa da estrada para dar forte ilusão de movimento
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([20, 30]); // Padrão tracejado
    // Deslocar de acordo com a velocidade do jogo e tempo para animar movimento
    this.ctx.lineDashOffset = (this.score * 80) % 50;

    this.ctx.beginPath();
    this.ctx.moveTo(0, y + 25);
    this.ctx.lineTo(w, y + 25);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawWeather() {
    if (this.stage !== 'Mestre da Agilidade' && this.stage !== 'Lenda Canina') return;

    this.ctx.save();

    // Chuva
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.rainParticles.forEach(rp => {
      this.ctx.moveTo(rp.x, rp.y);
      this.ctx.lineTo(rp.x - rp.vx * 1.5, rp.y - rp.length);
    });
    this.ctx.stroke();

    // Raio visual desenhado no fundo (Lenda Canina)
    if (this.stage === 'Lenda Canina' && this.lightningTimer > 18) {
      this.ctx.strokeStyle = '#fef08a';
      this.ctx.lineWidth = 3;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#fef08a';
      this.ctx.beginPath();
      let lx = this.gameWidth * 0.7 + (Math.random() * 200 - 100);
      let ly = 0;
      this.ctx.moveTo(lx, ly);
      for (let i = 0; i < 5; i++) {
        lx += (Math.random() * 80 - 40);
        ly += (Math.random() * 50 + 20);
        this.ctx.lineTo(lx, ly);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}

// Inicializar motor de jogo assim que carregar
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
