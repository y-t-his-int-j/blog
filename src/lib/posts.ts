import { marked } from 'marked';

export type Post = {
  title: string;
  author: string;
  categories: string[];
  date: string;
  displayDate: string;
  image: string;
  slug: string;
  excerpt: string;
  html: string;
};

type FrontMatter = {
  title?: string;
  author?: string;
  categories?: string[];
  image?: string;
};

type ParsedMarkdown = {
  data: FrontMatter;
  content: string;
};

const markdownFiles = import.meta.glob<string>('/_posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const imageFiles = import.meta.glob<string>('/assets/images/*', {
  query: '?url',
  import: 'default',
  eager: true,
});

marked.use({
  gfm: true,
  breaks: false,
});

function filenameFromPath(path: string) {
  return path.split('/').pop() ?? path;
}

function postDateFromFilename(filename: string) {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  return match?.[1] ?? '';
}

function slugFromFilename(filename: string) {
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

function assetUrl(path = '') {
  if (!path || /^(https?:)?\/\//.test(path) || path.startsWith('data:')) {
    return path;
  }

  const cleanPath = path.replace(/^(\.\.\/)+/, '').replace(/^\//, '');
  return imageFiles[`/${cleanPath}`] ?? `/${cleanPath}`;
}

function parseFrontMatter(raw: string): ParsedMarkdown {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      data: {},
      content: raw,
    };
  }

  const data = match[1].split(/\r?\n/).reduce<FrontMatter>((frontMatter, line) => {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!field) {
      return frontMatter;
    }

    const [, key, rawValue] = field;
    const value = rawValue.trim().replace(/^["']|["']$/g, '');

    if (key === 'title' || key === 'author' || key === 'image') {
      frontMatter[key] = value;
    }

    if (key === 'categories') {
      frontMatter.categories = value
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((category) => category.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }

    return frontMatter;
  }, {});

  return {
    data,
    content: raw.slice(match[0].length),
  };
}

function normalizeAssetPaths(markdown: string) {
  return markdown
    .replace(/(!\[[^\]]*\]\()((?:\.\.\/)*assets\/images\/[^)\s]+)(\))/g, (_, open, url, close) => {
      return `${open}${assetUrl(url)}${close}`;
    })
    .replace(/(src|href)=["']((?:\.\.\/)*assets\/images\/[^"']+)["']/g, (_, attr, url) => {
      return `${attr}="${assetUrl(url)}"`;
    });
}

function buildExcerpt(markdown: string) {
  return markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

function formatDate(date: string) {
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

export const posts: Post[] = Object.entries(markdownFiles)
  .map(([path, raw]) => {
    const filename = filenameFromPath(path);
    const date = postDateFromFilename(filename);
    const parsed = parseFrontMatter(raw);
    const data = parsed.data;
    const normalizedContent = normalizeAssetPaths(parsed.content);

    return {
      title: data.title ?? slugFromFilename(filename),
      author: data.author ?? 'jjin',
      categories: data.categories ?? [],
      date,
      displayDate: formatDate(date),
      image: assetUrl(data.image),
      slug: slugFromFilename(filename),
      excerpt: buildExcerpt(normalizedContent),
      html: marked.parse(normalizedContent) as string,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export const categories = [...new Set(posts.flatMap((post) => post.categories))].sort();
