# MemoryFlow - 艾宾浩斯记忆学习软件 V1.0

## 1. Concept & Vision

**MemoryFlow** 是一款基于艾宾浩斯遗忘曲线理论的学习工具，旨在通过科学的间隔重复算法帮助用户高效记忆知识。它不是冰冷的工具，而是一位温暖的学习伙伴——通过温暖的设计语言、鼓励性的反馈和直观的进度追踪，让学习变成一种令人期待的日常仪式。

设计理念：**专注·成长·坚持** — 深色模式配合琥珀色暖光，营造沉浸式学习氛围，同时通过渐变色彩和流畅动画传达学习的成长感。

## 2. Design Language

### Aesthetic Direction
**Warm Dark Academia** — 深邃的暗色背景搭配温暖的琥珀金色，如同深夜书房中的台灯光芒。卡片悬浮于暗色背景中，边缘散发着柔和的光晕。

### Color Palette
```
Primary Background:    #0f0f14 (深邃夜空)
Secondary Background:  #1a1a24 (卡片底层)
Card Background:       #242432 (卡片主体)
Accent Primary:        #f59e0b (琥珀金 - 主要交互)
Accent Secondary:      #fbbf24 (明亮金 - hover 状态)
Success:               #10b981 (翡翠绿 - 掌握/完成)
Warning:               #f97316 (活力橙 - 一般)
Danger:                #ef4444 (珊瑚红 - 生疏/重置)
Text Primary:          #f5f5f7 (近白色)
Text Secondary:        #9ca3af (柔和灰)
Text Muted:            #6b7280 (暗淡灰)
```

### Typography
- **标题**: "Noto Sans SC", system-ui — 700 weight
- **正文**: "Noto Sans SC", system-ui — 400/500 weight
- **数字/统计**: "JetBrains Mono", monospace — 强化数据感
- **Font Sizes**: 12px / 14px / 16px / 20px / 24px / 32px / 48px

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 8px (小元素) / 12px (卡片) / 16px (大容器)
- Card shadow: `0 4px 24px rgba(245, 158, 11, 0.1), 0 1px 3px rgba(0,0,0,0.3)`

### Motion Philosophy
- **入场动画**: opacity 0→1, translateY 20px→0, 400ms ease-out, 子元素依次延迟 50ms
- **交互反馈**: scale 0.98→1, 150ms ease-out; 按钮 hover 时微微上浮 (translateY -2px)
- **状态切换**: 卡片翻转使用 3D rotateY, 600ms cubic-bezier(0.4, 0, 0.2, 1)
- **进度动画**: 环形进度条 stroke-dashoffset 动画, 800ms ease-out
- **微交互**: 打卡成功时金色粒子飘散效果

### Visual Assets
- **Icons**: Lucide React — 线性风格, 1.5px stroke, 与琥珀色搭配
- **装饰元素**: 渐变光晕、微妙的几何图案背景纹理
- **空状态**: 自定义 SVG 插画，配合鼓励性文案

## 3. Layout & Structure

### 整体架构
```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo + 导航标签 + 统计徽章                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Main Content Area (根据当前视图动态切换)                  │
│                                                         │
│  [首页] [学习本管理] [复习中] [统计]                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  底部快捷操作栏 (仅复习视图可见)                           │
└─────────────────────────────────────────────────────────┘
```

### 页面结构

**首页 (Dashboard)**
- Hero 区域：今日任务概览（大数字 + 环形进度）
- 快捷操作：开始今日复习、创建新卡片
- 连续打卡日历（热力图形式）
- 学习本快速入口

**学习本管理 (Notebooks)**
- 顶部：新增学习本按钮
- 网格布局：学习本卡片（名称、卡片数、进度条）
- 点击进入：卡片列表

**卡片管理 (Cards)**
- 顶部：切换视图（问答卡/填空卡）+ 排序选项 + 新建按钮
- 列表/网格切换：卡片预览
- 悬浮操作：编辑、删除

**复习视图 (Review)**
- 全屏沉浸式
- 中心：卡片展示区（问题面 / 答案面）
- 底部：操作按钮区
- 顶部：进度条 + 退出按钮

**统计视图 (Stats)**
- 顶部：核心指标卡片（累计学习、连续打卡、已掌握）
- 中部：热力图日历（每日学习时长）
- 底部：学习本进度详情

### Responsive Strategy
- Desktop (≥1024px): 双栏布局，导航侧边栏
- Tablet (768-1023px): 单栏，顶部导航
- Mobile (< 768px): 底部标签导航，全屏卡片

## 4. Features & Interactions

### 4.1 学习本管理

**创建学习本**
- 点击 "+" 按钮，弹出模态框
- 输入：学习本名称（必填）、描述（可选）、封面颜色选择
- 颜色选项：5 种预设渐变色
- 确认创建后，页面刷新并显示新学习本

**学习本卡片交互**
- Hover：轻微上浮 + 光晕增强
- 点击：进入该学习本的卡片管理
- 长按/右键：显示快捷菜单（编辑、删除、导出）

### 4.2 卡片管理

**创建问答卡**
- 点击 "新建卡片" → 选择类型（问答卡）
- 正面：输入问题内容（支持多行）
- 背面：输入答案内容
- 选择所属学习本
- 保存

**创建填空卡**
- 点击 "新建卡片" → 选择类型（填空卡）
- 输入内容，使用 `{{答案}}` 格式标记填空
- 示例：`地球的卫星是{{月球}}`
- 系统自动识别 `{{}}` 包裹的内容作为答案
- 选择所属学习本
- 保存

**卡片操作**
- 编辑：点击卡片 → 进入编辑模式
- 删除：滑动卡片或点击删除图标 → 确认弹窗
- 排序：按创建时间 / 按复习次数 / 按熟练度

### 4.3 复习引擎

**艾宾浩斯间隔算法**
```javascript
// 初始间隔：1天
// 等级系数：
//   生疏 (忘记): interval = 1 (重置为1天)
//   一般 (模糊): interval = interval * 1.5 (四舍五入到整数天)
//   简单 (清晰): interval = interval * 2.2 (四舍五入到整数天)
// 最大间隔: 365天
// 复习阈值: 当前时间 >= 下次复习时间
```

**复习流程**
1. 进入复习 → 显示今日任务数量
2. 点击 "开始复习"
3. 显示问题面（问答卡显示问题文本，填空卡显示带底色的填空区域）
4. 用户思考后，点击 "显示答案"
5. 卡片 3D 翻转，显示答案
6. 用户选择熟练度：
   - 🔴 生疏（红色）：明天再复习，间隔重置
   - 🟠 一般（橙色）：按一般系数延长间隔
   - 🟢 简单（绿色）：按高系数延长间隔
7. 进入下一张卡片
8. 全部完成 → 显示庆祝动画 + 今日总结

**复习过程细节**
- 进度条实时更新
- 支持键盘快捷键（空格显示答案，1/2/3 选择熟练度）
- 点击退出：确认是否放弃本次复习（进度不保存）
- 完成一张后自动滑出、新卡片滑入

### 4.4 数据追踪

**首页统计展示**
- 累计学习天数：总天数（从第一次学习开始）
- 连续打卡天数：从最近一次漏打卡往前连续的天数
- 今日学习：本次会话已复习卡片数

**热力图日历**
- 展示最近 365 天
- 颜色深浅表示学习时长：
  - 无学习：空白
  - < 10 分钟：浅色
  - 10-30 分钟：中等
  - 30-60 分钟：较深
  - > 60 分钟：最深
- 鼠标悬浮显示具体日期和学习时长

**数据持久化**
- 所有数据存储在 localStorage
- 数据结构：{ notebooks, cards, reviewLogs, settings }
- 自动备份机制：每次操作后更新

## 5. Component Inventory

### Layout Components

**AppShell**
- 包含 Header、MainContent、BottomNav
- 状态：当前视图路由
- 管理全局状态上下文

**Header**
- Logo (MemoryFlow 文字 logo)
- 导航标签（首页、学习本、统计）
- 今日复习徽章（数字气泡）

**BottomNav** (Mobile)
- 4 个图标按钮：首页、学习本、复习、统计
- 当前项高亮（琥珀色）
- 中间复习按钮特殊样式（圆形突出）

### Card Components

**NotebookCard**
- 封面渐变色块（顶部 40%）
- 学习本名称 + 描述
- 底部：卡片数量 + 进度指示
- States: default, hover (lift + glow), active

**QuestionCard**
- 类型标签（问答/填空）
- 问题/内容预览
- 底部：复习次数、熟练度指示
- States: default, hover, selected (编辑模式)

**ReviewCard**
- 大尺寸居中展示
- 正面/背面内容
- 翻转动画
- States: front (question), back (answer), flipping

**FlashCard (填空卡专用)**
- 带底色的填空区域
- 答案隐藏（默认）/ 显示

### UI Components

**Button**
- Variants: primary (琥珀色填充), secondary (边框), ghost (无边框), danger (红色)
- Sizes: sm (32px), md (40px), lg (48px)
- States: default, hover, active (scale 0.98), disabled, loading

**Modal**
- 暗色半透明遮罩
- 居中卡片容器
- 标题 + 内容 + 操作区
- 入场动画：fade + scale

**Input**
- 暗色背景输入框
- 琥珀色 focus ring
- 标签 + 错误提示
- Variants: text, textarea, select

**ProgressRing**
- SVG 环形进度条
- 中心显示数字/百分比
- 动画：stroke-dashoffset

**HeatmapCalendar**
- 7 行（N 周）× N 列
- 颜色渐变：小格颜色映射学习时长
- 悬浮提示：具体数据

**Toast**
- 位置：底部居中
- Types: success, error, info
- 自动消失：3 秒

### Empty States

**EmptyNotebooks**
- SVG 插画：空书架
- 文案："还没有学习本，创建一个开始你的学习之旅吧"

**EmptyCards**
- SVG 插画：空白卡片
- 文案："这个学习本还没有卡片，添加第一张吧"

**EmptyReview**
- SVG 插画：轻松休息的人
- 文案："今日任务已完成，休息一下吧！"

## 6. Technical Approach

### 技术栈
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: Zustand (轻量级)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Date Handling**: date-fns
- **ID Generation**: nanoid

### 项目结构
```
src/
├── components/
│   ├── ui/              # 基础 UI 组件
│   ├── cards/           # 卡片相关组件
│   ├── layout/          # 布局组件
│   └── features/        # 功能模块组件
├── pages/               # 页面组件
├── stores/              # Zustand stores
├── hooks/               # 自定义 hooks
├── utils/               # 工具函数
├── types/               # TypeScript 类型定义
├── styles/              # 全局样式
└── App.tsx
```

### 数据模型

**Notebook**
```typescript
interface Notebook {
  id: string;
  name: string;
  description?: string;
  color: string; // 渐变色值
  createdAt: number;
  updatedAt: number;
}
```

**Card**
```typescript
interface Card {
  id: string;
  notebookId: string;
  type: 'question' | 'cloze';
  front: string; // 问题或带空格的文本
  back: string; // 答案或空格数组
  interval: number; // 当前间隔天数
  nextReview: number; // 下次复习时间戳
  reviewCount: number; // 复习次数
  easeFactor: number; // 简易度因子
  createdAt: number;
  updatedAt: number;
}
```

**ReviewLog**
```typescript
interface ReviewLog {
  id: string;
  cardId: string;
  rating: 'forgot' | 'hard' | 'good';
  reviewedAt: number;
  previousInterval: number;
  newInterval: number;
}
```

**Settings**
```typescript
interface Settings {
  dailyGoal: number; // 每日目标卡片数
  theme: 'dark'; // 预留主题功能
  lastStudyDate: string; // YYYY-MM-DD 格式
  streakDays: number; // 连续天数
  totalStudyDays: number; // 累计天数
}
```

### 核心算法

**艾宾浩斯复习间隔计算**
```typescript
function calculateNextReview(card: Card, rating: Rating): number {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  switch (rating) {
    case 'forgot':
      // 重置为 1 天
      return now + 1 * DAY;
    case 'hard':
      // 一般：间隔 × 1.5
      return now + Math.round(card.interval * 1.5) * DAY;
    case 'good':
      // 简单：间隔 × 2.2
      return now + Math.round(card.interval * 2.2) * DAY;
  }
}
```

**连续打卡计算**
```typescript
function calculateStreak(logs: ReviewLog[]): number {
  const dates = getUniqueDates(logs);
  dates.sort((a, b) => b.localeCompare(a)); // 降序

  let streak = 0;
  let currentDate = today();

  for (const date of dates) {
    if (date === currentDate || date === yesterday()) {
      streak++;
      currentDate = yesterday(date);
    } else {
      break;
    }
  }

  return streak;
}
```

### localStorage 结构
```typescript
{
  "memoryflow_notebooks": Notebook[],
  "memoryflow_cards": Card[],
  "memoryflow_review_logs": ReviewLog[],
  "memoryflow_settings": Settings
}
```
