import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type LiquidGlassTextProps = {
  text?: string;
  videoSrc?: string;
  imageSrc?: string;
  className?: string;
  intensity?: number;
};

const PLANE = new THREE.Vector2(1200, 340);
const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = Math.round((TEXTURE_WIDTH * PLANE.y) / PLANE.x);

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uVideo;
uniform sampler2D uMask;
uniform sampler2D uBevel;
uniform sampler2D uLens;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uLight;
uniform vec2 uVideoAspect;
uniform vec4 uCanvas;
uniform vec4 uFooter;
uniform vec2 uFoot;

varying vec2 vUv;

vec2 videoUvFromCss(vec2 css) {
  vec2 footerUv = (css - uFooter.xy) / max(uFooter.zw, vec2(1.0));
  float elementAspect = uFooter.z / max(uFooter.w, 1.0);
  float videoAspect = uVideoAspect.x / max(uVideoAspect.y, 0.001);
  vec2 vid = footerUv;
  if (videoAspect > elementAspect) {
    vid.x = (footerUv.x - 0.5) * (elementAspect / videoAspect) + 0.5;
  } else {
    vid.y = (footerUv.y - 0.5) * (videoAspect / elementAspect) + 0.5;
  }
  vid.y = 1.0 - vid.y;
  return vid;
}

void main() {
  float mask = texture2D(uMask, vUv).a;
  if (mask < 0.02) discard;

  float aa = max(fwidth(mask), 0.0015);
  float alpha = smoothstep(0.4 - aa, 0.62 + aa, mask);

  vec2 texel = vec2(1.0 / ${TEXTURE_WIDTH}.0, 1.0 / ${TEXTURE_HEIGHT}.0);
  float lL = texture2D(uLens, vUv - vec2(texel.x * 8.0, 0.0)).a;
  float lR = texture2D(uLens, vUv + vec2(texel.x * 8.0, 0.0)).a;
  float lD = texture2D(uLens, vUv - vec2(0.0, texel.y * 8.0)).a;
  float lU = texture2D(uLens, vUv + vec2(0.0, texel.y * 8.0)).a;
  vec2 lens = vec2(lL - lR, lD - lU);

  float bL = texture2D(uBevel, vUv - vec2(texel.x * 2.0, 0.0)).a;
  float bR = texture2D(uBevel, vUv + vec2(texel.x * 2.0, 0.0)).a;
  float bD = texture2D(uBevel, vUv - vec2(0.0, texel.y * 2.0)).a;
  float bU = texture2D(uBevel, vUv + vec2(0.0, texel.y * 2.0)).a;
  vec2 bevel = vec2(bL - bR, bD - bU);

  float amp = max(uIntensity, 0.0) / 12.0;
  vec2 onePx = vec2(1.0 / max(uCanvas.z, 1.0), 1.0 / max(uCanvas.w, 1.0));
  vec2 css = vec2(
    uCanvas.x + vUv.x * uCanvas.z,
    uCanvas.y + (1.0 - vUv.y) * uCanvas.w
  );
  vec2 bend = vec2(lens.x, -lens.y) * (42.0 * amp);
  vec2 shimmer = vec2(
    sin(vUv.y * 34.0 + uTime * 0.85),
    cos(vUv.x * 28.0 - uTime * 0.7)
  ) * (1.6 * amp);
  vec2 sampleCss = css + bend + shimmer;

  vec2 base = videoUvFromCss(sampleCss);
  float edge = smoothstep(0.02, 0.22, length(bevel));
  vec2 chromaPx = normalize(bend + vec2(0.0001)) * (2.4 * amp * edge);
  vec3 color = vec3(
    texture2D(uVideo, videoUvFromCss(sampleCss + chromaPx)).r,
    texture2D(uVideo, base).g,
    texture2D(uVideo, videoUvFromCss(sampleCss - chromaPx)).b
  );

  color = (color - 0.5) * 1.05 + 0.5;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color += (1.0 - luma) * vec3(0.07, 0.09, 0.12);

  vec2 m = onePx * 1.6;
  float left = texture2D(uMask, vUv - vec2(m.x, 0.0)).a;
  float right = texture2D(uMask, vUv + vec2(m.x, 0.0)).a;
  float down = texture2D(uMask, vUv - vec2(0.0, m.y)).a;
  float up = texture2D(uMask, vUv + vec2(0.0, m.y)).a;
  vec2 outward = vec2(left - right, down - up);
  float rim = smoothstep(0.12, 0.72, mask - min(min(left, right), min(down, up)));
  float bevelH = texture2D(uBevel, vUv).a;
  float softRim = smoothstep(0.25, 0.95, 1.0 - bevelH) * smoothstep(0.45, 0.8, mask);

  vec3 light = normalize(vec3(uLight, 0.9));
  float lightAlign = clamp(dot(normalize(outward + vec2(0.0001)), normalize(light.xy)), 0.0, 1.0);
  vec3 normal = normalize(vec3(bevel * 3.2, 0.72));
  vec3 halfDir = normalize(light + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
  float topSheen = smoothstep(-0.02, 0.2, bevel.y) * smoothstep(0.2, 0.85, bevelH);
  float bottomShade = smoothstep(0.0, 0.22, -bevel.y);

  color *= 1.0 - bottomShade * softRim * 0.55;
  color += topSheen * vec3(0.16, 0.18, 0.22);
  color += softRim * mix(vec3(0.25, 0.35, 0.45), vec3(0.95, 0.98, 1.0), lightAlign) * 0.85;
  color += rim * mix(0.15, 1.0, lightAlign) * 0.55;
  color += spec * softRim * (0.35 + lightAlign);
  float foot = smoothstep(uFoot.x, uFoot.y, vUv.y);
  color = mix(color, vec3(0.0), foot);
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("Canvas 2D indisponible");
  return { canvas, context };
}

function drawWord(text: string) {
  const { canvas, context } = makeCanvas();
  const family = '"Arial Black", Arial, sans-serif';
  let size = 200;
  context.font = `900 ${size}px ${family}`;
  context.letterSpacing = `${size * -0.04}px`;
  const measured = context.measureText(text).width || 1;
  size = Math.round((TEXTURE_WIDTH * 0.96 * size) / measured);
  context.font = `900 ${size}px ${family}`;
  context.letterSpacing = `${size * -0.04}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffffff";
  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  context.fillText(text, TEXTURE_WIDTH / 2, TEXTURE_HEIGHT * 0.68);
  return { canvas, size };
}

function blurFrom(source: HTMLCanvasElement, radius: number) {
  const { canvas, context } = makeCanvas();
  context.filter = `blur(${Math.max(1, radius)}px)`;
  context.drawImage(source, 0, 0);
  return canvas;
}

function footBand(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Vector2(0.2, 0.08);
  const { width, height } = canvas;
  const data = context.getImageData(0, 0, width, height).data;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y += 2) {
    const row = y * width * 4;
    for (let x = 0; x < width; x += 4) {
      if (data[row + x * 4 + 3] > 24) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        break;
      }
    }
  }
  if (bottom < 0) return new THREE.Vector2(0.2, 0.08);
  const span = Math.max(bottom - top, 1);
  const uv = (y: number) => 1 - y / height;
  return new THREE.Vector2(uv(bottom - span * 0.16), uv(bottom - span * 0.03));
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function mediaTexture(source: HTMLVideoElement | HTMLImageElement) {
  const texture = source instanceof HTMLVideoElement ? new THREE.VideoTexture(source) : new THREE.Texture(source);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function findSharedVideo(videoSrc: string) {
  const name = videoSrc.split("/").pop() || videoSrc;
  return [...document.querySelectorAll("video")].find((video) => {
    const source = video.currentSrc || video.src || video.querySelector("source")?.getAttribute("src") || "";
    return source.includes(name);
  }) ?? null;
}

function GlassWord({
  text,
  videoSrc,
  imageSrc,
  intensity,
}: Required<Pick<LiquidGlassTextProps, "text" | "intensity">> & Pick<LiquidGlassTextProps, "videoSrc" | "imageSrc">) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const lightTarget = useRef(new THREE.Vector2(-0.35, 0.72));
  const mediaRef = useRef<THREE.Texture | null>(null);
  const { viewport, gl } = useThree();

  const assets = useMemo(() => {
    const word = drawWord(text);
    const mask = canvasTexture(word.canvas);
    const bevel = canvasTexture(blurFrom(word.canvas, Math.max(3, word.size * 0.028)));
    const lens = canvasTexture(blurFrom(word.canvas, Math.max(8, word.size * 0.055)));

    let video: HTMLVideoElement | null = null;
    let image: HTMLImageElement | null = null;
    let ownsVideo = false;
    let media: THREE.Texture;

    if (imageSrc) {
      image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageSrc;
      media = mediaTexture(image);
    } else {
      const shared = findSharedVideo(videoSrc || "/footer-bg.mp4");
      if (shared) {
        video = shared;
      } else {
        video = document.createElement("video");
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "auto";
        video.src = videoSrc || "/footer-bg.mp4";
        ownsVideo = true;
      }
      media = mediaTexture(video);
    }

    const uniforms = {
      uVideo: { value: media },
      uMask: { value: mask },
      uBevel: { value: bevel },
      uLens: { value: lens },
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uLight: { value: new THREE.Vector2(-0.35, 0.72) },
      uVideoAspect: { value: new THREE.Vector2(16, 9) },
      uCanvas: { value: new THREE.Vector4(0, 0, 1, 1) },
      uFooter: { value: new THREE.Vector4(0, 0, 1, 1) },
      uFoot: { value: footBand(word.canvas) },
    };

    return { video, image, ownsVideo, media, mask, bevel, lens, uniforms };
  }, [imageSrc, intensity, text, videoSrc]);

  useLayoutEffect(() => {
    mediaRef.current = assets.media;
    const video = assets.video;
    const image = assets.image;
    const onMeta = () => {
      const aspect = material.current?.uniforms.uVideoAspect.value as THREE.Vector2 | undefined;
      if (!video || !aspect) return;
      aspect.set(video.videoWidth || 16, video.videoHeight || 9);
    };
    const onLoad = () => {
      if (mediaRef.current) mediaRef.current.needsUpdate = true;
      const aspect = material.current?.uniforms.uVideoAspect.value as THREE.Vector2 | undefined;
      if (!image || !aspect) return;
      aspect.set(image.naturalWidth || 16, image.naturalHeight || 9);
    };
    if (video && video.videoWidth) onMeta();
    video?.addEventListener("loadedmetadata", onMeta);
    if (image) {
      if (image.complete && image.naturalWidth) onLoad();
      image.addEventListener("load", onLoad);
    }
    if (assets.ownsVideo) video?.play().catch(() => {});

    return () => {
      video?.removeEventListener("loadedmetadata", onMeta);
      image?.removeEventListener("load", onLoad);
      if (assets.ownsVideo) video?.pause();
      mediaRef.current = null;
      assets.media.dispose();
      assets.mask.dispose();
      assets.bevel.dispose();
      assets.lens.dispose();
    };
  }, [assets]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const y = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
      const influence = THREE.MathUtils.clamp(1 - distance / (rect.width * 0.85), 0, 1);
      lightTarget.current.set(THREE.MathUtils.lerp(-0.35, x, influence), THREE.MathUtils.lerp(0.72, y * 0.45 + 0.4, influence));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl]);

  useFrame(({ clock }, delta) => {
    const mat = material.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uIntensity.value = intensity;
    const media = mediaRef.current;
    if (media instanceof THREE.VideoTexture) media.needsUpdate = true;

    const canvas = gl.domElement.getBoundingClientRect();
    const footer = gl.domElement.closest(".site-footer")?.getBoundingClientRect() ?? canvas;
    (mat.uniforms.uCanvas.value as THREE.Vector4).set(canvas.left, canvas.top, canvas.width, canvas.height);
    (mat.uniforms.uFooter.value as THREE.Vector4).set(footer.left, footer.top, footer.width, footer.height);
    if (assets.video && assets.video.videoWidth) {
      (mat.uniforms.uVideoAspect.value as THREE.Vector2).set(assets.video.videoWidth, assets.video.videoHeight);
    }

    const idleX = -0.32 + Math.sin(clock.elapsedTime * 0.4) * 0.38;
    const idleY = 0.7 + Math.cos(clock.elapsedTime * 0.31) * 0.1;
    const light = mat.uniforms.uLight.value as THREE.Vector2;
    light.x = THREE.MathUtils.damp(light.x, idleX * 0.45 + lightTarget.current.x * 0.55, 4, delta);
    light.y = THREE.MathUtils.damp(light.y, idleY * 0.45 + lightTarget.current.y * 0.55, 4, delta);
  });

  return (
    <mesh scale={[viewport.width || 1, viewport.height || 1, 1]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={assets.uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function LiquidGlassText({
  text = "Adxens",
  videoSrc = "/videos/background.mp4",
  imageSrc,
  className = "",
  intensity = 12,
}: LiquidGlassTextProps) {
  return (
    <div role="img" aria-label={text} className={className} style={{ width: "100%", aspectRatio: "1200 / 340", lineHeight: 0 }}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 1, near: 0.1, far: 20 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.LinearSRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <GlassWord text={text} videoSrc={videoSrc} imageSrc={imageSrc} intensity={intensity} />
      </Canvas>
    </div>
  );
}
