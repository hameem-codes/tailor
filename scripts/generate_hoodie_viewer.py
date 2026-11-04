import os
import json
import base64
import io
import numpy as np
from PIL import Image

def generate_hoodie_viewer():
    artifact_dir = r"C:\Users\matee\.gemini\antigravity\brain\7465a564-e37f-458f-ba1c-781be9a89fef"
    diffuse_path = "public/apparel/hoodie_hero_diffuse.png"
    depth_path = "public/apparel/hoodie_hero_depth.png"

    diffuse_img = Image.open(diffuse_path).convert("RGBA")
    cw, ch = diffuse_img.size
    alpha = np.array(diffuse_img.split()[-1]) / 255.0
    depth_arr = np.array(Image.open(depth_path)) / 255.0

    # Grid for smooth inline WebGL (52 x 42)
    grid_h = 52
    grid_w = 42
    y_indices = np.linspace(15, ch - 20, grid_h, dtype=int)
    x_indices = np.linspace(20, cw - 20, grid_w, dtype=int)
    center_x = cw * 0.5

    scale_y = 1.65
    scale_x = 1.45
    scale_z = 0.55

    vertices = []
    indices = []
    vert_map = {}

    for i, y in enumerate(y_indices):
        for j, x in enumerate(x_indices):
            a_val = alpha[y, x]
            if a_val > 0.18:
                vx = ((x - center_x) / (cw * 0.5)) * (scale_x * 0.5)
                vy = (1.0 - y / float(ch) - 0.5) * scale_y

                norm_x = (x - center_x) / (cw * 0.5)
                base_dome = max(0.0, 1.0 - (norm_x * 1.3)**2)**0.5
                d_val = depth_arr[y, x]
                vz = (base_dome * 0.45 + d_val * 0.55) * scale_z

                u = round(x / float(cw), 4)
                v = round(1.0 - (y / float(ch)), 4)

                # Normals
                nx = -norm_x * 0.55
                ny = -((y - ch*0.5) / (ch*0.5)) * 0.25
                nz = 0.85
                l = (nx**2 + ny**2 + nz**2)**0.5
                nx, ny, nz = nx/l, ny/l, nz/l

                vert_idx = len(vertices) // 8
                vert_map[(i, j)] = vert_idx
                vertices.extend([round(vx, 4), round(vy, 4), round(vz, 4), u, v, round(nx, 3), round(ny, 3), round(nz, 3)])

    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            p1, p2, p3, p4 = (i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j)
            if p1 in vert_map and p2 in vert_map and p3 in vert_map and p4 in vert_map:
                v1, v2, v3, v4 = vert_map[p1], vert_map[p2], vert_map[p3], vert_map[p4]
                indices.extend([v1, v2, v3, v1, v3, v4])

    print(f"Generated WebGL hoodie mesh: {len(vertices)//8} vertices, {len(indices)//3} triangles")

    # Power of two (512x512) texture for universal WebGL 1/2 hardware acceleration
    small_diffuse = diffuse_img.resize((512, 512), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    small_diffuse.convert("RGB").save(buf, format="JPEG", quality=86)
    tex_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    tex_data_uri = f"data:image/jpeg;base64,{tex_base64}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    body {{
      user-select: none;
      -webkit-user-select: none;
    }}
    .glow-light {{
      box-shadow: 0 0 25px -4px rgba(255, 255, 255, 0.25);
    }}
    .control-btn {{
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .control-btn:hover {{
      transform: translateY(-1px);
    }}
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-3">

  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
    
    <!-- Top Header Bar -->
    <div class="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background)]/50 gap-3">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-bold tracking-wide uppercase">3D Oversized Streetwear Hoodie</span>
            <span class="px-2 py-0.5 text-xs font-semibold uppercase bg-white/15 text-slate-100 rounded-full border border-white/25">Light Colorway</span>
          </div>
          <p class="text-xs text-[var(--muted-foreground)]">Chalk White &bull; Drop-Shoulder Silhouette &bull; Zero Green &bull; Real-Time Animated</p>
        </div>
      </div>

      <!-- Quick Specs Badge -->
      <div class="flex items-center space-x-2 text-xs">
        <span class="px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)] font-mono">
          {len(indices)//3:,} Triangles
        </span>
        <button id="btn-reset-cam" class="control-btn px-2.5 py-1 rounded-lg bg-[var(--background)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] font-medium flex items-center space-x-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <span>Reset</span>
        </button>
      </div>
    </div>

    <!-- Viewport Area -->
    <div class="relative w-full h-[430px] bg-gradient-to-b from-[#08090b] to-[#111317] flex items-center justify-center overflow-hidden">
      
      <!-- Interactive WebGL Canvas -->
      <canvas id="gl-canvas" class="w-full h-full cursor-grab active:cursor-grabbing"></canvas>

      <!-- Garment HUD Overlay (Top Left) -->
      <div class="absolute top-4 left-4 pointer-events-none bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs space-y-1 shadow-xl">
        <div class="flex items-center space-x-1.5 text-slate-200 font-semibold tracking-wider uppercase text-[11px]">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span>Aesthetic Reference Match</span>
        </div>
        <div class="text-white font-medium">Voluminous Streetwear Hoodie</div>
        <div class="text-slate-400 text-[11px]">Sculpted Hood &bull; Puffy Gathered Sleeves &bull; Chest Emblem</div>
      </div>

      <!-- Drag & Zoom Hint (Bottom Center) -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-1 text-[11px] text-slate-300 flex items-center space-x-1.5">
        <svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
        <span>Drag to rotate 3D &bull; Scroll to zoom &bull; Real-time cloth breathing</span>
      </div>

      <!-- Quick Camera Angles (Top Right) -->
      <div class="absolute top-4 right-4 flex flex-col space-y-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1.5 text-xs">
        <button class="cam-btn px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-left transition font-medium" data-yaw="0" data-pitch="0">Front</button>
        <button class="cam-btn px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-left transition font-medium" data-yaw="0.78" data-pitch="0.12">3/4 View</button>
        <button class="cam-btn px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-left transition font-medium" data-yaw="1.57" data-pitch="0">Profile</button>
        <button class="cam-btn px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-left transition font-medium" data-yaw="3.14" data-pitch="0">Back</button>
      </div>
    </div>

    <!-- Controls Strip -->
    <div class="p-4 border-t border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center justify-between gap-4">
      
      <!-- Animation Toggles -->
      <div class="flex items-center space-x-2">
        <button id="toggle-turntable" class="control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/15 text-white border border-white/30">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          <span id="label-turntable">360° Turntable</span>
        </button>

        <button id="toggle-breathing" class="control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/15 text-white border border-white/30">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
          <span id="label-breathing">Cloth Breathing</span>
        </button>
      </div>

      <!-- Shading Modes -->
      <div class="flex items-center space-x-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)] text-xs">
        <span class="text-[var(--muted-foreground)] px-2 text-[11px] font-medium uppercase">Shading:</span>
        <button class="mode-btn active px-2.5 py-1 rounded-lg bg-white/20 text-white font-medium" data-mode="pbr">PBR</button>
        <button class="mode-btn px-2.5 py-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium" data-mode="normal">Normal</button>
        <button class="mode-btn px-2.5 py-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium" data-mode="wireframe">Wire</button>
        <button class="mode-btn px-2.5 py-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium" data-mode="clay">Clay</button>
      </div>

      <!-- Light Colorway Swatches (All Light / Neutral - NO GREEN) -->
      <div class="flex items-center space-x-2">
        <span class="text-xs text-[var(--muted-foreground)]">Palette:</span>
        <div class="flex items-center space-x-1.5">
          <button class="swatch active w-5 h-5 rounded-full border-2 border-white bg-[#f8fafc] transition hover:scale-110" data-rgb="[1.0, 1.0, 1.0]" title="Pristine Chalk White"></button>
          <button class="swatch w-5 h-5 rounded-full border border-[var(--border)] bg-[#ede4db] transition hover:scale-110" data-rgb="[0.96, 0.92, 0.88]" title="Warm Bone / Ivory"></button>
          <button class="swatch w-5 h-5 rounded-full border border-[var(--border)] bg-[#e2e8f0] transition hover:scale-110" data-rgb="[0.90, 0.93, 0.96]" title="Platinum Silver"></button>
          <button class="swatch w-5 h-5 rounded-full border border-[var(--border)] bg-[#cbd5e1] transition hover:scale-110" data-rgb="[0.82, 0.85, 0.88]" title="Cool Ice Gray"></button>
          <button class="swatch w-5 h-5 rounded-full border border-[var(--border)] bg-[#d6ccc2] transition hover:scale-110" data-rgb="[0.88, 0.84, 0.80]" title="Oatmeal Heather"></button>
        </div>
      </div>

    </div>

    <!-- Bottom Specs & Downloads -->
    <div class="px-5 py-3 border-t border-[var(--border)] bg-[var(--background)]/30 flex flex-wrap items-center justify-between text-xs text-[var(--muted-foreground)] gap-2">
      <div>
        <span>Model: <strong>Luxury Streetwear Oversized Hoodie</strong> &bull; Triangles: {len(indices)//3:,} &bull; Palette: Light Neutrals (No Green)</span>
      </div>
      <div class="flex items-center space-x-3">
        <a href="models/streetwear_hoodie.glb" download="streetwear_hoodie.glb" class="text-white hover:underline flex items-center space-x-1 font-medium">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
          <span>Download .GLB</span>
        </a>
        <a href="models/streetwear_hoodie.obj" download="streetwear_hoodie.obj" class="text-slate-300 hover:underline flex items-center space-x-1 font-medium">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span>Download .OBJ</span>
        </a>
      </div>
    </div>

  </div>

  <!-- Raw WebGL Shaders & Animation Engine -->
  <script>
    const canvas = document.getElementById('gl-canvas');
    const gl = canvas.getContext('webgl', {{ antialias: true, alpha: true }});
    if (!gl) {{
      alert('WebGL not supported');
    }}

    const rawVertices = new Float32Array({json.dumps(vertices)});
    const rawIndices = new Uint16Array({json.dumps(indices)});

    // Vertex Shader
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec2 aUV;
      attribute vec3 aNormal;

      uniform mat4 uProjection;
      uniform mat4 uModelView;
      uniform float uTime;
      uniform float uBreathingActive;

      varying vec2 vUV;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {{
        vUV = aUV;
        vNormal = aNormal;

        vec3 pos = aPosition;
        if (uBreathingActive > 0.5) {{
          float wave = sin(uTime * 2.5 + pos.y * 3.5 + pos.x * 2.0) * 0.015;
          float breath = sin(uTime * 1.3) * 0.018 * step(-0.25, pos.y);
          pos.z += wave + breath;
        }}

        vec4 mvPosition = uModelView * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = uProjection * mvPosition;
      }}
    `;

    // Fragment Shader (Zero Green - Clean Studio Lighting)
    const fsSource = `
      precision mediump float;

      varying vec2 vUV;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      uniform sampler2D uSampler;
      uniform int uShadingMode; // 0: PBR, 1: Normal, 2: Wire, 3: Clay
      uniform vec3 uColorTint;
      uniform mat3 uNormalMatrix;

      void main() {{
        vec3 N = normalize(uNormalMatrix * vNormal);
        vec3 V = normalize(vViewPosition);

        // Mode 1: Normal inspection
        if (uShadingMode == 1) {{
          gl_FragColor = vec4(N * 0.5 + 0.5, 1.0);
          return;
        }}

        // Mode 2: Wireframe
        if (uShadingMode == 2) {{
          gl_FragColor = vec4(0.92, 0.94, 0.98, 1.0);
          return;
        }}

        // Lighting: Soft white key + platinum fill + moonlit rim (NO GREEN)
        vec3 keyDir = normalize(vec3(0.5, 0.7, 0.8));
        float diff = max(dot(N, keyDir), 0.0);

        vec3 rimDir = normalize(vec3(-0.7, 0.2, 0.6));
        float rimFactor = 1.0 - max(dot(N, V), 0.0);
        vec3 rimGlow = vec3(0.95, 0.97, 1.0) * pow(rimFactor, 2.6) * 0.85;

        vec3 H = normalize(keyDir + V);
        float spec = pow(max(dot(N, H), 0.0), 18.0) * 0.22;

        vec4 texColor = texture2D(uSampler, vUV);

        // Mode 3: Clay sculpt
        if (uShadingMode == 3) {{
          vec3 clay = vec3(0.88, 0.89, 0.91) * (diff * 0.75 + 0.35) + rimGlow * 0.5 + vec3(spec);
          gl_FragColor = vec4(clay, 1.0);
          return;
        }}

        // Mode 0: PBR Realistic
        vec3 base = texColor.rgb * uColorTint;
        vec3 finalColor = base * (diff * 0.85 + 0.40) + rimGlow * 0.35 + vec3(spec);
        gl_FragColor = vec4(finalColor, texColor.a);
      }}
    `;

    function compileShader(gl, source, type) {{
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {{
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }}
      return shader;
    }}

    const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertices, gl.STATIC_DRAW);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rawIndices, gl.STATIC_DRAW);

    const stride = 8 * 4;
    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);

    const aUV = gl.getAttribLocation(program, 'aUV');
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, stride, 3 * 4);

    const aNorm = gl.getAttribLocation(program, 'aNormal');
    gl.enableVertexAttribArray(aNorm);
    gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, stride, 5 * 4);

    const uProjLoc = gl.getUniformLocation(program, 'uProjection');
    const uMVLoc = gl.getUniformLocation(program, 'uModelView');
    const uNormMatLoc = gl.getUniformLocation(program, 'uNormalMatrix');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uBreathingLoc = gl.getUniformLocation(program, 'uBreathingActive');
    const uModeLoc = gl.getUniformLocation(program, 'uShadingMode');
    const uTintLoc = gl.getUniformLocation(program, 'uColorTint');

    gl.uniform1i(uModeLoc, 0);
    gl.uniform3f(uTintLoc, 1.0, 1.0, 1.0);
    gl.uniform1f(uBreathingLoc, 1.0);

    // Texture
    const texture = gl.createTexture();
    const texImg = new Image();
    texImg.onload = () => {{
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImg);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }};
    texImg.src = "{tex_data_uri}";

    function createPerspective(fov, aspect, near, far) {{
      const f = 1.0 / Math.tan(fov / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
      ]);
    }}

    let isTurntable = true;
    let isBreathing = true;
    let currentShadingMode = 0;
    let colorTint = [1.0, 1.0, 1.0];

    let yaw = 0.0;
    let pitch = 0.0;
    let zoom = 2.45;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    canvas.addEventListener('mousedown', (e) => {{
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }});
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {{
      if (isDragging) {{
        isTurntable = false;
        document.getElementById('toggle-turntable').className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]";
        document.getElementById('label-turntable').textContent = "Turntable (Paused)";

        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        yaw += dx * 0.008;
        pitch = Math.max(-0.55, Math.min(0.55, pitch + dy * 0.008));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }}
    }});

    canvas.addEventListener('wheel', (e) => {{
      e.preventDefault();
      zoom = Math.max(1.5, Math.min(4.2, zoom + e.deltaY * 0.002));
    }}, {{ passive: false }});

    // Touch
    canvas.addEventListener('touchstart', (e) => {{
      if (e.touches.length === 1) {{
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }}
    }});
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', (e) => {{
      if (isDragging && e.touches.length === 1) {{
        const dx = e.touches[0].clientX - prevMouseX;
        const dy = e.touches[0].clientY - prevMouseY;
        yaw += dx * 0.008;
        pitch = Math.max(-0.55, Math.min(0.55, pitch + dy * 0.008));
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }}
    }});

    let startTime = performance.now();

    function render() {{
      requestAnimationFrame(render);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = Math.floor(canvas.clientWidth * dpr);
      const displayH = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== displayW || canvas.height !== displayH) {{
        canvas.width = displayW;
        canvas.height = displayH;
        gl.viewport(0, 0, displayW, displayH);
      }}

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.clearColor(0.04, 0.045, 0.06, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const elapsed = (performance.now() - startTime) * 0.001;

      if (isTurntable) {{
        yaw += 0.011;
      }}

      const floatBob = Math.sin(elapsed * 1.5) * 0.025;

      const aspect = canvas.width / canvas.height;
      const proj = createPerspective(Math.PI / 4, aspect, 0.1, 100.0);
      gl.uniformMatrix4fv(uProjLoc, false, proj);

      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);

      const rotM = new Float32Array([
        cosY, sinP * sinY, -cosP * sinY, 0,
        0, cosP, sinP, 0,
        sinY, -sinP * cosY, cosP * cosY, 0,
        0, floatBob, -zoom, 1
      ]);
      gl.uniformMatrix4fv(uMVLoc, false, rotM);

      const normM = new Float32Array([
        rotM[0], rotM[1], rotM[2],
        rotM[4], rotM[5], rotM[6],
        rotM[8], rotM[9], rotM[10]
      ]);
      gl.uniformMatrix3fv(uNormMatLoc, false, normM);

      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform1f(uBreathingLoc, isBreathing ? 1.0 : 0.0);
      gl.uniform1i(uModeLoc, currentShadingMode);
      gl.uniform3fv(uTintLoc, colorTint);

      const drawMode = (currentShadingMode === 2) ? gl.LINES : gl.TRIANGLES;
      gl.drawElements(drawMode, rawIndices.length, gl.UNSIGNED_SHORT, 0);
    }}
    render();

    // UI Listeners
    document.getElementById('toggle-turntable').addEventListener('click', () => {{
      isTurntable = !isTurntable;
      const btn = document.getElementById('toggle-turntable');
      const label = document.getElementById('label-turntable');
      if (isTurntable) {{
        btn.className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/15 text-white border border-white/30";
        label.textContent = "360° Turntable";
      }} else {{
        btn.className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]";
        label.textContent = "Turntable (Paused)";
      }}
    }});

    document.getElementById('toggle-breathing').addEventListener('click', () => {{
      isBreathing = !isBreathing;
      const btn = document.getElementById('toggle-breathing');
      const label = document.getElementById('label-breathing');
      if (isBreathing) {{
        btn.className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/15 text-white border border-white/30";
        label.textContent = "Cloth Breathing";
      }} else {{
        btn.className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]";
        label.textContent = "Cloth Static";
      }}
    }});

    document.getElementById('btn-reset-cam').addEventListener('click', () => {{
      yaw = 0.0;
      pitch = 0.0;
      zoom = 2.45;
      isTurntable = true;
      const btn = document.getElementById('toggle-turntable');
      btn.className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/15 text-white border border-white/30";
      document.getElementById('label-turntable').textContent = "360° Turntable";
    }});

    document.querySelectorAll('.cam-btn').forEach(btn => {{
      btn.addEventListener('click', () => {{
        yaw = parseFloat(btn.dataset.yaw);
        pitch = parseFloat(btn.dataset.pitch);
        zoom = 2.45;
        isTurntable = false;
        const tBtn = document.getElementById('toggle-turntable');
        tBtn.className = "control-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]";
        document.getElementById('label-turntable').textContent = "Turntable (Paused)";
      }});
    }});

    document.querySelectorAll('.mode-btn').forEach(btn => {{
      btn.addEventListener('click', () => {{
        document.querySelectorAll('.mode-btn').forEach(b => {{
          b.className = "mode-btn px-2.5 py-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium";
        }});
        btn.className = "mode-btn active px-2.5 py-1 rounded-lg bg-white/20 text-white font-medium";
        const mode = btn.dataset.mode;
        if (mode === 'pbr') currentShadingMode = 0;
        else if (mode === 'normal') currentShadingMode = 1;
        else if (mode === 'wireframe') currentShadingMode = 2;
        else if (mode === 'clay') currentShadingMode = 3;
      }});
    }});

    document.querySelectorAll('.swatch').forEach(swatch => {{
      swatch.addEventListener('click', () => {{
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('border-2', 'border-white', 'scale-110'));
        swatch.classList.add('border-2', 'border-white', 'scale-110');
        colorTint = JSON.parse(swatch.dataset.rgb);
      }});
    }});
  </script>
</body>
</html>
"""
    out_html_path = os.path.join(artifact_dir, "apparel_3d_viewer.html")
    with open(out_html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated {out_html_path} ({len(html)} bytes)")

if __name__ == "__main__":
    generate_hoodie_viewer()

