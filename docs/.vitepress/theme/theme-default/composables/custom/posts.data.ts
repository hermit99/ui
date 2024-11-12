import fs from "node:fs";
import path from "node:path";
import type { MarkdownRenderer } from "vitepress";
import { createMarkdownRenderer } from "vitepress";
import { formatDistance } from "date-fns";
import useBlogFile from "./blog-file";

let md: MarkdownRenderer;
const { folderDir, readFrontMatter } = useBlogFile();

const dir = folderDir("posts");

export interface Post {
  title: string;
  author: string;
  href: string;
  date: {
    time: number;
    string: string;
    since: string;
  };
  excerpt: string | undefined;
  data: Record<string, any>;
}

declare const data: Post[];
export { data };

async function load(): Promise<Post[]>;
async function load() {
  md = md || (await createMarkdownRenderer(process.cwd()));
  return fs
    .readdirSync(dir)
    .map((file) => getPost(file, dir))
    .sort((a, b) => b.date.time - a.date.time);
}

export default {
  watch: path.join(dir, "*.md"),
  load,
};

const cache = new Map();

function getPost(file: string, postDir: string): Post {
  const fullPath = path.join(postDir, file);
  const timestamp = fs.statSync(fullPath).mtimeMs;

  const { data } = readFrontMatter(file, postDir, cache);

  const post: Post = {
    title: data.title,
    author: data.author ? data.author : "Felix",
    href: `/posts/${file.replace(/\.md$/, ".html")}`,
    date: formatDate(data.date),
    excerpt: data?.excerpt,
    data,
  };

  cache.set(fullPath, {
    timestamp,
    post,
  });
  return post;
}

function formatDate(date: string | Date): Post["date"] {
  if (!(date instanceof Date)) date = new Date(date);

  date.setUTCHours(1);

  return {
    time: +date,
    string: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    since: formatDistance(date, new Date(), { addSuffix: true }),
  };
}