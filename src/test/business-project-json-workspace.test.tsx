import { readFileSync } from 'node:fs';

import {
  renderToStaticMarkup,
} from 'react-dom/server';
import {
  describe,
  expect,
  it,
} from 'vitest';

import BusinessWorkspace from '../components/BusinessWorkspace.js';

const workspaceSource =
  readFileSync(
    new URL(
      '../components/BusinessWorkspace.tsx',
      import.meta.url
    ),
    'utf8'
  );

function sourceBetween(
  start: string,
  end: string
): string {
  const startIndex =
    workspaceSource.indexOf(
      start
    );

  const endIndex =
    workspaceSource.indexOf(
      end,
      startIndex
    );

  expect(
    startIndex
  ).toBeGreaterThanOrEqual(0);

  expect(
    endIndex
  ).toBeGreaterThan(
    startIndex
  );

  return workspaceSource.slice(
    startIndex,
    endIndex
  );
}

describe(
  'BusinessWorkspace project JSON integration',
  () => {
    it(
      'renders explicit JSON export and import controls',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(
          html
        ).toContain(
          'Export project JSON'
        );

        expect(
          html
        ).toContain(
          'Import project JSON'
        );

        expect(
          html
        ).toContain(
          '.json,application/json'
        );

        expect(
          html
        ).toContain(
          'Imported projects are'
        );

        expect(
          html
        ).toContain(
          'Save project'
        );
      }
    );

    it(
      'reuses the dedicated JSON contract and browser-action foundations',
      () => {
        expect(
          workspaceSource
        ).toContain(
          "from '../browser/business-project-json-actions.js'"
        );

        expect(
          workspaceSource
        ).toContain(
          "from '../browser/business-project-json.js'"
        );

        expect(
          workspaceSource
        ).toContain(
          'downloadBusinessProjectJson'
        );

        expect(
          workspaceSource
        ).toContain(
          'readBusinessProjectJsonFile'
        );

        expect(
          workspaceSource
        ).toContain(
          'parseBusinessProjectJson'
        );
      }
    );

    it(
      'exports only through the explicit project action instead of optimization submit',
      () => {
        const exportSource =
          sourceBetween(
            'const exportCurrentProject',
            'const importProjectJson'
          );

        expect(
          exportSource
        ).toContain(
          'downloadBusinessProjectJson('
        );

        const submitSource =
          sourceBetween(
            'const submit',
            'const itemLabels'
          );

        expect(
          submitSource
        ).not.toContain(
          'downloadBusinessProjectJson('
        );
      }
    );

    it(
      'requires a usable project name before attempting JSON export',
      () => {
        const exportSource =
          sourceBetween(
            'const exportCurrentProject',
            'const importProjectJson'
          );

        expect(
          exportSource
        ).toMatch(
          /trimmedName === ''[\s\S]*Enter a project name before exporting\./
        );

        expect(
          exportSource.indexOf(
            'Enter a project name before exporting.'
          )
        ).toBeLessThan(
          exportSource.indexOf(
            'downloadBusinessProjectJson('
          )
        );
      }
    );

    it(
      'builds export data from the complete current Business project snapshot',
      () => {
        const exportSource =
          sourceBetween(
            'const exportCurrentProject',
            'const importProjectJson'
          );

        expect(
          exportSource
        ).toContain(
          'businessProjectInputFromWorkspace('
        );

        expect(
          exportSource
        ).toContain(
          'products'
        );

        expect(
          exportSource
        ).toContain(
          'cartons'
        );

        expect(
          exportSource
        ).toContain(
          'objective'
        );

        expect(
          exportSource
        ).toContain(
          'createRecentBusinessProject('
        );

        expect(
          exportSource
        ).toContain(
          'downloadBusinessProjectJson('
        );
      }
    );

    it(
      'promotes the generated project identity only after a successful download',
      () => {
        const exportSource =
          sourceBetween(
            'const exportCurrentProject',
            'const importProjectJson'
          );

        expect(
          exportSource
        ).toMatch(
          /projectId \?\?[\s\S]*nextBusinessProjectId\(\s*recentProjects\s*\)/
        );

        expect(
          exportSource
        ).toMatch(
          /if \(!downloaded\)[\s\S]*Could not export this project from this browser\.[\s\S]*return;/
        );

        expect(
          exportSource.indexOf(
            'if (!downloaded)'
          )
        ).toBeLessThan(
          exportSource.indexOf(
            'setProjectId('
          )
        );

        expect(
          exportSource
        ).toContain(
          'Project JSON downloaded.'
        );
      }
    );

    it(
      'reads the selected file before delegating JSON validation to the parser',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).toContain(
          'readBusinessProjectJsonFile('
        );

        expect(
          importSource
        ).toContain(
          'parseBusinessProjectJson('
        );

        expect(
          importSource.indexOf(
            'readBusinessProjectJsonFile('
          )
        ).toBeLessThan(
          importSource.indexOf(
            'parseBusinessProjectJson('
          )
        );

        expect(
          importSource
        ).not.toContain(
          'JSON.parse('
        );
      }
    );

    it(
      'handles file-read failure before attempting project parsing',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).toMatch(
          /if \(!readResult\.ok\)[\s\S]*Could not read this project file\.[\s\S]*return;/
        );

        expect(
          importSource.indexOf(
            'Could not read this project file.'
          )
        ).toBeLessThan(
          importSource.indexOf(
            'parseBusinessProjectJson('
          )
        );
      }
    );

    it(
      'surfaces safe parser errors instead of accepting malformed project JSON',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).toMatch(
          /if \(!parsed\.ok\)[\s\S]*Could not import project: \$\{parsed\.error\.message\}[\s\S]*return;/
        );
      }
    );

    it(
      'restores the imported project snapshot and clears stale result state',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).toContain(
          'setProjectId('
        );

        expect(
          importSource
        ).toContain(
          'setProjectName('
        );

        expect(
          importSource
        ).toContain(
          'setProducts('
        );

        expect(
          importSource
        ).toContain(
          'cloneBusinessProduct'
        );

        expect(
          importSource
        ).toContain(
          'setCartons('
        );

        expect(
          importSource
        ).toContain(
          'cloneBusinessCarton'
        );

        expect(
          importSource
        ).toContain(
          'setObjective('
        );

        expect(
          importSource
        ).toContain(
          'setPlan(null)'
        );

        expect(
          importSource
        ).toContain(
          'setInventoryUsage(null)'
        );

        expect(
          importSource
        ).toContain(
          'setError(null)'
        );

        expect(
          importSource
        ).toContain(
          'Project imported. Save project to keep it in this browser.'
        );
      }
    );

    it(
      'does not automatically persist an imported project or change recent-project history',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).not.toContain(
          'saveRecentBusinessProject('
        );

        expect(
          importSource
        ).not.toContain(
          'setRecentProjects('
        );

        expect(
          importSource
        ).not.toContain(
          'orderRecentBusinessProjects('
        );
      }
    );

    it(
      'keeps imported project state separate from global objective and handling preferences',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).not.toContain(
          'writeBusinessObjectivePreference'
        );

        expect(
          importSource
        ).not.toContain(
          'writeBusinessHandlingPreference'
        );
      }
    );

    it(
      'resets the file input so the same backup can be selected again',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).toContain(
          "input.value = '';"
        );

        expect(
          importSource.indexOf(
            "input.value = '';"
          )
        ).toBeLessThan(
          importSource.indexOf(
            'await readBusinessProjectJsonFile('
          )
        );
      }
    );

    it(
      'keeps browser mechanics and later persistence phases outside the workspace component',
      () => {
        expect(
          workspaceSource
        ).not.toContain(
          'new Blob('
        );

        expect(
          workspaceSource
        ).not.toContain(
          'createObjectURL('
        );

        expect(
          workspaceSource
        ).not.toContain(
          'FileReader'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'JSON.parse('
        );

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
          'saved-product-catalog'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'csv'
        );
      }
    );
  }
);
