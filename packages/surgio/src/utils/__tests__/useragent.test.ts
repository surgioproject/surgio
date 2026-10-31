import { expect, test } from 'vitest'

import {
  isSurgeIOS,
  isSurgeMac,
  isClash,
  isClashVerge,
  isClashMetaForAndroid,
  isFlClash,
  isStash,
  isQuantumultX,
  isShadowrocket,
  isLoon,
  isEgern,
} from '../useragent.js'

test('isSurgeIOS', () => {
  expect(isSurgeIOS('Surge iOS/2920')).toBe(true)
  expect(isSurgeIOS('Surge iOS/2920', '>=300')).toBe(true)
  expect(isSurgeIOS('Surge iOS/2920 CFNetwork/1335.0.3.2', '>=300')).toBe(true)
  expect(isSurgeIOS('Surge iOS/2920', '>=3000')).toBe(false)
  expect(isSurgeIOS('Surge Mac/2408', '>3000')).toBe(false)
  expect(isSurgeIOS('Surge/1129 CFNetwork/1335.0.3.2 Darwin/21.6.0')).toBe(
    false,
  )
  expect(isSurgeIOS('Surge iOS', '>=3000')).toBe(false)
})

test('isSurgeMac', () => {
  expect(isSurgeMac('Surge Mac/2920')).toBe(true)
  expect(isSurgeMac('Surge Mac/2920', '>=300')).toBe(true)
  expect(isSurgeMac('Surge Mac/2920 CFNetwork/1335.0.3.2', '>=300')).toBe(true)
  expect(isSurgeMac('Surge Mac/2920', '>=3000')).toBe(false)
  expect(isSurgeMac('Surge iOS/2408', '>3000')).toBe(false)
  expect(isSurgeMac('Surge/1129 CFNetwork/1335.0.3.2 Darwin/21.6.0')).toBe(
    false,
  )
})

test('isClash', () => {
  expect(isClash('Surge iOS/2920')).toBe(false)
  expect(isClash('clash')).toBe(true)
  expect(isClash('Clash')).toBe(true)
  expect(isClash('clash-verge/v1.4.11')).toBe(true)
  expect(isClash('Stash/2.4.7 Clash/1.9.0')).toBe(true)
  expect(isClash('Stash/2.4.7 Clash/1.9.0', '>=1.9.0')).toBe(true)
  expect(isClash('Stash/2.4.7 Clash/1.9.0', '>=2.0.0')).toBe(false)
})

test('isClashVerge', () => {
  expect(isClashVerge('Surge iOS/2920')).toBe(false)
  expect(isClashVerge('clash')).toBe(false)
  expect(isClashVerge('Clash')).toBe(false)
  expect(isClashVerge('clash-verge/v1.4.11')).toBe(true)
  expect(isClashVerge('clash-verge/v1.4.11', '>=1.4.0')).toBe(true)
  expect(isClashVerge('clash-verge/v1.4.11', '>=1.5.0')).toBe(false)
  expect(isClashVerge('clash-verge')).toBe(true)
  expect(isClashVerge('clash-verge', '>=1.0.0')).toBe(false)
  expect(isClashVerge('FlClash/v0.9.2 clash-verge Platform/android')).toBe(true)
  expect(isClashVerge('clash-verger/v1.4.11')).toBe(false)
})

test('isFlClash', () => {
  const ua = 'FlClash/v0.9.2 clash-verge Platform/android'
  expect(isFlClash(ua)).toBe(true)
  expect(isFlClash(ua, '>=0.9.0')).toBe(true)
  expect(isFlClash(ua, '>=1.0.0')).toBe(false)
  expect(isFlClash('clash/v0.9.2 clash-verge Platform/windows')).toBe(true)
  expect(isFlClash('fl_clash/v0.9.2 clash-verge Platform/linux')).toBe(true)
  expect(
    isFlClash('FlClash/v0.8.40 clash-verge/v1.6.6 Platform/macos', '>=0.8.0'),
  ).toBe(true)
  expect(isFlClash('clash-verge/v1.4.11')).toBe(false)
  expect(isFlClash('ClashMetaForAndroid/2.8.8.Meta')).toBe(false)
  expect(isFlClash(undefined)).toBe(false)
})

test('isStash', () => {
  expect(isStash('Surge iOS/2920')).toBe(false)
  expect(isStash('clash')).toBe(false)
  expect(isStash('Stash/2.4.7 Clash/1.9.0')).toBe(true)
  expect(isStash('Stash/2.4.7 Clash/1.9.0', '>=1.9.0')).toBe(true)
  expect(isStash('Stash/2.4.7 Clash/1.9.0', '>=2.0.0')).toBe(true)
  expect(isStash('Stash/2.4.7 Clash/1.9.0', '>=3.0.0')).toBe(false)
})

test('isClashMetaForAndroid', () => {
  expect(isClashMetaForAndroid('ClashMetaForAndroid/2.8.8.Meta-Alpha')).toBe(
    true,
  )
  expect(
    isClashMetaForAndroid('ClashMetaForAndroid/2.8.8.Meta-Alpha', '>=2.8.0'),
  ).toBe(true)
  expect(
    isClashMetaForAndroid('ClashMetaForAndroid/2.8.8.Meta-Alpha', '>=3.0.0'),
  ).toBe(false)
  expect(isClashMetaForAndroid('ClashMetaForAndroid/2.18.8.Meta')).toBe(true)
  expect(
    isClashMetaForAndroid('ClashMetaForAndroid/2.18.8.Meta', '>=2.8.0'),
  ).toBe(true)
  expect(
    isClashMetaForAndroid('ClashMetaForAndroid/2.18.8.Meta', '>=3.0.0'),
  ).toBe(false)
  expect(isClashMetaForAndroid('clash')).toBe(false)
  expect(isClashMetaForAndroid('Stash/2.4.7 Clash/1.9.0')).toBe(false)
})

test('isQuantumultX', () => {
  expect(isQuantumultX('Quantumult%20X/1.4.1 (iPhone15,2; iOS 17.0.3)')).toBe(
    true,
  )
  expect(
    isQuantumultX('Quantumult%20X/1.4.1 (iPhone15,2; iOS 17.0.3)', '>1.0.0'),
  ).toBe(true)
  expect(
    isQuantumultX('Quantumult%20X/1.4.1 (iPhone15,2; iOS 17.0.3)', '>2.0.0'),
  ).toBe(false)
  expect(isQuantumultX('Quantumult/1.0.8 (iPhone15,2; iOS 17.0.3)')).toBe(false)
})

test('isShadowrocket', () => {
  expect(isShadowrocket('Shadowrocket/1982 CFNetwork/1474 Darwin/23.0.0')).toBe(
    true,
  )
  expect(
    isShadowrocket('Shadowrocket/1982 CFNetwork/1474 Darwin/23.0.0', '>=1900'),
  ).toBe(true)
  expect(
    isShadowrocket('Shadowrocket/1982 CFNetwork/1474 Darwin/23.0.0', '>=2000'),
  ).toBe(false)
  expect(isShadowrocket('CFNetwork/1474 Darwin/23.0.0')).toBe(false)
})

test('isLoon', () => {
  expect(isLoon('Loon/622 CFNetwork/1485 Darwin/23.1.0')).toBe(true)
  expect(isLoon('Loon/622 CFNetwork/1485 Darwin/23.1.0', '>=600')).toBe(true)
  expect(isLoon('Loon/622 CFNetwork/1485 Darwin/23.1.0', '>=700')).toBe(false)
  expect(isLoon('CFNetwork/1485 Darwin/23.1.0', '>=700')).toBe(false)
  expect(isLoon('Loon CFNetwork/1485 Darwin/23.1.0', '>=700')).toBe(false)
})

test('isEgern', () => {
  const ua = 'egern/2.20.0 (iOS 27.2; Build/783)'
  expect(isEgern(ua)).toBe(true)
  expect(isEgern(ua, '>=2.20')).toBe(true)
  expect(isEgern(ua, '>=2.21')).toBe(false)
  expect(isEgern('Egern/2.20.0 (iOS 27.2; Build/783)', '>=2')).toBe(true)
  expect(isEgern('CFNetwork/1568 Darwin/24.0.0')).toBe(false)
  expect(isEgern('egern (iOS 27.2)', '>=1')).toBe(false)
  expect(isEgern(undefined)).toBe(false)
})
