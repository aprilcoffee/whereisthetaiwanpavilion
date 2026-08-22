/* Every "Taiwan" on the page — in any language — scrambles while the pointer
   is over it, and settles back when the pointer leaves.
   Self-contained; if it fails, the words simply stay as they are. */

(function () {
  var WORDS = /(Taiwan|台灣|臺灣|台湾|臺湾|타이완)/gi;
  var GLYPHS = "!<>-_\\/[]{}=+*^?#%$&@~;:";
  var SKIP = { SCRIPT: 1, STYLE: 1, TITLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };

  /* wrap each match in its own span */
  function wrap(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !WORDS.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        WORDS.lastIndex = 0;
        var p = node.parentNode;
        while (p && p !== root) {
          if (SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains("scramble")) return NodeFilter.FILTER_REJECT;
          if (p.id === "list" || p.id === "bricks") return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains("contact")) return NodeFilter.FILTER_REJECT;
          if (p.nodeName === "A" && (p.getAttribute("href") || "").indexOf("mailto:") === 0)
            return NodeFilter.FILTER_REJECT;   // never scramble an address
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var targets = [], n;
    while ((n = walker.nextNode())) targets.push(n);

    targets.forEach(function (node) {
      var parts = node.nodeValue.split(WORDS);
      if (parts.length < 2) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (!part) return;
        if (i % 2 === 1) {
          var span = document.createElement("span");
          span.className = "scramble";
          span.textContent = part;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* the effect itself */
  function attach(el) {
    var original = el.textContent, frame = 0, raf = 0, queue = [];

    function rand(n) { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }

    function run(to) {
      var from = el.textContent, len = Math.max(from.length, to.length);
      queue = [];
      for (var i = 0; i < len; i++) {
        queue.push({
          from: from[i] || "",
          to: to[i] || "",
          start: Math.floor(Math.random() * 12),
          end: Math.floor(Math.random() * 12) + 12,
          ch: ""
        });
      }
      cancelAnimationFrame(raf);
      frame = 0;
      tick();
    }

    function tick() {
      var out = "", done = 0;
      for (var i = 0; i < queue.length; i++) {
        var q = queue[i];
        if (frame >= q.end) { done++; out += q.to; }
        else if (frame >= q.start) {
          if (!q.ch || Math.random() < 0.3) q.ch = rand();
          out += q.ch;
        } else out += q.from;
      }
      el.textContent = out;
      if (done < queue.length) { frame++; raf = requestAnimationFrame(tick); }
    }

    function scrambled() {
      var s = "";
      for (var i = 0; i < original.length; i++) s += rand();
      return s;
    }

    el.addEventListener("pointerenter", function () { run(scrambled()); });
    el.addEventListener("pointerleave", function () { run(original); });
  }

  function init() {
    try {
      wrap(document.body);
      [].slice.call(document.querySelectorAll(".scramble")).forEach(attach);
    } catch (e) { /* leave the page untouched */ }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
