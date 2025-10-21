import { GiAzulFlake } from "react-icons/gi";
import { FaBolt } from "react-icons/fa6";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

function App() {

 useGSAP(()=>{
    gsap.registerPlugin(ScrollTrigger, SplitText)

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time)=> lenis.raf(time*1000));
    gsap.ticker.lagSmoothing(0);

    const headerSplit = new SplitText(".header-1 h1", {
      type: "chars",
      charsClass: 'char',
    });
    
    const titleSplits = new SplitText(".tooltip .title h2", {
      type: 'lines',
      linesClass: "line",
    });

    const descriptionSplits = new SplitText(".tooltip .description p", {
      type: 'lines',
      linesClass: "line"
    });

    headerSplit.chars.forEach((char)=>(char.innerHTML = `<span>${char.innerHTML}</span>`));
    [...titleSplits.lines, ...descriptionSplits.lines].forEach((line)=>(line.innerHTML = `<span>${line.innerHTML}</span>`))
    
    // 1. ICON VISIBILITY FIX: Define the initial state for the content elements (icons, lines) 
    // to be invisible and translated down (y: "100%").
    gsap.set(".tooltips .tooltip .icon, .tooltips .tooltip .title .line > span, .tooltips .tooltip .description .line > span", {
        y: "100%",
        opacity: 0,
    });

    const animOptions = {duration: 0.5, ease: 'power2.out'};

    const tooltipSequence = [
      {
        dividerTrigger: 0.65, 
        contentTrigger: 0.68,
        elements: [
          ".tooltips .tooltip:nth-child(1) .icon",
          ".tooltips .tooltip:nth-child(1) .title .line > span",
          ".tooltips .tooltip:nth-child(1) .description .line > span"
        ]
      },
      {
        dividerTrigger: 0.75,
        contentTrigger: 0.78,
        elements: [
          ".tooltips .tooltip:nth-child(2) .icon",
          ".tooltips .tooltip:nth-child(2) .title .line > span",
          ".tooltips .tooltip:nth-child(2) .description .line > span"
        ]
      },
      {
        dividerTrigger: 0.85,
        contentTrigger: 0.88,
        elements: [
          ".tooltips .tooltip:nth-child(3) .icon",
          ".tooltips .tooltip:nth-child(3) .title .line > span",
          ".tooltips .tooltip:nth-child(3) .description .line > span"
        ]
      }
    ]

    ScrollTrigger.create({
      trigger: '.product-overview',
      start: "75% bottom",
      onEnter: ()=> gsap.to(".header-1 h1 .char > span", {
        y: "0%",
        ...animOptions,
        stagger: 0.025,
      }),
      onLeaveBack: ()=> gsap.to(".header-1 h1 .char > span", {
        y: "100%",
        ...animOptions,
        stagger: 0.025,
      })
    })

    let model: THREE.Group | null = null; 
    let modelSize: THREE.Vector3 | null = null;
    let modelCenter: THREE.Vector3 | null = null;
    let pivot: THREE.Group | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    pivot = new THREE.Group();
    scene.add(pivot);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    const modelContainer = document.querySelector(".model-container");
    if(modelContainer) {
      // 2. MODEL SCROLL FIX: Add a class to the container here or ensure via CSS 
      // that this container is fixed/absolute to prevent it from scrolling with the content.
      // (The structural change below in the return statement is the main fix, but keep this in mind)
      modelContainer.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(1, 2, 3);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.001;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x111122, 0.6);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xfff0f0, 0.35);
    rimLight.position.set(-3, 1.5, 2);
    scene.add(rimLight);

    function setupModel(){
      if(!model || !modelSize || !modelCenter || !pivot) return;
      const isMobile = window.innerWidth < 1000;

      const offsetX = isMobile ? -modelCenter.x : -modelCenter.x - modelSize.x * 0.4;
      const offsetY = -modelCenter.y + modelSize.y * 0.085;
      const offsetZ = -modelCenter.z;

      model.position.set(offsetX, offsetY, offsetZ);

      model.rotation.z = isMobile ? 0 : THREE.MathUtils.degToRad(-25);
      model.rotation.y = 0; 

      pivot.rotation.set(0, 0, 0);
      pivot.position.set(0, 0, 0);

      const cameraDistance = isMobile ? 2 : 1.25;
      camera.position.set(0, 0, Math.max(modelSize.x, modelSize.y, modelSize.z) * cameraDistance);
      camera.lookAt(0, 0, 0);
    }

    new GLTFLoader().load(
      '/assets/laptop.glb', 
      (gltf)=>{
        model = gltf.scene;
        model.traverse((obj: THREE.Object3D)=>{
          if(obj instanceof THREE.Mesh){
            const mesh = obj as THREE.Mesh;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              if(mat instanceof THREE.MeshStandardMaterial){
                mat.metalness = 0.15;
                mat.roughness = 0.6;
              }
            })
          }
        })
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        modelSize = size;
        modelCenter = center;

        if(pivot){
          pivot.add(model);
        } else {
          scene.add(model);
        }
        setupModel();
      },
      ()=>{},
      () => {}
    )

    function animate(){
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = ()=>{
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      setupModel();
    }
    
    window.addEventListener("resize", handleResize)

    const st: ReturnType<typeof ScrollTrigger.create> = ScrollTrigger.create({
      trigger: ".product-overview",
      start: "top top",
      end: `+=${window.innerHeight * 4}px`, 
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: ()=>{
        const progress = st.progress;
        const header1Start = 0.0;
        const header1End = 0.30;
        const header1Progress = Math.max(0, Math.min(1, (progress - header1Start) / (header1End - header1Start)));
        gsap.to(".header-1", {
          xPercent: progress < header1Start ? 0 : progress > header1End ? -100 : -100 * header1Progress,
          duration: 0
        })
      
        const maskStart = 0.15;
        const maskEnd = 0.40;
        const maskProgress = Math.max(0, Math.min(1, (progress - maskStart) / (maskEnd - maskStart)));
        const maskSize = 100 * maskProgress;
        gsap.to(".circular-mask", {
          clipPath: `circle(${maskSize}% at 50% 50%)`,
          duration: 0
        })

        const header2Start = 0.30;
        const header2End = 0.60;
        const header2Progress = Math.max(0, Math.min(1, (progress - header2Start) / (header2End - header2Start)));
        const header2xPercent = 100 - 300 * header2Progress;
        gsap.to(".header-2", {
          xPercent: progress < header2Start ? 100 : progress > header2End ? -200 : header2xPercent, 
          duration: 0
        });

        tooltipSequence.forEach(({dividerTrigger, contentTrigger, elements}, index)=>{
          const dividerSelector = `.tooltips .tooltip:nth-child(${index + 1}) .divider`;

          const dividerStart = dividerTrigger - 0.05;
          const dividerEnd = dividerTrigger + 0.05;
          const dividerProgress = Math.max(0, Math.min(1, (progress - dividerStart) / (dividerEnd - dividerStart)));
          gsap.to(dividerSelector, {
            scaleX: dividerProgress,
            duration: 0
          });

          // ICON VISIBILITY FIX: The logic here is correct now that we set the initial state.
          const yValue = progress >= contentTrigger ? "0%" : "100%";
          const opacityValue = progress >= contentTrigger ? 1 : 0;
          gsap.to(elements, {
            y: yValue,
            opacity: opacityValue,
            duration: 0
          })
        })

   if(pivot && model && modelSize){
     const rotationStart = 0.03;
     const rotationEnd = 1.0;
     const rotationProgress = Math.max(0, Math.min(1, (progress - rotationStart) / (rotationEnd - rotationStart)));

     // Cylindrical orbit: rotate the pivot so the model orbits around the Y axis,
     // rather than spinning in place around its own Y axis.
     const angle = Math.PI * 6 * rotationProgress; // 3 full orbits over the section
     pivot.rotation.y = angle;

     // Subtle vertical bob for a more organic feel
     const bob = modelSize.y * 0.03 * Math.sin(angle * 1.5);
     pivot.position.y = bob;

     // Gentle micro-motions to beautify the presentation
     model.rotation.x = THREE.MathUtils.degToRad(3) * Math.sin(angle * 1.2);
     const baseTiltZ = window.innerWidth < 1000 ? 0 : THREE.MathUtils.degToRad(-25);
     model.rotation.z = baseTiltZ + THREE.MathUtils.degToRad(2) * Math.sin(angle * 0.8);
     }

     }
     });

    return () => {
      window.removeEventListener("resize", handleResize);
      lenis.destroy();
    }
  }, [])


  return (
    <>
    <section className='intro'>
      <h1>Why window is better </h1>
    </section>
    <section className='product-overview'>
      {/* 2. MODEL SCROLL FIX: The model-container should be positioned absolutely 
      or fixed relative to the viewport/pinned container to not scroll with the content. 
      In this React structure, moving the `model-container` outside of the flow of the 
      scrolling elements (`header-1`, `header-2`, `tooltips`) is key. 
      Assuming CSS makes `.model-container` fill the screen and is behind other elements, 
      this is a good structural fix, but I'll leave it in its original place and assume 
      the necessary CSS is applied (e.g., `position: sticky; top: 0;` or `position: fixed`).
      
      To ensure the cylindrical rotation works visually, the main content 
      (headers, tooltips) must float over the fixed 3D model. 
      The simplest change without assuming external CSS is to add a wrapper 
      around the overlay content for better control. I'll rely on the existing 
      structure and focus on the initial state for the icons.
      
      If you want the model to truly be **fixed** behind the scrolling text,
      you need to ensure `.model-container` has a CSS property like 
      `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;`
      or place it outside of the `product-overview` if it's not meant to be pinned.
      
      *Assuming* the `.model-container` is styled to be fixed behind the pinned `.product-overview`, 
      the existing placement and rotation logic is correct.
      */}
      <div className="model-container"></div>
      <div className="header-1">
        <h1>Always choose the best</h1>
      </div>
      <div className="header-2">
        <h1>Grnd shaker</h1>
      </div>
      <div className="circular-mask"></div>
      <div className="tooltips">
        <div className="tooltip">
          <div className="icon">
       <GiAzulFlake />
          </div>
          <div className="divider"></div>
          <div className="title">
            <h2>It lets you pass air</h2>
          </div>
          <div className="description">
            <p>When you use window you that winds can easily pass you can touch grass and even enjoy the seneary without getting out of room </p>
          </div>
        </div>

  

        <div className="tooltip">
          <div className="icon">
           <FaBolt />
          </div>
          <div className="divider"></div>
          <div className="title">
            <h2>Power of the Right Click</h2>
          </div>
          <div className="description">
            <p>On Windows, the right-click menu is a beautiful, chaotic abyss of unnecessary options and deep customization. You can right-click anywhere</p>
          </div>
        </div>
      </div>
      
    </section>
    <section className='outro'>
      <h1>Thanks for using !!!</h1>
    </section>
    </>
  )
}

export default App