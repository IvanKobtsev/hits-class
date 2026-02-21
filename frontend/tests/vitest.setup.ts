import i18next from 'i18next';
import en from '../public/dictionaries/translation.en.json';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { initializeLocalization } from 'application/localization/localization';
import { defaultNS } from 'application/localization/locales';
import { cleanup, configure } from '@testing-library/react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(jestDomMatchers as any);

// The project uses data-test-id (with hyphen) instead of the default data-testid
configure({ testIdAttribute: 'data-test-id' });

afterEach(() => {
  cleanup();
});

beforeAll(async () => {
  await initializeLocalization();

  await i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { [defaultNS]: en },
    },
    interpolation: {
      escapeValue: false,
    },
  });
});

afterAll(() => {
  // run some teardown code once after all tests
});
