import os
import numpy as np
from PIL import Image
from skimage import measure

src_path = r'C:\Users\matee\.gemini\antigravity\brain\7aefb9a8-d719-4d2e-9743-73ed32e84685\.user_uploaded\media_1793813590831_465b7065.png'
out_dir = r'c:\Users\matee\OneDrive\Desktop\Resume Tools\Projects\Tailor\public'

orig = Image.open(src_path).convert('L')
arr = np.array(orig, dtype=np.float32)

# Bounding box
mask = arr < 245
y_indices, x_indices = np.where(mask)
pad = 6
ymin = max(0, int(y_indices.min()) - pad)
ymax = min(arr.shape[0] - 1, int(y_indices.max()) + pad)
xmin = max(0, int(x_indices.min()) - pad)
xmax = min(arr.shape[1] - 1, int(x_indices.max()) + pad)

cropped = orig.crop((xmin, ymin, xmax + 1, ymax + 1))
cw, ch = cropped.size

# 4x Upscale with Lanczos for smooth subpixel details
scale = 4
up_w = cw * scale
up_h = ch * scale
high_res = cropped.resize((up_w, up_h), Image.Resampling.LANCZOS)
high_arr = np.array(high_res, dtype=np.float32)

t_high = 246.0
t_low = 35.0
alpha = np.clip((t_high - high_arr) / (t_high - t_low), 0.0, 1.0)
alpha = (alpha ** 1.1) * 255.0
alpha = np.clip(alpha, 0, 255).astype(np.uint8)

# 1. Ultra high-DPI transparent white PNG
white_arr = np.zeros((up_h, up_w, 4), dtype=np.uint8)
white_arr[..., 0] = 255
white_arr[..., 1] = 255
white_arr[..., 2] = 255
white_arr[..., 3] = alpha
result_white = Image.fromarray(white_arr, 'RGBA')
result_white.save(os.path.join(out_dir, 'logo-tailor-white.png'), 'PNG')

# 2. Emerald accent version (Needle & loop in emerald #4ADE80, Tailor in white)
accent_arr = np.zeros((up_h, up_w, 4), dtype=np.uint8)
y_split = int(0.44 * up_h)
y_fade = int(0.08 * up_h)
for y in range(up_h):
    if y < y_split:
        factor = 1.0
    elif y < y_split + y_fade:
        factor = 1.0 - (y - y_split) / y_fade
    else:
        factor = 0.0
    accent_arr[y, :, 0] = int(255 * (1 - factor) + 74 * factor)
    accent_arr[y, :, 1] = int(255 * (1 - factor) + 222 * factor)
    accent_arr[y, :, 2] = int(255 * (1 - factor) + 128 * factor)
accent_arr[..., 3] = alpha
result_accent = Image.fromarray(accent_arr, 'RGBA')
result_accent.save(os.path.join(out_dir, 'logo-tailor-accent.png'), 'PNG')

# 3. Vector SVG extraction with Douglas-Peucker Polygon Approximation
contours = measure.find_contours(alpha, 128)
needle_paths = []
text_paths = []
all_paths = []

for c in contours:
    poly = measure.approximate_polygon(c, tolerance=1.4)
    poly_norm = poly / scale
    mean_y = poly_norm[:, 0].mean()
    cmds = [f"M {poly_norm[0,1]:.1f} {poly_norm[0,0]:.1f}"]
    for pt in poly_norm[1:]:
        cmds.append(f"L {pt[1]:.1f} {pt[0]:.1f}")
    cmds.append("Z")
    p_str = " ".join(cmds)
    all_paths.append(p_str)
    if mean_y < ch * 0.46:
        needle_paths.append(p_str)
    else:
        text_paths.append(p_str)

all_d = " ".join(all_paths)
needle_d = " ".join(needle_paths)
text_d = " ".join(text_paths)

# Vector SVGs
vector_svg_white = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw} {ch}" fill="currentColor">
  <path fill-rule="evenodd" d="{all_d}" />
</svg>'''

vector_svg_accent = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw} {ch}" fill="none">
  <!-- Needle & looping thread in vibrant emerald accent -->
  <path fill-rule="evenodd" d="{needle_d}" fill="#4ADE80" />
  <!-- Tailor script typography in pure crisp white -->
  <path fill-rule="evenodd" d="{text_d}" fill="#FFFFFF" />
</svg>'''

with open(os.path.join(out_dir, 'logo-tailor.svg'), 'w', encoding='utf-8') as f:
    f.write(vector_svg_accent)

with open(os.path.join(out_dir, 'logo-tailor-white.svg'), 'w', encoding='utf-8') as f:
    f.write(vector_svg_white)

with open(os.path.join(out_dir, 'logo-tailor-accent.svg'), 'w', encoding='utf-8') as f:
    f.write(vector_svg_accent)

# 4. Favicon SVG (dark badge with emerald needle + white script)
favicon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw} {ch}" fill="none">
  <rect width="{cw}" height="{ch}" rx="32" fill="#111113" />
  <path fill-rule="evenodd" d="{needle_d}" fill="#4ADE80" />
  <path fill-rule="evenodd" d="{text_d}" fill="#FFFFFF" />
</svg>'''

with open(os.path.join(out_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(favicon_svg)

# 5. Favicon PNG
fav = result_accent.resize((64, 64), Image.Resampling.LANCZOS)
fav.save(os.path.join(out_dir, 'favicon.png'), 'PNG')

print("Logo generation complete!")
