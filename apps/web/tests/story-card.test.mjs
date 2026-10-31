import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

// Usa somente o TypeScript já instalado e o Chrome local: sem dependências de teste adicionais.
const source = (name) => readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
const moduleUrl = (code) =>
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(code, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText
  ).toString('base64')}`
const cardUrl = moduleUrl(
  source('story-card').replace("'./image'", JSON.stringify(moduleUrl(source('image'))))
)
const { storyShareText, storyFileName, eventHashtag, shareStoryCard } = await import(cardUrl)
const chrome = process.env.CHROME_BIN || 'google-chrome'
const chromeAvailable = spawnSync(chrome, ['--version'], { stdio: 'ignore' }).status === 0
const details = {
  checkpointName: 'Robótica e ciência',
  eventName: '23ª SNCT – Ciência Delas',
  categoryName: 'Oficina',
  color: 'laranja',
  hashtag: 'SNCT2026',
}

test('texto compartilhado preserva atividade e hashtag sem acrescentar URLs ou dados do passaporte', () => {
  assert.equal(
    storyShareText(details),
    'Visitei Robótica e ciência no 23ª SNCT – Ciência Delas! #SNCT2026'
  )
  assert.equal(eventHashtag('  ##CiênciaDelas  '), '#CiênciaDelas')
  assert.equal(eventHashtag(null), '')
  assert.equal(eventHashtag('  '), '')
  assert.equal(storyFileName('../../Robótica? <ciência>'), 'passaporte-robotica-ciencia.png')
  assert.equal(storyFileName('🎉'), 'passaporte-conquista.png')
})

test('compartilhamento nativo envia o PNG preparado e preserva cancelamento e fallback', async () => {
  const file = new File(['PNG'], 'conquista.png', { type: 'image/png' })
  assert.equal(await shareStoryCard(file, details, {}), 'unsupported')
  let calls = 0
  const share = async (data) => {
    calls++
    assert.deepEqual(data.files, [file])
    assert.equal(data.text, storyShareText(details))
    assert.equal(data.title, details.checkpointName)
    assert.equal(data.url, undefined)
  }
  assert.equal(await shareStoryCard(file, details, { canShare: () => false, share }), 'unsupported')
  assert.equal(calls, 0)
  assert.equal(await shareStoryCard(file, details, { canShare: () => true, share }), 'shared')
  assert.equal(calls, 1)
  for (const [name, outcome] of [
    ['AbortError', 'cancelled'],
    ['NotAllowedError', 'failed'],
  ]) {
    assert.equal(
      await shareStoryCard(file, details, {
        canShare: () => true,
        share: async () => {
          throw new DOMException('teste', name)
        },
      }),
      outcome
    )
  }
})

test(
  'Canvas real gera PNG Stories, mantém texto dentro da imagem e aplica foto local',
  { timeout: 30000, skip: !chromeAvailable && 'Chrome necessário para a validação real de Canvas' },
  async () => {
    const profile = mkdtempSync(path.join(tmpdir(), 'passaporte-story-test-'))
    const browserTest = `
    const { createStoryCard } = await import(${JSON.stringify(cardUrl)});
    const details = ${JSON.stringify(details)};
    const lines = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y) {
      lines.push({ text, x, y, width: this.measureText(text).width });
      return original.call(this, text, x, y);
    };
    try {
      const card = await createStoryCard(details);
      const bitmap = await createImageBitmap(card);
      const originalLines = [...lines];
      lines.length = 0;
      await createStoryCard({ ...details,
        checkpointName: 'Atividade com nome muito longo '.repeat(10),
        eventName: 'Evento com nome muito longo '.repeat(8),
        categoryName: 'Categoria extensa '.repeat(8),
        hashtag: 'HashtagSemEspacos'.repeat(12),
      });
      const overflow = lines.filter(line => line.x < 0 || line.x + line.width > 996.5 || line.y > 1900);
      const photo = document.createElement('canvas');
      photo.width = 200; photo.height = 400;
      const photoContext = photo.getContext('2d');
      photoContext.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-magenta');
      photoContext.fillRect(0, 0, 200, 400);
      const photoBlob = await new Promise(resolve => photo.toBlob(resolve));
      const photoUrl = URL.createObjectURL(photoBlob);
      const photoCard = await createStoryCard(details, photoUrl);
      URL.revokeObjectURL(photoUrl);
      const photoBitmap = await createImageBitmap(photoCard);
      const inspect = document.createElement('canvas');
      inspect.width = 1080; inspect.height = 1920;
      const inspectContext = inspect.getContext('2d');
      inspectContext.drawImage(photoBitmap, 0, 0);
      const pixel = [...inspectContext.getImageData(540, 700, 1, 1).data];
      const preview = document.createElement('img');
      preview.src = URL.createObjectURL(card);
      preview.width = 1080; preview.height = 1920;
      document.body.prepend(preview);
      await preview.decode();
      document.querySelector('#result').textContent = JSON.stringify({
        width: bitmap.width, height: bitmap.height, type: card.type, bytes: card.size,
        texts: originalLines.map(line => line.text), overflow, photoPixel: pixel,
      });
    } catch (error) { document.querySelector('#result').textContent = JSON.stringify({ error: error.message }); }
  `
    const style = `
    :root { --color-violeta:#3b2492; --color-violeta-noite:#1d1147; --color-creme:#f7f2e9;
      --color-amarelo:#f6c21c; --color-verde:#2e9e4f; --color-magenta:#d9327e;
      --color-laranja:#f28322; --color-azul:#2563c9; --color-turquesa:#169c93;
      --font-montserrat:Arial; --font-nunito-sans:Arial; }
    body { margin:0 } img { display:block }
  `
    const browser = spawn(
      chrome,
      [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--hide-scrollbars',
        '--window-size=1080,1920',
        `--user-data-dir=${profile}`,
        '--remote-debugging-port=0',
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    )
    let connection
    try {
      const endpoint = await new Promise((resolve, reject) => {
        let output = ''
        browser.once('error', reject)
        browser.once('exit', () => reject(new Error(output)))
        browser.stderr.on('data', (chunk) => {
          output += chunk.toString()
          const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/)
          if (match) resolve(match[1])
        })
      })
      connection = new WebSocket(endpoint)
      await new Promise((resolve, reject) => {
        connection.addEventListener('open', resolve, { once: true })
        connection.addEventListener('error', reject, { once: true })
      })
      let nextId = 0
      const pending = new Map()
      connection.addEventListener('message', ({ data }) => {
        const response = JSON.parse(data)
        const handler = pending.get(response.id)
        if (handler) {
          pending.delete(response.id)
          if (response.error) handler.reject(new Error(response.error.message))
          else handler.resolve(response.result)
        }
      })
      const command = (method, params = {}, sessionId) =>
        new Promise((resolve, reject) => {
          const id = ++nextId
          pending.set(id, { resolve, reject })
          connection.send(JSON.stringify({ id, method, params, sessionId }))
        })
      const { targetId } = await command('Target.createTarget', { url: 'about:blank' })
      const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true })
      await command(
        'Emulation.setDeviceMetricsOverride',
        { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false },
        sessionId
      )
      const result = await command(
        'Runtime.evaluate',
        {
          expression: `(async () => {
        const style = document.createElement('style'); style.textContent = ${JSON.stringify(style)};
        document.head.append(style); document.body.innerHTML = '<pre id="result">pending</pre>';
        ${browserTest}
        return document.querySelector('#result').textContent;
      })()`,
          awaitPromise: true,
          returnByValue: true,
        },
        sessionId
      )
      assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails))
      const actual = JSON.parse(result.result.value)
      assert.equal(actual.error, undefined)
      assert.equal(actual.width, 1080)
      assert.equal(actual.height, 1920)
      assert.equal(actual.type, 'image/png')
      assert.ok(actual.bytes > 10000)
      assert.ok(actual.texts.includes(details.checkpointName))
      assert.ok(actual.texts.includes(details.eventName))
      assert.ok(actual.texts.includes('#SNCT2026'))
      assert.deepEqual(actual.overflow, [])
      assert.deepEqual(actual.photoPixel, [217, 50, 126, 255])
      if (process.env.STORY_PREVIEW) {
        const screenshot = await command('Page.captureScreenshot', { format: 'png' }, sessionId)
        writeFileSync(process.env.STORY_PREVIEW, Buffer.from(screenshot.data, 'base64'))
      }
    } finally {
      connection?.close()
      const exited = new Promise((resolve) => {
        if (browser.exitCode !== null || browser.signalCode !== null) resolve()
        else browser.once('exit', resolve)
      })
      browser.kill()
      await exited
      rmSync(profile, { recursive: true, force: true })
    }
  }
)
