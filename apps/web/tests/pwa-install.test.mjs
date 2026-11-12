import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canOfferInstall,
  installPromptMode,
  mobileInstallPlatform,
} from '../src/lib/pwa-install.mjs'

test('detecta celulares Android, iPhone e iPadOS sem classificar desktop comum', () => {
  assert.equal(
    mobileInstallPlatform({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Mobile)',
      maxTouchPoints: 5,
      viewportWidth: 412,
    }),
    'android'
  )
  assert.equal(
    mobileInstallPlatform({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
      maxTouchPoints: 5,
      viewportWidth: 390,
    }),
    'ios'
  )
  assert.equal(
    mobileInstallPlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      maxTouchPoints: 5,
      viewportWidth: 1024,
    }),
    'ios'
  )
  assert.equal(
    mobileInstallPlatform({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      maxTouchPoints: 0,
      viewportWidth: 1366,
    }),
    null
  )
})

test('oferece instalação apenas na entrada ou passaporte e respeita instalação e dispensa', () => {
  const base = { platform: 'android', installed: false, dismissed: false }
  assert.equal(canOfferInstall({ ...base, pathname: '/' }), true)
  assert.equal(canOfferInstall({ ...base, pathname: '/passaporte/snct-2026' }), true)
  assert.equal(canOfferInstall({ ...base, pathname: '/c/checkpoint' }), false)
  assert.equal(canOfferInstall({ ...base, pathname: '/privacidade' }), false)
  assert.equal(canOfferInstall({ ...base, pathname: '/', installed: true }), false)
  assert.equal(canOfferInstall({ ...base, pathname: '/', dismissed: true }), false)
})

test('prioriza o instalador nativo e só libera instrução de menu após a espera', () => {
  assert.equal(installPromptMode('android', false, false), null)
  assert.equal(installPromptMode('android', false, true), 'browser-menu')
  assert.equal(installPromptMode('android', true, false), 'native')
  assert.equal(installPromptMode('android', true, true), 'native')
  assert.equal(installPromptMode('ios', false, false), 'ios')
})
