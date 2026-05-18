export const creationStatuses = ['Live', 'Demo', 'Thoughts'] as const;

export type CreationStatus = (typeof creationStatuses)[number];

export type CreationVisual =
  | {
      kind: 'image';
      src: string;
      alt: string;
    }
  | {
      kind: 'placeholder';
      label?: string;
    };

export type Creation = {
  title: string;
  description: string;
  status: CreationStatus;
  tags: string[];
  visual?: CreationVisual;
  openUrl?: string;
  readUrl?: string;
};

export const creations: Creation[] = [
  {
    title: 'AI 离线翻译',
    description: '把 440MB 翻译大模型装进手机，在 macOS 与 Android 端完成本地推理、模型管理和发布验证。',
    status: 'Live',
    tags: ['Flutter', 'llama.cpp', 'GGUF'],
    visual: {
      kind: 'image',
      src: '/blog/geek/ai-offline-translator-macos.png',
      alt: 'AI 离线翻译 macOS 端实机翻译截图',
    },
    openUrl: 'https://kelegele.github.io/ai-offline-translator/',
    readUrl: '/blog/mobile-llm-offline-translator',
  },
  {
    title: 'AI Agent Blog',
    description: '用 Astro 6 和一套 Vercel Blog 风格设计规范，把旧博客迁移成新的 AI 创造力记录站点。',
    status: 'Live',
    tags: ['Astro', 'Vibe Coding', 'Design System'],
    visual: {
      kind: 'image',
      src: '/blog/geek/agent-blog-homepage.webp',
      alt: 'AI Agent Blog 首页截图',
    },
    openUrl: '/',
    readUrl: '/blog/ai-agent-coding',
  },
  {
    title: 'Skill Craft 实践',
    description: '从零依赖发布博客的 Skill 实践中，总结 Agent 工作流如何降低环境门槛。',
    status: 'Thoughts',
    tags: ['Agent Skill', 'Workflow', 'Writing'],
    visual: {
      kind: 'placeholder',
      label: 'Skill',
    },
    readUrl: '/blog/skill-craft-lessons',
  },
];
