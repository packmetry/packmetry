import { readFileSync } from 'node:fs';

import { renderToStaticMarkup } from 'react-dom/server';
import {
  describe,
  expect,
  it,
} from 'vitest';

import BusinessWorkspace, {
  BUSINESS_OBJECTIVE_OPTIONS,
} from '../components/BusinessWorkspace.js';

const workspaceSource =
  readFileSync(
    new URL(
      '../components/BusinessWorkspace.tsx',
      import.meta.url
    ),
    'utf8'
  );

describe(
  'BusinessWorkspace objective preference integration',
  () => {
    it(
      'keeps Balanced as the server-rendered default before browser preferences load',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(html).toMatch(
          /aria-pressed="true"[^>]*>Balanced<\/button>/
        );
      }
    );

    it(
      'preserves an explicit initial objective for deterministic rendering',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace
              initialObjective="fewest-cartons"
            />
          );

        expect(html).toMatch(
          /aria-pressed="true"[^>]*>Fewest boxes<\/button>/
        );
      }
    );

    it(
      'keeps the supported Business objective set unchanged',
      () => {
        expect(
          BUSINESS_OBJECTIVE_OPTIONS.map(
            option => option.kind
          )
        ).toEqual([
          'balanced',
          'fewest-cartons',
          'least-wasted-volume',
        ]);
      }
    );

    it(
      'reuses the dedicated Business objective preference module',
      () => {
        expect(
          workspaceSource
        ).toContain(
          "from '../browser/business-objective-preference.js'"
        );

        expect(
          workspaceSource
        ).toContain(
          'readBusinessObjectivePreference'
        );

        expect(
          workspaceSource
        ).toContain(
          'writeBusinessObjectivePreference'
        );
      }
    );

    it(
      'uses the explicit initial objective before the default Balanced fallback',
      () => {
        expect(
          workspaceSource
        ).toMatch(
          /useState<BusinessObjectiveKind>\(\s*initialObjective \?\?\s*'balanced'\s*\)/
        );
      }
    );

    it(
      'does not let a persisted preference override an explicit initialObjective prop',
      () => {
        expect(
          workspaceSource
        ).toMatch(
          /if \(\s*initialObjective !==\s*undefined\s*\) \{\s*return;\s*\}/
        );

        const guardIndex =
          workspaceSource.indexOf(
            'initialObjective !=='
          );

        const readIndex =
          workspaceSource.indexOf(
            'readBusinessObjectivePreference();'
          );

        expect(
          guardIndex
        ).toBeGreaterThan(-1);

        expect(
          readIndex
        ).toBeGreaterThan(
          guardIndex
        );
      }
    );

    it(
      'loads a valid saved objective on mount when no explicit initial objective is supplied',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'readBusinessObjectivePreference();'
        );

        expect(
          workspaceSource
        ).toMatch(
          /savedObjective !==\s*undefined[\s\S]*setObjective\(\s*savedObjective\s*\)/
        );
      }
    );

    it(
      'persists an objective selected by the user',
      () => {
        expect(
          workspaceSource
        ).toMatch(
          /const chooseObjective[\s\S]*writeBusinessObjectivePreference\(\s*nextObjective\s*\)/
        );
      }
    );

    it(
      'updates in-memory objective state before attempting browser persistence',
      () => {
        const chooseStart =
          workspaceSource.indexOf(
            'const chooseObjective'
          );

        const chooseEnd =
          workspaceSource.indexOf(
            'const submit',
            chooseStart
          );

        const chooseSource =
          workspaceSource.slice(
            chooseStart,
            chooseEnd
          );

        expect(
          chooseSource.indexOf(
            'setObjective('
          )
        ).toBeLessThan(
          chooseSource.indexOf(
            'writeBusinessObjectivePreference('
          )
        );
      }
    );

    it(
      'does not duplicate browser storage mechanics inside BusinessWorkspace',
      () => {
        expect(
          workspaceSource
        ).not.toContain(
          'window.localStorage'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'indexedDB'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'packmetry.business.objective'
        );
      }
    );

    it(
      'keeps objective-preference integration separate from later persistence slices',
      () => {
        expect(
          workspaceSource
        ).not.toContain(
          'business-project'
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
