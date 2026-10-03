import { readFileSync } from 'node:fs';

import {
  describe,
  expect,
  it,
} from 'vitest';

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
  'Business recent-project identity readiness',
  () => {
    it(
      'tracks recent-project history readiness separately from the loaded project list',
      () => {
        expect(
          workspaceSource
        ).toMatch(
          /recentProjectsLoaded,[\s\S]*setRecentProjectsLoaded,[\s\S]*useState\(false\)/
        );
      }
    );

    it(
      'marks project history ready only after the loaded history is applied',
      () => {
        const loadSource =
          sourceBetween(
            'void listRecentBusinessProjects()',
            'const [plan, setPlan]'
          );

        expect(
          loadSource
        ).toContain(
          'setRecentProjects('
        );

        expect(
          loadSource
        ).toContain(
          'setRecentProjectsLoaded('
        );

        expect(
          loadSource.indexOf(
            'setRecentProjects('
          )
        ).toBeLessThan(
          loadSource.indexOf(
            'setRecentProjectsLoaded('
          )
        );

        expect(
          loadSource
        ).toMatch(
          /setRecentProjectsLoaded\(\s*true\s*\)/
        );
      }
    );

    it(
      'blocks a new unsaved project save until recent-project history is ready',
      () => {
        const saveSource =
          sourceBetween(
            'const saveCurrentProject',
            'const openRecentProject'
          );

        expect(
          saveSource
        ).toMatch(
          /projectId === null &&[\s\S]*!recentProjectsLoaded/
        );

        expect(
          saveSource
        ).toContain(
          'Recent projects are still loading. Try again in a moment.'
        );

        expect(
          saveSource.indexOf(
            '!recentProjectsLoaded'
          )
        ).toBeLessThan(
          saveSource.indexOf(
            'nextBusinessProjectId('
          )
        );

        expect(
          saveSource.indexOf(
            '!recentProjectsLoaded'
          )
        ).toBeLessThan(
          saveSource.indexOf(
            'saveRecentBusinessProject('
          )
        );
      }
    );

    it(
      'blocks new-project export identity allocation until history is ready',
      () => {
        const exportSource =
          sourceBetween(
            'const exportCurrentProject',
            'const importProjectJson'
          );

        expect(
          exportSource
        ).toMatch(
          /projectId === null &&[\s\S]*!recentProjectsLoaded/
        );

        expect(
          exportSource
        ).toContain(
          'Recent projects are still loading. Try again in a moment.'
        );

        expect(
          exportSource.indexOf(
            '!recentProjectsLoaded'
          )
        ).toBeLessThan(
          exportSource.indexOf(
            'nextBusinessProjectId('
          )
        );

        expect(
          exportSource.indexOf(
            '!recentProjectsLoaded'
          )
        ).toBeLessThan(
          exportSource.indexOf(
            'downloadBusinessProjectJson('
          )
        );
      }
    );

    it(
      'preserves the existing project identity path while history is still loading',
      () => {
        const saveSource =
          sourceBetween(
            'const saveCurrentProject',
            'const openRecentProject'
          );

        const exportSource =
          sourceBetween(
            'const exportCurrentProject',
            'const importProjectJson'
          );

        expect(
          saveSource
        ).toMatch(
          /if \(\s*projectId === null &&\s*!recentProjectsLoaded\s*\)/
        );

        expect(
          exportSource
        ).toMatch(
          /if \(\s*projectId === null &&\s*!recentProjectsLoaded\s*\)/
        );

        expect(
          saveSource
        ).toMatch(
          /projectId \?\?[\s\S]*nextBusinessProjectId\(\s*recentProjects\s*\)/
        );

        expect(
          exportSource
        ).toMatch(
          /projectId \?\?[\s\S]*nextBusinessProjectId\(\s*recentProjects\s*\)/
        );
      }
    );

    it(
      'keeps imported project identity intact instead of allocating a replacement id',
      () => {
        const importSource =
          sourceBetween(
            'const importProjectJson',
            'const chooseObjective'
          );

        expect(
          importSource
        ).toMatch(
          /setProjectId\(\s*importedProject\.id\s*\)/
        );

        expect(
          importSource
        ).not.toContain(
          'nextBusinessProjectId('
        );
      }
    );

    it(
      'keeps opened recent-project identity intact instead of allocating a replacement id',
      () => {
        const openSource =
          sourceBetween(
            'const openRecentProject',
            'const exportCurrentProject'
          );

        expect(
          openSource
        ).toMatch(
          /setProjectId\(\s*project\.id\s*\)/
        );

        expect(
          openSource
        ).not.toContain(
          'nextBusinessProjectId('
        );
      }
    );

    it(
      'does not replace the existing deterministic business-project-N identity policy',
      () => {
        const allocatorSource =
          sourceBetween(
            'function nextBusinessProjectId',
            'function optionalNumber'
          );

        expect(
          allocatorSource
        ).toContain(
          '`business-project-${index}`'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'crypto.randomUUID'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'Math.random('
        );
      }
    );
  }
);
