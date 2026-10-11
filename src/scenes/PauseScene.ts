import Phaser from 'phaser';
import { FONT_BODY, FONT_TITLE } from '../lib/ui';

const W = 960, H = 540;

/** Opens over a paused game. Esc or P resumes; arrows and Enter (or the mouse) pick an option. */
export class PauseScene extends Phaser.Scene {
  private items: Phaser.GameObjects.Text[] = [];
  private index = 0;
  private level = 0;

  constructor() { super('Pause'); }

  init(data: { level: number }): void { this.level = data.level; }

  create(): void {
    this.items = []; this.index = 0;
    this.add.rectangle(0, 0, W, H, 0x050814, 0.72).setOrigin(0, 0);
    this.add.text(W / 2, 120, 'PAUSED', { fontFamily: FONT_TITLE, fontSize: '46px', color: '#ffd27a' }).setOrigin(0.5);
    const options: [string, () => void][] = [
      ['Resume', () => this.resume()],
      ['Restart this chapter', () => this.restart()],
      [this.sound.mute ? 'Sound: off' : 'Sound: on', () => { this.sound.mute = !this.sound.mute; this.refresh(); }],
      ['Quit to title', () => this.quit()],
    ];
    options.forEach(([label, fn], i) => {
      const t = this.add.text(W / 2, 210 + i * 56, label, { fontFamily: FONT_BODY, fontSize: '34px', color: '#ffffff' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.index = i; this.refresh(); });
      t.on('pointerdown', fn);
      (t as unknown as { act: () => void }).act = fn;
      this.items.push(t);
    });
    this.add.text(W / 2, H - 50, 'A / D or arrows walk   Space jump   M mute   Esc pause', { fontFamily: FONT_BODY, fontSize: '20px', color: '#7f8fc0' }).setOrigin(0.5);
    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.resume());
    kb.on('keydown-P', () => this.resume());
    kb.on('keydown-UP', () => { this.index = (this.index + this.items.length - 1) % this.items.length; this.refresh(); });
    kb.on('keydown-DOWN', () => { this.index = (this.index + 1) % this.items.length; this.refresh(); });
    kb.on('keydown-ENTER', () => (this.items[this.index] as unknown as { act: () => void }).act());
    kb.on('keydown-SPACE', () => (this.items[this.index] as unknown as { act: () => void }).act());
    this.refresh();
  }

  private refresh(): void {
    this.items.forEach((t, i) => {
      t.setColor(i === this.index ? '#ffd27a' : '#ffffff').setScale(i === this.index ? 1.08 : 1);
      if (i === 2) t.setText(this.sound.mute ? 'Sound: off' : 'Sound: on');
    });
  }

  private resume(): void {
    this.scene.resume('Game');
    this.scene.stop();
  }

  private restart(): void {
    this.scene.stop('Game');
    this.scene.start('Game', { level: this.level });
  }

  private quit(): void {
    this.scene.stop('Game');
    this.sound.stopAll();
    this.scene.start('Title');
  }
}
