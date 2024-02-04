import test from 'ava'

import {
  isSurgeIOS,
  isSurgeMac,
  isClash,
  isClashVerge,
  isStash,
  isQuantumultX,
  isShadowrocket,
  isLoon,
} from '../useragent'

test('isSurgeIOS', (t) => {
  t.is(isSurgeIOS('Surge iOS/2920'), true)
  t.is(isSurgeIOS('Surge iOS/2920', '>=300'), true)
  t.is(isSurgeIOS('Surge iOS/2920 CFNetwork/1335.0.3.2', '>=300'), true)
  t.is(isSurgeIOS('Surge iOS/2920', '>=3000'), false)
  t.is(isSurgeIOS('Surge Mac/2408', '>3000'), false)
  t.is(isSurgeIOS('Surge/1129 CFNetwork/1335.0.3.2 Darwin/21.6.0'), false)
  t.is(isSurgeIOS('Surge iOS', '>=3000'), false)
})

test('isSurgeMac', (t) => {
  t.is(isSurgeMac('Surge Mac/2920'), true)
  t.is(isSurgeMac('Surge Mac/2920', '>=300'), true)
  t.is(isSurgeMac('Surge Mac/2920 CFNetwork/1335.0.3.2', '>=300'), true)
  t.is(isSurgeMac('Surge Mac/2920', '>=3000'), false)
  t.is(isSurgeMac('Surge iOS/2408', '>3000'), false)
  t.is(isSurgeMac('Surge/1129 CFNetwork/1335.0.3.2 Darwin/21.6.0'), false)
})

test('isClash', (t) => {
  t.is(isClash('Surge iOS/2920'), false)
  t.is(isClash('clash'), true)
  t.is(isClash('Clash'), true)
  t.is(isClash('clash-verge/v1.4.11'), true)
  t.is(isClash('Stash/2.4.7 Clash/1.9.0'), true)
  t.is(isClash('Stash/2.4.7 Clash/1.9.0', '>=1.9.0'), true)
  t.is(isClash('Stash/2.4.7 Clash/1.9.0', '>=2.0.0'), false)
})

test('isClashVerge', (t) => {
  t.is(isClashVerge('Surge iOS/2920'), false)
  t.is(isClashVerge('clash'), false)
  t.is(isClashVerge('Clash'), false)
  t.is(isClashVerge('clash-verge/v1.4.11'), true)
  t.is(isClashVerge('clash-verge/v1.4.11', '>=1.4.0'), true)
  t.is(isClashVerge('clash-verge/v1.4.11', '>=1.5.0'), false)
})

test('isStash', (t) => {
  t.is(isStash('Surge iOS/2920'), false)
  t.is(isStash('clash'), false)
  t.is(isStash('Stash/2.4.7 Clash/1.9.0'), true)
  t.is(isStash('Stash/2.4.7 Clash/1.9.0', '>=1.9.0'), true)
  t.is(isStash('Stash/2.4.7 Clash/1.9.0', '>=2.0.0'), true)
  t.is(isStash('Stash/2.4.7 Clash/1.9.0', '>=3.0.0'), false)
})

test('isQuantumultX', (t) => {
  t.is(isQuantumultX('Quantumult%20X/1.4.1 (iPhone15,2; iOS 17.0.3)'), true)
  t.is(
    isQuantumultX('Quantumult%20X/1.4.1 (iPhone15,2; iOS 17.0.3)', '>1.0.0'),
    true,
  )
  t.is(
    isQuantumultX('Quantumult%20X/1.4.1 (iPhone15,2; iOS 17.0.3)', '>2.0.0'),
    false,
  )
  t.is(isQuantumultX('Quantumult/1.0.8 (iPhone15,2; iOS 17.0.3)'), false)
})

test('isShadowrocket', (t) => {
  t.is(isShadowrocket('Shadowrocket/1982 CFNetwork/1474 Darwin/23.0.0'), true)
  t.is(
    isShadowrocket('Shadowrocket/1982 CFNetwork/1474 Darwin/23.0.0', '>=1900'),
    true,
  )
  t.is(
    isShadowrocket('Shadowrocket/1982 CFNetwork/1474 Darwin/23.0.0', '>=2000'),
    false,
  )
  t.is(isShadowrocket('CFNetwork/1474 Darwin/23.0.0'), false)
})

test('isLoon', (t) => {
  t.is(isLoon('Loon/622 CFNetwork/1485 Darwin/23.1.0'), true)
  t.is(isLoon('Loon/622 CFNetwork/1485 Darwin/23.1.0', '>=600'), true)
  t.is(isLoon('Loon/622 CFNetwork/1485 Darwin/23.1.0', '>=700'), false)
  t.is(isLoon('CFNetwork/1485 Darwin/23.1.0', '>=700'), false)
  t.is(isLoon('Loon CFNetwork/1485 Darwin/23.1.0', '>=700'), false)
})
