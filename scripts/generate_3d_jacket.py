import os
import math
import numpy as np
from PIL import Image, ImageFilter

def create_jacket_assets():
    input_path = "public/apparel/tailored_jacket_original.jpg"
    out_dir_apparel = "public/apparel"
    out_dir_models = "public/models"
    os.makedirs(out_dir_apparel, exist_ok=True)
    os.makedirs(out_dir_models, exist_ok=True)

    img = Image.open(input_path).convert("RGB")
    width, height = img.size
    arr = np.array(img, dtype=np.float32)

    # 1. Clean garment mask
    # Background in studio is light gray (mean ~195-225), garment is dark slate charcoal (mean ~40-70)
    bg_brightness = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114)
    garment_mask_raw = (bg_brightness < 160.0).astype(np.float32)

    # Clean out small noise below hem (Y > 1020) and top background
    garment_mask_raw[1020:, :] = 0.0
    garment_mask_raw[:140, :] = 0.0

    mask_img = Image.fromarray((garment_mask_raw * 255).astype(np.uint8), mode="L")
    # Morphological clean up (MaxFilter then MinFilter = close small gaps)
    mask_img = mask_img.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    mask_smooth = mask_img.filter(ImageFilter.GaussianBlur(1.5))
    alpha = np.array(mask_smooth, dtype=np.float32) / 255.0

    # 2. Diffuse Map (RGBA)
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.array(img, dtype=np.uint8)
    rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)
    diffuse_img = Image.fromarray(rgba, mode="RGBA")
    diffuse_img.save(os.path.join(out_dir_apparel, "tailored_jacket_diffuse.png"), optimize=True)
    print("Saved diffuse map.")

    # 3. Depth & Displacement Map
    # Anatomical 3D depth profile:
    # Torso chest curves forward, waist curves in, sleeves curve forward, collar has neck depth
    ys = np.arange(height)[:, None]
    xs = np.arange(width)[None, :]

    # Centerline X around 448
    cx = 448.0
    # Normalized coordinates
    nx = (xs - cx) / (width * 0.5) # -1 to +1 across jacket width
    ny = (ys - 160.0) / (980.0 - 160.0) # 0 (collar) to 1 (hem)

    # Base torso curvature: elliptical dome
    # Chest apex around ny = 0.35 - 0.45
    torso_depth = np.maximum(0.0, 1.0 - (nx * 1.6)**2)
    vertical_profile = np.sin(np.clip(ny, 0.0, 1.0) * math.pi * 0.85 + 0.15)
    macro_depth = torso_depth * vertical_profile

    # Sleeves forward curve
    is_left_sleeve = (nx < -0.45) & (ny > 0.15) & (ny < 0.95)
    is_right_sleeve = (nx > 0.45) & (ny > 0.15) & (ny < 0.95)
    sleeve_curve = np.zeros_like(macro_depth)
    sleeve_curve[is_left_sleeve] = np.maximum(0.0, 1.0 - ((nx[is_left_sleeve] + 0.75) / 0.35)**2) * 0.6
    sleeve_curve[is_right_sleeve] = np.maximum(0.0, 1.0 - ((nx[is_right_sleeve] - 0.75) / 0.35)**2) * 0.6

    # Micro fabric folds from luminance
    lum = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0
    lum_centered = lum - lum.mean()

    # Zipper ridge along center line
    zipper_ridge = np.exp(-((xs - cx)**2) / (2.0 * 2.5**2)) * 0.15

    depth_map = (macro_depth * 0.75 + sleeve_curve * 0.25 + zipper_ridge + lum_centered * 0.08) * alpha
    depth_norm = np.clip(depth_map * 255.0, 0, 255).astype(np.uint8)
    depth_img = Image.fromarray(depth_norm, mode="L")
    depth_img.save(os.path.join(out_dir_apparel, "tailored_jacket_depth.png"))
    print("Saved depth map.")

    # 4. Tangent-Space Normal Map
    # Sobel gradients
    sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)

    from scipy.signal import convolve2d if False else None
    # Use numpy gradient for fast, accurate slope computation
    gy, gx = np.gradient(depth_map.astype(np.float32) * 12.0)
    # Add high-frequency fabric texture from luminance
    lum_gy, lum_gx = np.gradient(lum * 8.0)
    total_gx = gx + lum_gx * 0.6
    total_gy = gy + lum_gy * 0.6

    normal_z = np.ones_like(total_gx)
    length = np.sqrt(total_gx**2 + total_gy**2 + normal_z**2)
    nx_map = -total_gx / length
    ny_map = -total_gy / length
    nz_map = normal_z / length

    # Convert to RGB [0..255]
    normal_rgb = np.zeros((height, width, 3), dtype=np.uint8)
    normal_rgb[:, :, 0] = np.clip((nx_map * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    normal_rgb[:, :, 1] = np.clip((ny_map * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    normal_rgb[:, :, 2] = np.clip((nz_map * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)

    # Set background normal to flat (128, 128, 255)
    bg_pixels = alpha < 0.1
    normal_rgb[bg_pixels] = [128, 128, 255]

    normal_img = Image.fromarray(normal_rgb, mode="RGB")
    normal_img.save(os.path.join(out_dir_apparel, "tailored_jacket_normal.png"))
    print("Saved normal map.")

    # 5. Roughness & Metalness Maps
    # Zipper and slider are metallic
    metalness = np.zeros((height, width), dtype=np.uint8)
    is_zipper = (np.abs(xs - cx) < 6.0) & (ny > 0.15) & (ny < 0.90) & (alpha > 0.5)
    metalness[is_zipper] = 220
    metal_img = Image.fromarray(metalness, mode="L")
    metal_img.save(os.path.join(out_dir_apparel, "tailored_jacket_metalness.png"))

    roughness = np.full((height, width), 215, dtype=np.uint8) # ~0.84 for matte wool
    roughness[is_zipper] = 60 # ~0.24 for metallic teeth/slider
    rough_img = Image.fromarray(roughness, mode="L")
    rough_img.save(os.path.join(out_dir_apparel, "tailored_jacket_roughness.png"))
    print("Saved roughness and metalness maps.")

    # 6. Generate 3D Volumetric Mesh (OBJ format)
    # Downsample grid for smooth, high-fidelity real-time 3D performance
    grid_h = 100
    grid_w = 80
    
    # Coordinates of grid
    y_indices = np.linspace(150, 1000, grid_h, dtype=int)
    x_indices = np.linspace(110, 785, grid_w, dtype=int)

    # Real-world scale in meters (e.g., jacket height ~ 0.78m, width ~ 0.62m, depth ~ 0.26m)
    scale_y = 0.85
    scale_x = 0.70
    scale_z = 0.28

    front_verts = {}
    back_verts = {}
    vert_index = 1
    obj_lines = [
        "# Tailor 3D Garment Model - Bespoke Tailored Luxury Jacket",
        "mtllib tailored_jacket.mtl",
        "o TailoredJacket"
    ]

    # Precompute vertices
    for i, y in enumerate(y_indices):
        for j, x in enumerate(x_indices):
            a_val = alpha[y, x]
            if a_val > 0.18:
                # Coordinate normalized to -0.5 .. +0.5
                vx = ((x - cx) / (width * 0.5)) * (scale_x * 0.5)
                # Y positive is up in 3D
                vy = (1.0 - (y - 150) / (1000 - 150) - 0.5) * scale_y
                
                # Z depth: dome shape + depth map
                d_val = depth_map[y, x]
                # Cross section curve (elliptical torso + forward sleeves)
                norm_x = (x - cx) / (width * 0.5)
                base_dome = max(0.0, 1.0 - (norm_x * 1.5)**2)**0.5
                vz_front = (base_dome * 0.5 + d_val * 0.5) * scale_z
                vz_back = -(base_dome * 0.45) * scale_z # hollow/back curve

                u = x / float(width)
                v = 1.0 - (y / float(height)) # OBJ UVs have 0 at bottom

                front_verts[(i, j)] = (vx, vy, vz_front, u, v)
                back_verts[(i, j)] = (vx, vy, vz_back, u, v)

    # Write vertex positions
    front_v_ids = {}
    back_v_ids = {}
    
    # Vertices (v) and Texture Coords (vt) and Normals (vn)
    v_count = 0
    vt_count = 0

    for (i, j), (vx, vy, vz, u, v) in front_verts.items():
        v_count += 1
        front_v_ids[(i, j)] = v_count
        obj_lines.append(f"v {vx:.5f} {vy:.5f} {vz:.5f}")

    for (i, j), (vx, vy, vz, u, v) in back_verts.items():
        v_count += 1
        back_v_ids[(i, j)] = v_count
        obj_lines.append(f"v {vx:.5f} {vy:.5f} {vz:.5f}")

    # UV coords (vt)
    for (i, j), (vx, vy, vz, u, v) in front_verts.items():
        vt_count += 1
        obj_lines.append(f"vt {u:.5f} {v:.5f}")

    for (i, j), (vx, vy, vz, u, v) in back_verts.items():
        vt_count += 1
        obj_lines.append(f"vt {u:.5f} {v:.5f}")

    obj_lines.append("usemtl JacketFrontMaterial")
    obj_lines.append("s 1")

    # Front faces
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            p1 = (i, j)
            p2 = (i, j + 1)
            p3 = (i + 1, j + 1)
            p4 = (i + 1, j)

            if p1 in front_v_ids and p2 in front_v_ids and p3 in front_v_ids and p4 in front_v_ids:
                v1, v2, v3, v4 = front_v_ids[p1], front_v_ids[p2], front_v_ids[p3], front_v_ids[p4]
                # 2 triangles (quad)
                obj_lines.append(f"f {v1}/{v1} {v2}/{v2} {p3_id}/{p3_id}".replace(f"{p3_id}", f"{v3}"))
                obj_lines.append(f"f {v1}/{v1} {v3}/{v3} {v4}/{v4}")

    obj_lines.append("usemtl JacketBackMaterial")
    obj_lines.append("s 2")

    # Back faces (reversed winding for back-facing surface)
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            p1 = (i, j)
            p2 = (i, j + 1)
            p3 = (i + 1, j + 1)
            p4 = (i + 1, j)

            if p1 in back_v_ids and p2 in back_v_ids and p3 in back_v_ids and p4 in back_v_ids:
                v1, v2, v3, v4 = back_v_ids[p1], back_v_ids[p2], back_v_ids[p3], back_v_ids[p4]
                # Reversed winding
                obj_lines.append(f"f {v2}/{v2} {v1}/{v1} {v3}/{v3}")
                obj_lines.append(f"f {v3}/{v3} {v1}/{v1} {v4}/{v4}")

    # Side seam stitches (connecting front to back along garment boundary)
    obj_lines.append("usemtl JacketSeamMaterial")
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            # Check if this cell is on the boundary
            curr_front = (i, j) in front_v_ids
            right_front = (i, j + 1) in front_v_ids
            down_front = (i + 1, j) in front_v_ids

            if curr_front != right_front:
                # Vertical seam edge
                if curr_front:
                    vf1, vf2 = front_v_ids[(i, j)], front_v_ids[(i + 1, j)] if (i + 1, j) in front_v_ids else None
                    vb1, vb2 = back_v_ids[(i, j)], back_v_ids[(i + 1, j)] if (i + 1, j) in back_v_ids else None
                    if vf2 and vb2:
                        obj_lines.append(f"f {vf1}/{vf1} {vb1}/{vb1} {vb2}/{vb2}")
                        obj_lines.append(f"f {vf1}/{vf1} {vb2}/{vb2} {vf2}/{vf2}")
            
            if curr_front != down_front:
                # Horizontal seam edge
                if curr_front:
                    vf1, vf2 = front_v_ids[(i, j)], front_v_ids[(i, j + 1)] if (i, j + 1) in front_v_ids else None
                    vb1, vb2 = back_v_ids[(i, j)], back_v_ids[(i, j + 1)] if (i, j + 1) in back_v_ids else None
                    if vf2 and vb2:
                        obj_lines.append(f"f {vf1}/{vf1} {vf2}/{vf2} {vb2}/{vb2}")
                        obj_lines.append(f"f {vf1}/{vf1} {vb2}/{vb2} {vb1}/{vb1}")

    obj_path = os.path.join(out_dir_models, "tailored_jacket.obj")
    with open(obj_path, "w", encoding="utf-8") as f:
        f.write("\n".join(obj_lines))
    print(f"Exported {obj_path} ({len(front_verts) * 2} vertices, {len(obj_lines)} lines).")

    # 7. Write Material File (.mtl)
    mtl_content = """# Material definition for Tailored Luxury Jacket
newmtl JacketFrontMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.250 0.250 0.250
Ns 45.0
d 1.0
illum 2
map_Kd ../apparel/tailored_jacket_diffuse.png
map_Bump ../apparel/tailored_jacket_normal.png

newmtl JacketBackMaterial
Ka 0.850 0.850 0.850
Kd 0.120 0.130 0.150
Ks 0.150 0.150 0.150
Ns 25.0
d 1.0
illum 2
map_Kd ../apparel/tailored_jacket_diffuse.png

newmtl JacketSeamMaterial
Ka 0.100 0.100 0.100
Kd 0.080 0.080 0.100
Ks 0.100 0.100 0.100
Ns 10.0
d 1.0
illum 1
"""
    mtl_path = os.path.join(out_dir_models, "tailored_jacket.mtl")
    with open(mtl_path, "w", encoding="utf-8") as f:
        f.write(mtl_content)
    print(f"Exported {mtl_path}")

if __name__ == "__main__":
    create_jacket_assets()
