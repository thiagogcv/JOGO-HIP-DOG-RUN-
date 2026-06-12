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
    
    // Som áspero principal
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.25);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);

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
    } catch(e) {
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
    ctx.shadowBlur = this.isGood ? 8 : 0;
    ctx.shadowColor = this.color;
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
// 3. CLASSE DO CACHORRO (ENTITY)
// ==========================================
class Dog {
  constructor(canvasHeight) {
    this.groundY = canvasHeight - 65; // Nível estável do chão
    this.x = 80;
    this.y = this.groundY;
    this.width = 65;
    this.height = 42;
    this.vy = 0;
    this.gravity = 0.65;
    this.jumpPower = -12.5;
    this.isJumping = false;
    
    // Animação de corrida
    this.legAngle = 0;
    this.runSpeedModifier = 0.22;
    this.tailWagAngle = 0;
    
    this.stage = 'Filhote'; // Filhote, Jovem, Adulto saudável, Campeão
  }

  jump() {
    if (!this.isJumping) {
      this.vy = this.jumpPower;
      this.isJumping = true;
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

    // Animar patas e cauda
    if (!this.isJumping) {
      this.legAngle += speed * this.runSpeedModifier;
      this.tailWagAngle = Math.sin(this.legAngle * 1.5) * 0.3;
    } else {
      // Postura de pulo (pernas esticadas, orelhas estáticas)
      this.legAngle = 0.5; 
      this.tailWagAngle = -0.4;
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Efeito de Sombra sutil no chão
    const shadowOpacity = Math.max(0.1, 0.4 - (this.groundY - this.y) / 100);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.beginPath();
    ctx.ellipse(this.x + 30, this.groundY + 38, 30, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Translação de coordenadas para o cachorro
    ctx.translate(this.x, this.y);

    // Ajustar cores baseadas no nível/estágio
    let dogColor = '#f59e0b'; // Filhote: Laranja ouro fofinho
    let secondaryColor = '#b45309';
    let sizeScale = 0.75; // Filhote é menor!

    if (this.stage === 'Jovem') {
      dogColor = '#f97316'; // Laranja avermelhado com energia
      secondaryColor = '#c2410c';
      sizeScale = 0.9;
    } else if (this.stage === 'Adulto saudável') {
      dogColor = '#d97706'; // Dourado escuro forte
      secondaryColor = '#78350f';
      sizeScale = 1.1;
    } else if (this.stage === 'Campeão da Mobilidade') {
      dogColor = '#eab308'; // Amarelo cintilante
      secondaryColor = '#854d0e';
      sizeScale = 1.25;
    }

    // Aplicar escala do tamanho do cachorro
    ctx.scale(sizeScale, sizeScale);
    
    // Deslocar para manter as patas apoiadas corretamente na escala
    ctx.translate(0, (this.height - this.height * sizeScale) / sizeScale);

    // Desenhar Pernas do Cachorro (2 Traseiras, 2 Dianteiras)
    const renderLeg = (offsetX, isBackLeg, phaseOffset) => {
      ctx.save();
      ctx.translate(offsetX, 32);
      // Movimento harmônico de tesoura
      const rotation = Math.sin(this.legAngle + phaseOffset) * 0.6;
      ctx.rotate(rotation);
      
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      // Pata estilizada
      ctx.roundRect(-4, 0, 8, 14, 4);
      ctx.fill();
      ctx.restore();
    };

    // Pernas do fundo (desenhadas primeiro)
    renderLeg(14, true, Math.PI); // Pata traseira esquerda
    renderLeg(48, false, 0);       // Pata dianteira esquerda

    // Corpo (Torso Arredondado)
    ctx.fillStyle = dogColor;
    ctx.beginPath();
    ctx.roundRect(8, 12, 45, 22, 10);
    ctx.fill();

    // Peito / Pescoço
    ctx.fillStyle = dogColor;
    ctx.beginPath();
    ctx.ellipse(45, 18, 12, 14, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.beginPath();
    ctx.arc(52, 6, 12, 0, Math.PI * 2);
    ctx.fill();

    // Focinho
    ctx.beginPath();
    ctx.ellipse(59, 8, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Narizinho
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(65, 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Olho
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(54, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(55, 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Orelha caidinha fofa
    ctx.fillStyle = secondaryColor;
    ctx.save();
    ctx.translate(46, 5);
    // As orelhas balançam de leve no pulo
    const earRotation = this.isJumping ? -0.2 : Math.sin(this.legAngle) * 0.1;
    ctx.rotate(earRotation);
    ctx.beginPath();
    ctx.ellipse(0, 8, 5, 11, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rabo Alegre
    ctx.fillStyle = dogColor;
    ctx.save();
    ctx.translate(10, 16);
    ctx.rotate(Math.PI * 1.25 + this.tailWagAngle);
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, 18, 3);
    ctx.fill();
    ctx.restore();

    // Pernas da frente (desenhadas por cima)
    renderLeg(18, true, 0);       // Pata traseira direita
    renderLeg(44, false, Math.PI); // Pata dianteira direita

    // Se for Campeão da Mobilidade, adicionar uma coroinha brilhante!
    if (this.stage === 'Campeão da Mobilidade') {
      ctx.save();
      ctx.translate(50, -14);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      
      // Estrela de Campeão flutuante na cabeça
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(3, -1);
      ctx.lineTo(8, -1);
      ctx.lineTo(4, 3);
      ctx.lineTo(6, 8);
      ctx.lineTo(0, 5);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-4, 3);
      ctx.lineTo(-8, -1);
      ctx.lineTo(-3, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
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
    
    // Configuração de coordenadas
    this.width = 44;
    this.height = 44;
    this.x = canvasWidth + 50;
    
    // Altura de spawn: 65% no chão, 35% no ar (pulo necessário!)
    const spawnHigh = Math.random() < 0.35;
    this.y = spawnHigh ? canvasHeight - 130 : canvasHeight - 65;
  }

  update(speed) {
    this.x -= speed;
  }

  draw(ctx) {
    ctx.save();

    // Efeito de brilho/halo em volta do token
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    
    // Círculo base Glassmorphic
    ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Remover o efeito de sombra para desenhar o texto (evita borrão)
    ctx.shadowBlur = 0;

    // Desenhar Emoji do Item
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, this.x, this.y);

    // Rótulo Educativo (Texto explicativo embaixo do item)
    ctx.fillStyle = this.color;
    ctx.font = '800 9px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(this.name.toUpperCase(), this.x, this.y + 36);

    ctx.restore();
  }

  // Detecção de colisão circular otimizada
  collidesWith(dog) {
    // Ponto central do cão
    const dogCX = dog.x + dog.width / 2;
    const dogCY = dog.y + dog.height / 2;
    
    // Ponto central do item
    const itemCX = this.x;
    const itemCY = this.y;

    // Distância euclidiana aproximada com caixa de colisão flexível
    const dx = dogCX - itemCX;
    const dy = dogCY - itemCY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Tolerância confortável para o jogador
    return distance < (dog.width / 2.2 + 20);
  }
}

// Catálogo de Itens
const ITEM_POOL = [
  // Bons (Saúde ✅)
  { name: 'Peso Ideal', emoji: '⚖️', isGood: true, color: '#10b981' },
  { name: 'Ex. Moderado', emoji: '🐕', isGood: true, color: '#10b981' },
  { name: 'Fisioterapia', emoji: '👐', isGood: true, color: '#10b981' },
  { name: 'Natação', emoji: '🏊', isGood: true, color: '#10b981' },
  { name: 'Condroprotetor', emoji: '💊', isGood: true, color: '#10b981' },
  { name: 'Consulta Vet', emoji: '🩺', isGood: true, color: '#10b981' },
  
  // Ruins (Perigos ❌)
  { name: 'Obesidade', emoji: '🍔', isGood: false, color: '#ef4444' },
  { name: 'Sedentarismo', emoji: '🛋️', isGood: false, color: '#ef4444' },
  { name: 'Ex. Excessivo', emoji: '🏋️', isGood: false, color: '#ef4444' },
  { name: 'Saltos Altos', emoji: '🪜', isGood: false, color: '#ef4444' },
  { name: 'Piso Liso', emoji: '💦', isGood: false, color: '#ef4444' }
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
    
    // Estatísticas da Partida
    this.score = 0;
    this.life = 100;
    this.speed = 3.8;
    this.maxSpeed = 8.5;
    this.stage = 'Filhote';
    
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

    // Ajustar tamanho do Canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Loop do Jogo
    this.lastTime = 0;
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    // Ajustar de forma responsiva mantendo proporção desejada de 800x300
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    
    if (this.dog) {
      this.dog.groundY = this.canvas.height - 65;
      if (this.state === 'START') {
        this.dog.y = this.dog.groundY;
      }
    }
  }

  startGame(e) {
    if (e) e.stopPropagation();
    sounds.init();
    
    this.startOverlay.classList.remove('active');
    this.state = 'PLAYING';
    this.score = 0;
    this.life = 100;
    this.speed = 3.8;
    this.stage = 'Filhote';
    this.dog.stage = 'Filhote';
    this.items = [];
    this.particles = [];
    this.spawnTimer = 0;
    
    this.updateHUD();
    this.scoreVal.textContent = '0000';
    sounds.playCollect();
  }

  resumeGame(e) {
    if (e) e.stopPropagation();
    this.levelUpOverlay.classList.remove('active');
    this.state = 'PLAYING';
    
    // Efeito de recuperação leve ao evoluir
    this.life = Math.min(100, this.life + 15);
    this.updateHUD();
  }

  restartGame(e) {
    if (e) e.stopPropagation();
    this.gameOverOverlay.classList.remove('active');
    
    // Reseta o estado do jogo e retorna para o menu inicial (fase Filhote)
    this.state = 'START';
    this.score = 0;
    this.life = 100;
    this.speed = 3.8;
    this.stage = 'Filhote';
    this.dog.stage = 'Filhote';
    this.items = [];
    this.particles = [];
    this.spawnTimer = 0;
    
    this.updateHUD();
    this.scoreVal.textContent = '0000';
    this.startOverlay.classList.add('active');
  }

  handleActionInput(e) {
    // Evita pulos acidentais ao tocar em botões de overlay
    if (e.target.closest('.btn') || e.target.closest('.overlay.active')) {
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
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updatePhysics() {
    // 1. Atualizar o cão
    this.dog.update(this.speed);

    // 2. Incrementar a pontuação por corrida
    this.score += 0.05;
    this.scoreVal.textContent = String(Math.floor(this.score)).padStart(4, '0');
    
    // Aumento suave de velocidade conforme score
    this.speed = Math.min(this.maxSpeed, 3.8 + (this.score * 0.006));

    // 3. Controle de Níveis (Progressão)
    this.checkEvolution();

    // 4. Mover Nuvens de Fundo
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed + (this.speed * 0.02);
      if (cloud.x + cloud.size * 2 < 0) {
        cloud.x = this.canvas.width + Math.random() * 100;
        cloud.y = Math.random() * 70 + 20;
      }
    });

    // 5. Spawn procedimental de Itens / Obstáculos
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      // Escolher um item aleatório do catálogo
      const randomItemData = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      this.items.push(new GameItem(this.canvas.width, this.canvas.height, randomItemData));
      
      // Ajustar intervalo de spawn de acordo com velocidade
      this.spawnInterval = Math.max(90, 140 - Math.floor(this.speed * 8));
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

    // 8. Decair Tremedeira de tela
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
    }

    // 9. Verificar condição de vitória (máximo de 1000 pontos)
    if (this.score >= 1000) {
      this.triggerGameOver(true);
    }
  }

  // Tratamento de colisões com os itens
  handleCollision(item) {
    if (item.isGood) {
      // Coleta Positiva
      this.score += 10;
      this.life = Math.min(100, this.life + 12);
      sounds.playCollect();
      this.createParticlesBurst(item.x, item.y, '#10b981', true);
      this.triggerFlashEffect(false);
    } else {
      // Impacto Negativo
      this.life = Math.max(0, this.life - 25);
      this.score = Math.max(0, this.score - 5);
      
      // Desaceleração temporária
      this.speed = Math.max(2.8, this.speed - 1.5);
      
      sounds.playHit();
      this.createParticlesBurst(item.x, item.y, '#ef4444', false);
      
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

    if (this.score >= 450 && this.stage !== 'Campeão da Mobilidade') {
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
      else evolutionEmojiEl.textContent = '🏆';
      
      this.levelUpOverlay.classList.add('active');
      this.updateHUD();
      sounds.playLevelUp();
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
    
    const titleEl = document.querySelector('.game-over-title');
    const descEl = document.querySelector('.game-over-desc');
    const tipTitleEl = document.querySelector('.educational-card h3');
    const tipDescEl = document.getElementById('gameOverTip');
    
    if (isVictory) {
      this.score = 1000;
      this.scoreVal.textContent = '1000';
      
      titleEl.innerHTML = 'Obrigado por jogar! 🏆';
      titleEl.style.color = 'var(--primary)';
      descEl.textContent = 'Você atingiu o limite de 1000 pontos e completou a jornada de mobilidade!';
      
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

    // 4. Desenhar o Solo / Estrada
    this.drawGround();

    // 5. Desenhar Itens
    this.items.forEach(item => item.draw(this.ctx));

    // 6. Desenhar Partículas
    this.particles.forEach(p => p.draw(this.ctx));

    // 7. Desenhar o Cachorro
    this.dog.draw(this.ctx);

    this.ctx.restore();
  }

  drawSkyGradient() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
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
    } else {
      // Campeão: Céu Espacial + Aurora Green
      grad.addColorStop(0, '#0f172a'); // Azul espacial escuro
      grad.addColorStop(0.4, '#1e1b4b'); // Roxo noite indigo
      grad.addColorStop(0.8, '#064e3b'); // Aurora Green escura
      grad.addColorStop(1, '#1e293b'); // Cinza azulado chão
    }
    
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    } else {
      mountColor1 = 'rgba(16, 185, 129, 0.1)';
      mountColor2 = 'rgba(4, 120, 87, 0.15)';
    }

    const midY = this.canvas.height - 65;

    // Linha 1: Montanhas distantes (se movem bem devagar)
    this.ctx.fillStyle = mountColor1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, midY);
    // Gerar cumes simples
    const w = this.canvas.width;
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
    const y = this.canvas.height - groundHeight;
    const w = this.canvas.width;

    // Solo sólido
    const groundGrad = this.ctx.createLinearGradient(0, y, 0, this.canvas.height);
    if (this.stage === 'Campeão da Mobilidade') {
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(1, '#0f172a');
    } else {
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(1, '#0f172a');
    }
    
    this.ctx.fillStyle = groundGrad;
    this.ctx.fillRect(0, y, w, groundHeight);

    // Linha superior de borda (grama/asfalto)
    this.ctx.strokeStyle = this.stage === 'Campeão da Mobilidade' ? '#10b981' : '#f59e0b';
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
}

// Inicializar motor de jogo assim que carregar
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
