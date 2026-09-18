import test from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber } from '../src/format.ts'

test('uses the same short-scale suffixes throughout the game', () => {
  assert.equal(formatNumber(999), '999')
  assert.equal(formatNumber(1_000), '1K')
  assert.equal(formatNumber(12_300), '12.3K')
  assert.equal(formatNumber(1_250_000), '1.25M')
  assert.equal(formatNumber(2_000_000_000), '2B')
  assert.equal(formatNumber(23_000_000_000_000), '23T')
  assert.equal(formatNumber(1_000_000_000_000_000), '1Qa')
  assert.equal(formatNumber(1_000_000_000_000_000_000), '1Qi')
})

test('keeps signs and falls back to scientific notation past the named scale', () => {
  assert.equal(formatNumber(-1_500_000), '-1.5M')
  assert.match(formatNumber(1e66), /^1\.00e66$/)
})
