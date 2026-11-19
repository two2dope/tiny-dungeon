from __future__ import annotations

import os
from collections import deque
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "assets" / "GUI UI_UX"
PROPS_SRC_DIR = REPO_ROOT / "assets" / "props"
DICE_SRC_DIR = REPO_ROOT / "assets" / "dice"
OUT_DIR = REPO_ROOT / "public" / "assets" / "ui"
PORTRAITS_OUT_DIR = OUT_DIR / "portraits"


def resolve_src_path(base_dir: Path, pattern: str) -> Path:
    direct = base_dir / pattern
    if direct.exists():
        return direct
    matches = sorted(base_dir.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"Asset nao encontrado ({pattern}) em {base_dir}")
    return matches[0]


def remove_white_backdrop_bfs(
    img: Image.Image,
    threshold: int = 232,
    feather: int = 204,
) -> Image.Image:
    """Remove near-white studio backdrop pixels connected to image borders via BFS flood-fill."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    buf = bytearray(rgba.tobytes())
    total = w * h

    visited = bytearray(total)
    removed = bytearray(total)
    queue: deque[int] = deque()

    def is_bg(idx: int) -> bool:
        off = idx * 4
        r, g, b, a = buf[off], buf[off + 1], buf[off + 2], buf[off + 3]
        if a == 0:
            return True
        return r >= threshold and g >= threshold and b >= threshold

    def try_seed(x: int, y: int) -> None:
        idx = y * w + x
        if not visited[idx]:
            visited[idx] = 1
            if is_bg(idx):
                queue.append(idx)

    for x in range(w):
        try_seed(x, 0)
        if h > 1:
            try_seed(x, h - 1)
    for y in range(1, h - 1):
        try_seed(0, y)
        if w > 1:
            try_seed(w - 1, y)

    while queue:
        cur = queue.popleft()
        removed[cur] = 1
        buf[cur * 4 + 3] = 0
        cx = cur % w
        cy = cur // w
        if cx > 0:
            try_seed(cx - 1, cy)
        if cx < w - 1:
            try_seed(cx + 1, cy)
        if cy > 0:
            try_seed(cx, cy - 1)
        if cy < h - 1:
            try_seed(cx, cy + 1)

    # Soft edge feathering against light anti-aliased fringes
    for idx in range(total):
        if removed[idx]:
            continue
        x = idx % w
        y = idx // w
        touches = (
            (x > 0 and removed[idx - 1])
            or (x < w - 1 and removed[idx + 1])
            or (y > 0 and removed[idx - w])
            or (y < h - 1 and removed[idx + w])
        )
        if not touches:
            continue
        off = idx * 4
        r, g, b = buf[off], buf[off + 1], buf[off + 2]
        if r >= feather and g >= feather and b >= feather:
            buf[off + 3] = min(buf[off + 3], 110)

    out = Image.frombytes("RGBA", (w, h), bytes(buf))
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out


def trim_transparent_padding(img: Image.Image, pad: int = 2) -> Image.Image:
    alpha = img.getchannel("A")
    mask = alpha.point(lambda a: 255 if a > 12 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return img
    w, h = img.size
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(w, bbox[2] + pad)
    bottom = min(h, bbox[3] + pad)
    return img.crop((left, top, right, bottom))


def resize_max(img: Image.Image, max_dim: int) -> Image.Image:
    w, h = img.size
    if max(w, h) <= max_dim:
        return img
    scale = max_dim / float(max(w, h))
    new_size = (max(1, round(w * scale)), max(1, round(h * scale)))
    return img.resize(new_size, Image.Resampling.LANCZOS)


def process_sprite(
    src_name: str,
    out_name: str,
    max_dim: int,
    src_dir: Path = SRC_DIR,
    trim: bool = False,
) -> Path:
    src_path = resolve_src_path(src_dir, src_name)

    with Image.open(src_path) as im:
        # Downscale oversized sources gently to max_dim * 2 before BFS for speed + crisp AA
        w, h = im.size
        pre_limit = max_dim * 2
        if max(w, h) > pre_limit:
            scale = pre_limit / float(max(w, h))
            im = im.resize(
                (max(1, round(w * scale)), max(1, round(h * scale))),
                Image.Resampling.LANCZOS,
            )
        cut = remove_white_backdrop_bfs(im)
        if trim:
            cut = trim_transparent_padding(cut, pad=2)
        final_img = resize_max(cut, max_dim)
        out_path = OUT_DIR / out_name
        final_img.save(out_path, "WEBP", quality=90, method=4)
        return out_path


def process_portrait(src_name: str, out_name: str, center_crop_ratio: float | None = None) -> Path:
    src_path = SRC_DIR / src_name
    if not src_path.exists():
        raise FileNotFoundError(f"Retrato nao encontrado: {src_path}")

    with Image.open(src_path) as im:
        rgba = im.convert("RGBA")
        w, h = rgba.size
        if center_crop_ratio is not None and 0 < center_crop_ratio < 1.0:
            crop_size = round(min(w, h) * center_crop_ratio)
            left = (w - crop_size) // 2
            top = (h - crop_size) // 2
            rgba = rgba.crop((left, top, left + crop_size, top + crop_size))
        final_img = rgba.resize((256, 256), Image.Resampling.LANCZOS)
        out_path = PORTRAITS_OUT_DIR / out_name
        final_img.save(out_path, "WEBP", quality=90, method=4)
        return out_path


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PORTRAITS_OUT_DIR.mkdir(parents=True, exist_ok=True)

    sprites = [
        # Frames & containers
        ("Orthogonal_2D_game_UI_frame_62d0429e.jpg", "panel-sidebar-frame.webp", 640),
        ("Game_UI_wooden_header_bar_673a5931.jpg", "header-title-banner.webp", 640),
        ("Crimson_wooden_button_sprite_028d7164.jpg", "btn-crimson.webp", 380),
        ("Game_UI_button_sprite_57f00121.jpg", "btn-gold.webp", 380),
        ("Square_game_UI_button_frame_153e353a.jpg", "btn-square.webp", 160),
        ("Parchment_quest_banner_asset_7da7a857.jpg", "banner-mission-parchment.webp", 520),
        ("Vertical_scroll_game_UI_container_c41f146d.jpg", "scroll-combat-log.webp", 480),
        ("Open_book_UI_frame_bf896c01.jpg", "modal-open-book.webp", 760),
        ("Wooden_dice_tray_asset_c5f342bf.jpg", "tray-dice-wooden.webp", 680),
        # Health & inventory icons
        ("Red_ruby_heart_health_icon_1dd08268.jpg", "icon-heart-full.webp", 128),
        ("Depleted_health_slot_icon_e1191dc7.jpg", "icon-heart-empty.webp", 128),
        ("Double_bulb_gourd_flask_icon_b525cef1.jpg", "icon-potion-gourd.webp", 128),
        ("Scroll_inventory_icon_99dbfc28.jpg", "icon-item-scroll.webp", 128),
        ("Magatama_jewel_icon_on_cord_533bb7d4.jpg", "icon-gem-magatama.webp", 128),
        ("Japanese_Oni_demon_mask_icon_722c0486.jpg", "icon-oni-skull.webp", 128),
        # Board prop tokens
        ("Jade_token_with_gold_rim_0b3f71a8.jpg", "token-gem-jade.webp", 256),
        ("Gold_and_crimson_relic_medallion_408ff248.jpg", "token-relic-gold.webp", 256),
        ("Wrought_iron_trap_board_token_42c76392.jpg", "token-trap-iron.webp", 256),
        # Crests
        ("Sengoku_clan_medallion_icon_5da252db.jpg", "crest-sengoku-mon.webp", 128),
        ("Katana_blades_and_kabuto_crest_51df0415.jpg", "icon-combat-power.webp", 128),
        # 5 original Sengoku relics
        ("Relic_katana_masamune_icon.png", "relic-katana.webp", 128),
        ("Relic_omamori_amulet_icon.png", "relic-omamori.webp", 128),
        ("Relic_yata_mirror_icon.png", "relic-mirror.webp", 128),
        ("Relic_yoroi_armor_icon.png", "relic-armor.webp", 128),
        ("Relic_onmyo_seal_icon.png", "relic-seal.webp", 128),
    ]

    props_round3_sprites = [
        # 11 curated Round 3 Google Flow winners (board tokens, milestone icons, potion slots, upgraded relics)
        ("*_7f02dae7.jpg", "token-potion-fountain.webp", 256),
        ("*_59fbbf08.jpg", "token-sealed-lock.webp", 256),
        ("*_f0f70279.jpg", "token-edge-portal.webp", 256),
        ("*_f4438dc6.jpg", "icon-bonus-levelup.webp", 128),
        ("*_28cb706c.jpg", "icon-bonus-forge.webp", 128),
        ("*_c6d57c71.jpg", "icon-bonus-alchemist.webp", 128),
        ("*_93bd9fcc.jpg", "icon-potion-slot-empty.webp", 128),
        ("*_a26bfefb.jpg", "icon-potion-slot-full.webp", 128),
        ("*_9c0d1d4d.jpg", "relic-kaginawa.webp", 128),
        ("*_722cb50b.jpg", "relic-waraji.webp", 128),
        ("*_49de808b.jpg", "relic-elixir.webp", 128),
    ]

    dice_round4_sprites = [
        (f"die-{color}-{symbol}.png", f"die-{color}-{symbol}.webp", 160)
        for color in ("white", "black")
        for symbol in ("sword", "shield", "boot", "magic", "rogue", "skull")
    ]

    generated: list[Path] = []
    for src_name, out_name, max_dim in sprites:
        generated.append(process_sprite(src_name, out_name, max_dim))
    for src_pattern, out_name, max_dim in props_round3_sprites:
        generated.append(process_sprite(src_pattern, out_name, max_dim, src_dir=PROPS_SRC_DIR))
    for src_name, out_name, max_dim in dice_round4_sprites:
        generated.append(
            process_sprite(src_name, out_name, max_dim, src_dir=DICE_SRC_DIR, trim=True)
        )

    portraits = [
        ("Samurai_warrior_portrait_dba1460b.jpg", "warrior.webp", None),
        ("Shinobi_mystic_portrait_lighting_35786da4.jpg", "mage.webp", 0.63),
        ("Buddhist_warrior_monk_portrait_41c2fe16.jpg", "cleric.webp", 0.63),
        ("Ronin_rogue_portrait_8222fc4a.jpg", "rogue.webp", None),
    ]
    for src_name, out_name, crop_ratio in portraits:
        generated.append(process_portrait(src_name, out_name, crop_ratio))

    total_bytes = sum(p.stat().st_size for p in generated)
    print(f"Processed {len(generated)} WebP assets -> {OUT_DIR}")
    print(f"Total size: {total_bytes / 1024:.1f} KB ({total_bytes / (1024 * 1024):.2f} MB)")
    for p in generated:
        print(f"  - {p.relative_to(OUT_DIR)}: {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
