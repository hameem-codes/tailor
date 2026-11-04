import os
import math
import numpy as np
from PIL import Image, ImageFilter

def create_perfect_clean_hoodie():
    input_path = "public/apparel/luxury_streetwear_hoodies.jpg"
    out_dir_apparel = "public/apparel"
    
    img = Image.open(input_path).convert("RGB")
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    # 1. Cleanly isolate the center hoodie without any adjacent hoodie overlap
    ys, xs = np.indices((h, w))

    # Center hoodie boundaries
    # Collar/hood: (560 to 815, Y=80 to 220)
    # Shoulders/chest: (520 to 845, Y=220 to 450)
    # Body/hem: (530 to 835, Y=450 to 710)
    left_bound = 525.0 + np.sin(ys * 0.01) * 8.0
    right_bound = 840.0 - np.sin(ys * 0.01) * 8.0
    
    # Natural torso mask
    center_mask = (xs >= left_bound) & (xs <= right_bound) & (ys >= 80) & (ys <= 710)
    
    # Background distance mask (background is #060709)
    bg_color = np.array([6.0, 7.0, 9.0], dtype=np.float32)
    dist = np.linalg.norm(arr - bg_color, axis=2)
    alpha_raw = np.clip((dist - 16.0) / 28.0, 0.0, 1.0) * center_mask

    # Crop bounds with padding
    crop_x1, crop_x2 = 505, 860
    crop_y1, crop_y2 = 75, 715
    
    cw = crop_x2 - crop_x1
    ch = crop_y2 - crop_y1
    
    cropped_rgb = arr[crop_y1:crop_y2, crop_x1:crop_x2]
    cropped_alpha_raw = alpha_raw[crop_y1:crop_y2, crop_x1:crop_x2]

    # Feather the alpha smoothly around the boundary (hermite curve)
    mask_img = Image.fromarray((cropped_alpha_raw * 255.0).astype(np.uint8), mode="L")
    mask_smooth = mask_img.filter(ImageFilter.GaussianBlur(1.5))
    alpha = np.array(mask_smooth, dtype=np.float32) / 255.0

    # Ensure border pixels are strictly 0
    alpha[:4, :] = 0.0
    alpha[-4:, :] = 0.0
    alpha[:, :4] = 0.0
    alpha[:, -4:] = 0.0

    hero_rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
    hero_rgba[:, :, :3] = cropped_rgb.astype(np.uint8)
    hero_rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)

    diffuse_img = Image.fromarray(hero_rgba, mode="RGBA")
    diffuse_img.save(os.path.join(out_dir_apparel, "hoodie_hero_diffuse.png"), optimize=True)
    print(f"Saved flawless hoodie_hero_diffuse.png ({cw}x{ch})")

    # 2. Smooth Normal Map
    cy_grid = np.arange(ch)[:, None]
    cx_grid = np.arange(cw)[None, :]
    center_x = cw * 0.5
    norm_x = np.tile((cx_grid - center_x) / (cw * 0.5), (ch, 1))

    torso_depth = np.maximum(0.0, 1.0 - (norm_x * 1.25)**2) * 0.65
    is_left_sleeve = (norm_x < -0.38) & (np.tile(cy_grid > 200, (1, cw)))
    is_right_sleeve = (norm_x > 0.38) & (np.tile(cy_grid > 200, (1, cw)))
    sleeve_depth = np.zeros_like(torso_depth)
    sleeve_depth[is_left_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_left_sleeve] + 0.65) / 0.35)**2) * 0.55
    sleeve_depth[is_right_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_right_sleeve] - 0.65) / 0.35)**2) * 0.55

    is_hood = np.tile(cy_grid < 230, (1, cw))
    hood_rim = np.zeros_like(torso_depth)
    hood_rim[is_hood] = np.exp(-((norm_x[is_hood])**2) / (2.0 * 0.42**2)) * 0.38

    lum = (cropped_rgb[:, :, 0] * 0.299 + cropped_rgb[:, :, 1] * 0.587 + cropped_rgb[:, :, 2] * 0.114) / 255.0
    lum_centered = lum - lum.mean()

    depth_map = (torso_depth + sleeve_depth + hood_rim + lum_centered * 0.08) * alpha
    
    gy, gx = np.gradient(depth_map.astype(np.float32) * 8.0)
    lum_gy, lum_gx = np.gradient(lum * 4.0)
    total_gx = gx + lum_gx * 0.4
    total_gy = gy + lum_gy * 0.4

    normal_z = np.ones_like(total_gx)
    length = np.sqrt(total_gx**2 + total_gy**2 + normal_z**2)
    nx_map = -total_gx / length
    ny_map = -total_gy / length
    nz_map = normal_z / length

    normal_rgb = np.zeros((ch, cw, 3), dtype=np.float32)
    normal_rgb[:, :, 0] = (nx_map * 0.5 + 0.5) * 255.0
    normal_rgb[:, :, 1] = (ny_map * 0.5 + 0.5) * 255.0
    normal_rgb[:, :, 2] = (nz_map * 0.5 + 0.5) * 255.0

    flat_normal = np.array([128.0, 128.0, 255.0], dtype=np.float32)
    alpha_weight = np.clip(alpha[:, :, None] * 2.0, 0.0, 1.0)
    smooth_normal = normal_rgb * alpha_weight + flat_normal * (1.0 - alpha_weight)
    
    Image.fromarray(smooth_normal.astype(np.uint8), mode="RGB").save(os.path.join(out_dir_apparel, "hoodie_hero_normal.png"))
    print("Saved smooth hoodie_hero_normal.png")

if __name__ == "__main__":
    create_perfect_clean_hoodie()
