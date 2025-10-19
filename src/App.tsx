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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

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

    function setupModel(){
      if(!model || !modelSize) return;
      const isMobile = window.innerWidth < 1000;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());

      model.position.set(
        isMobile ? -center.x : -center.x - modelSize.x * 0.4,
        -center.y + modelSize.y * 0.085,
        -center.z
      );

      model.rotation.z = isMobile ? 0 : THREE.MathUtils.degToRad(-25);
      const cameraDistance = isMobile ? 2 : 1.25;
      camera.position.set(0, 0, Math.max(modelSize.x, modelSize.y, modelSize.z) * cameraDistance);
      camera.lookAt(0, 0, 0);
    }

    new GLTFLoader().load(
      '/assets/laptop.glb', 
      (gltf)=>{
        model = gltf.scene;
        model.traverse((node)=>{
          if(node instanceof THREE.Mesh && node.material){
            Object.assign(node.material, {
              metalness: 0.05,
              roughness: 0.9,
            })
          }
        })
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        modelSize = size;

        scene.add(model);
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

    ScrollTrigger.create({
      trigger: ".product-overview",
      start: "top top",
      end: `+=${window.innerHeight * 4}px`, 
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: ({progress})=>{
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

          const yValue = progress >= contentTrigger ? "0%" : "100%";
          const opacityValue = progress >= contentTrigger ? 1 : 0;
          gsap.to(elements, {
            y: yValue,
            opacity: opacityValue,
            duration: 0
          })
        })
   
        if(model){
          const rotationStart = 0.03;
          const rotationEnd = 1.0;
          const rotationProgress = Math.max(0, Math.min(1, (progress - rotationStart) / (rotationEnd - rotationStart)));
          
          const targetRotation = Math.PI * 3*4 * rotationProgress; 
          
          model.rotation.y = targetRotation;
        }
      }
    })

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
      
      <div className="model-container"></div>
    </section>
    <section className='outro'>
      <h1>Thanks for using !!!</h1>
    </section>
    </>
  )
}

export default App
