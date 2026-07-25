/*
 * app.js — 博客前端逻辑（纯原生 JS，无框架）
 * 路由：#/ 首页  |  #/post/<slug> 详情  |  #/tag/<标签> 标签  |  #/about 关于
 */
(function () {
  'use strict';

  var POSTS = (window.POSTS || []).slice().sort(function (a, b) {
    return (b.date || '').localeCompare(a.date || '');
  });

  // 标签配色（杂志感强调色）
  var PALETTE = {
    '技术': { grad: 'linear-gradient(135deg,#6366f1,#0ea5e9)', color: '#4f46e5' },
    '前端': { grad: 'linear-gradient(135deg,#3b82f6,#06b6d4)', color: '#2563eb' },
    '工具': { grad: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#7c3aed' },
    '随笔': { grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#d97706' },
    '生活': { grad: 'linear-gradient(135deg,#fb7185,#f43f5e)', color: '#e11d48' },
    '摄影': { grad: 'linear-gradient(135deg,#10b981,#0ea5e9)', color: '#059669' },
    '旅行': { grad: 'linear-gradient(135deg,#22c55e,#84cc16)', color: '#16a34a' }
  };
  var DEFAULT_PAL = { grad: 'linear-gradient(135deg,#64748b,#334155)', color: '#475569' };

  function pal(tag) { return PALETTE[tag] || DEFAULT_PAL; }

  function esc(s) { return MD.escapeHtml(String(s == null ? '' : s)); }

  function fmtDate(d) {
    if (!d) return '';
    var p = d.split('-');
    return p.length === 3 ? p[0] + ' 年 ' + (+p[1]) + ' 月 ' + (+p[2]) + ' 日' : d;
  }

  function readingTime(text) {
    var n = (text || '').replace(/\s/g, '').length;
    return Math.max(1, Math.round(n / 350));
  }

  function allTags() {
    var set = {};
    POSTS.forEach(function (p) { (p.tags || []).forEach(function (t) { set[t] = (set[t] || 0) + 1; }); });
    return Object.keys(set).sort(function (a, b) { return set[b] - set[a]; });
  }

  function tagChip(tag, active) {
    var p = pal(tag);
    return '<a class="chip" href="#/tag/' + encodeURIComponent(tag) + '" ' +
      'style="--c:' + p.color + (active ? ';background:' + p.color + ';border-color:' + p.color + ';color:#fff' : '') + '">' +
      esc(tag) + '</a>';
  }

  function card(post) {
    var main = (post.tags || [])[0];
    var p = pal(main);
    return '' +
      '<article class="card">' +
        '<a class="card-cover" href="#/post/' + esc(post.slug) + '" style="background:' + p.grad + '">' +
          '<span class="card-cat">' + esc(main || '文章') + '</span>' +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-meta"><time>' + fmtDate(post.date) + '</time>' +
            (post.author ? '<span>· ' + esc(post.author) + '</span>' : '') + '</div>' +
          '<h2 class="card-title"><a href="#/post/' + esc(post.slug) + '">' + esc(post.title) + '</a></h2>' +
          '<p class="card-excerpt">' + esc(post.excerpt || '') + '</p>' +
          '<div class="card-tags">' + (post.tags || []).map(function (t) { return tagChip(t, false); }).join('') + '</div>' +
        '</div>' +
      '</article>';
  }

  // ---------- 视图 ----------
  function renderHome() {
    var tags = allTags();
    var featured = POSTS[0];
    var rest = POSTS.slice(1);
    var html = '' +
      '<section class="hero">' +
        '<p class="hero-kicker">林深的个人博客</p>' +
        '<h1 class="hero-title">在技术与生活之间，<br>认真地记录每一段光。</h1>' +
        '<p class="hero-sub">这里收集关于代码、随笔与摄影的零碎想法。慢一点，也挺好。</p>' +
        '<div class="hero-tags">' + tags.map(function (t) { return tagChip(t, false); }).join('') + '</div>' +
      '</section>';

    if (featured) {
      var fp = pal((featured.tags || [])[0]);
      html += '' +
        '<a class="featured" href="#/post/' + esc(featured.slug) + '">' +
          '<div class="featured-cover" style="background:' + fp.grad + '">' +
            '<span class="card-cat">' + esc((featured.tags || [])[0] || '文章') + '</span></div>' +
          '<div class="featured-body">' +
            '<div class="card-meta"><time>' + fmtDate(featured.date) + '</time>' +
              (featured.author ? '<span>· ' + esc(featured.author) + '</span>' : '') + '</div>' +
            '<h2 class="featured-title">' + esc(featured.title) + '</h2>' +
            '<p class="card-excerpt">' + esc(featured.excerpt || '') + '</p>' +
            '<span class="read-more">阅读全文 →</span>' +
          '</div>' +
        '</a>';
    }

    html += '<div class="section-head"><h3>最新文章</h3><span>' + POSTS.length + ' 篇</span></div>';
    html += '<div class="grid">' + rest.map(card).join('') + '</div>';
    mount(html);
  }

  function renderTag(tag) {
    var list = POSTS.filter(function (p) { return (p.tags || []).indexOf(tag) >= 0; });
    var p = pal(tag);
    var html = '' +
      '<div class="tag-banner" style="background:' + p.grad + '">' +
        '<p class="tag-banner-label">标签</p>' +
        '<h1 class="tag-banner-title">' + esc(tag) + '</h1>' +
        '<p class="tag-banner-count">共 ' + list.length + ' 篇</p>' +
      '</div>' +
      '<div class="grid">' + list.map(card).join('') + '</div>';
    mount(html);
  }

  function renderPost(slug) {
    var post = POSTS.filter(function (p) { return p.slug === slug; })[0];
    if (!post) { renderNotFound(); return; }
    var main = (post.tags || [])[0];
    var p = pal(main);
    var body = MD.parse(post.content || '');
    var idx = POSTS.indexOf(post);
    var prev = POSTS[idx + 1], next = POSTS[idx - 1];

    var html = '' +
      '<article class="post">' +
        '<a class="back" href="#/">← 返回首页</a>' +
        '<div class="post-cat" style="--c:' + p.color + '">' + esc(main || '文章') + '</div>' +
        '<h1 class="post-title">' + esc(post.title) + '</h1>' +
        '<div class="post-meta"><time>' + fmtDate(post.date) + '</time>' +
          (post.author ? '<span>· ' + esc(post.author) + '</span>' : '') +
          '<span>· 约 ' + readingTime(post.content) + ' 分钟</span></div>' +
        '<div class="post-tags">' + (post.tags || []).map(function (t) { return tagChip(t, false); }).join('') + '</div>' +
        '<div class="post-content">' + body + '</div>' +
        '<nav class="post-nav">' +
          (prev ? '<a class="post-nav-prev" href="#/post/' + esc(prev.slug) + '"><span>← 上一篇</span><strong>' + esc(prev.title) + '</strong></a>' : '<span></span>') +
          (next ? '<a class="post-nav-next" href="#/post/' + esc(next.slug) + '"><span>下一篇 →</span><strong>' + esc(next.title) + '</strong></a>' : '<span></span>') +
        '</nav>' +
      '</article>';
    mount(html);
    // 代码块语言角标
    document.querySelectorAll('.code-block').forEach(function (el) {
      var lang = el.getAttribute('data-lang');
      if (lang) {
        var b = document.createElement('span');
        b.className = 'code-lang';
        b.textContent = lang;
        el.appendChild(b);
      }
    });
  }

  function renderAbout() {
    var tags = allTags();
    var html = '' +
      '<section class="about">' +
        '<div class="about-avatar">林</div>' +
        '<h1 class="about-name">林深</h1>' +
        '<p class="about-role">写代码的人 · 爱拍照的人 · 慢生活实践者</p>' +
        '<div class="about-text">' +
          '<p>你好，我是林深。白天写程序，傍晚散步，周末背着一台老相机在城市里乱走。</p>' +
          '<p>这个博客是我留给自己的角落：把学到的、想到的、拍到的，慢慢记下来。不追求日更，只求真诚。</p>' +
          '<p>如果某一篇刚好也戳中你，那就太好了。欢迎随便逛逛。</p>' +
        '</div>' +
        '<div class="about-stats">' +
          '<div><strong>' + POSTS.length + '</strong><span>篇文章</span></div>' +
          '<div><strong>' + tags.length + '</strong><span>个标签</span></div>' +
          '<div><strong>2026</strong><span>年开始</span></div>' +
        '</div>' +
        '<div class="about-tags">' + tags.map(function (t) { return tagChip(t, false); }).join('') + '</div>' +
      '</section>';
    mount(html);
  }

  function renderNotFound() {
    mount('<div class="notfound"><h1>404</h1><p>没有找到这篇文章。</p><a href="#/">← 回到首页</a></div>');
  }

  function mount(html) {
    var app = document.getElementById('app');
    app.innerHTML = html;
    document.body.setAttribute('data-view', location.hash.split('/')[1] || 'home');
  }

  function router() {
    var hash = location.hash.replace(/^#/, '') || '/';
    if (hash === '/' || hash === '') renderHome();
    else if (hash.indexOf('/post/') === 0) renderPost(decodeURIComponent(hash.slice(6)));
    else if (hash.indexOf('/tag/') === 0) renderTag(decodeURIComponent(hash.slice(5)));
    else if (hash === '/about') renderAbout();
    else renderHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', function () {
    if (!POSTS.length) {
      mount('<div class="notfound"><h1>空</h1><p>还没有文章。运行 <code>node scripts/build.js</code> 生成内容。</p></div>');
      return;
    }
    router();
  });
})();
