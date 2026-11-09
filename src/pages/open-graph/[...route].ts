import { generateOpenGraphImage } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { route: `blog/${post.id}.png` },
    props: { title: post.data.title, category: post.data.category },
  }));
};

// Brand look: black canvas, small black-bg logo, white headline — matches logo-black-bg.png
export const GET: APIRoute = async ({ props }) => {
  const { title, category } = props;
  const png = await generateOpenGraphImage({
    title,
    description: `${category} · 可了个乐 — AI × Creativity`,
    logo: { path: 'public/logo-black-bg.png', size: [160] },
    bgGradient: [[0, 0, 0]],
    padding: 96,
    fonts: ['./src/fonts/NotoSansSC-Regular.otf', './src/fonts/NotoSansSC-Bold.otf'],
    font: {
      title: { size: 72, weight: 'Bold', color: [255, 255, 255], families: ['Noto Sans SC'] },
      description: { size: 36, weight: 'Normal', color: [186, 186, 186], families: ['Noto Sans SC'] },
    },
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
