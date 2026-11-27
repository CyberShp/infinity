#!/usr/bin/env python3
"""
Infinity 2.5D Art Asset Packing Pipeline (tools/pack_art_assets.py)
==================================================================
Production pipeline for Lineup-A heavy-ink 2.5D character sprite sheets and
Hades-style 2x2 VFX flipbooks:

  1. Chroma-key & edge despill for #00FF00 green-screen sheets while preserving
     cyan/teal energy blades, holographic tablets, amber visors, gold books,
     and crimson lanterns with zero green fringe.
  2. Automatic 4-frame segmentation (valley-cut / component clustering) with
     uniform scale and strict foot-bottom baseline locking across all frames.
  3. Tangent-space Normal Map derivation (OpenGL +X right, +Y up, +Z out)
     combining distance-field silhouette volume with luminance micro-relief.
  4. Character-aware selective Emissive Mask extraction clamping skin, hair,
     and cloth strictly <= 12 (no light-box overexposure in dark horror lighting).
  5. 2x2 Hades Flipbook standardization (1024x1024 pure black background,
     center crossbar & edge divider removal, cell-border bleed guard).
  6. QA contact-sheet builder for visual inspection.

Dependencies: Pillow, numpy, scipy
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage


# ---------------------------------------------------------------------------
# Color space helpers (vectorized float32 in [0, 1])
# ---------------------------------------------------------------------------

def rgb_to_hsv(rgb: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convert float32 RGB in [0, 1] (H, W, 3) to H (deg 0..360), S (0..1), V (0..1)."""
    r = rgb[..., 0]
    g = rgb[..., 1]
    b = rgb[..., 2]
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin

    h = np.zeros_like(cmax, dtype=np.float32)
    mask = delta > 1e-6

    rm = mask & (cmax == r)
    gm = mask & (cmax == g) & (~rm)
    bm = mask & (~rm) & (~gm)

    h[rm] = (60.0 * (((g[rm] - b[rm]) / delta[rm]) % 6.0))
    h[gm] = (60.0 * (((b[gm] - r[gm]) / delta[gm]) + 2.0))
    h[bm] = (60.0 * (((r[bm] - g[bm]) / delta[bm]) + 4.0))
    h = np.mod(h, 360.0)

    s = np.where(cmax > 1e-6, delta / np.maximum(cmax, 1e-6), 0.0).astype(np.float32)
    v = cmax.astype(np.float32)
    return h, s, v


def hue_dist_deg(h: np.ndarray, target_deg: float) -> np.ndarray:
    d = np.abs(h - target_deg)
    return np.minimum(d, 360.0 - d)


# ---------------------------------------------------------------------------
# 1. Green-screen chroma-key & despill
# ---------------------------------------------------------------------------

def key_greenscreen(img: Image.Image) -> Image.Image:
    """
    Remove pure #00FF00 green-screen background (including interior holes between
    legs/arms/scissors) and remove green edge spill while strictly preserving
    bright glowing cyan/teal/gold energy blades, tablets, visors, and lanterns.
    """
    rgba = np.array(img.convert("RGBA"), dtype=np.float32)
    r, g, b, a_in = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
    rgb01 = rgba[..., :3] / 255.0
    h, s, v = rgb_to_hsv(rgb01)

    max_rb = np.maximum(r, b)
    green_excess = g - max_rb

    # Pure chroma-key #00FF00 has high green saturation (S >= 0.62) and low R & B.
    # Bright glowing cyan/gold sword cores have high B or high R (low S or max_rb > 135),
    # so requiring S >= 0.62 and max_rb <= 135 guarantees glowing weapons are never eaten.
    is_chroma_hue = (h >= 88.0) & (h <= 146.0)
    hard_bg = (
        is_chroma_hue
        & (s >= 0.62)
        & (g >= 115.0)
        & (max_rb <= 135.0)
        & (green_excess >= 72.0)
        & (g > r * 1.45)
        & (g > b * 1.40)
    )

    # Anti-aliased border pixels immediately adjacent to hard_bg
    soft_bg_candidate = (
        (h >= 82.0) & (h <= 152.0)
        & (s >= 0.45)
        & (g >= 85.0)
        & (max_rb <= 150.0)
        & (green_excess >= 38.0)
        & (g > b * 1.25)
    )

    near_hard_bg = ndimage.binary_dilation(hard_bg, iterations=2)
    bg_mask = hard_bg | (soft_bg_candidate & near_hard_bg)

    alpha = np.where(bg_mask, 0.0, a_in / 255.0).astype(np.float32)

    # Smooth 2px anti-aliased edge feathering ONLY for chroma-green fringe (not cyan/gold glow)
    fringe_zone = ndimage.binary_dilation(bg_mask, iterations=2) & (~bg_mask)
    fringe_green = (
        fringe_zone
        & (h >= 80.0) & (h <= 152.0)
        & (s >= 0.35)
        & (max_rb <= 165.0)
        & (green_excess > 18.0)
        & (g > b * 1.15)
    )
    feather = np.clip(1.0 - (green_excess - 18.0) / 62.0, 0.0, 1.0)
    alpha = np.where(fringe_green, np.minimum(alpha, feather), alpha)

    # Remove tiny isolated speckle noise (< 24 pixels)
    fg_bin = alpha > 0.12
    labeled, num = ndimage.label(fg_bin)
    if num > 0:
        sizes = ndimage.sum(fg_bin, labeled, range(1, num + 1))
        small_ids = np.where(np.asarray(sizes) < 24)[0] + 1
        if len(small_ids) > 0:
            drop = np.isin(labeled, small_ids)
            alpha[drop] = 0.0

    # Despill pass: suppress residual green reflection on edge pixels (within 5px of alpha=0)
    # including yellow-green bloom halos (e.g. amber muzzle flash / gold watch / red lantern
    # composited over #00FF00) and mint-shifted cyan holograms, while preserving pure cyan/gold.
    edge_band = ndimage.binary_dilation(alpha < 0.25, iterations=5) & (alpha > 0.0)
    spill_mask = edge_band & (h >= 62.0) & (h <= 156.0) & (green_excess > 4.0) & (b < g * 0.92)

    r_out = r.copy()
    g_out = g.copy()
    b_out = b.copy()

    tight_band = ndimage.binary_dilation(alpha < 0.25, iterations=3) & spill_mask
    soft_band = spill_mask & (~tight_band)

    avg_rb = 0.5 * (r + b)
    # Pull green spill on dark ink outlines to avg(R,B); on warm glows clamp G <= R*0.92 so
    # yellow-green screen contamination turns back into clean warm gold/amber/red
    warm_glow = (r >= 90.0) & (b < 115.0) & (g > r)
    g_target_tight = np.where(max_rb < 64.0, avg_rb, np.where(warm_glow, r * 0.90, max_rb))
    g_out = np.where(tight_band, np.minimum(g_out, g_target_tight), g_out)
    g_out = np.where(soft_band, np.minimum(g_out, np.where(warm_glow, r * 0.96, max_rb + 6.0)), g_out)

    # Also catch interior yellow-green lantern/ring bleed (e.g. red/gold glass over green screen)
    # where B is very low and G exceeds R on bright yellow-green pixels adjacent to dark/warm edges
    interior_yg = (alpha > 0.0) & (h >= 64.0) & (h <= 135.0) & (g > r + 14.0) & (b < 95.0) & (r > 70.0)
    g_out = np.where(interior_yg, np.minimum(g_out, r * 0.92), g_out)

    # Subtle cyan-hologram green-screen un-tinting: translucent cyan over #00FF00 shifts mint (G > B)
    mint_holo = (alpha > 0.0) & (h >= 142.0) & (h <= 176.0) & (b >= 110.0) & (g > b + 12.0)
    g_out = np.where(mint_holo, np.minimum(g_out, b * 1.06 + 8.0), g_out)
    b_out = np.where(mint_holo, np.minimum(255.0, b_out * 1.08), b_out)

    zero = alpha <= (2.0 / 255.0)
    r_out[zero] = 0.0
    g_out[zero] = 0.0
    b_out[zero] = 0.0
    alpha[zero] = 0.0

    out = np.stack([
        np.clip(r_out, 0, 255),
        np.clip(g_out, 0, 255),
        np.clip(b_out, 0, 255),
        np.clip(alpha * 255.0, 0, 255),
    ], axis=-1).astype(np.uint8)
    return Image.fromarray(out)


# ---------------------------------------------------------------------------
# 2. 4-frame 2D segmentation & foot-bottom anchor locking
# ---------------------------------------------------------------------------

def _segment_frames_2d(rgba: np.ndarray, n_frames: int = 4) -> List[Tuple[np.ndarray, float, List[int]]]:
    """
    Segment a horizontal n_frames sprite sheet using 2D connected components
    so outstretched weapons overlapping a neighbor's empty air space stay
    intact with their owner frame instead of getting sliced vertically.
    Falls back to valley-splitting only if two characters touch in 2D.
    Returns list of (crop_rgba, anchor_x, [x0, x1]).
    """
    h, w = rgba.shape[:2]
    alpha = rgba[..., 3]
    fg = alpha > 18

    # Light 3px dilation bridges 1-2px gaps (thin blade glow / lantern wire) without merging characters
    bridged = ndimage.binary_dilation(fg, iterations=2)
    labeled, num = ndimage.label(bridged)

    comps = []
    for cid in range(1, num + 1):
        mask = (labeled == cid) & fg
        area = int(mask.sum())
        if area < 20:
            continue
        ys, xs = np.where(mask)
        cx = float(xs.mean())
        comps.append({
            "cid": cid,
            "mask": mask,
            "area": area,
            "cx": cx,
            "bbox": (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1),
        })

    if len(comps) >= n_frames:
        # Pick the n_frames largest components as the main character bodies
        comps_by_area = sorted(comps, key=lambda c: c["area"], reverse=True)
        mains = comps_by_area[:n_frames]
        satellites = comps_by_area[n_frames:]

        # Verify all n_frames main components are real bodies (smallest >= 15% of largest)
        if mains[-1]["area"] >= mains[0]["area"] * 0.15:
            mains.sort(key=lambda c: c["cx"])
            # Precompute Euclidean distance transform from each main component to assign satellites
            frame_masks = [m["mask"].copy() for m in mains]
            if satellites:
                dist_maps = [ndimage.distance_transform_edt(~fm) for fm in frame_masks]
                for sat in satellites:
                    sy, sx = np.where(sat["mask"])
                    dists = [float(dm[sy, sx].min()) for dm in dist_maps]
                    best_idx = int(np.argmin(dists))
                    # Attach if reasonably close (e.g., detached sword tip or sparks)
                    if dists[best_idx] <= max(w, h) * 0.14:
                        frame_masks[best_idx] |= sat["mask"]

            results = []
            for fm in frame_masks:
                # Include soft anti-aliased 2px halo around this component
                halo = ndimage.binary_dilation(fm, iterations=2)
                ys, xs = np.where(fm)
                y0, y1 = max(0, int(ys.min()) - 2), min(h, int(ys.max()) + 3)
                x0, x1 = max(0, int(xs.min()) - 2), min(w, int(xs.max()) + 3)
                sub = rgba[y0:y1, x0:x1, :].copy()
                sub_mask = halo[y0:y1, x0:x1]
                sub[~sub_mask] = 0
                ch, cw = sub.shape[:2]
                lower_start = int(ch * 0.55)
                lower_a = (sub[lower_start:, :, 3] > 24).astype(np.float32)
                if lower_a.sum() > 10:
                    x_coords = np.arange(cw, dtype=np.float32)[None, :]
                    anchor_x = float((lower_a * x_coords).sum() / lower_a.sum())
                else:
                    anchor_x = cw * 0.5
                results.append((sub, anchor_x, [x0, x1]))
            return results

    # Fallback: 1D vertical valley search across foreground span (handles lightly touching poses)
    col_mass = fg.sum(axis=0)
    nz = np.where(col_mass > 0)[0]
    if len(nz) == 0:
        raise ValueError(
            "Input image contains zero foreground pixels after chroma-keying; "
            "refusing to produce an empty sprite sheet."
        )
    x_min, x_max = int(nz[0]), int(nz[-1]) + 1
    span = max(1, x_max - x_min)
    if span < int(w * 0.55):
        raise ValueError(
            f"Foreground spans only {span}/{w}px ({span / float(w) * 100:.1f}% < 55%) and "
            f"did not yield {n_frames} distinct 2D character bodies; refusing to slice a partial sheet."
        )

    smooth_mass = ndimage.gaussian_filter1d(col_mass.astype(np.float32), sigma=2.0)
    peak_mass = float(np.percentile(col_mass[nz], 90))
    cuts = [0]
    for i in range(1, n_frames):
        ideal = x_min + int(round(span * (i / n_frames)))
        search_r = max(12, int(span / (n_frames * 2.6)))
        lo = max(cuts[-1] + 20, ideal - search_r)
        hi = min(w - 20, ideal + search_r)
        if hi <= lo:
            cut_x = ideal
        else:
            xs = np.arange(lo, hi, dtype=np.float32)
            penalty = 0.002 * ((xs - ideal) ** 2)
            cut_x = lo + int(np.argmin(smooth_mass[lo:hi] + penalty))
        # Guard: a valid cut between touching poses must be a genuine valley (< 35% of torso height),
        # never slicing straight through the middle of a single body (e.g. a 3-frame input sheet).
        if peak_mass > 0 and float(smooth_mass[cut_x]) > peak_mass * 0.35:
            raise ValueError(
                f"Cannot find a clean separation valley for frame cut {i}/{n_frames} "
                f"(x={cut_x}, mass={smooth_mass[cut_x]:.1f} vs peak={peak_mass:.1f}); "
                "input sheet likely does not contain 4 separated poses."
            )
        cuts.append(cut_x)
    cuts.append(w)

    results = []
    for i in range(n_frames):
        x0, x1 = cuts[i], cuts[i + 1]
        sub = rgba[:, x0:x1, :]
        ys, xs = np.where(sub[..., 3] > 18)
        if len(ys) < 64:
            raise ValueError(
                f"Frame {i} (x={x0}..{x1}) has insufficient foreground pixels "
                f"({len(ys)} < 64); refusing to pack incomplete sprite sheet."
            )
        cy0, cy1 = int(ys.min()), int(ys.max()) + 1
        cx0, cx1 = int(xs.min()), int(xs.max()) + 1
        crop = sub[cy0:cy1, cx0:cx1, :].copy()
        ch, cw = crop.shape[:2]
        lower_a = (crop[int(ch * 0.55):, :, 3] > 24).astype(np.float32)
        if lower_a.sum() > 10:
            anchor_x = float((lower_a * np.arange(cw, dtype=np.float32)[None, :]).sum() / lower_a.sum())
        else:
            anchor_x = cw * 0.5
        results.append((crop, anchor_x, [x0 + cx0, x0 + cx1]))
    return results


def pack_sprite_sheet(
    raw_img: Image.Image,
    cell_w: int = 256,
    cell_h: int = 256,
    n_frames: int = 4,
    bottom_margin: Optional[int] = None,
    top_margin: Optional[int] = None,
    side_margin: int = 6,
) -> Tuple[Image.Image, Dict[str, object]]:
    """
    Key green screen, segment into exactly 4 frames via 2D components, normalize scale
    uniformly across all frames, and lock every frame's feet onto the exact same baseline Y.
    """
    if n_frames != 4:
        raise ValueError(
            f"Runtime sprite sheet contract requires exactly 4 frames "
            f"([idle, walk1, walk2, action]); got frames={n_frames}."
        )

    keyed = key_greenscreen(raw_img)
    rgba = np.array(keyed, dtype=np.uint8)
    if int((rgba[..., 3] > 24).sum()) < 256:
        raise ValueError(
            "Input image contains no usable foreground sprite after chroma-keying; "
            "refusing to overwrite sprite assets."
        )

    if bottom_margin is None:
        bottom_margin = max(6, int(round(cell_h * 0.032)))
    if top_margin is None:
        top_margin = max(8, int(round(cell_h * 0.045)))

    segmented = _segment_frames_2d(rgba, n_frames=n_frames)
    if len(segmented) != 4:
        raise ValueError(f"Expected 4 segmented frames, got {len(segmented)}.")
    for idx, (crop_arr, _, _) in enumerate(segmented):
        fg_count = int((crop_arr[..., 3] > 24).sum())
        if fg_count < 64:
            raise ValueError(
                f"Segmented frame {idx} has insufficient foreground pixels ({fg_count} < 64); "
                "refusing to overwrite sprite assets."
            )

    avail_h = cell_h - top_margin - bottom_margin
    avail_w = cell_w - 2 * side_margin

    heights = [c.shape[0] for c, _, _ in segmented]
    widths = [c.shape[1] for c, _, _ in segmented]
    max_h = max(heights) if heights else 1
    max_w = max(widths) if widths else 1
    min_h = min(heights) if heights else 0
    if min_h < max_h * 0.60:
        raise ValueError(
            f"Frame height consistency check failed (heights={heights}, min/max={min_h / float(max_h):.2f} < 0.60); "
            "input sheet likely has fewer than 4 complete poses or clipped fragments."
        )

    scale_h = avail_h / float(max_h)
    scale_w = avail_w / float(max_w)
    scale = min(scale_h, scale_w)

    sheet = Image.new("RGBA", (cell_w * n_frames, cell_h), (0, 0, 0, 0))
    baseline_y = cell_h - bottom_margin
    frame_stats = []

    for idx, (crop_arr, anchor_x, x_range) in enumerate(segmented):
        ch, cw = crop_arr.shape[:2]
        new_w = max(1, int(round(cw * scale)))
        new_h = max(1, int(round(ch * scale)))

        # Premultiply alpha before LANCZOS downsampling to prevent dark/colored fringe halos
        arr_f = crop_arr.astype(np.float32)
        a_f = arr_f[..., 3:4] / 255.0
        premult = np.concatenate([arr_f[..., :3] * a_f, arr_f[..., 3:4]], axis=-1)
        premult_img = Image.fromarray(np.clip(premult, 0, 255).astype(np.uint8))
        resized_pm = premult_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        r_arr = np.array(resized_pm, dtype=np.float32)
        ra = r_arr[..., 3:4] / 255.0
        safe_a = np.where(ra > 1e-4, ra, 1.0)
        unpremult_rgb = np.where(ra > 1e-4, np.clip(r_arr[..., :3] / safe_a, 0, 255), 0.0)
        final_crop = np.concatenate([unpremult_rgb, r_arr[..., 3:4]], axis=-1).astype(np.uint8)

        # Find exact post-resize bottom-most visible foot row so baseline_y is pixel-exact
        nz_y = np.where(final_crop[..., 3] > 24)[0]
        actual_bottom = int(nz_y.max()) + 1 if len(nz_y) > 0 else new_h

        scaled_anchor_x = anchor_x * scale
        paste_x_in_cell = int(round((cell_w * 0.5) - scaled_anchor_x))
        paste_x_in_cell = max(side_margin, min(cell_w - side_margin - new_w, paste_x_in_cell))
        paste_y = baseline_y - actual_bottom
        if paste_y < 2:
            paste_y = 2

        cell_x = idx * cell_w + paste_x_in_cell
        sheet.paste(Image.fromarray(final_crop), (cell_x, paste_y))

        frame_stats.append({
            "frame": idx,
            "src_x_range": x_range,
            "src_size": [cw, ch],
            "packed_size": [new_w, new_h],
            "foot_y": paste_y + actual_bottom,
            "cell_x": paste_x_in_cell,
        })

    meta = {
        "sheet_size": [cell_w * n_frames, cell_h],
        "cell_size": [cell_w, cell_h],
        "scale": round(scale, 4),
        "baseline_y": baseline_y,
        "frames": frame_stats,
    }
    return sheet, meta


# ---------------------------------------------------------------------------
# 3. Tangent-space Normal Map derivation
# ---------------------------------------------------------------------------

def generate_normal_map(sheet_rgba: Image.Image, strength: float = 2.4) -> Image.Image:
    """
    Derive an OpenGL/Three.js tangent-space Normal Map (neutral = 128,128,255)
    from sprite silhouette inflation (3D body volume) + luminance micro-relief.
    """
    arr = np.array(sheet_rgba.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3] / 255.0
    alpha = arr[..., 3] / 255.0
    fg = alpha > 0.12

    # 1. Silhouette distance-field height (cylindrical rounded volume per body/limb)
    dist = ndimage.distance_transform_edt(fg).astype(np.float32)
    radius = max(12.0, float(sheet_rgba.height) * 0.085)
    h_sil = np.sqrt(np.clip(dist / radius, 0.0, 1.0))
    h_sil = ndimage.gaussian_filter(h_sil, sigma=2.2)

    # 2. Luminance micro-relief (cloth folds, armor edges, hair strands)
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]).astype(np.float32)
    # Fill exterior luminance with nearest foreground value to prevent artificial silhouette cliffs
    if fg.any():
        _, nearest_idx = ndimage.distance_transform_edt(~fg, return_indices=True)
        lum_ext = lum[nearest_idx[0], nearest_idx[1]]
    else:
        lum_ext = lum
    h_lum = ndimage.gaussian_filter(lum_ext, sigma=1.1)

    height = (0.72 * h_sil + 0.28 * h_lum * np.clip(alpha * 1.5, 0.0, 1.0)).astype(np.float32)

    # Sobel gradients:
    #   +X right => nx = -dH/dc
    #   +Y up    => ny = +dH/dr (image row increases downward)
    dh_dc = ndimage.sobel(height, axis=1) / 8.0
    dh_dr = ndimage.sobel(height, axis=0) / 8.0

    nx = -dh_dc * strength
    ny = +dh_dr * strength
    nz = np.ones_like(nx, dtype=np.float32)

    norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-6
    nx /= norm
    ny /= norm
    nz /= norm

    # Fade smoothly to neutral (0, 0, 1) outside silhouette so bilinear filtering has zero dark seams
    blend = np.clip(alpha * 1.4, 0.0, 1.0)
    nx = nx * blend
    ny = ny * blend
    nz = nz * blend + (1.0 - blend)

    out = np.stack([
        np.clip((nx * 0.5 + 0.5) * 255.0, 0, 255),
        np.clip((ny * 0.5 + 0.5) * 255.0, 0, 255),
        np.clip((nz * 0.5 + 0.5) * 255.0, 0, 255),
    ], axis=-1).astype(np.uint8)
    return Image.fromarray(out)


# ---------------------------------------------------------------------------
# 4. Selective Emissive Mask extraction (cloth & skin strictly <= 12)
# ---------------------------------------------------------------------------

EMISSIVE_PROFILES: Dict[str, Dict[str, object]] = {
    # Cyan energy blade + wristwatch
    "player": {
        "hue_ranges": [(155.0, 225.0)],
        "min_sat": 0.32,
        "min_val": 0.52,
        "core_boost": True,
        "core_val": 0.88,
        "core_max_sat": 0.40,
        "exclude_skin": True,
    },
    # Golden law codex / ledger glow + tie pin + arcane action shards
    "yanci": {
        "hue_ranges": [(38.0, 66.0), (190.0, 232.0)],
        "min_sat": 0.38,
        "min_val": 0.52,
        "core_boost": True,
        "core_val": 0.86,
        "core_max_sat": 0.45,
        "exclude_skin": True,
    },
    # Amber tactical visor + railgun energy coils
    "lujin": {
        "hue_ranges": [(18.0, 52.0)],
        "min_sat": 0.62,
        "min_val": 0.58,
        "core_boost": True,
        "core_val": 0.90,
        "core_max_sat": 0.55,
        "exclude_skin": True,
    },
    # Cyan holographic tablet + glasses reflection
    "xutan": {
        "hue_ranges": [(150.0, 220.0)],
        "min_sat": 0.30,
        "min_val": 0.50,
        "core_boost": True,
        "core_val": 0.88,
        "core_max_sat": 0.42,
        "exclude_skin": True,
    },
    # Antique gold pocket watch & occult sigil glint
    "shenyan": {
        "hue_ranges": [(34.0, 64.0)],
        "min_sat": 0.46,
        "min_val": 0.58,
        "core_boost": True,
        "core_val": 0.90,
        "core_max_sat": 0.45,
        "exclude_skin": True,
    },
    # Crimson blood-red lantern & glowing eye/rim glints
    "inspector": {
        "hue_ranges": [(335.0, 360.0), (0.0, 18.0)],
        "min_sat": 0.50,
        "min_val": 0.38,
        "core_boost": True,
        "core_val": 0.84,
        "core_max_sat": 0.55,
        "exclude_skin": False,
    },
}


def generate_emissive_map(
    sheet_rgba: Image.Image,
    char_id: str,
) -> Tuple[Image.Image, Dict[str, float]]:
    """
    Extract strictly localized emissive regions (energy sword, visor, tablet,
    golden ledger, pocket watch, crimson lantern). All cloth, hair, and skin
    pixels are clamped strictly <= 12 (near black) so characters absorb scene
    lighting properly without looking like glowing billboards.
    """
    arr = np.array(sheet_rgba.convert("RGBA"), dtype=np.float32)
    rgb = arr[..., :3]
    rgb01 = rgb / 255.0
    alpha = arr[..., 3] / 255.0
    fg = alpha > 0.2

    h, s, v = rgb_to_hsv(rgb01)
    prof = EMISSIVE_PROFILES.get(char_id, EMISSIVE_PROFILES["player"])

    hue_match = np.zeros_like(fg, dtype=bool)
    for lo, hi in prof["hue_ranges"]:
        hue_match |= (h >= lo) & (h <= hi)

    # Skin exclusion heuristic: human skin is warm peach (H 8..38, S 0.12..0.52, V 0.42..0.92).
    # Notice Lujin's amber visor/coils have S >= 0.62 and Yanci/Shenyan gold has H >= 36 & S >= 0.46.
    is_skin = (
        fg
        & (h >= 6.0) & (h <= 35.0)
        & (s >= 0.10) & (s <= 0.54)
        & (v >= 0.35) & (v <= 0.94)
    )

    seed = fg & hue_match & (s >= float(prof["min_sat"])) & (v >= float(prof["min_val"]))
    if prof.get("exclude_skin", True):
        seed &= (~is_skin)

    # Include incandescent white-hot cores directly adjacent to colored emissive glow
    if prof.get("core_boost", True) and seed.any():
        near_glow = ndimage.binary_dilation(seed, iterations=4)
        bright_core = (
            fg
            & near_glow
            & (v >= float(prof["core_val"]))
            & (s <= float(prof["core_max_sat"]))
        )
        if prof.get("exclude_skin", True):
            bright_core &= (~is_skin)
        emissive_bin = seed | bright_core
    else:
        emissive_bin = seed

    # Remove tiny isolated 1-3px noise sparkles
    labeled, num = ndimage.label(emissive_bin)
    if num > 0:
        sizes = ndimage.sum(emissive_bin, labeled, range(1, num + 1))
        tiny = np.where(np.asarray(sizes) < 4)[0] + 1
        if len(tiny) > 0:
            emissive_bin[np.isin(labeled, tiny)] = False

    # Soften mask edge slightly inside foreground so glow transitions cleanly
    mask = ndimage.gaussian_filter(emissive_bin.astype(np.float32), sigma=0.9)
    mask = np.clip(mask * 1.25, 0.0, 1.0) * alpha

    # Compute emissive RGB: glowing pixels get full intensity; non-emissive cloth/skin <= 8
    emissive_rgb = rgb * mask[..., None]
    non_emissive = mask < 0.08
    # Strictly suppress non-emissive pixels to <= 6 (well under the <= 12 rule)
    ambient_floor = np.minimum(rgb * 0.025, 6.0) * alpha[..., None]
    out_rgb = np.where(non_emissive[..., None], ambient_floor, emissive_rgb)
    out_rgb = np.where(fg[..., None], out_rgb, 0.0)

    out_u8 = np.clip(out_rgb, 0, 255).astype(np.uint8)
    em_pct = float(emissive_bin.sum()) / max(1.0, float(fg.sum())) * 100.0
    non_em_fg = fg & non_emissive
    non_em_max = float(out_u8[non_em_fg].max()) if non_em_fg.any() else 0.0
    em_max = float(out_u8.max())

    stats = {
        "emissive_fg_pct": round(em_pct, 2),
        "emissive_max_rgb": round(em_max, 1),
        "non_emissive_max_rgb": round(non_em_max, 1),
    }
    return Image.fromarray(out_u8), stats


# ---------------------------------------------------------------------------
# 5. Hades 2x2 VFX Flipbook cleaning & standardization
# ---------------------------------------------------------------------------

def _clean_quadrant_dividers(quad: np.ndarray, seam_trim: int = 8) -> np.ndarray:
    """
    Remove thin center divider crossbars or outer frame lines along the edges
    of a 2x2 quadrant without touching interior VFX or dark ink smoke.
    """
    h, w, _ = quad.shape
    q = quad.copy()

    # Zero out explicit seam_trim pixels on all 4 edges? No: only fade/zero the outermost
    # divider band where grid crossbars live, AND detect uniform low-sat border lines up to 16px in.
    for edge in range(min(18, h // 10)):
        for row_idx in (edge, h - 1 - edge):
            row = q[row_idx]
            mean_v = row.mean(axis=1)
            sat = row.max(axis=1) - row.min(axis=1)
            # A grid divider line spans >55% of the edge with low saturation and non-black grey
            is_line = ((mean_v > 6.0) & (mean_v < 140.0) & (sat < 30.0)).mean() > 0.55
            if is_line or edge < 4:
                q[row_idx] = 0.0

    for edge in range(min(18, w // 10)):
        for col_idx in (edge, w - 1 - edge):
            col = q[:, col_idx]
            mean_v = col.mean(axis=1)
            sat = col.max(axis=1) - col.min(axis=1)
            is_line = ((mean_v > 6.0) & (mean_v < 140.0) & (sat < 30.0)).mean() > 0.55
            if is_line or edge < 4:
                q[:, col_idx] = 0.0

    # Extra clean trim of inner seam_trim band if residual low-alpha/grey crossbar glow remains
    t = max(4, seam_trim)
    for row_idx in list(range(t)) + list(range(h - t, h)):
        row = q[row_idx]
        if row.max() < 65.0 and (row.max(axis=1) - row.min(axis=1)).mean() < 18.0:
            q[row_idx] = 0.0
    for col_idx in list(range(t)) + list(range(w - t, w)):
        col = q[:, col_idx]
        if col.max() < 65.0 and (col.max(axis=1) - col.min(axis=1)).mean() < 18.0:
            q[:, col_idx] = 0.0

    # Very conservative black-floor cleanup: kill JPEG/WebP background block noise (<= 6)
    # while keeping Hades dark ink smoke (typically RGB 10..40) completely intact.
    max_ch = q.max(axis=2)
    q[max_ch <= 6.0] = 0.0

    # Smooth 6px edge vignette to pure #000000 to prevent WebGL UV bilinear cross-bleed
    fade = 6
    ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
    q[:fade, :, :] *= ramp[:, None, None]
    q[-fade:, :, :] *= ramp[::-1, None, None]
    q[:, :fade, :] *= ramp[None, :, None]
    q[:, -fade:, :] *= ramp[None, ::-1, None]

    return q


def pack_flipbook(
    raw_img: Image.Image,
    out_size: int = 1024,
    seam_trim: int = 8,
) -> Tuple[Image.Image, Dict[str, object]]:
    """
    Standardize a 2x2 Hades VFX Flipbook to out_size x out_size pure-black RGB,
    eliminating center divider crossbars, outer border lines, and UV cross-bleed.
    """
    rgb = np.array(raw_img.convert("RGB"), dtype=np.float32)
    h, w, _ = rgb.shape
    mh, mw = h // 2, w // 2
    half = out_size // 2

    quads = [
        rgb[0:mh, 0:mw],
        rgb[0:mh, mw:w],
        rgb[mh:h, 0:mw],
        rgb[mh:h, mw:w],
    ]
    positions = [(0, 0), (half, 0), (0, half), (half, half)]

    canvas = Image.new("RGB", (out_size, out_size), (0, 0, 0))
    quad_stats = []
    for idx, (q_arr, (px, py)) in enumerate(zip(quads, positions)):
        cleaned = _clean_quadrant_dividers(q_arr, seam_trim=seam_trim)
        q_img = Image.fromarray(np.clip(cleaned, 0, 255).astype(np.uint8))
        if q_img.size != (half, half):
            q_img = q_img.resize((half, half), Image.Resampling.LANCZOS)
        # Re-enforce 4px black border after resize so UV seams are 100% pure black
        q_final = np.array(q_img, dtype=np.float32)
        fade = 4
        ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
        q_final[:fade, :, :] *= ramp[:, None, None]
        q_final[-fade:, :, :] *= ramp[::-1, None, None]
        q_final[:, :fade, :] *= ramp[None, :, None]
        q_final[:, -fade:, :] *= ramp[None, ::-1, None]
        q_u8 = np.clip(q_final, 0, 255).astype(np.uint8)
        canvas.paste(Image.fromarray(q_u8), (px, py))
        quad_stats.append({
            "quad": idx,
            "max_rgb": int(q_u8.max()),
            "nonzero_pct": round(float((q_u8.max(axis=2) > 8).mean() * 100.0), 2),
        })

    # Verify center cross seam is pure black
    c_arr = np.array(canvas, dtype=np.uint8)
    seam_max = int(max(
        c_arr[half - 1:half + 1, :, :].max(),
        c_arr[:, half - 1:half + 1, :].max(),
    ))
    return canvas, {"size": [out_size, out_size], "center_seam_max_rgb": seam_max, "quads": quad_stats}


# ---------------------------------------------------------------------------
# 6. QA Contact Sheet builder
# ---------------------------------------------------------------------------

def _make_checkerboard(w: int, h: int, cell: int = 16) -> Image.Image:
    y = np.arange(h)[:, None] // cell
    x = np.arange(w)[None, :] // cell
    dark = ((x + y) % 2) == 0
    arr = np.where(dark[..., None], np.array([28, 34, 44], dtype=np.uint8), np.array([42, 50, 62], dtype=np.uint8))
    return Image.fromarray(arr)


def build_qa_contact_sheet(
    sprites_dir: Path,
    vfx_dir: Path,
    out_path: Path,
    char_ids: Sequence[str] = ("player", "yanci", "lujin", "xutan", "shenyan", "inspector"),
    vfx_ids: Sequence[str] = (
        "hades_cyan",
        "hades_flame",
        "hades_emp",
        "hades_tao_ground",
        "hades_occult_chain",
        "hades_heal_aegis",
    ),
) -> Path:
    """Build a single comprehensive QA overview board of all packed sprites (sheet/normal/emissive) and VFX."""
    pad = 18
    row_w = 1560
    header_h = 44

    # Sprite section: 6 rows, each showing Albedo (on checker with baseline guide), Normal, Emissive
    sprite_row_h = 168
    vfx_tile = 236
    vfx_cols = 6
    vfx_section_h = vfx_tile + 54

    total_h = header_h + len(char_ids) * (sprite_row_h + 12) + 46 + vfx_section_h + pad * 2
    board = Image.new("RGB", (row_w, total_h), (12, 15, 21))
    draw = ImageDraw.Draw(board)

    draw.text((pad, 12), "INFINITY 2.5D ART QA BOARD - LINEUP-A SPRITES (ALBEDO | NORMAL | EMISSIVE) & HADES 2x2 VFX", fill=(110, 232, 255))

    y_cur = header_h
    col_w_albedo = 560
    col_w_norm = 460
    col_w_em = 460

    for cid in char_ids:
        sheet_p = sprites_dir / f"{cid}_sheet.webp"
        norm_p = sprites_dir / f"{cid}_normal.webp"
        em_p = sprites_dir / f"{cid}_emissive.webp"
        draw.text((pad, y_cur), f"[{cid}]", fill=(242, 201, 107))

        panel_y = y_cur + 18
        panel_h = sprite_row_h - 22

        if sheet_p.exists():
            s_im = Image.open(sheet_p).convert("RGBA")
            aspect = s_im.width / float(s_im.height)
            th = min(panel_h, int(round(col_w_albedo / aspect)))
            tw = int(round(th * aspect))
            chk = _make_checkerboard(tw, th, cell=12)
            s_res = s_im.resize((tw, th), Image.Resampling.LANCZOS)
            chk.paste(s_res, (0, 0), s_res)
            # Draw subtle horizontal red foot-baseline reference + cell dividers
            cdraw = ImageDraw.Draw(chk)
            for k in range(1, 4):
                gx = int(round(tw * k / 4.0))
                cdraw.line([(gx, 0), (gx, th)], fill=(70, 95, 120), width=1)
            base_line = int(round(th * (1.0 - 0.032)))
            cdraw.line([(0, base_line), (tw, base_line)], fill=(255, 190, 60), width=1)
            board.paste(chk, (pad, panel_y))
            draw.text((pad + 4, panel_y + 2), f"sheet {s_im.width}x{s_im.height}", fill=(210, 230, 245))

        if norm_p.exists():
            n_im = Image.open(norm_p).convert("RGB")
            aspect = n_im.width / float(n_im.height)
            th = min(panel_h, int(round(col_w_norm / aspect)))
            tw = int(round(th * aspect))
            board.paste(n_im.resize((tw, th), Image.Resampling.LANCZOS), (pad + col_w_albedo + 14, panel_y))
            draw.text((pad + col_w_albedo + 18, panel_y + 2), "normal", fill=(18, 22, 32))

        if em_p.exists():
            e_im = Image.open(em_p).convert("RGB")
            aspect = e_im.width / float(e_im.height)
            th = min(panel_h, int(round(col_w_em / aspect)))
            tw = int(round(th * aspect))
            board.paste(e_im.resize((tw, th), Image.Resampling.LANCZOS), (pad + col_w_albedo + col_w_norm + 28, panel_y))
            draw.text((pad + col_w_albedo + col_w_norm + 32, panel_y + 2), "emissive", fill=(180, 230, 255))

        y_cur += sprite_row_h + 12

    y_cur += 10
    draw.text((pad, y_cur), "HADES 2x2 VFX FLIPBOOKS (1024x1024 PURE BLACK, ZERO CROSSBAR)", fill=(110, 232, 255))
    y_cur += 26

    gap = (row_w - pad * 2 - vfx_cols * vfx_tile) // max(1, vfx_cols - 1)
    for idx, vid in enumerate(vfx_ids):
        vp = vfx_dir / f"{vid}.webp"
        vx = pad + idx * (vfx_tile + gap)
        draw.rectangle([vx - 1, y_cur - 1, vx + vfx_tile, y_cur + vfx_tile], outline=(62, 82, 108), width=1)
        if vp.exists():
            vim = Image.open(vp).convert("RGB").resize((vfx_tile, vfx_tile), Image.Resampling.LANCZOS)
            board.paste(vim, (vx, y_cur))
        draw.text((vx + 2, y_cur + vfx_tile + 6), vid, fill=(220, 230, 240))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    board.save(out_path, format="PNG")
    return out_path


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------

def _unlink_quiet(path: Optional[Path]) -> None:
    if path is None:
        return
    try:
        if path.exists():
            path.unlink()
    except OSError:
        pass


def _publish_webp_bundle(
    items: Sequence[Tuple[Image.Image, Path, int, bool]],
) -> None:
    """
    Two-phase transactional WebP publisher for coupled asset bundles
    (e.g. _sheet/_normal/_emissive):
      Phase 1: Encode and verify all temp files before touching any target.
      Phase 2: Snapshot backups of existing targets and os.replace all temp
               files; on ANY BaseException (including KeyboardInterrupt),
               restore all replaced targets from backups and remove temps.
    """
    pid = os.getpid()
    staged: List[Tuple[Path, Path]] = []
    backups: List[Tuple[Path, Optional[Path]]] = []
    replaced: List[Tuple[Path, Optional[Path]]] = []

    try:
        # Phase 1: encode & validate every artifact into its sibling .tmp file
        for idx, (img, target, quality, lossless) in enumerate(items):
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp_path = target.with_name(f".{target.stem}.tmp.{pid}.{idx}.webp")
            staged.append((target, tmp_path))
            img.save(tmp_path, format="WEBP", quality=quality, method=6, lossless=lossless)
            if not tmp_path.exists() or tmp_path.stat().st_size == 0:
                raise OSError(f"Staged WebP temp file is missing or empty: {tmp_path}")

        # Phase 2a: backup existing targets before any replacement begins
        for idx, (target, _tmp_path) in enumerate(staged):
            if target.exists():
                bak_path = target.with_name(f".{target.stem}.bak.{pid}.{idx}.webp")
                _unlink_quiet(bak_path)
                try:
                    os.link(target, bak_path)
                except OSError:
                    shutil.copy2(target, bak_path)
                backups.append((target, bak_path))
            else:
                backups.append((target, None))

        # Phase 2b: commit replacements atomically per file
        for (target, tmp_path), (_bt, bak_path) in zip(staged, backups):
            os.replace(tmp_path, target)
            replaced.append((target, bak_path))

        # Phase 2c: clean up backups after full bundle commit
        for _target, bak_path in backups:
            _unlink_quiet(bak_path)
    except BaseException:
        # Roll back any targets already replaced during Phase 2b
        for target, bak_path in reversed(replaced):
            try:
                if bak_path is not None and bak_path.exists():
                    os.replace(bak_path, target)
                else:
                    _unlink_quiet(target)
            except OSError:
                pass
        for _target, tmp_path in staged:
            _unlink_quiet(tmp_path)
        for _target, bak_path in backups:
            _unlink_quiet(bak_path)
        raise


def _save_webp_atomic(img: Image.Image, target: Path, quality: int = 92, lossless: bool = False) -> None:
    _publish_webp_bundle([(img, target, quality, lossless)])


def cmd_pack_sprite(args: argparse.Namespace) -> None:
    if args.frames != 4:
        raise ValueError(
            f"pack-sprite requires --frames 4 to match the runtime 4x1 sheet contract "
            f"([idle, walk1, walk2, action]); got --frames {args.frames}."
        )

    raw = Image.open(args.input)
    is_boss = args.id == "inspector"
    cell_w = args.cell_w or (320 if is_boss else 256)
    cell_h = args.cell_h or (384 if is_boss else 256)

    sheet, sheet_meta = pack_sprite_sheet(raw, cell_w=cell_w, cell_h=cell_h, n_frames=4)

    # Post-pack guard: verify all 4 output cells contain non-empty foreground pixels before any disk write
    sheet_arr = np.array(sheet, dtype=np.uint8)
    for idx in range(4):
        cell_fg = int((sheet_arr[:, idx * cell_w:(idx + 1) * cell_w, 3] > 24).sum())
        if cell_fg < 64:
            raise ValueError(
                f"Packed frame cell {idx} has insufficient foreground pixels ({cell_fg} < 64); "
                "refusing to overwrite target WebP files."
            )

    normal = generate_normal_map(sheet, strength=args.normal_strength)
    emissive, em_meta = generate_emissive_map(sheet, char_id=args.id)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    sheet_path = out_dir / f"{args.id}_sheet.webp"
    normal_path = out_dir / f"{args.id}_normal.webp"
    emissive_path = out_dir / f"{args.id}_emissive.webp"

    _publish_webp_bundle([
        (sheet, sheet_path, args.quality, False),
        (normal, normal_path, args.quality, False),
        (emissive, emissive_path, args.quality, False),
    ])

    report = {
        "id": args.id,
        "outputs": {
            "sheet": str(sheet_path),
            "normal": str(normal_path),
            "emissive": str(emissive_path),
        },
        "sheet_meta": sheet_meta,
        "emissive_meta": em_meta,
    }
    print(json.dumps(report, indent=2))


def cmd_pack_flipbook(args: argparse.Namespace) -> None:
    raw = Image.open(args.input)
    fb, meta = pack_flipbook(raw, out_size=args.size, seam_trim=args.seam_trim)
    for q in meta["quads"]:
        if float(q["nonzero_pct"]) <= 0.0:
            raise ValueError(
                f"Flipbook quadrant {q['quad']} is completely blank; "
                "refusing to overwrite target WebP file."
            )
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    _save_webp_atomic(fb, out_path, quality=args.quality)
    print(json.dumps({"output": str(out_path), **meta}, indent=2))


def cmd_contact_sheet(args: argparse.Namespace) -> None:
    out = build_qa_contact_sheet(
        sprites_dir=Path(args.sprites_dir),
        vfx_dir=Path(args.vfx_dir),
        out_path=Path(args.output),
    )
    print(json.dumps({"contact_sheet": str(out)}, indent=2))


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Pack Infinity 2.5D sprites and Hades VFX flipbooks.")
    sub = parser.add_subparsers(dest="command", required=True)

    p_sp = sub.add_parser("pack-sprite", help="Pack a 4x1 green-screen sprite sheet into sheet/normal/emissive WebP.")
    p_sp.add_argument("--input", required=True, help="Input raw green-screen image path")
    p_sp.add_argument("--out-dir", default="sim/assets/sprites", help="Output sprites directory")
    p_sp.add_argument("--id", required=True, help="Character ID (player, yanci, lujin, xutan, shenyan, inspector)")
    p_sp.add_argument("--cell-w", type=int, default=0, help="Cell width (default 256, inspector 320)")
    p_sp.add_argument("--cell-h", type=int, default=0, help="Cell height (default 256, inspector 384)")
    p_sp.add_argument("--frames", type=int, default=4, help="Number of horizontal frames (must be 4)")
    p_sp.add_argument("--normal-strength", type=float, default=2.4, help="Normal map slope strength")
    p_sp.add_argument("--quality", type=int, default=92, help="WebP quality (default 92)")
    p_sp.set_defaults(func=cmd_pack_sprite)

    p_fb = sub.add_parser("pack-flipbook", help="Clean and standardize a 2x2 Hades VFX flipbook to 1024x1024 WebP.")
    p_fb.add_argument("--input", required=True, help="Input raw 2x2 flipbook path")
    p_fb.add_argument("--output", required=True, help="Output WebP path")
    p_fb.add_argument("--size", type=int, default=1024, help="Output square resolution (default 1024)")
    p_fb.add_argument("--seam-trim", type=int, default=8, help="Inner seam crossbar trim margin in pixels")
    p_fb.add_argument("--quality", type=int, default=92, help="WebP quality (default 92)")
    p_fb.set_defaults(func=cmd_pack_flipbook)

    p_qa = sub.add_parser("contact-sheet", help="Generate QA overview board for all sprites and VFX.")
    p_qa.add_argument("--sprites-dir", default="sim/assets/sprites")
    p_qa.add_argument("--vfx-dir", default="sim/assets/vfx")
    p_qa.add_argument("--output", required=True)
    p_qa.set_defaults(func=cmd_contact_sheet)

    args = parser.parse_args(argv)
    try:
        args.func(args)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
