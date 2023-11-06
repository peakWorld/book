# 模型
[C站](https://civitai.com/models)

## checkpoint[模型]
* 文件后缀 xx.ckpt | xx.safetensors
* 路径地址 models/Stable-diffusion

- wget -O ChilloutMix.safetensors https://civitai.com/api/download/models/11745

## embeddings[改变文字向量]
* 文件后缀 xx.pt | xx.safetensors
* 路径地址 embeddings

## hypernetworks[指定画风]
* 文件后缀 xx.pt | xx.safetensors
* 路径地址 models/hypernetworks

## Lora/LyCORIS[风格调整]
* 文件后缀 xx.safetensors
* 路径地址
  - models/Lora
  - models/LyCORIS

- wget -O ayanami_rei.safetensors https://civitai.com/api/download/models/10389

* lora模型训练
https://www.bilibili.com/video/BV148411c7U2/?spm_id_from=333.788&vd_source=45ec08ffb275ecf5a715685d67e52040

## ControlNet
* 文件后缀 xx.safetensors
* 路径地址 models/ControlNet

- wget -O control_v11p_sd15_openpose.pth https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_openpose.pth

- wget -O control_v11p_sd15_normalbae.pth https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_normalbae.pth

## VAE[美化模型, 提高画面亮度]
* 文件后缀 xx.pt | xx.safetensors
* 路径地址 models/VAE


## sd1.5
* 二次元模型
- Anything系列
- Hassaku系列

* 写实
- Chilloutmix/Chikmix<CHECKPOINT>
- Photon<CHECKPOINT>
- majicMIX realistic<CHECKPOINT>

* 2.5D
- GuoFeng3.2<CHECKPOINT>

* 游戏
- Game Icon Institute_mode<CHECKPOINT>

* ReV Animated<CHECKPOINT>/blindbox<lora>

- Detail Tweaker LoRA<lora>（细节调整）
- epi_noiseoffset<lora>（增强光影）

## sdxl



- DreamShaper XL1.0<CHECKPOINT>: 写实风大模型
- LEOSAM's HelloWorld<CHECKPOINT>: 肖像/电影风格
- Anime Art Diffusion XL<CHECKPOINT>: 动漫风模型
- SDXL_Niji_Special Edition<CHECKPOINT>: 卡通大模型
- Mysterious - SDXL<CHECKPOINT>: 奇幻风格大模型
- DynaVision XL<CHECKPOINT>: 3D特化模型/动物
- RongHua | 容华 | 国风大模型<CHECKPOINT>


* lora 模型
- Papercut SDXL<lora>: 剪纸风
- Fashion Girl<lora>: 人物
- hanfu tang SDXL<lora>: 汉服唐风
- China Goddess Fashion<lora>: 敦煌风汉服
- fat animal<lora>