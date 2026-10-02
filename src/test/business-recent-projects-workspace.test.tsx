import { readFileSync } from 'node:fs';

import {
  renderToStaticMarkup,
} from 'react-dom/server';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createRecentBusinessProject,
  type RecentBusinessProject,
} from '../browser/business-recent-projects.js';
import BusinessWorkspace, {
  BusinessRecentProjects,
  businessProjectInputFromWorkspace,
  type BusinessCartonValues,
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

function product(): BusinessProductValues {
  return {
    id: 'business-product-1',
    name: 'Ceramic mug',
    sku: 'MUG-001',
    lengthMm: 80,
    widthMm: 80,
    heightMm: 80,
    quantity: 12,
    unitWeightG: 500,
    rotationPolicy: 'upright',
  };
}

function carton(): BusinessCartonValues {
  return {
    id: 'business-carton-1',
    libraryId: 'saved-carton-1',
    name: 'Medium mailer',
    cartonCode: 'BX-M',
    lengthMm: 400,
    widthMm: 300,
    heightMm: 200,
    quantityAvailable: 15,
    maxGrossWeightG: 12_000,
    emptyBoxWeightG: 350,
    costPerBox: 1.75,
  };
}

function recentProject(): RecentBusinessProject {
  return createRecentBusinessProject(
    {
      id: 'business-project-1',
      name: 'October orders',
      products: [
        product(),
      ],
      cartons: [
        carton(),
      ],
      objective:
        'fewest-cartons',
    },
    123
  );
}

describe(
  'BusinessWorkspace recent project integration',
  () => {
    it(
      'renders explicit project controls and browser-only recent-project copy',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessWorkspace />
          );

        expect(html).toContain(
          'Project name'
        );

        expect(html).toContain(
          'Save project'
        );

        expect(html).toContain(
          'Recent projects'
        );

        expect(html).toContain(
          'Your recent projects stay in this browser.'
        );

        expect(html).toContain(
          'No recent projects yet.'
        );
      }
    );

    it(
      'renders a recent project with summary counts and an explicit open action',
      () => {
        const html =
          renderToStaticMarkup(
            <BusinessRecentProjects
              projects={[
                recentProject(),
              ]}
              message={null}
              onOpen={() => {}}
            />
          );

        expect(html).toContain(
          'October orders'
        );

        expect(html).toContain(
          '1 product'
        );

        expect(html).toContain(
          '1 carton'
        );

        expect(html).toContain(
          'Open project'
        );
      }
    );

    it(
      'builds a complete project snapshot from current Business workspace state',
      () => {
        const products = [
          product(),
        ];
        const cartons = [
          carton(),
        ];

        const input =
          businessProjectInputFromWorkspace(
            'business-project-1',
            'October orders',
            products,
            cartons,
            'least-wasted-volume'
          );

        expect(input).toEqual({
          id: 'business-project-1',
          name: 'October orders',
          products,
          cartons,
          objective:
            'least-wasted-volume',
        });

        expect(
          input.products
        ).not.toBe(
          products
        );

        expect(
          input.cartons
        ).not.toBe(
          cartons
        );

        expect(
          input.products[0]
        ).not.toBe(
          products[0]
        );

        expect(
          input.cartons[0]
        ).not.toBe(
          cartons[0]
        );
      }
    );

    it(
      'reuses the dedicated Business recent-project persistence module',
      () => {
        expect(
          workspaceSource
        ).toContain(
          "from '../browser/business-recent-projects.js'"
        );

        expect(
          workspaceSource
        ).toContain(
          'listRecentBusinessProjects'
        );

        expect(
          workspaceSource
        ).toContain(
          'saveRecentBusinessProject'
        );

        expect(
          workspaceSource
        ).toContain(
          'createRecentBusinessProject'
        );

        expect(
          workspaceSource
        ).toContain(
          'orderRecentBusinessProjects'
        );
      }
    );

    it(
      'loads recent-project history on mount without replacing the current workspace',
      () => {
        expect(
          workspaceSource
        ).toContain(
          'listRecentBusinessProjects()'
        );

        expect(
          workspaceSource
        ).toContain(
          'setRecentProjects('
        );

        expect(
          workspaceSource
        ).not.toContain(
          'setProducts(loadedProjects'
        );

        expect(
          workspaceSource
        ).not.toContain(
          'setCartons(loadedProjects'
        );
      }
    );

    it(
      'saves projects only through the explicit project action instead of optimization submission',
      () => {
        const saveStart =
          workspaceSource.indexOf(
            'const saveCurrentProject'
          );

        const saveEnd =
          workspaceSource.indexOf(
            'const openRecentProject',
            saveStart
          );

        const saveSource =
          workspaceSource.slice(
            saveStart,
            saveEnd
          );

        expect(
          saveSource
        ).toContain(
          'saveRecentBusinessProject('
        );

        const submitStart =
          workspaceSource.indexOf(
            'const submit'
          );

        const submitEnd =
          workspaceSource.indexOf(
            'const itemLabels',
            submitStart
          );

        const submitSource =
          workspaceSource.slice(
            submitStart,
            submitEnd
          );

        expect(
          submitSource
        ).not.toContain(
          'saveRecentBusinessProject('
        );
      }
    );

    it(
      'requires a project name before attempting browser persistence',
      () => {
        const saveStart =
          workspaceSource.indexOf(
            'const saveCurrentProject'
          );

        const saveEnd =
          workspaceSource.indexOf(
            'const openRecentProject',
            saveStart
          );

        const saveSource =
          workspaceSource.slice(
            saveStart,
            saveEnd
          );

        expect(
          saveSource
        ).toMatch(
          /trimmedName === ''[\s\S]*Enter a project name before saving\./
        );

        expect(
          saveSource.indexOf(
            'Enter a project name before saving.'
          )
        ).toBeLessThan(
          saveSource.indexOf(
            'saveRecentBusinessProject('
          )
        );
      }
    );

    it(
      'allocates a project identity once and reuses it when the same workspace is saved again',
      () => {
        const saveStart =
          workspaceSource.indexOf(
            'const saveCurrentProject'
          );

        const saveEnd =
          workspaceSource.indexOf(
            'const openRecentProject',
            saveStart
          );

        const saveSource =
          workspaceSource.slice(
            saveStart,
            saveEnd
          );

        expect(
          saveSource
        ).toMatch(
          /projectId \?\?[\s\S]*nextBusinessProjectId\(\s*recentProjects\s*\)/
        );

        expect(
          saveSource
        ).toMatch(
          /setProjectId\(\s*nextProjectId\s*\)/
        );
      }
    );

    it(
      'updates the in-memory recent list only after persistence succeeds',
      () => {
        const saveStart =
          workspaceSource.indexOf(
            'const saveCurrentProject'
          );

        const saveEnd =
          workspaceSource.indexOf(
            'const openRecentProject',
            saveStart
          );

        const saveSource =
          workspaceSource.slice(
            saveStart,
            saveEnd
          );

        expect(
          saveSource
        ).toContain(
          'createRecentBusinessProject('
        );

        expect(
          saveSource
        ).toContain(
          'orderRecentBusinessProjects('
        );

        expect(
          saveSource
        ).toContain(
          'Project saved in this browser.'
        );

        expect(
          saveSource.indexOf(
            'if (!saved)'
          )
        ).toBeLessThan(
          saveSource.indexOf(
            'setRecentProjects('
          )
        );
      }
    );

    it(
      'reports browser persistence failure without changing the project into a saved state',
      () => {
        const saveStart =
          workspaceSource.indexOf(
            'const saveCurrentProject'
          );

        const saveEnd =
          workspaceSource.indexOf(
            'const openRecentProject',
            saveStart
          );

        const saveSource =
          workspaceSource.slice(
            saveStart,
            saveEnd
          );

        expect(
          saveSource
        ).toMatch(
          /if \(!saved\)[\s\S]*Could not save this project in this browser\.[\s\S]*return;/
        );

        expect(
          saveSource.indexOf(
            'Could not save this project in this browser.'
          )
        ).toBeLessThan(
          saveSource.indexOf(
            'setProjectId('
          )
        );
      }
    );

    it(
      'opens a recent project only through an explicit action and restores its workspace snapshot',
      () => {
        const openStart =
          workspaceSource.indexOf(
            'const openRecentProject'
          );

        const openEnd =
          workspaceSource.indexOf(
            'const chooseObjective',
            openStart
          );

        const openSource =
          workspaceSource.slice(
            openStart,
            openEnd
          );

        expect(
          openSource
        ).toContain(
          'setProjectId('
        );

        expect(
          openSource
        ).toContain(
          'setProjectName('
        );

        expect(
          openSource
        ).toContain(
          'setProducts('
        );

        expect(
          openSource
        ).toContain(
          'setCartons('
        );

        expect(
          openSource
        ).toContain(
          'setObjective('
        );

        expect(
          openSource
        ).toContain(
          'setPlan(null)'
        );

        expect(
          openSource
        ).toContain(
          'setInventoryUsage(null)'
        );

        expect(
          openSource
        ).toContain(
          'setError(null)'
        );

        expect(
          openSource
        ).toContain(
          'Project opened.'
        );
      }
    );

    it(
      'keeps project restore separate from global preferences and later persistence slices',
      () => {
        const openStart =
          workspaceSource.indexOf(
            'const openRecentProject'
          );

        const openEnd =
          workspaceSource.indexOf(
            'const chooseObjective',
            openStart
          );

        const openSource =
          workspaceSource.slice(
            openStart,
            openEnd
          );

        expect(
          openSource
        ).not.toContain(
          'writeBusinessObjectivePreference'
        );

        expect(
          openSource
        ).not.toContain(
          'writeBusinessHandlingPreference'
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
      }
    );
  }
);
