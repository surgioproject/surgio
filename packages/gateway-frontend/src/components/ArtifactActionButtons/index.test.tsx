import { render } from '@testing-library/react'
import React from 'react'
import { ArtifactConfig } from 'surgio/internal'
import { CATEGORIES } from 'surgio/constant'

import ArtifactActionButtons from './'

describe('<ArtifactActionButtons />', () => {
  test('renders empty component', () => {
    const artifact = generateArtifact()
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons').innerHTML).toBe('')
  })

  test('renders surge button for artifact that has surge in its name', () => {
    const artifact = generateArtifact({
      name: 'Surge.conf',
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 Surge'
    )
  })

  test('renders surge button for artifact that has surge category', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: [CATEGORIES.SURGE],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 Surge'
    )
  })

  test('renders clash button for artifact that has clash in its name', () => {
    const artifact = generateArtifact({
      name: 'Clash.conf',
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 ClashX/CFW'
    )
  })

  test('renders clash button for artifact that has clash category', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: [CATEGORIES.CLASH],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 ClashX/CFW'
    )
  })

  test('renders quanx server remote button', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: [CATEGORIES.QUANTUMULT_X_SERVER],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('quanx-server-remote')).toBeInTheDocument()
  })

  test('renders quanx filter remote button', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: [CATEGORIES.QUANTUMULT_X_FILTER],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('quanx-filter-remote')).toBeInTheDocument()
  })

  test('renders quanx rewrite remote button', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: [CATEGORIES.QUANTUMULT_X_REWRITE],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('quanx-rewrite-remote')).toBeInTheDocument()
  })

  test('renders loon button for artifact that has loon in its name', () => {
    const artifact = generateArtifact({
      name: 'loon.conf',
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 Loon'
    )
  })

  test('renders loon button for artifact that has loon category', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: [CATEGORIES.LOON],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 Loon'
    )
  })

  test('renders surfboard button for artifact that has surfboard in its name', () => {
    const artifact = generateArtifact({
      name: 'surfboard.conf',
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 Surfboard'
    )
  })

  test('renders surfboard button for artifact that has surfboard category', () => {
    const artifact = generateArtifact({
      name: 'test.conf',
      categories: ['Surfboard'],
    })
    const { getByTestId } = render(
      <ArtifactActionButtons artifact={artifact} />
    )

    expect(getByTestId('action-buttons')?.querySelector('a')?.textContent).toBe(
      '添加到 Surfboard'
    )
  })
})

function generateArtifact(partial?: Partial<ArtifactConfig>): ArtifactConfig {
  return {
    name: 'test.conf',
    template: 'test',
    provider: 'test',
    templateType: 'default',
    ...partial,
  }
}
