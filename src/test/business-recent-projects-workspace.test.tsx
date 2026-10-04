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
  type BusinessDimensionalWeightValues,
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
    externalLengthMm: 410,
    externalWidthMm: 310,
    externalHeightMm: 210,
    quantityAvailable: 15,
    maxGrossWeightG: 12_000,
    emptyBoxWeightG: 350,
    costPerBox: 1.75,
  };
}

function dimensionalWeight():
  BusinessDimensionalWeightValues {
  return {
    divisorValue: 5000,
    lengthUnit: 'cm',
    massUnit: 'kg',
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
      dimensionalWeight:
        dimensionalWeight(),
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
          'Export project JSON'
        );

        expect(html).toContain(
          'Import project JSON'
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
      'builds a complete project snapshot from current Business workspace state including DIM settings',
      () => {
        const products = [
          product(),
        ];

        const cartons = [
          carton(),
        ];

        const dimValues =
          dimensionalWeight();

        const input =
          businessProjectInputFromWorkspace(
            'business-project-1',
            'October orders',
            products,
            cartons,
            'least-wasted-volume',
            dimValues
          );

        expect(input).toEqual({
          id: 'business-project-1',
          name: 'October orders',
          products,
          cartons,
          objective:
            'least-wasted-volume',
          dimensionalWeight: {
            divisorValue: 5000,
            lengthUnit: 'cm',
            massUnit: 'kg',
          },
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

        expect(
          input.dimensionalWeight
        ).not.toBe(
          dimValues
        );
      }
    );

    it(
      'preserves a blank DIM divisor in a project snapshot without inventing a carrier default',
      () => {
        const input =
          businessProjectInputFromWorkspace(
            'business-project-blank-dim',
            'Blank DIM project',
            [
              product(),
            ],
            [
              carton(),
            ],
            'balanced',
            {
              divisorValue:
                undefined,
              lengthUnit: 'in',
              massUnit: 'lb',
            }
          );

        expect(
          input.dimensionalWeight
        ).toEqual({
          divisorValue:
            undefined,
          lengthUnit: 'in',
          massUnit: 'lb',
        });
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
      'includes current DIM settings when saving a project',
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
          /businessProjectInputFromWorkspace\([\s\S]*objective,[\s\S]*dimensionalWeightValues[\s\S]*\)/
        );

        expect(
          saveSource
        ).toContain(
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
      'opens a recent project only through an explicit action and restores its workspace snapshot including DIM settings',
      () => {
        const openStart =
          workspaceSource.indexOf(
            'const openRecentProject'
          );

        const openEnd =
          workspaceSource.indexOf(
            'const exportCurrentProject',
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
          'setDimensionalWeightValues('
        );

        expect(
          openSource
        ).toContain(
          'project.dimensionalWeight ??'
        );

        expect(
          openSource
        ).toContain(
          'DEFAULT_BUSINESS_DIMENSIONAL_WEIGHT'
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
      'exports the current DIM settings as part of the Business project snapshot',
      () => {
        const exportStart =
          workspaceSource.indexOf(
            'const exportCurrentProject'
          );

        const exportEnd =
          workspaceSource.indexOf(
            'const importProjectJson',
            exportStart
          );

        const exportSource =
          workspaceSource.slice(
            exportStart,
            exportEnd
          );

        expect(
          exportSource
        ).toMatch(
          /businessProjectInputFromWorkspace\([\s\S]*objective,[\s\S]*dimensionalWeightValues[\s\S]*\)/
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
      'restores imported DIM settings and safely falls back for older projects without them',
      () => {
        const importStart =
          workspaceSource.indexOf(
            'const importProjectJson'
          );

        const importEnd =
          workspaceSource.indexOf(
            'const updateDimensionalWeight',
            importStart
          );

        const importSource =
          workspaceSource.slice(
            importStart,
            importEnd
          );

        expect(
          importSource
        ).toContain(
          'setDimensionalWeightValues('
        );

        expect(
          importSource
        ).toContain(
          'importedProject.dimensionalWeight ??'
        );

        expect(
          importSource
        ).toContain(
          'DEFAULT_BUSINESS_DIMENSIONAL_WEIGHT'
        );

        expect(
          importSource
        ).toContain(
          'Project imported. Save project to keep it in this browser.'
        );
      }
    );

    it(
      'keeps project restore separate from global preferences and direct storage access',
      () => {
        const openStart =
          workspaceSource.indexOf(
            'const openRecentProject'
          );

        const openEnd =
          workspaceSource.indexOf(
            'const exportCurrentProject',
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