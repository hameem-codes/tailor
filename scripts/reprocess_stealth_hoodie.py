import os
import math
import numpy as np
from PIL import Image, ImageFilter

def reprocess_stealth_hoodie():
    input_path = "public/apparel/luxury_streetwear_hoodies.jpg"
    out_dir_apparel = "public/apparel"
    
    img = Image.open(input_path).convert("RGB")
    width, height = img.size
    arr = np.array(img, dtype=np.float32)

    # Clean crop centered on center hoodie
    crop_x1, crop_x2 = 430, 946
    crop_y1, crop_y2 = 70, 725
    center_img = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    cw, ch = center_img.size
    c_arr = np.array(center_img, dtype=np.float32)
    
    # Background is black (#060709)
    # Distance from background
    bg_color = np.array([6.0, 7.0, 9.0], dtype=np.float32)
    dist = np.linalg.norm(c_arr - bg_color, axis=2)

    # Smooth organic alpha mask
    alpha_raw = np.clip((dist - 18.0) / 32.0, 0.0, 1.0)
    
    # Smooth cosine/hermite fade at left & right borders (35 pixels) to avoid rectangular box seams
    x_coords = np.arange(cw)
    border_fade = np.ones(cw, dtype=np.float32)
    fade_len = 35
    border_fade[:fade_len] = 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, fade_len))
    border_fade[-fade_len:] = 0.5 + 0.5 * np.cos(np.linspace(0, math.pi, fade_len))
    
    alpha_clean = alpha_raw * border_fade[None, :]
    
    # Morphological smooth & gaussian blur
    mask_img = Image.fromarray((alpha_clean * 255.0).astype(np.uint8), mode="L")
    mask_smooth = mask_img.filter(ImageFilter.GaussianBlur(1.8))
    alpha = np.array(mask_smooth, dtype=np.float32) / 255.0

    # Save clean diffuse
    hero_rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
    hero_rgba[:, :, :3] = np.array(center_img, dtype=np.uint8)
    hero_rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)
    Image.fromarray(hero_rgba, mode="RGBA").save(os.path.join(out_dir_apparel, "hoodie_hero_diffuse.png"), optimize=True)
    print("Saved clean hoodie_hero_diffuse.png with seamless organic edges.")

    # Generate super smooth normal map without hard threshold step
    ys = np.arange(ch)[:, None]
    xs = np.arange(cw)[None, :]
    center_x = cw * 0.5
    norm_x = np.tile((xs - center_x) / (cw * 0.5), (ch, 1))

    torso_depth = np.maximum(0.0, 1.0 - (norm_x * 1.3)**2) * 0.65
    is_left_sleeve = (norm_x < -0.4) & (np.tile(ys > 220, (1, cw)))
    is_right_sleeve = (norm_x > 0.4) & (np.tile(ys > 220, (1, cw)))
    sleeve_depth = np.zeros_like(torso_depth)
    sleeve_depth[is_left_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_left_sleeve] + 0.65) / 0.35)**2) * 0.55
    sleeve_depth[is_right_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_right_sleeve] - 0.65) / 0.35)**2) * 0.55

    is_hood = np.tile(ys < 240, (1, cw))
    hood_rim = np.zeros_like(torso_depth)
    hood_rim[is_hood] = np.exp(-((norm_x[is_hood])**2) / (2.0 * 0.4**2)) * 0.4

    lum = (c_arr[:, :, 0] * 0.299 + c_arr[:, :, 1] * 0.587 + c_arr[:, :, 2] * 0.114) / 255.0
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

    # Smoothly lerp towards flat normal [128, 128, 255] by alpha
    flat_normal = np.array([128.0, 128.0, 255.0], dtype=np.float32)
    alpha_weight = np.clip(alpha[:, :, None] * 2.0, 0.0, 1.0)
    smooth_normal = normal_rgb * alpha_weight + flat_normal * (1.0 - alpha_weight)
    
    Image.fromarray(smooth_normal.astype(np.uint8), mode="RGB").save(os.path.join(out_dir_apparel, "hoodie_hero_normal.png"))
    print("Saved smooth hoodie_hero_normal.png")

if __name__ == "__main__":
    reprocess_stealth_hoodie()
