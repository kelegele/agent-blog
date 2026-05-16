import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const posts = await getCollection('blog');
  const post = posts.find(p => p.id === params.slug);

  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  const { title, description, date } = post.data;
  const rawBody = post.body ?? '';

  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const header = [
    `# ${title}`,
    '',
    `**Published:** ${formattedDate}`,
    '',
    `*${description}*`,
    '',
    '---',
    '',
  ].join('\n');

  // Strip frontmatter from body if present
  const body = rawBody.replace(/^---[\s\S]*?---\n*/, '');

  return new Response(header + body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
