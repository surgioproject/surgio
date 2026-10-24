import React from 'react'
import { render } from '@testing-library/react'
import { SnackbarProvider } from 'notistack'
import { ArtifactConfig } from 'surgio/internal'

import ArtifactCard from './'

describe('<ArtifactCard />', () => {
  test('renders component', () => {
    const artifact = generateArtifact()
    const { queryByText, getAllByTestId, getByTestId } = render(
      <SnackbarProvider>
        <ArtifactCard artifact={artifact} />
      </SnackbarProvider>
    )

    expect(getByTestId('download-button')).toBeInTheDocument()
    expect(getByTestId('download-button')).toHaveAttribute(
      'href',
      'http://localhost/get-artifact/test.conf?dl=1'
    )
    expect(getByTestId('preview-button')).toBeInTheDocument()
    expect(getByTestId('preview-button')).toHaveAttribute(
      'href',
      'http://localhost/get-artifact/test.conf'
    )

    expect(getAllByTestId('display-provider-item').length).toBe(1)
    expect(getAllByTestId('display-provider-item')[0].textContent).toBe('test')

    expect(queryByText('分类')).toBeNull()
  })

  test('displays multiple providers', () => {
    const artifact = generateArtifact({
      combineProviders: ['test2', 'test3'],
    })
    const { getAllByTestId } = render(
      <SnackbarProvider>
        <ArtifactCard artifact={artifact} />
      </SnackbarProvider>
    )

    expect(getAllByTestId('display-provider-item').length).toBe(3)
    expect(getAllByTestId('display-provider-item')[0].textContent).toBe('test')
    expect(getAllByTestId('display-provider-item')[1].textContent).toBe('test2')
    expect(getAllByTestId('display-provider-item')[2].textContent).toBe('test3')
  })

  test('displays categories', () => {
    const artifact = generateArtifact({
      categories: ['test1', 'test2'],
    })
    const { getAllByTestId } = render(
      <SnackbarProvider>
        <ArtifactCard artifact={artifact} />
      </SnackbarProvider>
    )

    expect(getAllByTestId('display-category-item').length).toBe(2)
    expect(getAllByTestId('display-category-item')[0].textContent).toBe('test1')
    expect(getAllByTestId('display-category-item')[1].textContent).toBe('test2')
  })

  test('embed artifact', () => {
    const artifact = generateArtifact()
    const { queryByTestId } = render(
      <SnackbarProvider>
        <ArtifactCard artifact={artifact} isEmbed={true} />
      </SnackbarProvider>
    )

    expect(queryByTestId('expand-extra-button')).toBeNull()
    expect(queryByTestId('collapse-area')).toBeNull()
  })

  test('artifact params', () => {
    const artifact = generateArtifact()
    const params = new URLSearchParams('?foo=1&bar=2')
    const { getByTestId } = render(
      <SnackbarProvider>
        <ArtifactCard
          artifact={artifact}
          isEmbed={true}
          artifactParams={params}
        />
      </SnackbarProvider>
    )

    expect(getByTestId('download-button')).toHaveAttribute(
      'href',
      'http://localhost/get-artifact/test.conf?dl=1&foo=1&bar=2'
    )
    expect(getByTestId('preview-button')).toHaveAttribute(
      'href',
      'http://localhost/get-artifact/test.conf?foo=1&bar=2'
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
