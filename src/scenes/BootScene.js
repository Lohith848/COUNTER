import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Set up a dark, premium background for loading screen
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Drawing loading screen UI
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'PREPARING THE RING...',
      style: {
        font: '18px "Press Start 2P"',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 + 35,
      text: '0%',
      style: {
        font: '24px "Outfit"',
        fill: '#00ff88',
        fontWeight: 'bold'
      }
    });
    percentText.setOrigin(0.5);

    // Glowing progress bar background
    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x1a1a2e, 1);
    progressBarBg.fillRoundedRect(width / 2 - 200, height / 2 - 10, 400, 20, 10);
    progressBarBg.lineStyle(2, 0xff0055, 0.3);
    progressBarBg.strokeRoundedRect(width / 2 - 200, height / 2 - 10, 400, 20, 10);

    const progressBar = this.add.graphics();

    // Loader events
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      // Draw inner bar
      progressBar.fillStyle(0x00ff88, 1);
      // Give the progress bar a rounded look matching the background
      if (value > 0.05) {
        progressBar.fillRoundedRect(width / 2 - 198, height / 2 - 8, 396 * value, 16, 8);
      }
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBarBg.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Preload images
    this.load.image('ring', 'assets/ring.jpg');
    this.load.image('akira_raw', 'assets/AKIRA.png');
    this.load.image('ryuga_raw', 'assets/RYUGA.png');
  }

  create() {
    // Process character textures to remove white background using flood fill
    this.processTexture('akira_raw', 'akira_clean');
    this.processTexture('ryuga_raw', 'ryuga_clean');

    // Go to Menu Scene
    this.scene.start('MenuScene');
  }

  /**
   * Performs an edge-based BFS flood-fill on the image to replace pure-white background
   * pixels with transparency, preserving interior white details (like text and white shorts shading).
   */
  processTexture(sourceKey, outputKey) {
    if (!this.textures.exists(sourceKey)) return;

    const sourceTexture = this.textures.get(sourceKey);
    const sourceImage = sourceTexture.getSourceImage();

    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = imgData.width;
    const h = imgData.height;

    // Queue for BFS
    const queue = [];
    const visited = new Uint8Array(w * h);

    // Helper to get pixel index
    const getIdx = (x, y) => (y * w + x) * 4;

    // Helper to check if pixel is target white background
    const isBackgroundWhite = (x, y) => {
      const idx = getIdx(x, y);
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a === 0) return false;
      // We look for pure white (255, 255, 255) and very close off-whites (250+)
      return r > 250 && g > 250 && b > 250;
    };

    // Add all border pixels to queue
    for (let x = 0; x < w; x++) {
      if (isBackgroundWhite(x, 0)) {
        queue.push(x, 0);
        visited[0 * w + x] = 1;
      }
      if (isBackgroundWhite(x, h - 1)) {
        queue.push(x, h - 1);
        visited[(h - 1) * w + x] = 1;
      }
    }
    for (let y = 0; y < h; y++) {
      if (isBackgroundWhite(0, y)) {
        queue.push(0, y);
        visited[y * w + 0] = 1;
      }
      if (isBackgroundWhite(w - 1, y)) {
        queue.push(w - 1, y);
        visited[y * w + (w - 1)] = 1;
      }
    }

    // BFS Loop
    let head = 0;
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];

    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const idx = getIdx(cx, cy);

      // Make background transparent
      data[idx + 3] = 0;

      // Check neighbors
      for (let i = 0; i < directions.length; i++) {
        const nx = cx + directions[i][0];
        const ny = cy + directions[i][1];

        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const vIdx = ny * w + nx;
          if (visited[vIdx] === 0) {
            visited[vIdx] = 1;
            if (isBackgroundWhite(nx, ny)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    // Write back modified pixels and create texture
    ctx.putImageData(imgData, 0, 0);
    this.textures.addCanvas(outputKey, canvas);
  }
}
