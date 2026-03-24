# 实现计划：天津房屋采光模拟器

## 概述

基于 Vite + TypeScript 构建纯前端采光模拟器，按照计算引擎 → UI 交互 → 可视化渲染 → 集成联调的顺序逐步实现，确保每一步都可验证。

## 任务

- [x] 1. 项目初始化与基础结构搭建
  - [x] 1.1 初始化 Vite + TypeScript 项目
    - 运行 `npm create vite` 创建项目，安装依赖
    - 配置 `tsconfig.json`、`vite.config.ts`
    - 安装测试依赖：`vitest`、`fast-check`、`playwright`
    - 创建 `src/types.ts`，定义 `SolarPosition`、`DayInfo`、`SunlightData`、`AppState`、`Season`、`SEASON_CONFIG`、`TIANJIN_LAT`、`TIANJIN_LNG` 等核心类型和常量
    - 创建目录结构：`src/calc/`、`src/ui/`、`src/render/`、`tests/unit/`、`tests/property/`、`tests/e2e/`
    - _需求：7.1, 7.2_

- [x] 2. 实现计算引擎层
  - [x] 2.1 实现朝向处理模块 (`src/calc/orientation.ts`)
    - 实现 `normalizeAngle(angle: number): number`：将任意角度规范化到 [0, 360)
    - 实现 `angleToLabel(angle: number): string`：角度转方位标签（北、东、南、西等）
    - 实现 `parseOrientation(input: string): number | null`：解析用户输入
    - 实现 `formatOrientation(angle: number): string`：格式化角度为显示字符串
    - _需求：1.5, 1.6_

  - [ ]* 2.2 编写朝向处理模块的属性测试 (`tests/property/orientation.property.test.ts`)
    - **属性 1：角度规范化范围不变量** — 对任意数值输入，`normalizeAngle` 输出在 [0, 360) 且与 x mod 360 等价
    - **验证需求：1.5**

  - [ ]* 2.3 编写朝向处理模块的属性测试 — 往返一致性 (`tests/property/orientation.property.test.ts`)
    - **属性 7：朝向值往返一致性** — 对任意有效角度，`parseOrientation(formatOrientation(angle))` 规范化后与原始角度相等
    - **验证需求：8.5**

  - [ ]* 2.4 编写朝向处理模块的单元测试 (`tests/unit/orientation.test.ts`)
    - 测试边界值：0°、360°、负数（-10° → 350°）、大数（370° → 10°）
    - 测试方位标签映射：0° → 北、90° → 东、180° → 南、270° → 西
    - _需求：1.5, 1.6_

  - [x] 2.5 实现太阳位置计算模块 (`src/calc/solar.ts`)
    - 实现 `calculateSolarPosition(latitude, longitude, dayOfYear, hourOfDay): SolarPosition`
    - 实现 `calculateDayInfo(latitude, longitude, dayOfYear): DayInfo`
    - 实现 `calculateDailySolarPath(latitude, longitude, dayOfYear): SolarPosition[]`
    - 使用设计文档中的天文算法公式（赤纬角、时角、高度角、方位角）
    - _需求：2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.6 编写太阳位置计算的属性测试 (`tests/property/solar.property.test.ts`)
    - **属性 3：太阳位置计算有效性** — 对任意有效日期和小时，方位角在 [0, 360)，高度角在 [-90, 90]
    - **验证需求：2.2**

  - [ ]* 2.7 编写太阳位置计算的属性测试 — 夜间标记 (`tests/property/solar.property.test.ts`)
    - **属性 4：夜间标记与高度角一致性** — 高度角 < 0° 时标记为夜间，≥ 0° 时标记为白天
    - **验证需求：2.5**

  - [ ]* 2.8 编写太阳位置计算的属性测试 — 日照时长 (`tests/property/solar.property.test.ts`)
    - **属性 5：总日照时长等于日落减日出** — `daylight === sunset - sunrise` 且 `sunrise < sunset`
    - **验证需求：5.1**

  - [ ]* 2.9 编写太阳位置计算的单元测试 (`tests/unit/solar.test.ts`)
    - 使用已知天文数据点验证精度（方位角偏差 < 2°，高度角偏差 < 1°）
    - 验证四季代表日的日出日落时间合理性
    - _需求：2.3, 2.4_

  - [x] 2.10 实现采光分析模块 (`src/calc/sunlight.ts`)
    - 实现 `calculateEffectiveSunlight(solarPath, houseOrientation, dayInfo): number`
    - 实现 `getSunlightData(season, houseOrientation, currentHour): SunlightData`
    - 有效采光判定：太阳高度角 > 0° 且太阳方位角与房屋朝向差 < 90°
    - _需求：5.1, 5.2, 5.3_

  - [ ]* 2.11 编写采光分析模块的属性测试 (`tests/property/sunlight.property.test.ts`)
    - **属性 6：有效采光时长范围不变量** — 对任意朝向和季节，`0 ≤ effectiveSunlight ≤ totalDaylight`
    - **验证需求：5.2**

  - [ ]* 2.12 编写采光分析模块的单元测试 (`tests/unit/sunlight.test.ts`)
    - 测试正南朝向（180°）冬至日采光最大化
    - 测试特定朝向的有效采光计算
    - _需求：5.1, 5.2_

- [x] 3. 检查点 — 计算引擎验证
  - 确保所有计算引擎相关测试通过，如有问题请向用户确认。

- [x] 4. 实现应用状态管理
  - [x] 4.1 实现状态管理模块 (`src/state.ts`)
    - 实现 `StateManager` 类：`getState()`、`setOrientation()`、`setSeason()`、`setCurrentHour()`、`subscribe()`
    - 默认季节根据当前日期自动判断
    - 状态变更时通知所有订阅者
    - _需求：3.2, 4.4, 5.4_

- [x] 5. 实现 UI 交互层
  - [x] 5.1 创建 HTML 页面结构 (`index.html`)
    - 创建响应式布局骨架：控制面板区域 + 可视化区域
    - 包含旋转控件容器、数字输入框、季节选择按钮、时间滑块、数据面板、Canvas 元素
    - 添加方位标签（北、东、南、西）
    - _需求：1.1, 1.2, 1.6, 6.1, 6.3_

  - [x] 5.2 编写响应式样式
    - 编写 CSS 样式，支持 320px 至 1920px 屏幕宽度
    - 移动端垂直排列控制面板和可视化区域
    - 桌面端水平排列
    - 使用颜色渐变表示光照强度
    - _需求：6.1, 6.3, 4.2_

  - [x] 5.3 实现旋转控件 (`src/ui/rotary-control.ts`)
    - 实现拖拽旋转交互（鼠标 + 触摸事件）
    - 旋转控件变更时调用 `StateManager.setOrientation()`
    - 订阅状态变更，同步更新控件位置
    - _需求：1.1, 1.3, 1.4, 6.2_

  - [x] 5.4 实现数字输入框联动
    - 数字输入框变更时调用 `StateManager.setOrientation()`，输入值自动规范化
    - 订阅状态变更，同步更新输入框值
    - 处理无效输入（非数字、空值）
    - _需求：1.2, 1.3, 1.4, 1.5_

  - [x] 5.5 实现季节选择器 (`src/ui/season-selector.ts`)
    - 渲染四个季节按钮，显示代表日期
    - 切换季节时调用 `StateManager.setSeason()`
    - 显示当前季节的日出、日落时间
    - _需求：3.1, 3.2, 3.3, 3.4_

  - [x] 5.6 实现时间滑块 (`src/ui/time-slider.ts`)
    - 滑块范围为当前季节的日出到日落时间
    - 拖动时调用 `StateManager.setCurrentHour()`
    - 显示当前选中时刻
    - _需求：4.5, 4.6_

  - [x] 5.7 实现数据展示面板 (`src/ui/data-panel.ts`)
    - 订阅状态变更，调用 `getSunlightData()` 获取数据
    - 显示总日照时长、有效采光时长、当前太阳方位角和高度角
    - _需求：5.1, 5.2, 5.3, 5.4_

- [x] 6. 实现可视化渲染层
  - [x] 6.1 实现 Canvas 渲染器 (`src/render/canvas-renderer.ts`)
    - 实现 `CanvasRenderer` 类，管理 Canvas 上下文和尺寸
    - 实现 `render()` 方法，协调各渲染子模块
    - 实现 `resize()` 方法，响应窗口尺寸变化
    - 处理 Canvas 上下文获取失败的降级方案
    - _需求：4.1, 4.4_

  - [x] 6.2 实现房屋俯视图绘制 (`src/render/house-view.ts`)
    - 绘制房屋平面矩形，根据朝向角度旋转
    - 标注房屋正面方向
    - _需求：4.1, 4.4_

  - [x] 6.3 实现太阳轨迹绘制 (`src/render/sun-path.ts`)
    - 绘制当前季节的太阳轨迹弧线
    - 标注当前太阳位置
    - _需求：4.3_

  - [x] 6.4 实现光照效果渲染 (`src/render/lighting.ts`)
    - 使用颜色渐变表示光照强度
    - 绘制太阳光照射方向和投影
    - 实时更新光照效果
    - _需求：4.2, 4.4, 4.6_

- [x] 7. 检查点 — UI 与可视化验证
  - 确保所有组件正常联动，可视化渲染正确，如有问题请向用户确认。

- [x] 8. 入口文件与集成联调
  - [x] 8.1 实现入口文件 (`src/main.ts`)
    - 初始化 `StateManager`
    - 初始化所有 UI 组件和 Canvas 渲染器
    - 连接状态订阅：状态变更 → 重新计算 → 重新渲染
    - 绑定窗口 resize 事件
    - _需求：4.4, 5.4_

  - [x] 8.2 配置构建脚本
    - 在 `package.json` 中配置 `build` 脚本：先运行测试再构建
    - 配置 Vite 构建输出，生成带缓存控制的静态文件
    - 测试失败时中止构建
    - _需求：7.2, 7.4, 8.3, 8.4_

- [x] 9. 端到端测试
  - [x] 9.1 配置 Playwright (`playwright.config.ts`)
    - 配置测试浏览器和基础 URL
    - _需求：8.2_

  - [ ]* 9.2 编写端到端测试 (`tests/e2e/app.spec.ts`)
    - 测试旋转控件与数字输入框双向同步（属性 2）
    - 测试季节切换后可视化和数据面板更新（500ms 内）
    - 测试时间滑块交互
    - 测试移动端响应式布局（320px 视口）
    - _需求：1.3, 1.4, 3.3, 4.5, 6.1, 6.3, 8.2_

- [x] 10. 最终检查点 — 全部测试通过
  - 运行 `vitest --run && playwright test`，确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的子任务为可选任务，可跳过以加速 MVP 开发
- 每个任务引用了对应的需求编号，确保需求可追溯
- 检查点任务用于阶段性验证，确保增量开发质量
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
