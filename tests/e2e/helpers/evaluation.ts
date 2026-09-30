import { expect, type Locator, type Page } from '@playwright/test'

const getVisibleDrawer = (page: Page): Locator =>
  page.locator('[data-testid="evaluation-panel-drawer"]:visible').last()

export async function clickEvaluateButtonWithin(container: Locator): Promise<void> {
  let lastError: unknown = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const button = container.getByTestId('focus-analyze-main')
    await expect(button).toBeVisible({ timeout: 15000 })
    await expect(button).toBeEnabled({ timeout: 15000 })

    try {
      await button.click({ timeout: 15000 })
      return
    } catch (error) {
      lastError = error
      await container.page().waitForTimeout(500)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export async function getScoreBadgeValue(
  container: Locator,
  type: 'result' | 'compare',
): Promise<number> {
  const badge = container.getByTestId(`score-badge-${type}`)
  await expect(badge).toBeVisible({ timeout: 90000 })
  await expect(badge).not.toHaveClass(/loading/, { timeout: 60000 })

  const scoreValue = badge.getByTestId('score-value')
  await expect(scoreValue).toBeVisible({ timeout: 10000 })

  const text = (await scoreValue.textContent())?.trim() || '0'
  const score = Number.parseInt(text, 10)

  expect(score).toBeGreaterThan(0)
  expect(score).toBeLessThanOrEqual(100)

  return score
}

export async function openEvaluationDrawerFromBadge(badge: Locator): Promise<Locator> {
  const page = badge.page()
  const existingDrawer = getVisibleDrawer(page)

  if ((await existingDrawer.count()) > 0) {
    await expect(existingDrawer).toBeVisible({ timeout: 15000 })
    return existingDrawer
  }

  await expect(badge).toBeVisible({ timeout: 15000 })

  let lastError: unknown = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await badge.click({ force: attempt > 0 })

    const drawer = getVisibleDrawer(page)
    if ((await drawer.count()) > 0) {
      await expect(drawer).toBeVisible({ timeout: 15000 })
      return drawer
    }

    const viewDetailsButton = page.getByTestId('evaluation-hover-view-details')
    await expect(viewDetailsButton).toBeVisible({ timeout: 15000 })

    try {
      await viewDetailsButton.click({ timeout: 15000, force: attempt > 0 })
    } catch (error) {
      lastError = error
      await page.waitForTimeout(400)
      continue
    }

    const openedDrawer = getVisibleDrawer(page)
    if ((await openedDrawer.count()) > 0) {
      await expect(openedDrawer).toBeVisible({ timeout: 15000 })
      return openedDrawer
    }

    await page.waitForTimeout(400)
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to open evaluation drawer from badge')
}

export async function openEvaluationDrawerFromHoverCard(page: Page): Promise<Locator> {
  const existingDrawer = getVisibleDrawer(page)

  if ((await existingDrawer.count()) > 0) {
    await expect(existingDrawer).toBeVisible({ timeout: 15000 })
    return existingDrawer
  }

  let lastError: unknown = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const viewDetailsButton = page.getByTestId('evaluation-hover-view-details')
    await expect(viewDetailsButton).toBeVisible({ timeout: 15000 })

    try {
      await viewDetailsButton.click({ timeout: 15000, force: attempt > 0 })
    } catch (error) {
      lastError = error
      await page.waitForTimeout(400)
      continue
    }

    const drawer = getVisibleDrawer(page)
    if ((await drawer.count()) > 0) {
      await expect(drawer).toBeVisible({ timeout: 15000 })
      return drawer
    }

    await page.waitForTimeout(400)
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to open evaluation drawer from hover card')
}

export async function closeEvaluationDrawer(drawer: Locator): Promise<void> {
  const closeButton = drawer.locator('.n-base-close').first()
  await expect(closeButton).toBeVisible({ timeout: 10000 })
  await closeButton.click()
  await expect(drawer).toBeHidden({ timeout: 10000 })
}

export async function expectStructuredCompareDrawer(drawer: Locator): Promise<void> {
  await expect(drawer.getByTestId('evaluation-panel-compare-decision')).toBeVisible({
    timeout: 15000,
  })

  const compareContext = drawer.getByTestId('evaluation-panel-compare-context')
  const compareMetadata = drawer.getByTestId('evaluation-panel-compare-metadata')
  await expect(compareContext.or(compareMetadata)).toBeVisible({
    timeout: 15000,
  })

  await expect(
    drawer.getByTestId('evaluation-panel-compare-context-roles')
      .or(drawer.getByTestId('evaluation-panel-compare-metadata-roles'))
  ).toBeVisible({
    timeout: 15000,
  })

  await expect(drawer.getByTestId('evaluation-panel-rewrite-from-evaluation')).toBeVisible({
    timeout: 15000,
  })
}

export async function expectPromptVersionTagVisible(
  page: Page,
  version: number,
): Promise<void> {
  await expect(page.getByTestId(`prompt-panel-version-tag-v${version}`)).toBeVisible({
    timeout: 120000,
  })
}
