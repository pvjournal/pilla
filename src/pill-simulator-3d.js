/**
 * PILLA 3D Pill Simulator
 * Parametric Information Layering Logic – Anatemnein
 * 
 * © 1993–2026 Abhishek Choudhary. All rights reserved.
 * 
 * Interactive 3D visualization of parametric pharmaceutical surfaces
 * with recursive geometric encoding demonstration.
 * 
 * Uses Three.js for 3D rendering
 */

class PILLASimulator {
    constructor(canvasElementId) {
        this.container = document.getElementById(canvasElementId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.pill = null;
        this.controls = null;
        
        // Pill parameters
        this.params = {
            // Macroscale (Layer 1: Human Recognition)
            color: 0x3366ff,           // Blue
            topFaceColor: 0x3366ff,
            bottomFaceColor: 0xffffff,
            width: 1.0,
            height: 0.5,
            thickness: 0.8,
            
            // Mesoscale (Layer 2: Clinical)
            topBevelRadius: 0.15,
            bottomBevelRadius: 0.15,
            grooveCount: 2,
            grooveDepth: 0.05,
            grooveWidth: 0.1,
            
            // Microscale (Layer 3: Machine Vision)
            microgridDensity: 0.0,     // 0-1, controls microfacets on top
            facetDensity: 0.3,
            
            // Colors for each layer
            topColor: { r: 0.2, g: 0.4, b: 1.0 },      // Blue
            grooveFloorColor: { r: 1.0, g: 1.0, b: 0.0 }, // Yellow
            leftWallColor: { r: 0.2, g: 0.8, b: 0.2 },   // Green
            rightWallColor: { r: 1.0, g: 0.2, b: 0.2 },  // Red
            
            // Rotation for display
            rotationX: 0.3,
            rotationY: 0.5,
            rotationZ: 0.0,
            
            // Zoom level (recursive decomposition)
            zoomLevel: 0 // 0=macroscale, 1=grooves visible, 2=microfacets
        };
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f7fa);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(2, 1, 2.5);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x667eea, 0.5);
        pointLight.position.set(-3, 2, 3);
        this.scene.add(pointLight);
        
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8eef7,
            metalness: 0.1,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create initial pill
        this.createPill();
        
        // Animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createPill() {
        // Remove old pill if exists
        if (this.pill) {
            this.scene.remove(this.pill);
        }
        
        this.pill = new THREE.Group();
        this.pill.position.set(0, 0, 0);
        this.scene.add(this.pill);
        
        // Create base pill shape (capsule-like)
        const topGeometry = this.createTopFace();
        const bottomGeometry = this.createBottomFace();
        const rimGeometry = this.createRim();
        
        // Top face
        const topMaterial = new THREE.MeshStandardMaterial({
            color: this.rgbToHex(this.params.topColor),
            metalness: 0.3,
            roughness: 0.4
        });
        const topFace = new THREE.Mesh(topGeometry, topMaterial);
        topFace.castShadow = true;
        topFace.receiveShadow = true;
        this.pill.add(topFace);
        
        // Bottom face
        const bottomMaterial = new THREE.MeshStandardMaterial({
            color: this.rgbToHex(this.params.bottomFaceColor),
            metalness: 0.3,
            roughness: 0.4
        });
        const bottomFace = new THREE.Mesh(bottomGeometry, bottomMaterial);
        bottomFace.position.z = -this.params.thickness;
        bottomFace.castShadow = true;
        bottomFace.receiveShadow = true;
        this.pill.add(bottomFace);
        
        // Rim (outer edge)
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: this.rgbToHex(this.params.topColor),
            metalness: 0.2,
            roughness: 0.5
        });
        const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
        rimMesh.castShadow = true;
        rimMesh.receiveShadow = true;
        this.pill.add(rimMesh);
        
        // Add score grooves (Layer 2: Clinical)
        this.addGrooves();
        
        // Add micro-features (Layer 3: Machine Vision)
        if (this.params.zoomLevel >= 1) {
            this.addMicrofacets();
        }
        
        // Bevel edges
        this.addBevels();
    }
    
    createTopFace() {
        // Ellipsoid top surface
        const geometry = new THREE.SphereGeometry(
            this.params.width / 2,
            64,
            32,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
        
        // Flatten to tablet-like shape
        geometry.vertices.forEach(v => {
            v.z = v.z * 0.5; // Flatten the curve
        });
        
        return geometry;
    }
    
    createBottomFace() {
        // Mirror of top face
        const geometry = this.createTopFace();
        geometry.scale(1, 1, -1);
        return geometry;
    }
    
    createRim() {
        // Cylindrical rim connecting top and bottom
        const geometry = new THREE.CylinderGeometry(
            this.params.width / 2,
            this.params.width / 2,
            this.params.thickness,
            64,
            8
        );
        return geometry;
    }
    
    addGrooves() {
        // Score grooves on top face (Layer 2)
        const grooveSpacing = (this.params.width - this.params.grooveWidth * 2) / (this.params.grooveCount + 1);
        
        for (let i = 0; i < this.params.grooveCount; i++) {
            const x = -this.params.width / 2 + grooveSpacing * (i + 1);
            
            // Left wall (Green)
            const leftWallGeo = new THREE.PlaneGeometry(this.params.grooveWidth, this.params.grooveDepth);
            const leftWallMat = new THREE.MeshStandardMaterial({
                color: this.rgbToHex(this.params.leftWallColor),
                metalness: 0.2,
                roughness: 0.6
            });
            const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
            leftWall.position.set(x - this.params.grooveWidth / 2, 0, -this.params.grooveDepth / 2);
            leftWall.rotation.y = Math.PI / 2;
            leftWall.castShadow = true;
            this.pill.add(leftWall);
            
            // Right wall (Red)
            const rightWallMat = new THREE.MeshStandardMaterial({
                color: this.rgbToHex(this.params.rightWallColor),
                metalness: 0.2,
                roughness: 0.6
            });
            const rightWall = new THREE.Mesh(leftWallGeo, rightWallMat);
            rightWall.position.set(x + this.params.grooveWidth / 2, 0, -this.params.grooveDepth / 2);
            rightWall.rotation.y = Math.PI / 2;
            rightWall.castShadow = true;
            this.pill.add(rightWall);
            
            // Floor (Yellow)
            const floorGeo = new THREE.PlaneGeometry(this.params.grooveWidth, this.params.grooveDepth);
            const floorMat = new THREE.MeshStandardMaterial({
                color: this.rgbToHex(this.params.grooveFloorColor),
                metalness: 0.1,
                roughness: 0.7
            });
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.position.set(x, 0, -this.params.grooveDepth);
            floor.castShadow = true;
            this.pill.add(floor);
        }
    }
    
    addMicrofacets() {
        // Layer 3/4: Microscale geometric features
        // Demonstrates recursive zoom to micro/nanoscale
        
        if (this.params.zoomLevel < 2) return;
        
        const facetSize = 0.02;
        const spacing = facetSize * 1.5;
        
        for (let x = -this.params.width / 2; x < this.params.width / 2; x += spacing) {
            for (let y = -this.params.height / 2; y < this.params.height / 2; y += spacing) {
                if (Math.random() < this.params.facetDensity) {
                    const facetGeo = new THREE.BoxGeometry(
                        facetSize * 0.8,
                        facetSize * 0.3,
                        facetSize * 0.6
                    );
                    const facetMat = new THREE.MeshStandardMaterial({
                        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
                        metalness: 0.5,
                        roughness: 0.3
                    });
                    const facet = new THREE.Mesh(facetGeo, facetMat);
                    facet.position.set(x, y, 0.02 + Math.random() * 0.01);
                    facet.castShadow = true;
                    this.pill.add(facet);
                }
            }
        }
    }
    
    addBevels() {
        // Beveled edges (Layer 2 feature)
        const bevelRadius = this.params.topBevelRadius;
        const bevels = [
            { pos: [0, 0, 0], scale: [1, 1, 1] },  // Top
            { pos: [0, 0, -this.params.thickness], scale: [1, 1, -1] } // Bottom
        ];
        
        for (const bevel of bevels) {
            const bevelGeo = new THREE.TorusGeometry(
                this.params.width / 2 - 0.1,
                bevelRadius,
                8,
                64
            );
            const bevelMat = new THREE.MeshStandardMaterial({
                color: this.rgbToHex(this.params.topColor),
                metalness: 0.4,
                roughness: 0.3
            });
            const bevelMesh = new THREE.Mesh(bevelGeo, bevelMat);
            bevelMesh.position.set(...bevel.pos);
            bevelMesh.scale.set(...bevel.scale);
            bevelMesh.castShadow = true;
            this.pill.add(bevelMesh);
        }
    }
    
    rgbToHex(rgb) {
        const r = Math.round(rgb.r * 255);
        const g = Math.round(rgb.g * 255);
        const b = Math.round(rgb.b * 255);
        return (r << 16) | (g << 8) | b;
    }
    
    updatePillColor(color) {
        this.params.color = color;
        this.params.topColor = {
            r: (color >> 16) / 255,
            g: ((color >> 8) & 255) / 255,
            b: (color & 255) / 255
        };
        this.createPill();
    }
    
    updatePillGeometry() {
        this.createPill();
    }
    
    setZoomLevel(level) {
        this.params.zoomLevel = level;
        this.createPill();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.pill) {
            this.pill.rotation.x += 0.001;
            this.pill.rotation.y += 0.002;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PILLASimulator;
}
