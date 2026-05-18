# MemoryFlow - 艾宾浩斯记忆学习软件

<div align="center">
  <img src="public/favicon.svg" alt="MemoryFlow Logo" width="64" height="64" />
  <h3>基于艾宾浩斯遗忘曲线理论的学习工具</h3>
</div>

## 功能特性

### 1. 卡片管理
- **问答卡**：正面问题，背面答案，适合概念记忆
- **填空卡**：使用 `{{答案}}` 标记填空位置，适合事实和数据记忆
- **学习本分类**：按主题创建不同的学习本
- **排序浏览**：按创建时间、复习次数、名称排序

### 2. 复习引擎
- **今日任务**：清晰展示待复习卡片数量和进度
- **艾宾浩斯算法**：
  - 生疏 → 间隔重置为 1 天
  - 一般 → 间隔 × 1.5
  - 简单 → 间隔 × 2.2
- **键盘快捷键**：空格显示答案，1/2/3 选择熟练度

### 3. 数据追踪
- **连续打卡天数**：激励持续学习
- **累计学习天数**：记录学习历程
- **热力图日历**：可视化每日学习强度
- **学习本进度**：掌握程度一目了然

## 技术栈

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 开始使用

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── components/
│   ├── ui/              # 基础 UI 组件 (Button, Modal, Input...)
│   ├── cards/           # 卡片相关组件 (NotebookCard, CardPreview, ReviewCard...)
│   └── layout/          # 布局组件 (Header...)
├── pages/               # 页面组件
│   ├── HomePage.tsx     # 首页
│   ├── NotebooksPage.tsx # 学习本管理
│   └── StatsPage.tsx    # 统计页面
├── stores/              # Zustand 状态管理
│   └── useStore.ts
├── types/               # TypeScript 类型定义
├── styles/              # 全局样式
└── App.tsx              # 应用入口
```

## 设计理念

**Warm Dark Academia** — 深邃的暗色背景搭配温暖的琥珀金色，营造沉浸式学习氛围。

- 专注 · 成长 · 坚持

## License

MIT
