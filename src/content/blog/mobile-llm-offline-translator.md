---
title: 把 440MB 大模型装进手机：离线翻译 App 开发复盘
description: 复盘 AI 离线翻译 App 的开发过程：如何用 Flutter、llama.cpp、JNI、ObjC++ 和 STQ1_0 量化模型，把 440MB 大模型跑到 macOS 与 Android 端，并总结端侧推理、跨端桥接和发布验证中的关键踩坑。
date: 2026-05-17
category: 极客
categorySlug: geek
draft: true
---

这篇文章复盘一个**移动端离线大模型**项目：**AI 离线翻译 App**。它的目标很直接：把一个 **440MB** 的翻译专用大模型放到手机里，本地完成翻译，不依赖云端 API。

项目成果已经开源：

- GitHub 仓库：[kelegele/ai-offline-translator](https://github.com/kelegele/ai-offline-translator)
- 发布页：[AI 离线翻译](https://kelegele.github.io/ai-offline-translator/)

![AI 离线翻译 macOS 端实机翻译截图](/blog/geek/ai-offline-translator-macos.png)

<img src="/blog/geek/ai-offline-translator-android.jpg" alt="AI 离线翻译 Android 端模型管理截图" width="360" />

最终版本跑通了 **[macOS](https://developer.apple.com/macos/)** 和 **[Android](https://developer.android.com/)**。macOS 用来快速验证 UI、模型加载和推理链路，Android 是移动端落地的主目标。这个项目真正难的不是"调用大模型"，而是把**模型格式、原生推理、跨端桥接、模型管理和发布验证**串成一条稳定链路。

## 为什么做离线翻译

翻译是一个很适合端侧大模型的场景。

它的输入输出短，不需要很长的上下文。用户也天然关心隐私，很多待翻译内容不适合上传到服务器。交互也足够清晰：输入原文、选择语言、等待译文、复制结果。

所以这个项目一开始就不是"云端 API 外壳"。目标是让模型真的在设备端跑起来：

- App 本体尽量小，模型按需下载或导入
- 推理完全发生在本机
- macOS 和 Android 共用一套 native 推理引擎
- UI 保持工具型，不做复杂营销包装

技术路线也因此确定：**[Flutter](https://flutter.dev/)** 负责跨平台 UI，**[llama.cpp](https://github.com/ggml-org/llama.cpp)** 负责原生推理，中间用一层很薄的平台桥接连接。

## 关键问题：模型怎么进手机

项目使用 **[Hy-MT1.5](https://modelscope.cn/models/AngelSlim/Hy-MT1.5-1.8B-1.25bit-GGUF)** 翻译模型，**[GGUF](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)** 文件约 **440MB**。这个体积能进手机，是因为它用了 **1.25bit STQ1_0 量化**。对比原始 bf16 模型大约 7GB 的体积，压缩比例接近 16 倍。

但 STQ1_0 不是 llama.cpp 主线默认支持的量化格式，需要使用 llama.cpp 的 **[PR #22836](https://github.com/ggml-org/llama.cpp/pull/22836)** 兼容路径。这意味着 `third_party/llama.cpp` 不能随意更新。每次更新 submodule 前，都要确认 `Hy-MT1.5-1.8B-STQ1_0.gguf` 能加载，并完成最小翻译。

这也是端侧大模型和普通 App 资源的区别：模型格式、量化类型、推理库版本和 CPU 指令路径是绑在一起的。错一环，不是效果差一点，而是直接加载失败或输出乱码。

## 架构：Flutter UI + shared C++ engine

最终架构分成四层：

```text
Flutter UI (Dart)
  -> MethodChannel
Platform Bridge (Swift / Kotlin)
  -> C++ function call
TranslatorEngine (C++)
  -> links against
llama.cpp
```

Flutter 层负责翻译页面、模型管理、语言选择和打字机流式渲染。平台层负责文件选择、模型下载、线程调度和 MethodChannel。真正的推理逻辑收敛到 `translator_engine.hpp` 和 `translator_engine.cpp`。

C++ 引擎只暴露少量接口：

```cpp
struct TranslatorEngine {
    bool loadModel(const char* model_path);
    void translate(const char* text, char* out, size_t out_size);
    void cancel();
    bool isModelLoaded();
};
```

macOS 通过 **[ObjC++ wrapper](https://clang.llvm.org/docs/UsersManual.html#objective-c)** 调这套 C++ 引擎，Android 通过 **[JNI](https://docs.oracle.com/javase/8/docs/technotes/guides/jni/)** 调同一份 `translator_engine.cpp`。两个平台的差异被限制在桥接层，推理核心不复制两份。

引擎内部封装了 llama.cpp 的模型加载、jinja chat template、tokenize、采样和生成循环。参数上也刻意克制：`n_ctx=256`，`n_threads=2`。翻译场景不需要长上下文，小窗口可以降低内存占用和推理延迟。

## 开发过程

**v0.0.1** 先跑通 macOS。目标是验证最小闭环：Flutter UI 能打开，模型能导入，llama.cpp 能加载，输入 `Hello` 能翻译成 `你好`。

**v0.0.2** 加入 **[ModelScope](https://modelscope.cn/)** 模型下载。模型不再要求用户手填路径，而是通过 App 下载或导入，保存到 App 私有目录。

**v0.0.3** 开始补齐 Android：TranslatorService、MethodChannelHandler、ModelScope 下载器、GGUF 文件选择器、JNI 桥接、[CMake](https://cmake.org/) 配置，以及 `scripts/build_android_llama.sh`。这一步也把 C++ 推理引擎抽到 `flutter_app/native/translator_engine/`，让 macOS 和 Android 共用同一份代码。

这个版本也踩了一个严重的发布坑：代码写完、构建通过，不等于功能完成。没有 Android 设备实际运行验证就打 tag，后来撤回。从那之后项目定下规则：没有在目标平台真实跑通，不打 tag，不发 release。

**v0.1.0** 才是第一个双平台功能完整版本。它支持 macOS DMG 和 Android APK 分发，模型下载、导入、自动检测、加载、流式翻译、取消和复制都形成闭环。安装包可以从项目的 [GitHub Releases](https://github.com/kelegele/ai-offline-translator/releases) 获取。

## 几个关键教训

第一，**不要手写 prompt**。Hy-MT1.5 的 chat template 是 jinja 格式，必须用 llama.cpp common 层处理。早期手写 token 序列，结果输出全是重复字符。

第二，**Flutter bottom sheet 状态要单独同步**。`showModalBottomSheet` 有独立 widget 树，父组件 `setState` 不会触发 sheet 重建。模型下载进度、加载状态这类信息，必须传 `ChangeNotifier` 并在 sheet 内监听。

第三，**macOS 文件选择器必须回主线程**。`NSOpenPanel` 在非主线程调用时可能不弹出，MethodChannel 回调不能假设就在主线程。

第四，**Android 权限和窗口行为不能漏**。下载模型要声明 `INTERNET` 权限；键盘弹起时工具型翻译 App 不应该被压缩，所以用了 `adjustNothing` 和 `resizeToAvoidBottomInset: false`。

第五，**发布验证必须看真实设备**。`flutter analyze`、`flutter test`、`flutter build` 只能证明代码能编译。端侧大模型的运行时问题通常来自 ABI、模型路径、动态库链接、权限和线程调度。

## 可以复用什么

这个项目里最值得复用的是 `translator_engine.hpp` 和 `translator_engine.cpp`。它们把 llama.cpp 的加载、chat template、tokenize、采样和生成循环封装成纯 C++ 引擎，和 Flutter 没有强耦合。

第二个是 Android 构建脚本。`scripts/build_android_llama.sh` 负责把 llama.cpp 交叉编译成 **arm64-v8a 静态库**，再交给 Android CMake 链接。项目明确不支持 x86/x86_64 Android ABI，因为目标是真机移动端。

第三个是桥接方式：Android 用 JNI/CMake，macOS 用 ObjC++。如果你要做"Flutter UI + 原生大模型推理"，这套结构可以直接参考。

第四个是模型管理策略。模型不要内置进 App 包，而是下载或导入到 App 私有目录。这样 App 本体保持 15MB 到 30MB，440MB 模型按需获取。

## 发布页也是成果

项目后期做了 [GitHub Pages](https://pages.github.com/) 发布页：`docs/index.html`。它展示项目特性、架构、下载入口和实机截图。

页面几轮调整后，最后选择了工业暗色和终端气质：[DM Sans](https://fonts.google.com/specimen/DM+Sans) 做标题，[JetBrains Mono](https://www.jetbrains.com/lp/mono/) 做技术标签，重点强调端侧推理和工程感。这个页面的作用不是炫技，而是把项目说清楚：这不是一个云端翻译壳，而是一个真的把 llama.cpp 包进移动端 App 的工程。

## 总结

这个项目最重要的收获是：**移动端大模型不是单点 demo，而是一套工程系统**。

模型要能被推理库识别，量化格式要匹配，原生库要能为目标 ABI 构建，UI 要能表达模型状态，文件和权限要符合平台规则，发布前还必须在目标设备真实跑通。

Flutter、llama.cpp、JNI、ObjC++、CMake、GGUF、STQ1_0 都只是局部技术。真正决定项目能不能落地的，是把它们组合成稳定链路的能力。
