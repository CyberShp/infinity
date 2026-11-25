# Infinity 2.5D HD-2D 外部美术资产热插拔规范

本目录支持 **ComfyUI / Midjourney / Aseprite** 产出的高精像素肖像与无缝环境贴图**直接覆盖热插拔**，无需改动引擎代码。

## 1. 无线电与大厅 CRT 像素肖像（已预装初版，可直接覆盖）
放置路径：`sim/assets/portraits/<id>.webp`（推荐尺寸 `128×128` 或 `256×256`，1:1 正方形，暗黑背景 + 角色专属侧逆光）。

| 文件名 | 角色 | 推荐色调与视觉特征 |
|---|---|---|
| `yanci.webp` | 严辞（队长） | 深黑长风衣、冷蓝＋微金领针、冷静分析眼神 |
| `lujin.webp` | 陆烬（主C） | 暗灰战术夹克、青橙赛博战术目镜反光、凌厉压迫感 |
| `xutan.webp` | 许檀（副队/技术） | 深色连帽机能外套、细框眼镜映出冷青终端微光 |
| `shenyan.webp` | 沈砚（可疑外队） | 灰衣、半张脸隐入暗影、底部透出诡异暗红车票反光 |
| `yelin.webp` | 夜林（原著线） | 黑色高领外套、颧骨浅疤、深红旋涡侧光、冷峻戒备 |
| `litianyang.webp` | 李天阳（原著线） | 深色旧大衣、暖金与阴郁交错光影、温和却疲惫 |
| `guhe.webp` | 顾禾（医疗） | 暗绿急救大衣、冷翡翠医疗指示光、克制沉静 |
| `inspector.webp` | 零号检票员（Boss） | 破旧黑铁路制服与大檐帽、阴影遮面、左下猩红灯笼＋右侧冰冷铁钳 |

## 2. 无缝平铺 2.5D 站台材质（可选热插拔）
将 ComfyUI（开启 Seamless Tiling + Pixel Art LoRA）生成的 `64×64` 或 `128×128` 无缝 `.webp` 贴图放入 `sim/assets/tiles/`，并在 `sim/data/asset_manifest.js` 的 `tiles` 对象中取消对应注释即可自动替换 3D 站台贴图（未配置时自动零报错回退到程序化像素材质）：

- `sim/assets/tiles/floor_slate.webp` — 潮湿暗青地铁石板砖
- `sim/assets/tiles/floor_platform.webp` — 0号站台深灰水泥地砖
- `sim/assets/tiles/floor_hazard.webp` — 磨损黄黑站台警戒线
- `sim/assets/tiles/floor_rail.webp` — 下沉暗黑枕木与双轨
- `sim/assets/tiles/wall_concrete.webp` — 潮湿裂纹混凝土墙面
- `sim/assets/tiles/wall_neon.webp` — 带青/红应急灯条的地铁墙面
- `sim/assets/tiles/train_hull.webp` — 焦黑金属幽灵列车车身

## 3. 使用 ComfyUI API 批量出图（安全说明）
可使用 `tools/gen_comfyui_assets.py`（通过环境变量传入 Key，**切勿将 API Key 写入代码或提交到 Git**）：
```bash
export COMFYUI_API_KEY="你的_comfyui_key"
python3 tools/gen_comfyui_assets.py --list-prompts
```
