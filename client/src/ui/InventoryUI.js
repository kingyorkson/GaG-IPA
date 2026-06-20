import { COLORS, GAME_WIDTH, GAME_HEIGHT, INVENTORY_SLOTS } from '../config/constants.js';
import { SEEDS } from '../config/seeds.js';

export class InventoryUI {
  constructor(scene, onClose) {
    this.scene = scene;
    this.onClose = onClose;
    this.visible = false;
    this.selectedSeed = null;
    this.inventoryItems = [];
    this.allObjects = [];
    this.build();
  }

  build() {
    const invH = 180;
    const invY = GAME_HEIGHT - invH;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(0, invY, GAME_WIDTH, invH, 10);
    bg.lineStyle(2, COLORS.tabletBorder, 1);
    bg.strokeRoundedRect(0, invY, GAME_WIDTH, invH, 10);
    this.allObjects.push(bg);

    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(COLORS.danger, 1);
    closeBg.fillRoundedRect(GAME_WIDTH - 42, invY + 3, 32, 32, 5);
    const closeZone = this.scene.add.zone(GAME_WIDTH - 26, invY + 19, 32, 32)
      .setInteractive({ useHandCursor: true });
    closeZone.on('pointerdown', () => this.hide());
    const closeText = this.scene.add.text(GAME_WIDTH - 26, invY + 19, 'X', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.allObjects.push(closeBg, closeZone, closeText);

    const permanentBg = this.scene.add.graphics();
    permanentBg.fillStyle(COLORS.inventorySlot, 1);
    permanentBg.fillRoundedRect(10, invY + 10, 180, 50, 5);
    permanentBg.lineStyle(1, COLORS.buttonGreenOutline, 0.5);
    permanentBg.strokeRoundedRect(10, invY + 10, 180, 50, 5);
    this.allObjects.push(permanentBg);

    const sledgeText = this.scene.add.text(20, invY + 15, 'Sledgehammer', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'Arial',
    });
    const shovelText = this.scene.add.text(20, invY + 35, 'Shovel', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'Arial',
    });
    this.allObjects.push(sledgeText, shovelText);

    const sledgeHit = this.scene.add.zone(10, invY + 10, 85, 50).setInteractive({ useHandCursor: true });
    sledgeHit.on('pointerdown', () => {
      this.scene.currentTool = 'sledgehammer';
      this.scene.showMessage('Sledgehammer selected - click a plot to place a prop');
    });
    this.allObjects.push(sledgeHit);

    const shovelHit = this.scene.add.zone(105, invY + 10, 85, 50).setInteractive({ useHandCursor: true });
    shovelHit.on('pointerdown', () => {
      this.scene.currentTool = null;
      if (this.scene.placedProps.length > 0) {
        const prop = this.scene.placedProps.pop();
        if (prop.graphics) prop.graphics.destroy();
        if (prop.plot) prop.plot.plant = null;
        this.scene.showMessage('Removed last prop');
      }
    });
    this.allObjects.push(shovelHit);

    this.slotBounds = [];
    this.slotGraphics = [];
    this.slotTexts = [];
    this.slotHits = [];

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const sx = 210 + col * 103;
      const sy = invY + 10 + row * 55;

      const slot = this.scene.add.graphics();
      slot.fillStyle(COLORS.inventorySlot, 0.8);
      slot.fillRoundedRect(sx, sy, 98, 48, 4);
      slot.lineStyle(1, 0x444444, 0.5);
      slot.strokeRoundedRect(sx, sy, 98, 48, 4);

      const slotText = this.scene.add.text(sx + 5, sy + 24, '', {
        fontSize: '10px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0, 0.5);

      const hit = this.scene.add.zone(sx + 49, sy + 24, 98, 48).setInteractive({ useHandCursor: true });
      hit.slotIndex = i;

      this.slotBounds.push({ x: sx, y: sy, w: 98, h: 48 });
      this.slotGraphics.push(slot);
      this.slotTexts.push(slotText);
      this.slotHits.push(hit);
      this.allObjects.push(slot, slotText, hit);
    }

    this.hide();
  }

  show() {
    this.visible = true;
    this.allObjects.forEach(o => o.setVisible ? o.setVisible(true) : null);
    this.renderSlots();
  }

  hide() {
    this.visible = false;
    this.allObjects.forEach(o => o.setVisible ? o.setVisible(false) : null);
    this.selectedSeed = null;
    if (this.onClose) this.onClose();
  }

  renderSlots() {
    const items = this.scene.user ? this.scene.user.inventory : [];

    this.slotTexts.forEach((text, i) => {
      text.setText(i < items.length ? items[i].name : '');
    });

    this.slotHits.forEach((hit, i) => {
      hit.removeAllListeners('pointerdown');
      if (i < items.length) {
        hit.on('pointerdown', () => {
          this.selectedSeed = items[i].id;
          this.updateSelectedDisplay();
          this.hide();
          this.scene.showMessage(`Selected ${items[i].name} - click a soil plot to plant`);
        });
      } else {
        hit.on('pointerdown', () => {});
      }
    });
  }

  updateSelectedDisplay() {
    if (this.selectedSeed) {
      const seed = SEEDS.find(s => s.id === this.selectedSeed);
      if (seed) {
        this.scene.showMessage(`Selected: ${seed.name}`);
      }
    }
  }

  showPropSelector(callback) {
    this.show();
    const items = this.scene.user ? this.scene.user.inventory : [];

    this.slotHits.forEach((hit, i) => {
      hit.removeAllListeners('pointerdown');
      if (i < items.length && items[i].type === 'prop') {
        hit.on('pointerdown', () => {
          callback(items[i].id);
        });
      } else {
        hit.on('pointerdown', () => {
          callback(null);
        });
      }
    });
  }

  removeFromInventory(seedId) {
    if (!this.scene.user || !this.scene.user.inventory) return;
    const idx = this.scene.user.inventory.findIndex(i => i.id === seedId);
    if (idx > -1) {
      this.scene.user.inventory.splice(idx, 1);
      this.renderSlots();
    }
  }
}