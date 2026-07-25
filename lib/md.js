/*
 * md.js — 轻量 Markdown 解析器（零依赖，离线可用）
 * 支持：标题、加粗/斜体、行内代码、围栏代码块、链接、图片、
 *       无序/有序列表、引用、分隔线、表格、删除线、段落。
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function splitRow(line) {
    return line.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
  }

  function parseInline(str) {
    // 1. 提取行内代码，避免其中的 * _ 被误解析（用安全占位符包裹）
    var codes = [];
    str = str.replace(/`([^`]+)`/g, function (m, c) {
      codes.push(c);
      return '##CODE' + (codes.length - 1) + '##';
    });

    // 2. 转义正文中的 HTML 特殊字符（此时已不含行内代码内容）
    str = escapeHtml(str);

    // 3. 图片 ![alt](url)
    str = str.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
      return '<img src="' + url + '" alt="' + alt + '">';
    });

    // 4. 链接 [text](url)
    str = str.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>';
    });

    // 5. 加粗 **text** / __text__
    str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // 6. 斜体 *text* / _text_
    str = str.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    str = str.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');

    // 7. 删除线 ~~text~~
    str = str.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 8. 还原行内代码
    str = str.replace(/##CODE(\d+)##/g, function (m, idx) {
      return '<code>' + escapeHtml(codes[+idx]) + '</code>';
    });

    return str;
  }

  function parse(md) {
    md = (md || '').replace(/\r\n/g, '\n');
    var lines = md.split('\n');
    var html = '';
    var i = 0;

    function isBlockStart(l) {
      return /^#{1,6}\s/.test(l) ||
        /^```/.test(l) ||
        /^>\s?/.test(l) ||
        /^\s*[-*+]\s+/.test(l) ||
        /^\s*\d+\.\s+/.test(l) ||
        /^(\-{3,}|\*{3,}|_{3,})\s*$/.test(l) ||
        /^\|.*\|\s*$/.test(l);
    }

    while (i < lines.length) {
      var line = lines[i];

      // 围栏代码块
      if (/^```/.test(line)) {
        var lang = line.slice(3).trim();
        i++;
        var code = [];
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // 跳过结束 ```
        html += '<pre class="code-block"' + (lang ? ' data-lang="' + lang + '"' : '') +
          '><code>' + escapeHtml(code.join('\n')) + '</code></pre>';
        continue;
      }

      // 标题
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        var lvl = h[1].length;
        html += '<h' + lvl + '>' + parseInline(h[2].trim()) + '</h' + lvl + '>';
        i++;
        continue;
      }

      // 分隔线
      if (/^(\-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        html += '<hr>';
        i++;
        continue;
      }

      // 引用
      if (/^>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        html += '<blockquote>' + parse(quote.join('\n')) + '</blockquote>';
        continue;
      }

      // 无序列表
      if (/^\s*[-*+]\s+/.test(line)) {
        var uitems = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          uitems.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
          i++;
        }
        html += '<ul>' + uitems.map(function (it) { return '<li>' + parseInline(it) + '</li>'; }).join('') + '</ul>';
        continue;
      }

      // 有序列表
      if (/^\s*\d+\.\s+/.test(line)) {
        var oitems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          oitems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        html += '<ol>' + oitems.map(function (it) { return '<li>' + parseInline(it) + '</li>'; }).join('') + '</ol>';
        continue;
      }

      // 表格
      if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        var header = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(function (c) {
          var l = c.indexOf(':') === 0, r = c.lastIndexOf(':') === c.length - 1;
          return (l && r) ? 'center' : r ? 'right' : l ? 'left' : '';
        });
        i += 2;
        var rows = [];
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        html += '<table><thead><tr>' +
          header.map(function (c, idx) {
            return '<th' + (aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '') + '>' + parseInline(c) + '</th>';
          }).join('') +
          '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + r.map(function (c, idx) {
              return '<td' + (aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '') + '>' + parseInline(c) + '</td>';
            }).join('') + '</tr>';
          }).join('') +
          '</tbody></table>';
        continue;
      }

      // 空行
      if (/^\s*$/.test(line)) { i++; continue; }

      // 段落
      var para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      html += '<p>' + parseInline(para.join(' ')) + '</p>';
    }

    return html;
  }

  global.MD = { parse: parse, escapeHtml: escapeHtml };
})(typeof window !== 'undefined' ? window : this);
