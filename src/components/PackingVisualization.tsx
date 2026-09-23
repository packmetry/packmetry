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

const VIEW_HEIGHT = 360;

const ITEM_COLORS = [
  0x2563eb,
  0x16a34a,
  0xdc2626,
  0x9333ea,
  0xea580c,
  0x0891b2,
  0xca8a04,
  0x4f46e5,
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
      scene.background = new THREE.Color(0xf8fafc);

      const initialWidth = Math.max(
        280,
        Math.floor(mount.clientWidth || 520)
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

      scene.add(new THREE.AmbientLight(0xffffff, 1.55));

      const keyLight = new THREE.DirectionalLight(
        0xffffff,
        2.2
      );
      keyLight.position.set(
        model.sizeX,
        model.sizeY * 1.5,
        model.sizeZ * 1.2
      );
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(
        0xdbeafe,
        1.1
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
          color: 0x18181b,
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
          roughness: 0.66,
          metalness: 0.02,
          transparent: true,
          opacity: 0.82,
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
            opacity: 0.75,
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
        0xd4d4d8,
        0xe4e4e7
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
          Math.floor(mount.clientWidth || 520)
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
        style={styles.card}
      >
        <p style={styles.eyebrow}>3D packing view</p>
        <h3
          id="packing-visualization-heading"
          style={styles.heading}
        >
          No packed box to visualize.
        </h3>
        <p style={styles.description}>
          A 3D view will appear when the verified plan contains at
          least one packed box.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="packing-visualization-heading"
      style={styles.card}
    >
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>3D packing view</p>
          <h3
            id="packing-visualization-heading"
            style={styles.heading}
          >
            {cartonLabel(
              plan.cartons[safeCartonIndex]!,
              safeCartonIndex
            )}
          </h3>
          <p style={styles.description}>
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {plan.cartons.length > 1 && (
          <div
            style={styles.selector}
            aria-label="Choose box to visualize"
          >
            {plan.cartons.map((carton, index) => (
              <button
                key={`${carton.carton.id}-${index}`}
                type="button"
                onClick={() => setSelectedCartonIndex(index)}
                aria-pressed={safeCartonIndex === index}
                style={{
                  ...styles.selectorButton,
                  ...(safeCartonIndex === index
                    ? styles.selectorButtonActive
                    : {}),
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {renderError && (
        <div role="alert" style={styles.error}>
          3D view unavailable: {renderError}
        </div>
      )}

      <div
        ref={mountRef}
        data-testid="packing-visualization-canvas"
        style={styles.canvas}
      />

      <p style={styles.caption}>
        The wireframe is the inside of the box. Colored blocks are
        the verified item placements.
      </p>
    </section>
  );
}

const styles = {
  card: {
    marginTop: '24px',
    borderTop: '1px solid #e4e4e7',
    paddingTop: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '12px',
  },
  eyebrow: {
    margin: '0 0 5px',
    color: '#71717a',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  heading: {
    margin: 0,
    color: '#18181b',
    fontSize: '16px',
    lineHeight: 1.3,
  },
  description: {
    margin: '5px 0 0',
    color: '#71717a',
    fontSize: '12px',
  },
  selector: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-end',
    gap: '6px',
  },
  selectorButton: {
    minWidth: '32px',
    height: '32px',
    border: '1px solid #d4d4d8',
    borderRadius: '8px',
    padding: '0 9px',
    background: '#ffffff',
    color: '#3f3f46',
    font: 'inherit',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  selectorButtonActive: {
    borderColor: '#18181b',
    background: '#18181b',
    color: '#ffffff',
  },
  canvas: {
    width: '100%',
    minHeight: `${VIEW_HEIGHT}px`,
    overflow: 'hidden',
    border: '1px solid #e4e4e7',
    borderRadius: '12px',
    background: '#f8fafc',
  },
  caption: {
    margin: '9px 0 0',
    color: '#71717a',
    fontSize: '11px',
    lineHeight: 1.45,
  },
  error: {
    marginBottom: '10px',
    borderRadius: '10px',
    padding: '10px 12px',
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: '12px',
    lineHeight: 1.45,
  },
} as const;
