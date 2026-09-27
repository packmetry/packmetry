import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import type { PackedCarton } from '../core/domain/packed-carton.js';
import type { PackingPlan } from '../core/domain/packing-plan.js';

export interface PackingVisualizationProps {
  plan: PackingPlan;
}

export interface VisualizationItem {
  key: string;
  itemId: string;
  instanceIndex: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
}

export interface VisualizationModel {
  cartonId: string;
  cartonName?: string;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  items: VisualizationItem[];
}

const VIEW_HEIGHT = 340;

const ITEM_COLORS = [
  0x3569c8,
  0x3f8b69,
  0xb95a52,
  0x7867b8,
  0xc8753d,
  0x3f8792,
  0xb18b37,
  0x5968a8,
] as const;

export function buildVisualizationModel(
  packedCarton: PackedCarton
): VisualizationModel {
  const carton = packedCarton.carton;
  const cartonLength = carton.internalDimensions.length;
  const cartonWidth = carton.internalDimensions.width;
  const cartonHeight = carton.internalDimensions.height;

  return {
    cartonId: carton.id,
    ...(carton.name ? { cartonName: carton.name } : {}),
    sizeX: cartonLength,
    sizeY: cartonHeight,
    sizeZ: cartonWidth,
    items: packedCarton.placements.map(placement => ({
      key: `${placement.itemId}-${placement.instanceIndex}`,
      itemId: placement.itemId,
      instanceIndex: placement.instanceIndex,
      centerX:
        placement.x +
        placement.length / 2 -
        cartonLength / 2,
      centerY:
        placement.z +
        placement.height / 2 -
        cartonHeight / 2,
      centerZ:
        placement.y +
        placement.width / 2 -
        cartonWidth / 2,
      sizeX: placement.length,
      sizeY: placement.height,
      sizeZ: placement.width,
    })),
  };
}

function disposeMaterial(material: THREE.Material): void {
  material.dispose();
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse(object => {
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.LineSegments
    ) {
      object.geometry.dispose();

      if (Array.isArray(object.material)) {
        object.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(object.material);
      }
    }
  });
}

function cartonLabel(
  packedCarton: PackedCarton,
  index: number
): string {
  const name = packedCarton.carton.name;
  return name ? `Box ${index + 1} — ${name}` : `Box ${index + 1}`;
}

export default function PackingVisualization({
  plan,
}: PackingVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCartonIndex, setSelectedCartonIndex] =
    useState(0);
  const [renderError, setRenderError] = useState<string | null>(
    null
  );

  const safeCartonIndex =
    plan.cartons.length === 0
      ? 0
      : Math.min(selectedCartonIndex, plan.cartons.length - 1);

  const packedCarton = plan.cartons[safeCartonIndex];

  const model = useMemo(
    () =>
      packedCarton
        ? buildVisualizationModel(packedCarton)
        : null,
    [packedCarton]
  );

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount || !model) {
      return;
    }

    setRenderError(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let scene: THREE.Scene | null = null;
    let handleResize: (() => void) | null = null;

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f9fa);

      const initialWidth = Math.max(
        280,
        Math.floor(mount.clientWidth || 620)
      );

      const maxDimension = Math.max(
        model.sizeX,
        model.sizeY,
        model.sizeZ
      );

      const camera = new THREE.PerspectiveCamera(
        38,
        initialWidth / VIEW_HEIGHT,
        0.1,
        maxDimension * 40
      );

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
      );
      renderer.setSize(initialWidth, VIEW_HEIGHT, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = `${VIEW_HEIGHT}px`;
      renderer.domElement.setAttribute(
        'aria-label',
        'Interactive 3D packing visualization'
      );

      mount.replaceChildren(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 1.5));

      const keyLight = new THREE.DirectionalLight(
        0xffffff,
        2.05
      );
      keyLight.position.set(
        model.sizeX,
        model.sizeY * 1.5,
        model.sizeZ * 1.2
      );
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(
        0xd8e5ef,
        0.95
      );
      fillLight.position.set(
        -model.sizeX,
        model.sizeY,
        -model.sizeZ
      );
      scene.add(fillLight);

      const cartonGeometry = new THREE.BoxGeometry(
        model.sizeX,
        model.sizeY,
        model.sizeZ
      );
      const cartonEdges = new THREE.EdgesGeometry(cartonGeometry);
      cartonGeometry.dispose();

      const cartonLines = new THREE.LineSegments(
        cartonEdges,
        new THREE.LineBasicMaterial({
          color: 0x17212b,
          transparent: true,
          opacity: 0.72,
        })
      );
      scene.add(cartonLines);

      model.items.forEach((item, index) => {
        const geometry = new THREE.BoxGeometry(
          item.sizeX,
          item.sizeY,
          item.sizeZ
        );

        const color =
          ITEM_COLORS[index % ITEM_COLORS.length];

        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.72,
          metalness: 0.01,
          transparent: true,
          opacity: 0.84,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          item.centerX,
          item.centerY,
          item.centerZ
        );
        mesh.userData = {
          itemId: item.itemId,
          instanceIndex: item.instanceIndex,
        };
        scene?.add(mesh);

        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edges = new THREE.LineSegments(
          edgeGeometry,
          new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.72,
          })
        );
        edges.position.copy(mesh.position);
        scene?.add(edges);
      });

      const maxHorizontal = Math.max(
        model.sizeX,
        model.sizeZ
      );
      const grid = new THREE.GridHelper(
        maxHorizontal * 1.55,
        10,
        0xcfd8df,
        0xe5eaee
      );
      grid.position.y = -model.sizeY / 2;
      scene.add(grid);

      camera.position.set(
        maxDimension * 1.45,
        maxDimension * 1.15,
        maxDimension * 1.55
      );
      camera.lookAt(0, 0, 0);

      controls = new OrbitControls(
        camera,
        renderer.domElement
      );
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 0, 0);
      controls.minDistance = maxDimension * 0.75;
      controls.maxDistance = maxDimension * 5;
      controls.update();

      handleResize = () => {
        if (!renderer || !mount) {
          return;
        }

        const width = Math.max(
          280,
          Math.floor(mount.clientWidth || 620)
        );

        camera.aspect = width / VIEW_HEIGHT;
        camera.updateProjectionMatrix();
        renderer.setSize(width, VIEW_HEIGHT, false);
      };

      window.addEventListener('resize', handleResize);

      renderer.setAnimationLoop(() => {
        controls?.update();
        renderer?.render(scene as THREE.Scene, camera);
      });
    } catch (error) {
      setRenderError(
        error instanceof Error
          ? error.message
          : 'Unable to initialize the 3D visualization.'
      );
    }

    return () => {
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }

      renderer?.setAnimationLoop(null);
      controls?.dispose();

      if (scene) {
        disposeScene(scene);
      }

      renderer?.dispose();
      mount.replaceChildren();
    };
  }, [model]);

  if (plan.cartons.length === 0) {
    return (
      <section
        aria-labelledby="packing-visualization-heading"
        className="pm-viz pm-viz-empty"
      >
        <p className="pm-section-kicker">3D packing view</p>
        <h3 id="packing-visualization-heading">
          No packed box to visualize.
        </h3>
        <p>
          A 3D view will appear when the verified plan contains at
          least one packed box.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="packing-visualization-heading"
      className="pm-viz"
    >
      <div className="pm-viz-header">
        <div>
          <p className="pm-section-kicker">3D packing view</p>
          <h3 id="packing-visualization-heading">
            {cartonLabel(
              plan.cartons[safeCartonIndex]!,
              safeCartonIndex
            )}
          </h3>
          <p className="pm-viz-instruction">
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {plan.cartons.length > 1 && (
          <div
            className="pm-viz-selector"
            aria-label="Choose box to visualize"
          >
            {plan.cartons.map((carton, index) => (
              <button
                key={`${carton.carton.id}-${index}`}
                type="button"
                onClick={() => setSelectedCartonIndex(index)}
                aria-pressed={safeCartonIndex === index}
              >
                Box {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {renderError && (
        <div role="alert" className="pm-viz-error">
          3D view unavailable: {renderError}
        </div>
      )}

      <div
        ref={mountRef}
        data-testid="packing-visualization-canvas"
        className="pm-viz-canvas"
      />

      <p className="pm-viz-caption">
        The wireframe is the inside of the box. Colored blocks are
        the verified item placements.
      </p>
    </section>
  );
}
