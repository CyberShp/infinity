#!/usr/bin/env python3
"""
Infinity HD-2D Asset Prompt & ComfyUI Cloud Helper
Reads COMFYUI_API_KEY strictly from environment variable (NEVER hardcoded).
"""
import argparse
import json
import os
import sys

PORTRAIT_PROMPTS = {
    "yanci": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, 23yo sharp calm Chinese male strategist in dark tailored trenchcoat with subtle gold collar pin, cool cyan and muted gold rim light, obsidian dark background, crisp retro CRT pixel shading, no text",
    "lujin": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, 21yo fierce athletic Chinese male fighter in charcoal tactical jacket with glowing amber-cyan visor sensor, obsidian dark background, crisp retro CRT pixel shading, no text",
    "xutan": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, 22yo Chinese hacker in dark hooded techwear jacket with slim glasses illuminated by cold cyan terminal glow, obsidian dark background, crisp pixel shading, no text",
    "shenyan": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, enigmatic pale young man in ash coat, half face shrouded in deep shadow with eerie crimson glow from below, obsidian background, crisp pixel shading, no text",
    "yelin": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, cold calculating Chinese survivor in black high-collar coat, faint scar on cheek, crimson vortex rim light, obsidian background, crisp pixel shading, no text",
    "litianyang": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, calm weary young Chinese man in dark coat, muted antique gold side light, deep obsidian shadow, crisp retro pixel shading, no text",
    "guhe": "dark HD-2D pixel art portrait bust, Signalis and Hyper Light Drifter style, composed 28yo female trauma doctor in dark emerald-gray medical coat, cool teal rim light, obsidian dark background, crisp pixel shading, no text",
    "inspector": "dark HD-2D pixel art horror boss portrait, Signalis style, towering subway ticket inspector in tattered black conductor uniform and peaked cap, face lost in shadow with twin dim crimson embers, glowing red lantern below, steel shears glint, obsidian background, no text"
}

TILE_PROMPTS = {
    "floor_slate": "seamless tileable top-down dark HD-2D pixel art texture, wet weathered dark slate subway floor tiles with damp puddles, Signalis aesthetic, crisp 64x64 pixel grid, no perspective",
    "floor_platform": "seamless tileable top-down dark HD-2D pixel art texture, dark weathered subway platform concrete slabs with subtle expansion joints and grit, Signalis aesthetic, crisp 64x64 pixel grid, no perspective",
    "floor_hazard": "seamless tileable top-down dark HD-2D pixel art texture, worn amber-yellow and black diagonal subway platform warning line on dark concrete, Signalis aesthetic, crisp 64x64 pixel grid, no perspective",
    "floor_rail": "seamless tileable top-down dark HD-2D pixel art texture, dark recessed subway rail ballast gravel with weathered timber sleepers and steel twin tracks, Signalis aesthetic, crisp 64x64 pixel grid, no perspective",
    "wall_concrete": "seamless tileable dark HD-2D pixel art texture, grimy cracked underground metro concrete wall with water stains and dark steel baseboard, Signalis aesthetic, crisp pixels",
    "wall_neon": "seamless tileable dark HD-2D pixel art texture, dark subway concrete wall with thin glowing cyan and amber emergency strip light, Signalis aesthetic, crisp pixels",
    "train_hull": "seamless tileable dark HD-2D pixel art texture, scorched riveted dark iron ghost subway train exterior hull plating with faint frost and grime, Signalis aesthetic, crisp pixels"
}


def main():
    parser = argparse.ArgumentParser(description="Infinity HD-2D ComfyUI / Midjourney asset prompt helper")
    parser.add_argument("--list-prompts", action="store_true", help="Print ready-to-use prompts for ComfyUI / Midjourney")
    parser.add_argument("--json", action="store_true", help="Output prompts as JSON")
    args = parser.parse_args()

    if args.json:
        print(json.dumps({"portraits": PORTRAIT_PROMPTS, "tiles": TILE_PROMPTS}, ensure_ascii=False, indent=2))
        return

    print("=== Infinity HD-2D Portrait Prompts (save to sim/assets/portraits/<id>.webp, 256x256) ===")
    for k, v in PORTRAIT_PROMPTS.items():
        print(f"  [{k}] {v}")
    print("\n=== Infinity HD-2D Seamless Tile Prompts (save to sim/assets/tiles/<name>.webp, 128x128) ===")
    for k, v in TILE_PROMPTS.items():
        print(f"  [{k}] {v}")

    key = os.environ.get("COMFYUI_API_KEY", "").strip()
    if not key:
        print("\nTip: export COMFYUI_API_KEY=... in your local shell before integrating with a ComfyUI Cloud workflow.")
    else:
        print("\nCOMFYUI_API_KEY detected in environment (masked). Ready for local workflow submission.")


if __name__ == "__main__":
    main()
