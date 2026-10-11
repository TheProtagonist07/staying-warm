import Phaser from 'phaser';
import { NAME_COLOR, PORTRAIT } from './story';
import type { Line } from './story';
import { FONT_BODY, FONT_TITLE } from './ui';

const W = 960, H = 540;

/**
 * A dialogue box along the bottom of the screen: portrait, name, and text that types itself out.
 * Space, Enter, Z or a click/tap finishes the line, and then moves to the next one.
 */
export class Dialog {
  active = false;
  private lines: Line[] = [];
  private index = 0;
  private done?: () => void;
  private onLine?: (i: number) => void;
  private typed = 0;
  private full = '';
  private box: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Sprite;
  private portraitFrame: Phaser.GameObjects.Rectangle;
  private name: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private keys: Phaser.Input.Keyboard.Key[];
  private holdOff = 0;

  constructor(private scene: Phaser.Scene) {
    const panel = scene.add.rectangle(W / 2, H - 92, W - 60, 150, 0x080d1c, 0.93).setStrokeStyle(2, 0x4a5c99);
    this.portraitFrame = scene.add.rectangle(110, H - 92, 96, 96, 0x121a33).setStrokeStyle(2, 0x4a5c99);
    this.portrait = scene.add.sprite(110, H - 92, 'chars', 6).setScale(3.4);
    this.name = scene.add.text(190, H - 150, '', { fontFamily: FONT_BODY, fontSize: '28px', color: '#ffd27a' });
    this.body = scene.add.text(190, H - 124, '', {
      fontFamily: FONT_BODY, fontSize: '26px', color: '#e8eefc', wordWrap: { width: W - 270 }, lineSpacing: 5,
    });
    this.prompt = scene.add.text(W - 60, H - 38, 'space', { fontFamily: FONT_BODY, fontSize: '20px', color: '#7f8fc0' }).setOrigin(1, 0.5);
    scene.tweens.add({ targets: this.prompt, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 });
    this.box = scene.add.container(0, 0, [panel, this.portraitFrame, this.portrait, this.name, this.body, this.prompt])
      .setScrollFactor(0).setDepth(90).setVisible(false);
    const kb = scene.input.keyboard!;
    this.keys = [kb.addKey('SPACE'), kb.addKey('ENTER'), kb.addKey('Z')];
    scene.input.on('pointerdown', () => { if (this.active && scene.time.now > this.holdOff) this.advance(); });
  }

  /** Starts a conversation. `onDone` runs after the last line. */
  show(lines: Line[], onDone?: () => void, onLine?: (i: number) => void): void {
    if (this.active || lines.length === 0) return;
    this.lines = lines; this.index = 0; this.done = onDone; this.onLine = onLine; this.active = true;
    this.holdOff = this.scene.time.now + 450; // ignore the key that was still down when the talk began
    this.box.setVisible(true);
    this.load();
  }

  private load(): void {
    const l = this.lines[this.index]!;
    this.onLine?.(this.index);
    const frame = PORTRAIT[l.who];
    this.portrait.setVisible(frame !== null).setFrame(frame ?? 6);
    this.portraitFrame.setVisible(frame !== null);
    this.name.setText(l.who === 'Narrator' ? '' : l.who).setColor(NAME_COLOR[l.who]);
    this.body.setColor(l.who === 'Narrator' ? '#b9c6ee' : '#e8eefc').setFontStyle(l.who === 'Narrator' ? 'italic' : '');
    this.full = l.text; this.typed = 0; this.body.setText('');
    // Without a portrait the text uses the full width of the box.
    const x = frame === null ? 70 : 190;
    this.body.setX(x); this.name.setX(x);
    this.body.setWordWrapWidth(frame === null ? W - 150 : W - 270);
    this.scene.sound.play('footstep_snow_000', { volume: 0.05 });
  }

  private advance(): void {
    if (this.typed < this.full.length) { this.typed = this.full.length; this.body.setText(this.full); return; }
    this.index++;
    if (this.index >= this.lines.length) {
      this.active = false; this.box.setVisible(false);
      const cb = this.done; this.done = undefined; cb?.();
      return;
    }
    this.load();
  }

  update(dt: number): void {
    if (!this.active) return;
    if (this.typed < this.full.length) {
      const before = Math.floor(this.typed);
      this.typed = Math.min(this.full.length, this.typed + dt * 0.055);
      if (Math.floor(this.typed) !== before) this.body.setText(this.full.slice(0, Math.floor(this.typed)));
      this.prompt.setText('');
    } else this.prompt.setText('space  >');
    if (this.scene.time.now > this.holdOff && this.keys.some((k) => Phaser.Input.Keyboard.JustDown(k))) this.advance();
  }
}
