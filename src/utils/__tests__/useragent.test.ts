import { expect, test } from 'vitest'

import {
  isSurgeIOS,
  isSurgeMac,
  isClash,
  isClashVerge,
  isClashMetaForAndroid,
  isStash,
  isQuantumultX,
  isShadowrocket,
  isLoon,
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
