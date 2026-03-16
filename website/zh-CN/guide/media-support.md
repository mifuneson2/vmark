# 媒体支持

VMark 支持在 Markdown 文档中使用标准 HTML5 标签嵌入视频、音频和 YouTube 内容。

## 支持的格式

### 视频

| 格式 | 扩展名 |
|------|--------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### 音频

| 格式 | 扩展名 |
|------|--------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## 语法

### 视频

使用标准 HTML5 视频标签：

```html
<video src="path/to/video.mp4" controls></video>
```

带可选属性：

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### 音频

使用标准 HTML5 音频标签：

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### YouTube 嵌入

使用隐私增强型 YouTube iframe：

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### 图片语法回退

你也可以使用带有媒体文件扩展名的图片语法——VMark 会自动将其提升为正确的媒体类型：

```markdown
![](video.mp4)
![](audio.mp3)
```

## 插入媒体

### 工具栏

使用工具栏中的插入菜单：

- **视频**——打开视频文件选择器，将文件复制到 `.assets/`，并插入 `<video>` 标签
- **音频**——打开音频文件选择器，将文件复制到 `.assets/`，并插入 `<audio>` 标签
- **YouTube**——从剪贴板读取 YouTube URL 并插入隐私增强型嵌入代码

### 拖放

将视频或音频文件从文件系统直接拖入编辑器。VMark 会：

1. 将文件复制到文档的 `.assets/` 文件夹
2. 插入带有相对路径的相应媒体节点

### 源码模式

在源码模式中，直接输入 HTML 标签。媒体标签会以彩色左边框高亮显示：

- **视频**——青色边框
- **音频**——靛蓝色边框
- **YouTube**——红色边框

## 编辑媒体

在所见即所得模式中双击任意媒体元素，打开媒体弹窗：

- **来源路径**——编辑文件路径或 URL
- **标题**——可选的 title 属性
- **封面图**（仅视频）——缩略图路径
- **删除**——移除媒体元素

按 `Escape` 关闭弹窗并返回编辑器。

## 路径解析

VMark 支持三种媒体路径类型：

| 路径类型 | 示例 | 行为 |
|----------|------|------|
| 相对路径 | `./assets/video.mp4` | 相对于文档目录解析 |
| 绝对路径 | `/Users/me/video.mp4` | 通过 Tauri 资源协议直接使用 |
| 外部 URL | `https://example.com/video.mp4` | 直接从网络加载 |

推荐使用相对路径——它可以让你的文档在不同机器之间保持可移植性。

## 安全性

- 相对路径会针对目录遍历攻击进行验证
- YouTube iframe 限制为 `youtube.com` 和 `youtube-nocookie.com` 域名
- 其他 iframe 来源会被净化器过滤掉
