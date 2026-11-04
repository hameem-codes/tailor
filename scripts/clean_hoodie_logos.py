import os
import cv2
import numpy as np
from PIL import Image, ImageFilter

def remove_hoodie_logo():
    diffuse_path = "public/apparel/hoodie_hero_diffuse.png"
    normal_path = "public/apparel/hoodie_hero_normal.png"

    # 1. Load current diffuse texture
    img = cv2.imread(diffuse_path, cv2.IMREAD_UNCHANGED)
    assert img is not None, "Failed to load diffuse texture"
    h, w, c = img.shape
    b, g, r, a = cv2.split(img)
    rgb = cv2.merge([b, g, r])
    gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)

    # 2. Chest logo bounding box
    # The 4-pointed star logo is centered at (258, 227)
    box_y1, box_y2 = 140, 315
    box_x1, box_x2 = 195, 325

    # Build precise inpaint mask
    mask = np.zeros((h, w), dtype=np.uint8)
    patch = gray[box_y1:box_y2, box_x1:box_x2]

    # Baseline smooth gradient of chest fabric
    bg_patch = np.zeros_like(patch, dtype=np.float32)
    for y_idx in range(patch.shape[0]):
        left_val = float(gray[box_y1 + y_idx, box_x1 - 6])
        right_val = float(gray[box_y1 + y_idx, box_x2 + 6])
        bg_patch[y_idx, :] = np.linspace(left_val, right_val, patch.shape[1])

    # Logo differs from the smooth chest fabric gradient
    diff = np.abs(patch.astype(np.float32) - bg_patch)
    logo_mask = (diff > 10) | (patch < (bg_patch - 6))
    mask[box_y1:box_y2, box_x1:box_x2] = (logo_mask * 255).astype(np.uint8)

    # Dilate mask generously so all anti-aliased edge fringes of the star are included
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.dilate(mask, kernel, iterations=3)

    # 3. High quality inpainting
    inpainted = cv2.inpaint(rgb, mask, 5, cv2.INPAINT_TELEA)

    # Blend natural micro-fabric texture into inpainted area
    np.random.seed(42)
    noise = (np.random.randn(h, w, 3) * 1.8).astype(np.float32)
    mask_weight = (mask.astype(np.float32) / 255.0)[:, :, None]
    final_rgb = np.clip(inpainted.astype(np.float32) + noise * mask_weight, 0, 255).astype(np.uint8)

    # Save clean diffuse texture
    clean_diffuse = cv2.merge([final_rgb[:, :, 0], final_rgb[:, :, 1], final_rgb[:, :, 2], a])
    cv2.imwrite(diffuse_path, clean_diffuse)
    print("Saved clean, logo-free diffuse texture to:", diffuse_path)

    # 4. Generate pristine Normal Map from logo-free diffuse
    clean_rgb = cv2.merge([final_rgb[:, :, 2], final_rgb[:, :, 1], final_rgb[:, :, 0]]) # to RGB
    c_arr = clean_rgb.astype(np.float32)
    alpha = a.astype(np.float32) / 255.0

    ys = np.arange(h)[:, None]
    xs = np.arange(w)[None, :]
    center_x = w * 0.5
    norm_x = np.tile((xs - center_x) / (w * 0.5), (h, 1))

    torso_depth = np.maximum(0.0, 1.0 - (norm_x * 1.3)**2) * 0.65
    is_left_sleeve = (norm_x < -0.4) & (np.tile(ys > 220, (1, w)))
    is_right_sleeve = (norm_x > 0.4) & (np.tile(ys > 220, (1, w)))
    sleeve_depth = np.zeros_like(torso_depth)
    sleeve_depth[is_left_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_left_sleeve] + 0.65) / 0.35)**2) * 0.55
    sleeve_depth[is_right_sleeve] = np.maximum(0.0, 1.0 - ((norm_x[is_right_sleeve] - 0.65) / 0.35)**2) * 0.55

    is_hood = np.tile(ys < 240, (1, w))
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

    normal_rgb = np.zeros((h, w, 3), dtype=np.float32)
    normal_rgb[:, :, 0] = (nx_map * 0.5 + 0.5) * 255.0
    normal_rgb[:, :, 1] = (ny_map * 0.5 + 0.5) * 255.0
    normal_rgb[:, :, 2] = (nz_map * 0.5 + 0.5) * 255.0

    flat_normal = np.array([128.0, 128.0, 255.0], dtype=np.float32)
    alpha_weight = np.clip(alpha[:, :, None] * 2.0, 0.0, 1.0)
    smooth_normal = normal_rgb * alpha_weight + flat_normal * (1.0 - alpha_weight)

    Image.fromarray(smooth_normal.astype(np.uint8), mode="RGB").save(normal_path)
    print("Saved pristine logo-free normal map to:", normal_path)

    # 5. Clean up debug test files
    for debug_f in [
        "public/apparel/debug_logo_mask.png",
        "public/apparel/debug_inpaint_telea.png",
        "public/apparel/debug_inpaint_ns.png",
        "public/apparel/debug_clean_patch.png",
        "public/apparel/debug_chest_patch.png",
        "public/apparel/logo_test_crop.png",
    ]:
        if os.path.exists(debug_f):
            try:
                os.remove(debug_f)
            except Exception:
                pass
    print("Cleaned up temporary debug files.")

if __name__ == "__main__":
    remove_hoodie_logo()
