import re

with open(r'c:\JOGO-HIP-DOG-RUN-\game.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir canvas.width por gameWidth
content = content.replace('this.canvas.width', 'this.gameWidth')
content = content.replace('this.canvas.height', 'this.gameHeight')
content = content.replace('canvasWidth = this.canvas.width', 'canvasWidth = this.gameWidth')
content = content.replace('canvasHeight = this.canvas.height', 'canvasHeight = this.gameHeight')

# Restaurar resizeCanvas
old_resize = '''  resizeCanvas() {
    // Ajustar de forma responsiva mantendo proporção desejada de 800x300
    const parent = this.canvas.parentElement;
    this.gameWidth = parent.clientWidth;
    this.gameHeight = parent.clientHeight;

    // Recalcular posições relativas ao novo tamanho se necessário
    if (this.dog) {
      this.dog.groundY = this.gameHeight - 65;
      if (this.dog.y > this.dog.groundY) this.dog.y = this.dog.groundY;
    }
  }'''

new_resize = '''  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    this.gameWidth = parent.clientWidth;
    this.gameHeight = parent.clientHeight;
    
    this.canvas.style.width = this.gameWidth + 'px';
    this.canvas.style.height = this.gameHeight + 'px';
    
    this.canvas.width = this.gameWidth * dpr;
    this.canvas.height = this.gameHeight * dpr;
    
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.dog) {
      this.dog.groundY = this.gameHeight - 65;
      if (this.dog.y > this.dog.groundY) this.dog.y = this.dog.groundY;
    }
  }'''

content = content.replace(old_resize, new_resize)

# Fix GameItem instantiations (they use canvasWidth, canvasHeight directly from the environment scope, so no need if we changed the scope var, but wait...)
# Wait, let's just make sure.

with open(r'c:\JOGO-HIP-DOG-RUN-\game.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("game.js refactored successfully for DPI scaling.")
