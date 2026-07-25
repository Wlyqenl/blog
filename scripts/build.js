/*
 * build.js — 把 manifest.json + 各篇 .md 打包成 content/posts.js
 * 用法：node scripts/build.js
 * 产物：window.POSTS = [{ slug, title, date, tags, author, excerpt, content }]
 * 采用内联数据，双击 index.html 也能直接运行（无需本地服务器）。
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const MANIFEST = path.join(POSTS_DIR, 'manifest.json');
const OUT = path.join(POSTS_DIR, 'posts.js');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const posts = manifest.map(function (meta) {
  const mdPath = path.join(POSTS_DIR, meta.slug + '.md');
  const content = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';
  return Object.assign({}, meta, { content: content });
});

// JSON.stringify 会自动处理换行、引号、反引号等转义，安全内联。
const out = 'window.POSTS = ' + JSON.stringify(posts, null, 2) + ';\n';

fs.writeFileSync(OUT, out, 'utf8');
console.log('已生成 ' + OUT + '，共 ' + posts.length + ' 篇文章。');
