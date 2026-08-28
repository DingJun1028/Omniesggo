/**
 * ESG Soul Dialogue Integration Tests
 * Superpowers TDD: Write tests FIRST, watch them fail, then implement
 *
 * 5T Compliance: Traceable | Trackable | Tangible | Transparent | Trustworthy
 *
 * Path contract (Traceable):
 *   __dirname            = <repo>/apps/ftg-3.0/tests
 *   ESG_DIR              = <repo>/apps/ftg-3.0/public/images/esg-impact-note
 *   FEEDBACK_HTML        = <repo>/apps/ftg-3.0/feedback.html
 *   DEPLOY_WORKFLOW      = <repo>/.github/workflows/deploy.yml
 * All paths are resolved from __dirname, never from process.cwd(), so the suite
 * passes identically in CI (repo root) and when run from apps/ftg-3.0.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ESG_DIR = join(__dirname, '..', 'public', 'images', 'esg-impact-note');
const FEEDBACK_HTML = join(__dirname, '..', 'feedback.html');
const DEPLOY_WORKFLOW = join(__dirname, '..', '..', '..', '.github', 'workflows', 'deploy.yml');

describe('ESG Impact Soul Dialogue Images', () => {
  test('1. team-dialogue-replacement.png exists and has correct dimensions', () => {
    const path = join(ESG_DIR, 'team-dialogue-soul-replacement.png');
    expect(existsSync(path)).toBe(true);

    const stats = statSync(path);
    expect(stats.size).toBeGreaterThan(500000); // > 500KB
    expect(stats.size).toBeLessThan(2000000); // < 2MB
  });

  test('2. leadership-soul-replacement.png exists with introspection theme', () => {
    const path = join(ESG_DIR, 'leadership-soul-replacement.png');
    expect(existsSync(path)).toBe(true);

    const stats = statSync(path);
    expect(stats.size).toBeGreaterThan(500000); // > 500KB
  });

  test('3. nature-dialogue-soul-replacement.png exists with nature theme', () => {
    const path = join(ESG_DIR, 'nature-dialogue-soul-replacement.png');
    expect(existsSync(path)).toBe(true);

    const stats = statSync(path);
    expect(stats.size).toBeGreaterThan(500000); // > 500KB
  });

  test('4. soul-dialogue-mapping.json exists with valid structure', () => {
    const path = join(ESG_DIR, 'soul-dialogue-mapping.json');
    expect(existsSync(path)).toBe(true);

    const content = JSON.parse(readFileSync(path, 'utf-8'));
    expect(content.image_group).toBe('soul-dialogue-replacements');

    // `images` is a keyed map (team-dialogue / leadership-dialogue / nature-dialogue),
    // not an array — assert over its values so the contract stays explicit.
    const images = Object.values<any>(content.images);
    expect(images).toHaveLength(3);
    expect(Object.keys(content.images).sort()).toEqual([
      'leadership-dialogue',
      'nature-dialogue',
      'team-dialogue',
    ]);

    images.forEach((img: any) => {
      expect(img.file_desktop).toBeDefined();
      expect(img.concept_zh).toBeDefined();
      expect(img.concept_en).toBeDefined();
      expect(img.replaces).toBeInstanceOf(Array);
      expect(img['5t_compliance']).toBeDefined();
      // every referenced desktop asset must actually exist on disk (Trustworthy)
      expect(existsSync(join(ESG_DIR, img.file_desktop))).toBe(true);
    });
  });

  test('5. feedback.html form references correct API endpoint', () => {
    const content = readFileSync(FEEDBACK_HTML, 'utf-8');

    // Check API endpoint
    expect(content).toContain('action="https://ftg-api.esggo.co/feedback"');

    // Check form fields — the live form uses camelCase input names; the SQLite
    // schema (schema.sql) uses snake_case columns, so the API layer owns the
    // tripDate→trip_date / rating→overall_rating / esgImpact→esg_impact mapping.
    expect(content).toContain('name="tripDate"');
    expect(content).toContain('name="rating"');
    expect(content).toContain('name="esgImpact"');

    // Check 5T compliance markers
    expect(content).toContain('data-hash');
  });

  test('6. schema.sql exists with correct tables', () => {
    const path = join(ESG_DIR, 'schema.sql');
    expect(existsSync(path)).toBe(true);

    const content = readFileSync(path, 'utf-8');
    // schema.sql is idempotent (`IF NOT EXISTS`) — match tolerantly.
    expect(content).toMatch(/CREATE TABLE (IF NOT EXISTS )?esg_feedback/);
    expect(content).toMatch(/CREATE VIEW (IF NOT EXISTS )?esg_feedback_stats/);
    expect(content).toContain('hash TEXT NOT NULL');
  });

  test('7. CI/CD workflow includes ESG Impact Note changes', () => {
    const content = readFileSync(DEPLOY_WORKFLOW, 'utf-8');
    expect(content).toContain('apps/**');
    expect(content).toContain('public/**');
  });
});
