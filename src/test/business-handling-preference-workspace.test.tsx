import { readFileSync } from 'node:fs';

import {
  renderToStaticMarkup,
} from 'react-dom/server';
import {
  describe,
  expect,
  it,
} from 'vitest';

import BusinessWorkspace, {
  BUSINESS_HANDLING_OPTIONS,
  type BusinessHandlingPolicy,
  type BusinessProductValues,
} from '../components/BusinessWorkspace.js';

const workspaceSource =
  readFileSync(
    new URL(
      '../components/BusinessWorkspace.tsx',
      import.meta.url
    ),
    'utf8'
  );

function product(
  rotationPolicy:
    BusinessHandlingPolicy
): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Display product',
    sku: 'SKU-001',
    lengthMm: 100,
    widthMm: 60,
    heightMm: 40,
    quantity: 1,
    unitWeightG: undefined,
    rotationPolicy,
  };
}

describe(
  'BusinessWorkspace handling preference integration',
  () => {
    it(
      'keeps Any rotation as the server-rendered default before browser preferences load',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(html).toMatch(
          /aria-pressed="true"[^>]*>Any rotation<\/button>/
        );
      }
    );

    it(
      'preserves explicit initial product handling for deterministic rendering',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace
              initialProducts={[
                product('fixed'),
              ]}
            />
          );

        expect(html).toMatch(
          /aria-pressed="true"[^>]*>Fixed orientation<\/button>/
        );
      }
    );

    it(
      'keeps the supported Business handling set unchanged',
      () => {
        expect(
          BUSINESS_HANDLING_OPTIONS.map(
            option => option.policy
          )
        ).toEqual([
          'any',
          'upright',
          'fixed',
        ]);
      }
    );

    it(
      'reuses the dedicated Business handling preference module',
      () => {
        expect(
          workspaceSource
        ).toContain(
          "from '../browser/business-handling-preference.js'"
        );

        expect(
          workspaceSource
        ).toContain(
          'readBusinessHandlingPreference'
        );

        expect(
          workspaceSource
        ).toContain(
          'writeBusinessHandlingPreference'
        );
      }
    );

    it(
      'keeps Any rotation as the in-memory handling default before browser preference loading',
      () => {
        expect(
          workspaceSource
        ).toMatch(
          /useState<BusinessHandlingPolicy>\(\s*'any'\s*\)/
        );
      }
    );

    it(
      'loads a saved handling default while leaving explicit initial products untouched',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'readBusinessHandlingPreference();'
        );

        expect(
          workspaceSource
        ).toMatch(
          /savedHandling ===\s*undefined[\s\S]*setHandlingPreference\(\s*savedHandling\s*\)/
        );

        const explicitGuard =
          workspaceSource.indexOf(
            'initialProducts !=='
          );

        const defaultProductUpdate =
          workspaceSource.indexOf(
            'setProducts(current =>',
            explicitGuard
          );

        expect(
          explicitGuard
        ).toBeGreaterThan(-1);

        expect(
          defaultProductUpdate
        ).toBeGreaterThan(
          explicitGuard
        );
      }
    );

    it(
      'applies a loaded preference only to the default product instead of rewriting every product',
      () => {
        expect(
          workspaceSource
        ).toMatch(
          /current\.map\(\s*\(product, index\) =>\s*index === 0[\s\S]*rotationPolicy:\s*savedHandling[\s\S]*: product/
        );
      }
    );

    it(
      'updates only the selected product and persists that handling as the future default',
      () => {
        const chooseStart =
          workspaceSource.indexOf(
            'const chooseHandling'
          );

        const chooseEnd =
          workspaceSource.indexOf(
            'const updateCarton',
            chooseStart
          );

        const chooseSource =
          workspaceSource.slice(
            chooseStart,
            chooseEnd
          );

        expect(
          chooseSource
        ).toContain(
          'updateProduct('
        );

        expect(
          chooseSource
        ).toMatch(
          /rotationPolicy:\s*nextHandling/
        );

        expect(
          chooseSource
        ).toContain(
          'setHandlingPreference('
        );

        expect(
          chooseSource
        ).toContain(
          'writeBusinessHandlingPreference('
        );

        expect(
          chooseSource
        ).not.toContain(
          'current.map('
        );
      }
    );

    it(
      'updates in-memory handling state before attempting browser persistence',
      () => {
        const chooseStart =
          workspaceSource.indexOf(
            'const chooseHandling'
          );

        const chooseEnd =
          workspaceSource.indexOf(
            'const updateCarton',
            chooseStart
          );

        const chooseSource =
          workspaceSource.slice(
            chooseStart,
            chooseEnd
          );

        expect(
          chooseSource.indexOf(
            'updateProduct('
          )
        ).toBeLessThan(
          chooseSource.indexOf(
            'writeBusinessHandlingPreference('
          )
        );

        expect(
          chooseSource.indexOf(
            'setHandlingPreference('
          )
        ).toBeLessThan(
          chooseSource.indexOf(
            'writeBusinessHandlingPreference('
          )
        );
      }
    );

    it(
      'uses the current preferred handling default for newly added products',
      () => {
        const addStart =
          workspaceSource.indexOf(
            'const addProduct'
          );

        const addEnd =
          workspaceSource.indexOf(
            'const removeProduct',
            addStart
          );

        const addSource =
          workspaceSource.slice(
            addStart,
            addEnd
          );

        expect(
          addSource
        ).toMatch(
          /rotationPolicy:\s*handlingPreference/
        );
      }
    );

    it(
      'keeps storage mechanics and unsupported later handling semantics out of BusinessWorkspace',
      () => {
        expect(
          workspaceSource
        ).not.toContain(
          'window.localStorage'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'packmetry.business.handling'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'vertical-axis-only'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'saved-product-catalog'
        );
      }
    );
  }
);
