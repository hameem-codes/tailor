import os
import math
import numpy as np
from PIL import Image, ImageFilter

def process_hoodie_assets():
    input_path = "public/apparel/luxury_streetwear_hoodies.jpg"
    out_dir_apparel = "public/apparel"
    out_dir_models = "public/models"
    os.makedirs(out_dir_apparel, exist_ok=True)
    os.makedirs(out_dir_models, exist_ok=True)

    img = Image.open(input_path).convert("RGB")
    width, height = img.size
    arr = np.array(img, dtype=np.float32)

    # 1. Full Trio Transparency Mask
    # Background is near-black (#060709). Light-colored hoodies have R,G,B > 25
    max_c = np.max(arr, axis=2)
    # Smooth alpha transition between 15 and 40 brightness
    alpha_raw = np.clip((max_c - 16.0) / 28.0, 0.0, 1.0)
    
    # Filter tiny background noise
    alpha_img = Image.fromarray((alpha_raw * 255.0).astype(np.uint8), mode="L")
    alpha_clean = alpha_img.filter(ImageFilter.GaussianBlur(1.0))
    alpha_trio = np.array(alpha_clean, dtype=np.float32) / 255.0

    # Save Full Trio Diffuse
    trio_rgba = np.zeros((height, width, 4), dtype=np.uint8)
    trio_rgba[:, :, :3] = np.array(img, dtype=np.uint8)
    trio_rgba[:, :, 3] = (alpha_trio * 255.0).astype(np.uint8)
    Image.fromarray(trio_rgba, mode="RGBA").save(os.path.join(out_dir_apparel, "hoodies_trio_diffuse.png"), optimize=True)
    print("Saved hoodies_trio_diffuse.png")

    # 2. Extract Center Hero Hoodie (Clean crop)
    # Bounds: X=[445, 930], Y=[80, 715]
    crop_x1, crop_x2 = 445, 930
    crop_y1, crop_y2 = 80, 715
    center_img = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    cw, ch = center_img.size
    c_arr = np.array(center_img, dtype=np.float32)
    c_max = np.max(c_arr, axis=2)

    # Hero alpha
    c_alpha_raw = np.clip((c_max - 18.0) / 26.0, 0.0, 1.0)
    # Cut off side overlap from left/right hoodies
    # Left edge < 25 and Right edge > cw - 25 fade out
    fade_x = np.ones((ch, cw), dtype=np.float32)
    fade_x[:, :20] = np.linspace(0, 1, 20)[None, :]
    fade_x[:, -20:] = np.linspace(1, 0, 20)[None, :]
    c_alpha_clean = c_alpha_raw * fade_x

    c_alpha_img = Image.fromarray((c_alpha_clean * 255.0).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(1.2))
    c_alpha = np.array(c_alpha_img, dtype=np.float32) / 255.0

    hero_rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
    hero_rgba[:, :, :3] = np.array(center_img, dtype=np.uint8)
    hero_rgba[:, :, 3] = (c_alpha * 255.0).astype(np.uint8)
    hero_img = Image.fromarray(hero_rgba, mode="RGBA")
    hero_img.save(os.path.join(out_dir_apparel, "hoodie_hero_diffuse.png"), optimize=True)
    print(f"Saved hoodie_hero_diffuse.png ({cw}x{ch})")

    # 3. Tangent Normal Map & Depth Map for Center Hoodie
    ys = np.arange(ch)[:, None]
    xs = np.arange(cw)[None, :]
    center_x = cw * 0.5

    # Anatomical streetwear hoodie depth:
    # 1. Voluminous open hood at top (Y from 0 to 220)
    # 2. Chest & wide dropped shoulders (Y from 200 to 520)
    # 3. Puffy drop-sleeves extending outwards
    # 4. Gathered cuffs and cropped waist ribbing
    norm_x = np.tile((xs - center_x) / (cw * 0.5), (ch, 1))
    norm_y = np.tile((ys - ch * 0.5) / (ch * 0.5), (1, cw))

    # Torso dome
    torso_depth = np.maximum(0.0, 1.0 - (norm_x * 1.3)**2) * 0.65
    # Puffy sleeves depth
    is_left_sleeve = (norm_x < -0.4) & (ys > 220)
    is_right_sleeve = (norm_x > 0.4) & (ys > 220)
    sleeve_depth = np.zeros_like(torso_depth)
    sleeve_depth[is_left_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_left_sleeve] + 0.65) / 0.35)**2) * 0.55
    sleeve_depth[is_right_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_right_sleeve] - 0.65) / 0.35)**2) * 0.55

    # Hood hollow & rim:
    is_hood = np.tile(ys < 240, (1, cw))
    hood_rim = np.zeros_like(torso_depth)
    # Rim is raised, inner hood is recessed
    hood_rim[is_hood] = np.exp(-((norm_x[is_hood])**2) / (2.0 * 0.4**2)) * 0.4

    # Fabric micro folds from luminance
    lum = (c_arr[:, :, 0] * 0.299 + c_arr[:, :, 1] * 0.587 + c_arr[:, :, 2] * 0.114) / 255.0
    lum_centered = lum - lum.mean()

    depth_map = (torso_depth + sleeve_depth + hood_rim + lum_centered * 0.12) * c_alpha
    depth_norm = np.clip(depth_map * 255.0, 0, 255).astype(np.uint8)
    Image.fromarray(depth_norm, mode="L").save(os.path.join(out_dir_apparel, "hoodie_hero_depth.png"))
    print("Saved hoodie_hero_depth.png")

    # Normal map via gradients
    gy, gx = np.gradient(depth_map.astype(np.float32) * 14.0)
    lum_gy, lum_gx = np.gradient(lum * 6.0)
    total_gx = gx + lum_gx * 0.5
    total_gy = gy + lum_gy * 0.5

    normal_z = np.ones_like(total_gx)
    length = np.sqrt(total_gx**2 + total_gy**2 + normal_z**2)
    nx_map = -total_gx / length
    ny_map = -total_gy / length
    nz_map = normal_z / length

    normal_rgb = np.zeros((ch, cw, 3), dtype=np.uint8)
    normal_rgb[:, :, 0] = np.clip((nx_map * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    normal_rgb[:, :, 1] = np.clip((ny_map * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    normal_rgb[:, :, 2] = np.clip((nz_map * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    normal_rgb[c_alpha < 0.1] = [128, 128, 255]

    Image.fromarray(normal_rgb, mode="RGB").save(os.path.join(out_dir_apparel, "hoodie_hero_normal.png"))
    print("Saved hoodie_hero_normal.png")

    # 4. Generate 3D Mesh (OBJ)
    grid_h = 75
    grid_w = 60
    y_indices = np.linspace(10, ch - 15, grid_h, dtype=int)
    x_indices = np.linspace(15, cw - 15, grid_w, dtype=int)

    scale_y = 1.35
    scale_x = 1.25
    scale_z = 0.48

    front_verts = {}
    back_verts = {}

    for i, y in enumerate(y_indices):
        for j, x in enumerate(x_indices):
            a_val = c_alpha[y, x]
            if a_val > 0.22:
                vx = ((x - center_x) / (cw * 0.5)) * (scale_x * 0.5)
                vy = (1.0 - y / float(ch) - 0.5) * scale_y
                d_val = depth_map[y, x]

                norm_x_val = (x - center_x) / (cw * 0.5)
                base_dome = max(0.0, 1.0 - (norm_x_val * 1.3)**2)**0.5
                vz_front = (base_dome * 0.45 + d_val * 0.55) * scale_z
                vz_back = -(base_dome * 0.4) * scale_z

                u = x / float(cw)
                v = 1.0 - (y / float(ch))

                front_verts[(i, j)] = (vx, vy, vz_front, u, v)
                back_verts[(i, j)] = (vx, vy, vz_back, u, v)

    obj_lines = [
        "# Tailor 3D Luxury Streetwear Hoodie",
        "mtllib streetwear_hoodie.mtl",
        "o StreetwearHoodie"
    ]

    front_v_ids = {}
    back_v_ids = {}
    v_count = 0

    for (i, j), (vx, vy, vz, u, v) in front_verts.items():
        v_count += 1
        front_v_ids[(i, j)] = v_count
        obj_lines.append(f"v {vx:.5f} {vy:.5f} {vz:.5f}")

    for (i, j), (vx, vy, vz, u, v) in back_verts.items():
        v_count += 1
        back_v_ids[(i, j)] = v_count
        obj_lines.append(f"v {vx:.5f} {vy:.5f} {vz:.5f}")

    for (i, j), (vx, vy, vz, u, v) in front_verts.items():
        obj_lines.append(f"vt {u:.5f} {v:.5f}")

    for (i, j), (vx, vy, vz, u, v) in back_verts.items():
        obj_lines.append(f"vt {u:.5f} {v:.5f}")

    obj_lines.append("usemtl HoodieFrontMaterial")
    obj_lines.append("s 1")
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            p1, p2, p3, p4 = (i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j)
            if p1 in front_v_ids and p2 in front_v_ids and p3 in front_v_ids and p4 in front_v_ids:
                v1, v2, v3, v4 = front_v_ids[p1], front_v_ids[p2], front_v_ids[p3], front_v_ids[p4]
                obj_lines.append(f"f {v1}/{v1} {v2}/{v2} {v3}/{v3}")
                obj_lines.append(f"f {v1}/{v1} {v3}/{v3} {v4}/{v4}")

    obj_lines.append("usemtl HoodieBackMaterial")
    obj_lines.append("s 2")
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            p1, p2, p3, p4 = (i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j)
            if p1 in back_v_ids and p2 in back_v_ids and p3 in back_v_ids and p4 in back_v_ids:
                v1, v2, v3, v4 = back_v_ids[p1], back_v_ids[p2], back_v_ids[p3], back_v_ids[p4]
                obj_lines.append(f"f {v2}/{v2} {v1}/{v1} {v3}/{v3}")
                obj_lines.append(f"f {v3}/{v3} {v1}/{v1} {v4}/{v4}")

    # Side seam stitches
    obj_lines.append("usemtl HoodieSeamMaterial")
    for i in range(grid_h - 1):
        for j in range(grid_w - 1):
            curr_front = (i, j) in front_v_ids
            right_front = (i, j + 1) in front_v_ids
            down_front = (i + 1, j) in front_v_ids

            if curr_front != right_front and curr_front:
                if (i + 1, j) in front_v_ids and (i + 1, j) in back_v_ids:
                    vf1, vf2 = front_v_ids[(i, j)], front_v_ids[(i + 1, j)]
                    vb1, vb2 = back_v_ids[(i, j)], back_v_ids[(i + 1, j)]
                    obj_lines.append(f"f {vf1}/{vf1} {vb1}/{vb1} {vb2}/{vb2}")
                    obj_lines.append(f"f {vf1}/{vf1} {vb2}/{vb2} {vf2}/{vf2}")

            if curr_front != down_front and curr_front:
                if (i, j + 1) in front_v_ids and (i, j + 1) in back_v_ids:
                    vf1, vf2 = front_v_ids[(i, j)], front_v_ids[(i, j + 1)]
                    vb1, vb2 = back_v_ids[(i, j)], back_v_ids[(i, j + 1)]
                    obj_lines.append(f"f {vf1}/{vf1} {vf2}/{vf2} {vb2}/{vb2}")
                    obj_lines.append(f"f {vf1}/{vf1} {vb2}/{vb2} {vb1}/{vb1}")

    obj_path = os.path.join(out_dir_models, "streetwear_hoodie.obj")
    with open(obj_path, "w", encoding="utf-8") as f:
        f.write("\n".join(obj_lines))
    print(f"Exported {obj_path} ({len(front_verts)*2} vertices, {len(obj_lines)} lines)")

    # MTL file
    mtl_content = """# Material definition for Streetwear Luxury Hoodie (Light Colorway, No Green)
newmtl HoodieFrontMaterial
Ka 1.0 1.0 1.0
Kd 0.96 0.96 0.98
Ks 0.20 0.20 0.22
Ns 35.0
d 1.0
illum 2
map_Kd ../apparel/hoodie_hero_diffuse.png
map_Bump ../apparel/hoodie_hero_normal.png

newmtl HoodieBackMaterial
Ka 0.90 0.90 0.92
Kd 0.18 0.18 0.20
Ks 0.10 0.10 0.12
Ns 20.0
d 1.0
illum 2
map_Kd ../apparel/hoodie_hero_diffuse.png

newmtl HoodieSeamMaterial
Ka 0.20 0.20 0.22
Kd 0.15 0.15 0.18
Ks 0.05 0.05 0.05
Ns 10.0
d 1.0
illum 1
"""
    mtl_path = os.path.join(out_dir_models, "streetwear_hoodie.mtl")
    with open(mtl_path, "w", encoding="utf-8") as f:
        f.write(mtl_content)
    print(f"Exported {mtl_path}")

if __name__ == "__main__":
    process_hoodie_assets()
