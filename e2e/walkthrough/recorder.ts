import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, type Page } from '@playwright/test';

// The walkthrough's step helper: a step of the recording, numbered by the recorder in the
// order the steps are played, so the whole recording keeps one numbering whatever each bar
// calls its steps; at least one picture per step saved as NN[letter]-<slug>[-<detail>].png
// (the first unlettered, then 03b, 03c, …; `-<detail>` when shot() is given one), and
// chapters.json rewritten as each step starts, so a run that fails part way still leaves the
// chapters it reached. `pictures` holds the names as written.

export interface Chapter {
  step: number;
  title: string;
  /** Seconds from the start of the video. */
  start: number;
}

export class Recorder {
  readonly chapters: Chapter[] = [];
  readonly pictures: string[] = [];
  private current: { step: number; slug: string; shots: number } | null = null;

  /**
   * `dir` is the demo folder; `startedAt` is when the page (and so its video) began, in ms
   * since the epoch; `check` runs before every picture.
   */
  constructor(
    private readonly page: Page,
    readonly dir: string,
    private readonly startedAt: number,
    private readonly check: () => Promise<void> = async () => {},
  ) {
    mkdirSync(dir, { recursive: true });
  }

  /**
   * Runs the recording's next step as a chapter, numbered one after the last; takes its picture
   * at the end if `body` took none.
   */
  async step(title: string, slug: string, body: () => Promise<void>): Promise<void> {
    const step = this.chapters.length + 1;
    const start = Math.round((Date.now() - this.startedAt) / 100) / 10;
    this.chapters.push({ step, title, start });
    writeFileSync(path.join(this.dir, 'chapters.json'), `${JSON.stringify(this.chapters, null, 2)}\n`);
    this.current = { step, slug, shots: 0 };
    await test.step(`${pad(step)} ${title}`, body);
    if (this.current.shots === 0) await this.shot();
    this.current = null;
  }

  /**
   * Saves a picture of the screen for the current step as NN[letter]-<slug>[-<detail>].png:
   * the first NN-<slug>, then NNb-<slug>, NNc-<slug>, …, each with `-<detail>` when given.
   */
  async shot(detail?: string): Promise<string> {
    if (!this.current) throw new Error('shot() outside a step');
    await this.check();
    const { step, slug, shots } = this.current;
    const letter = shots === 0 ? '' : String.fromCharCode('a'.charCodeAt(0) + shots);
    const name = `${pad(step)}${letter}-${slug}${detail ? `-${detail}` : ''}.png`;
    await this.page.screenshot({ path: path.join(this.dir, name) });
    this.pictures.push(name);
    this.current.shots += 1;
    return name;
  }

  /** Closes the page and saves its video into the demo folder. */
  async finish(name = 'walkthrough.webm'): Promise<string> {
    const video = this.page.video();
    if (!video) throw new Error('the page has no video: is video on in playwright.walkthrough.config.ts?');
    await this.page.close();
    const file = path.join(this.dir, name);
    await video.saveAs(file);
    return file;
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
