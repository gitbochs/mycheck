// ==UserScript==
// @name         觅影
// @version      20.3.33
// @author       (o˘◡˘o)
// @description  平平无奇的原网页解析VIP视频
// @note         最近更新：修复： `芒果TV` 部分页面改版不显示解析；更新解析
// @namespace    (o˘◡˘o)
// @supportURL   https://gitee.com/ecruos/oo
// @icon         https://p.pstatp.com/origin/fe690000c9141955bbac
// @license      GPL License
// @include      *
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

!async function() {
  function Is(n) {
    let o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Href;
    return "string" == typeof n ? o.includes(n) : n.test(n.source.includes("=http") ? o : o.replace(/=http[^&]+/, ""));
  }
  function IsNot(n, o) {
    return !Is(n, o);
  }
  function magicSource(n) {
    return n.match(/\w+/g).forEach((function(o) {
      n = n.replace(o, magicString(o));
    })), n;
  }
  function mVU(n) {
    const o = magicSource(n);
    return "https://" + o + (o.includes("?") ? "" : (o.endsWith(".") ? "php" : o.includes("/") ? "" : "/") + "?url") + "=";
  }
  function ensureArray(n) {
    return Array.isArray(n) ? n : n.trim().split(/[\n\s]*\n+[\n\s]*/);
  }
  function toUrlRegex(n) {
    return new RegExp(n.map((function(n) {
      return n.replace(/.+\/\/|\/.+/g, "").replace(/\./g, "\\.");
    })).join("|"));
  }
  function getCdnUrl(n) {
    return "https://cdn.bootcss.com" + n;
  }
  async function fetchCdnUrl(n, o) {
    let e, i;
    const t = /^\/\w/.test(n);
    if (n = t ? getCdnUrl(n) : n, !o && t) {
      const o = n.match(/cdn.bootcss.com\/([^\/]+)\/([^\/]+)\/.+(\.\w+)$/);
      e = o[1] + o[3], i = o[2];
    } else e = o.name || n, i = o.version || VERSION;
    const a = GlobalStore.get(e);
    let r;
    return r = a && a.version === i ? a.data : await window.fetch(n).then((function(n) {
      return n.text();
    })).then((function(n) {
      return GlobalStore.set(e, {
        data: n,
        version: i
      }), n;
    })), r;
  }
  async function addJs(url, opts) {
    const data = await fetchCdnUrl(url, opts);
    return eval(data);
  }
  async function addCssUrl(n) {
    addCss(await fetchCdnUrl(n));
  }
  function addCss(n) {
    let o;
    return /^(http|\/)/.test(n) ? addCssUrl(n) : (n = n.replace(/\n+\s*/g, " "), o = document.createElement("style"),
    o.styleSheet ? o.styleSheet.cssText = n : o.appendChild(document.createTextNode(n)),
    o.type = "text/css", void document.getElementsByTagName("head")[0].appendChild(o));
  }
  function $$(n, o) {
    let e = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
    return 0 === $(n).length ? void (e > 100 ? log("× waitToRun:", n, "warn") : setTimeout((function() {
      waitToRun(n, o, e + 1);
    }), 100)) : (log("✔ waitToRun:", n), void $((function() {
      o();
    })));
  }
  function uuid() {
    let n = 46656 * Math.random() | 0, o = 46656 * Math.random() | 0;
    return n = ("000" + n.toString(36)).slice(-2), o = ("000" + o.toString(36)).slice(-3),
    "o" + n + o;
  }
  function emitter(n) {
    return n = n || Object.create(null), {
      on(o, e) {
        (n[o] || (n[o] = [])).push(e);
      },
      off(o, e) {
        n[o] && n[o].splice(n[o].indexOf(e) >>> 0, 1);
      },
      emit(o, e) {
        (n[o] || []).slice().map((function(n) {
          n(e);
        })), (n["*"] || []).slice().map((function(n) {
          n(o, e);
        }));
      }
    };
  }
  function log() {}
  function fixUrl(n) {
    return n.replace(/[\?#].+/g, "");
  }
  function fixVipUrl(n) {
    const o = BETTER_ADDONS.find((function(o) {
      return o.fixUrl && o.match.test(n);
    }));
    return o ? !0 === o.fixUrl ? fixUrl(n) : o.fixUrl(n) : n;
  }
  function getVipTargetUrl() {
    if (ooPlayUrl) return ooPlayUrl;
    let n = Is(isVipUrlRegex) ? location.href.replace(/.+=http/, "http") : location.href.replace(/&?\w+=http[^&]+/, "").replace(/.+http/, "http");
    return n = decodeURI(fixVipUrl(n) || n), n;
  }
  function getGlobal(n) {
    return (hasUnsafeWindow ? unsafeWindow : window)[n];
  }
  function setGlobal(n, o) {
    window[n] = o, hasUnsafeWindow && (unsafeWindow[n] = o);
  }
  function pausePlay() {
    log("pausePlay");
    try {
      $("video:not(.o--video), audio").each((function(n, o) {
        o.pause(), o.muted = !0, $("video:not(.o--video), audio").remove();
      }));
      const n = Date.now(), o = setInterval((function() {
        const e = Date.now() - n, i = getGlobal("playerObject") || getGlobal("MGTVPlayer") && getGlobal("MGTVPlayer").player || getGlobal("videoPlayer") || getGlobal("PLAYER");
        i && i.pause instanceof Function && i.pause(), (!i || e > 6e4) && clearInterval(o);
      }), 60);
    } catch (n) {
      console.error(PLUGIN_NAME + " play: " + n);
    }
  }
  function canPlayInPage(n) {
    return !isOnlyDownloadVideoUrlRegex.test(n) && (!/\/\/vwecam.tc.qq.com/.test(n) || Is("v.qq.com"));
  }
  function isValidVideoUrl(n) {
    return isValidUrlRegex.test(n) && isVideoUrlRegex.test(n) && !isInvalidSniffUrlRegex.test(n);
  }
  function toShortVideoUrl(n) {
    const o = n.match(shortVideoUrlRegex) || n.match(shortVideoUrlLoseRegex);
    return o ? o[1].split(".").slice(-2).join(".") + " ... " + o[o.length - 2].slice(-10) + "<span> . " + o[o.length - 1] + "</span>" : n;
  }
  async function playBefore() {
    $(".o--vip-play").removeClass("is-hide"), !isLoadPlayer && (addCss("/plyr/3.5.10/plyr.css"),
    await addJs("/hls.js/0.13.2/hls.min.js"), await addJs("/plyr/3.5.10/plyr.min.js"),
    isLoadPlayer = !0);
  }
  function formatPassedTime(n) {
    return ((Date.now() - n) / 1e3).toFixed(2) + "s";
  }
  function getSniffTime(n) {
    const o = sniffTimes[fixIframeUrl(n)];
    return o ? formatPassedTime(o) : "0s";
  }
  function sniffStart() {
    isSniffing = !0, sniffTimestamp = Date.now(), sniffUrls = [], sniffUrlsKey = [],
    $("html").addClass("o--on"), $(".o--vip").removeClass("is-play-in-page");
  }
  function sniffDone() {
    const n = formatPassedTime(sniffStartTime);
    log("Sniff done ✔ - usedTime ".concat(n)), isSniffing = !1, emptyIframes(), $(".o--sniff-progress").css({
      width: "100%"
    }), $(".o--vip").removeClass("is-sniffing").addClass("is-sniff-done"), sniffUrls.length > 0 && 0 === $(".o--sniff-done").length && $(".o--vip-play .o--sources").length && $(".o--vip-play .o--sources").append('<span class="o--sniff-done">✔</span>');
  }
  function sniffSuccess(n, o) {
    const e = (n = decodeURIComponent(n).replace(/^(http:)?\/\//, "https://")).replace(/\?.+/, "");
    if (sniffUrlsKey.includes(e)) return void (isAllowIframeSniff && log("Skip duplicate sniff url:", n));
    sniffUrlsKey.push(e), sniffUrls.push(n), log("✔ sniffSuccess:", n);
    const i = sniffUrls.length, t = _D ? ' _from="'.concat(o, '"') : "", a = n.match(isVideoUrlRegex)[1];
    $(".o--vip-play .o--sources").append('<a _href="'.concat(n, '" class="is-').concat(a, '"').concat(t, ">线路").concat(i, "</a>")),
    $(".o--vip-play .o--sources a").off("click").on("click", (function() {
      const n = $(this).attr("_href");
      log("→ playing:", n), updateQrcode(n);
      let o = document.querySelector(".o--player video");
      !o && ($(".o--player").prepend('<video class="o--video" poster="'.concat(PlayerCover, '" controls playsinline></video>')),
      o = document.querySelector(".o--player video"));
      const e = getGlobal("Plyr"), i = getGlobal("Hls");
      if (!player && e ? (player = new e(o, {
        debug: _D,
        invertTime: !1,
        autoplay: !0,
        volume: .75,
        speed: {
          selected: 1,
          options: [ .5, .75, 1, 1.25, 1.5, 2 ]
        },
        storage: {
          enabled: !0,
          key: storePrefix + "plyr"
        }
      }), player.on("enterfullscreen", (function() {
        $("html").addClass("o--fullscreen");
      })), player.on("exitfullscree", (function() {
        $("html").removeClass("o--fullscreen");
      }))) : !e && console.warn("NO Plyr."), $(".o--player-bg").remove(), /\.m3u8/.test(n) && i && i.isSupported()) {
        const e = new i;
        e.loadSource(n), e.attachMedia(o), e.on(i.Events.MANIFEST_PARSED, (function() {
          o.play();
        }));
      } else o.src = n, o.addEventListener("loadedmetadata", (function() {
        o.play();
      }));
      $(".o--play-url").html('来源：<a _href="'.concat(n, '">').concat(toShortVideoUrl(n), "</a>").concat(canPlayInPage(n) ? '<span class="o--span">如果全部线路都无法播放，可以点击来源链接下载来播放，或使用单个解析播放。</span>' : '<span class="o--span is-warning"><span>该链接无法在当前站点播放，请点击来源下载播放</span></span>')),
      $(".o--play-url a").off("click").on("click", (function() {
        const n = $(this).attr("_href");
        log("click play url:", n), isHiker && window.fy_bridge_app.playVideo ? window.fy_bridge_app.playVideo(n) : isMixia && window.mx_browser_obj.playvideo ? window.mx_browser_obj.playvideo(n, n) : window.open(n, "_blank", "noopener");
      })), $(".o--vip-play .o--sources a").removeClass("is-active"), $(this).addClass("is-active");
    })), 1 === i ? ($(".o--vip-play a").eq(0).click(), $(".o--vip").addClass("is-sniff-success"),
    $(".o--vip-play").removeClass("is-hide")) : setTimeout((function() {
      player && player.ready && 0 === player.duration && $(".o--vip-play a").eq(i - 1).click();
    }), isMobile ? 3200 : 2800);
  }
  function sniffFail() {
    log("× sniffFail"), sniffDone(), $(".o--player-bg").addClass("is-fail"), $(".o--vip").addClass("is-sniff-fail");
  }
  function _Sniff() {}
  function hikerSniff(sniffTickId) {
    if (sniffTickId !== sniffTick) return;
    let resource = eval(window.fy_bridge_app.getNetworkRecords());
    resource = resource.filter((function(n) {
      return n.timestamp > sniffTimestamp && /video/i.test(n.mediaType.name) && isValidVideoUrl(n.url);
    })), isSniffing && (resource.forEach((function(n) {
      sniffSuccess(n.url);
    })), setTimeout((function() {
      hikerSniff(sniffTickId);
    }), 100));
  }
  function mixiaSniff(n) {
    if (n !== sniffTick) return;
    let o = [], e = window.mx_browser_obj.getweblogs("http");
    "error" !== e && (o = e.trim().split(/\s*\n[\n\s]*/), o = o.filter((function(n) {
      return isValidVideoUrl(n);
    }))), isSniffing && (o.forEach((function(n) {
      sniffSuccess(n);
    })), setTimeout((function() {
      mixiaSniff(n);
    }), 100));
  }
  function insertPlayerHtml() {
    let n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
    const o = '<div class="o--player-bg"><div class="o--sniff-progress"></div><div class="o--loader">'.concat(Icon.loader, '</div><div class="o--sign">(o˘◡˘o)<span class="o--version">v ').concat(VERSION, '</span></div><div class="o--slogan"><strong>觅</strong>即知君不可见，挥毫点染湖山<strong>影</strong></div><div class="o--error-text">解析失败，可以尝试使用单个解析播放，或者到其它正版网站上解析</div></div>'), e = '<div class="o--player">'.concat(o).concat(n, "</div>"), i = getVipPlayer();
    i.length > 0 && (i.empty().append(e), $(".o--player").parent().addClass("o--player-box"));
  }
  function sniff(n) {
    if (log("sniff / isAllowSniff ".concat(isAllowSniff ? "✔" : "×")), sniffStart(),
    isAllowIframeSniff) log("_Sniff"), _Sniff(); else if (isAllowHikerSniff) log("hikerSniff"),
    hikerSniff(n); else {
      if (!isAllowMixiaSniff) return void sniffDone();
      log("mixiaSniff"), mixiaSniff(n);
    }
    const o = '<div class="o--vip-play is-hide"><div class="o--sources"></div><div class="o--play-url"></div></div>';
    insertPlayerHtml(isMobile ? "" : o), isMobile && ($(".o--vip-play").remove(), $(".o--vip-panel").after(o)),
    pausePlay(), sniffUrls = [], sniffTimes = {}, goSniff();
  }
  function goSniff() {
    function n() {
      const e = $("oo-iframes > iframe").length;
      if (e > p - 1) setTimeout((function() {
        n();
      }), 100); else {
        const n = player && player.ready && player.duration > 0 ? 200 * e : 0, i = e < p - 2 ? isMobile ? Math.min(150 * sniffUrls.length + 150 * e + 800, 1200) : Math.min(150 * sniffUrls.length + 200 * e + 1e3, 1500) : 150;
        log("[".concat(o + 1, "] nextSniffTime: ").concat(i)), setTimeout((function() {
          goSniff(o + 1);
        }), i + n);
      }
    }
    let o = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0;
    if (!isSniffing) return;
    const e = VU[o], i = (o + 1) / (VU.length + 1), t = (sniffUrls.length + 1) / MAX_SNIFF_PLAY_COUNT, a = Math.min(10 * (2.5 * i + 2.5 * t + 5 * Math.max(i, t) + .5), 99).toFixed(4) + "%";
    if (log("【".concat(o, " - ").concat(a, " (thread ").concat($("oo-iframes > iframe").length, ")】goSniff:"), e),
    $(".o--sniff-progress").css({
      width: a
    }), !e) {
      const n = setInterval((function() {
        0 === $("oo-iframes > iframe").length && (clearInterval(n), 0 === sniffUrls.length ? sniffFail() : sniffDone());
      }), 1e3);
      return;
    }
    if (sniffUrls.length >= MAX_SNIFF_PLAY_COUNT + (player && player.ready && player.duration > 0 ? -1 : 2)) return void sniffDone();
    const r = getVipTargetUrl(), l = mVU(e) + r;
    log("sniff: " + l), sniffTimes[fixIframeUrl(l)] = Date.now();
    const s = addIframe(l), c = 12e3, p = isMobile ? 7 : 5;
    s.onload = function() {
      setTimeout((function() {
        removeIframe(s, "TIMEOUT");
      }), c);
    }, setTimeout((function() {
      removeIframe(s, "MAX TIMEOUT");
    }), c + 3e3), n();
  }
  async function autoSniffPlay() {
    log("autoSniffPlay"), await playBefore(), sniffTick > 0 && sniffDone(), sniffStartTime = Date.now(),
    sniff(++sniffTick), $(".o--vip").removeClass("is-sniff-success is-sniff-done").addClass("is-sniffing");
  }
  function getVipPlayer() {
    let n = $(PlayerSelector).eq(0);
    return 0 === n.length && (n = $("#player, .player").eq(0)), n;
  }
  function playInPage(n) {
    $(".o--player").removeClass("is-loaded"), 0 === getVipPlayer().length ? location.href = n : (pausePlay(),
    insertPlayerHtml('<iframe id="o--player-iframe" style="'.concat("width: 100%; height: 100%; border: none; outline: none;", '" ').concat(' width="100%" height="100%" allowfullscreen="true" allowtransparency="true" frameborder="0" scrolling="no" sandbox="allow-scripts allow-same-origin allow-forms"', ' src="').concat(n, '"></iframe>'))),
    setTimeout((function() {
      $(".o--player").addClass("is-loaded");
    }), 1500);
  }
  function playVipUrl(n) {
    if (!n) return void log("[playVipUrl] No vipUrl:", n);
    const o = n + getVipTargetUrl();
    log("playVipUrl: " + o), $(".o--vip").removeClass("is-sniff-success is-sniff-done is-sniffing").addClass("is-play-in-page"),
    updateQrcode(o), isPlayingInPage && !/http:/.test(n) ? playInPage(o) : (pausePlay(),
    $("#o--player-iframe").remove(), $(".o--player").removeClass("is-loaded"), setTimeout((function() {
      window.open(o, "_blank");
    }), 100));
  }
  async function updateQrcode() {
    let url = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : Href;
    isMobile || (log("updateQrcode:", url), !qrcodeCode && (qrcodeCode = await fetchCdnUrl("/qrcode-generator/1.4.4/qrcode.min.js")),
    eval(qrcodeCode), QR = qrcode(0, "L"), QR.addData(url), QR.make(), log("updateQrcode success"),
    $(".o--qrcode-box").removeClass("o--hide"), $(".o--qrcode").html(QR.createImgTag()));
  }
  function playVipItem(n) {
    const o = $(n).length > 0;
    let e = o ? $(n).hasClass("o--vip-sniff") ? "auto" : $(n).attr("_href") : Store.get("lastPlayChoice", "");
    log(o ? "✔" : "× playVipItem - lastPlayChoice: " + (e || "auto")), $(".o--vip-item").removeClass("is-active"),
    o ? $(n).addClass("is-active") : e.startsWith("http") ? ($(".o--vip-item:not(.o--vip-sniff)").each((function() {
      $(this).attr("_href") === e && $(this).addClass("is-active");
    })), playVipUrl(e)) : $(".o--vip-item.o--vip-sniff").addClass("is-active"), isSniffing && sniffDone(),
    e.startsWith("http") ? playVipUrl(e) : autoSniffPlay(), Store.set("lastPlayChoice", e);
  }
  function insertVipSource(n) {
    function o() {
      $(".o--setting-button").off("click").on("click", (function() {
        $(".o--vip").toggleClass("is-setting-on");
      })), $(".o--toggle").off("click").on("click", (function() {
        $(this).toggleClass("is-n"), $(this).hasClass("o--action-pip") && (isPlayingInPage = !isPlayingInPage,
        GlobalStore.set("isPlayingInPage", isPlayingInPage));
      })), $(".o--edit-vip-source-panel textarea").off("input").on("input", (function() {
        GlobalStore.set("VipUrls", $(this).val());
      })), $(".o--vip-item").off("click").on("click", (function() {
        playVipItem(this);
      })), $(".o--log-button").off("click").on("click", (function() {
        $("oo-logs").toggleClass("is-active");
      }));
    }
    let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "after", i = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
    if ($(".o--vip").length > 0 || i > 20) return;
    const t = $(n);
    if (0 === t.length) return void setTimeout((function() {
      insertVipSource(n, e, i + 1);
    }), 250);
    log("insertVipSource"), t.eq(0)[e]('<div class="o--vip'.concat(isAllowSniff ? " is-allow-sniff" : "", '"><div class="o--sniff-progress"></div><div class="o--vip-panel"><div class="o--vip-title"><span class="o--vip-title-text">').concat(PLUGIN_NAME, '<span class="o--vip-small">v').concat(VERSION, "</span></span>").concat(_D ? '<span class="o--log-button">LOG</span>' : "", '</div><div class="o--menus"><div class="o--qrcode-box o--hide">').concat(Icon.qrcode, '<div class="o--qrcode-text">手机扫码看</div><div class="o--qrcode"></div></div><div class="o--setting-button">').concat(Icon.settings, '</div></div></div><div class="o--setting-panel"><div class="o--actions"><div class="o--action o--toggle o--action-pip').concat(isPlayingInPage ? "" : " is-n", '"><span class="o--y">是</span><span class="o--n">否</span>开启原网页解析播放</div><div class="o--action"><a href="https://greasyfork.org/scripts/393284" target="_blank">油猴地址</a></div></div><div class="o--edit-vip-source-panel"><div class="o--edit-hint">编辑后，刷新页面生效，清空会恢复为默认（原网页解析只支持 https 开头的解析）</div><textarea>').concat(customVipUrls.trim(), '</textarea></div></div><div class="o--vip-list"><span class="o--vip-item o--vip-sniff">').concat(Icon.vip, "</span>").concat(vipUrls.map((function(n) {
      return '<span class="o--vip-item' + (n.url.startsWith("https") ? " is-play-in-page" : "") + '" _href="' + n.url + '">' + n.name + "</span>";
    })).join(""), "</div></div>"));
    let a = 0, r = setInterval((function() {
      o(), a++ > 100 && clearInterval(r);
    }), Math.min(200 + 50 * a, 1e3));
  }
  function execQuickAddons(n) {
    log("execQuickAddons:", n.name || n.match);
    let o = STYLES;
    n.hide && (o += "".concat(n.hide, " {").concat(PurifyStyle, "}")), n.css && (o += n.css),
    addCss(o), $((function() {
      if (n.sign && $(n.sign).html(OO_SIGN), n.vip && (addIframe(PlayerCover), window.addEventListener("message", (function(n) {
        const o = n.data;
        !o || o._id !== MESSAGE_ID || (log("message:", MESSAGE_ID, o), o.action && E.emit(o.action, o));
      })), "boolean" != typeof n.vip)) {
        (Array.isArray(n.vip) ? n.vip : [ n.vip ]).forEach((function(n) {
          insertVipSource((n = n.split(/\s*\|\s*/))[0], n[1]);
        }));
      }
      n.js instanceof Function && n.js();
    }));
  }
  function fixIframeUrl(n) {
    return n.replace(/\/?\?.+/, "");
  }
  function getIframeId(n) {
    return iframes[fixIframeUrl(n)];
  }
  function getIframe(n) {
    return frames[fixIframeUrl(n)];
  }
  function setIframe(n, o) {
    iframes[fixIframeUrl(n)] = o;
  }
  function addIframe(n) {
    let o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "oo-iframes";
    log("addIframe:", n, "|", o);
    const e = document.createElement("iframe");
    return e.id = uuid(), e.frameborder = "0", e.scrolling = "no", e.seamless = !0,
    e.sandbox = "allow-scripts allow-same-origin allow-forms", n && (e.src = n, setIframe(n, e.id)),
    $(o).append(e), e;
  }
  function removeIframe() {
    let n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "oo-iframes > iframe", o = arguments.length > 1 ? arguments[1] : void 0;
    const e = $("string" == typeof n ? n.startsWith("oo-iframes") ? n : "#" + n : n.id ? "#" + n.id : n).get(0);
    e && (log("Remove iframe #".concat(e.id, " (").concat(e.src, ")") + (o ? "【".concat(o, "】") : "")),
    e.src = "about:blank", $(e).remove());
  }
  function emptyIframes() {
    $("oo-iframes > iframe").each((function(n, o) {
      removeIframe(o);
    })), $("oo-iframes").empty();
  }
  function urlDetector() {
    setInterval((function() {
      !function() {
        if (Href !== window.location.href) {
          const n = Href;
          Href = window.location.href, E.emit("url.change", {
            newUrl: Href,
            oldUrl: n
          });
        }
      }();
    }), 250);
  }
  function fixM3u8Playing() {
    log("fixM3u8Playing");
    const n = Date.now();
    let o;
    const e = setInterval((function() {
      const i = Date.now() - n;
      (o = document.querySelector("video[src]")) && o.src.endsWith(".m3u8") ? (clearInterval(e),
      setTimeout((async function() {
        if (0 === o.readyState) {
          const n = getGlobal("Hls");
          if (!n && await addJs("/hls.js/0.13.2/hls.min.js"), n.isSupported()) {
            o.pause();
            const e = new n;
            e.loadSource(o.src), e.attachMedia(o), e.on(n.Events.MANIFEST_PARSED, (function() {
              o.play();
            })), isNotTop ? window.parent.postMessage({
              _id: MESSAGE_ID,
              action: "log",
              from: location.href,
              origin: location.href,
              url: o.src,
              parent: !0,
              text: "Fix m3u8 play"
            }, "*") : log({
              from: location.href,
              origin: location.href,
              url: o.src,
              text: "Fix m3u8 play"
            });
          }
        }
      }), 1e3)) : i >= 15e3 && clearInterval(e);
    }), 100);
  }
  function sniffInIframe(n) {
    log("sniffInIframe"), location.href === PlayerCover && window.top.postMessage({
      pageInfo: n,
      _id: MESSAGE_ID,
      action: "enable.sniff",
      from: location.href
    }, "*"), window.addEventListener("message", (function(n) {
      const o = n.data;
      !o || o._id !== MESSAGE_ID || (log("iframe message:", MESSAGE_ID, o), o.parent && (o.from = location.href,
      window.parent.postMessage(o, "*")));
    }));
    const o = Date.now(), e = setInterval((function() {
      const i = Date.now() - o;
      if ($("video source[src], video[src]").length > 0) {
        clearInterval(e), $("video, audio").each((function(n, o) {
          const e = o.muted;
          o.muted = !0;
          const i = Date.now(), t = setInterval((function() {
            const n = Date.now() - i;
            o.muted = !0, o.pause(), n > 4e3 ? (clearInterval(t), o.muted = e) : o.muted = !0;
          }), 60);
        }));
        const o = $("video source[src]").eq(0).attr("src") || $("video[src]").eq(0).attr("src") || "";
        return /^\/[^\/]/.test(o) && (o = location.origin + o), void (isValidVideoUrl(o) ? window.parent.postMessage({
          pageInfo: n,
          usedTime: i,
          _id: MESSAGE_ID,
          action: "play.video",
          from: location.href,
          origin: location.href,
          url: o,
          parent: !0
        }, "*") : window.parent.postMessage({
          pageInfo: n,
          usedTime: i,
          text: "NOT MATCH VIDEO URL",
          _id: MESSAGE_ID,
          action: "log",
          from: location.href,
          origin: location.href,
          url: o,
          parent: !0
        }, "*"));
      }
      const t = $("iframe[src]").length > 0;
      if (i >= 4e3 && t) return void clearInterval(e);
      const a = $("video").length > 0;
      (i >= 1e4 || i >= 2e3 && a) && (clearInterval(e), window.parent.postMessage({
        pageInfo: n,
        usedTime: i,
        hasVideo: a,
        hasIframe: t,
        _id: MESSAGE_ID,
        action: "sniff.fail",
        from: location.href,
        origin: location.href,
        parent: !0
      }, "*"));
    }), 100);
  }
  function addonGo() {
    BETTER_ADDONS.forEach((function(n) {
      Is(n.match) && execQuickAddons(n);
    }));
  }
  const isTop = window.top === window.self, isNotTop = !isTop, _D = !1, OO_SIGN = "(o˘◡˘o)", PLUGIN_ID = "(o˘◡˘o) 觅影", PLUGIN_ATTR = "miying", PLUGIN_NAME = "觅影", VERSION = "20.3.33", isGM = "undefined" != typeof GM && "undefined" != typeof unsafeWindow;
  if (isTop && /vwecam.tc.qq.com|\.titan.mgtv.com/.test(location.href) && !document.querySelector("video")) return location.reload();
  const HTML = document.getElementsByTagName("html")[0];
  if (HTML.getAttribute(PLUGIN_ATTR) === PLUGIN_ID) return;
  HTML.setAttribute(PLUGIN_ATTR, PLUGIN_ID);
  const MAX_Z_INDEX = 2147483647, BETTER_ADDONS = [ {
    name: "腾讯·播放页",
    match: /v\.qq\.com\/(cover|play|x\/cover|x\/page|x\/play|x\/m\/cover|x\/m\/page|x\/m\/play)/,
    vip: "#vip_title, .U_box_bg_a, .player_headline, .mod_video_info",
    title: ".mod_video_info .video_title, ._main_title, .player_title",
    fixUrl(n) {
      if (n.includes("cid=")) {
        const o = n.match(/cid=(\w+)/)[1];
        let e = n.match(/vid=(\w+)/);
        return e = e ? "/" + e[1] : "", "https://v.qq.com/x/cover/".concat(o).concat(e, ".html");
      }
      return n.includes("/x/cover") ? n.replace(/\.html.*/, ".html") : n;
    },
    hide: '.mod_source, .video_function, .mod_promotion, #vip_privilege, #vip_activity, .U_bg_b, .btn_open_v, .btn_openapp, #vip_header, .btn_user_hd, .mod_sideslip_privileges, .mod_game_rec, .mod_source, .mod_promotion, .mod_sideslip_h, .btn_open, .btn_pay, .mod_box_lastview, .mod_vip_popup, .mod_vip_popup + .mask_layer, txpdiv[data-role="hd-ad-adapter-interactivelayer"], .mod_ad',
    css: "body, #vip_title {padding-bottom: 0 !important;}.mod_episodes_numbers.is-vip .item {width: auto;padding: 0 1em;}.U_html_bg .container {padding-bottom: 30px;}.mod_play .mod_player_viptips .btn_try {left: 30%;}"
  }, {
    name: "爱奇艺·播放页",
    match: /\.iqiyi\.com\/v_/,
    vip: 'div[name="m-videoInfo"], #block-C',
    title: "#widget-videotitle, .video-title, .c-title-link, .player-title a",
    fixUrl: !0,
    sign: ".m-footer",
    hide: '.m-iqyDown, .header-login + div, .m-video-action, div[name="m-vipRights"], div[name="m-extendBar"], .m-iqylink-diversion, .m-iqylink-guide, .c-openVip, .c-score-btn, .m-videoUser-spacing, .m-pp-entrance, .m-hotWords-bottom, div[template-type="ALBUM"] .m-player-tip, .iqp-box-integral, body > div[style]',
    css: '\n.page_play {padding-bottom: 0;}div[name="m-videoInfo"] {padding-top: 1em;}.m-box-items .o--album-item {border-radius: 0.05em;background-color: #e9ecef;color: #495057;padding: 0.5em 1em;display: inline-flex;justify-content: center;align-items: center;margin: 0.25em;font-weight: bold;}.m-video-player #o--player-iframe {padding-top: 56.25%;top: 50%;transform: translateY(-50%);}.qy-header .header-wrap {z-index: '.concat(MAX_Z_INDEX, ";}"),
    js() {
      log("修复爱奇艺选集");
      let n = [], o = ($('[name="apple-itunes-app"]').attr("content") || "").match(/aid=\d{2,}/);
      if (o) {
        fetch("https://pcw-api.iqiyi.com/albums/album/avlistinfo?page=1&size=9999&" + o[0]).then((function(n) {
          return n.json();
        })).then((function(o) {
          n = o.data.epsodelist;
        }));
        let e = 0;
        setInterval((function() {
          let o = Number($(".qy-episode-num .select-item.selected .select-link").text() || 0);
          if (o && o !== e) {
            log("change episode num: ".concat(e, " → ").concat(o)), e = o;
            let i = n[e - 1];
            if (i) {
              let n = i.playUrl.replace(/https?:/, location.protocol);
              if (n !== ooPlayUrl) {
                const o = ooPlayUrl || location.href;
                ooPlayUrl = n, log("change episode to:", n), E.emit("url.change", {
                  oldUrl: o,
                  newUrl: n,
                  autoPlay: !0
                });
              }
            }
          }
        }), 100);
      }
    }
  }, {
    name: "优酷·播放页",
    match: /m\.youku\.com\/a|m\.youku\.com\/v|v\.youku\.com\/v_/,
    vip: ".h5-detail-info, .player-title",
    title: ".player-title .subtitle a, .module-name, .anthology-title-wrap .title, .title-link",
    fixUrl: !0,
    sign: ".copyright",
    hide: ".h5-detail-guide, .h5-detail-ad, .brief-btm, .smartBannerBtn, .cmt-user-action, #right-title-ad-banner, .Corner-container",
    css: "#bpmodule-playpage-lefttitle {height: auto !important;}"
  }, {
    name: "土豆·播放页",
    match: /\.tudou.com\/v\//,
    vip: ".play-video-desc, .td-play__baseinfo",
    title: ".td-listbox__title, .video-desc-title",
    fixUrl: !0,
    hide: ".video-player-topbar, .td-h5__player__appguide, #tudou-footer, .dropdown__panel__con"
  }, {
    name: "芒果·播放页",
    match: /\.mgtv\.com\/(b|l)\//,
    vip: [ ".xuanji | before", ".v-panel-box, .control-left" ],
    title: ".v-panel-title, .vt-txt",
    fixUrl: !0,
    sign: ".mg-footer-copyright",
    hide: ".ad-banner, .video-area-bar, .video-error .btn, .m-vip-list, .m-vip-list + div:not([class]), .toapp, .video-comment .ft, .mg-app-swip"
  }, {
    name: "搜狐·播放页",
    match: /film\.sohu\.com\/album\/|tv\.sohu\.com\/(v|phone_play_film|\d+\/n\d+.shtml)/,
    vip: ".title-wrap, .videoInfo, .tw-info, .player-detail, .movie-info-content",
    title: "#vinfobox h2, .t-info, .movie-t h3",
    fixUrl(n) {
      if (/phone_play_film.+channeled=/.test(n)) {
        const o = n.match(/channeled=(\w+)/)[1], e = n.match(/aid=(\w+)/)[1];
        return "https://film.sohu.com/album/".concat(e, ".html?channeled=").concat(o);
      }
      return n;
    },
    sign: ".links",
    hide: ".actv-banner, .btn-xz-app, .twinfo_iconwrap, .btn-comment-app, #ad_banner, .advertise, .main-ad-view-box, .foot.sohu-swiper, .app-star-vbox, .app-guess-vbox, .main-rec-view-box, .app-qianfan-box, .comment-empty-bg, .copyinfo, .ph-vbox, .btn_m_action, .btn-xz-app, #film_top_banner, .btn-comment-app",
    css: ".comment-empty-txt {margin-bottom: 0;}.app-view-box + footer {padding: 0;opacity: 0.5;}#sohuplayer #menu {z-index: ".concat(MAX_Z_INDEX, ";}")
  }, {
    name: "乐视·播放页",
    match: /\.le\.com\/(ptv\/vplay\/|vplay_)/,
    vip: ".introduction_box, .briefIntro_left .info_list",
    title: ".briefIntro_info .info_tit, #j-introduction h2",
    fixUrl: !0,
    hide: ".gamePromotion, .gamePromotionTxt, #j-leappMore, .lbzDaoliu, .arkBox"
  }, {
    name: "咪咕·播放页",
    match: /miguvideo\.com\/.+\/detail\.html/,
    vip: ".playerFooter, .programgroup",
    title: ".left-box .title, .episodeTitle, .video_title",
    hide: '.group-item[name*="广告"], .openClient'
  }, {
    name: "PPTV·播放页",
    match: /(v|m)\.pptv\.com\/show\//,
    vip: ".m .cf, .vod-tit, .vod-intor",
    title: "#video-info h1, .vod-tit-in span, .tit",
    fixUrl: !0,
    hide: '.w-video-vastad, #video-download-game, div[class*="openapp"], div[class*="side-adv"], div[id*="afp_"], div[id*="-afp"], iframe[src*="/game/"], .afpPosition, .download-iconbar'
  }, {
    name: "华数·播放页",
    match: /wasu\.cn\/.*[pP]lay\/show\//,
    vip: ".movie_title",
    title: ".movie_title h2",
    fixUrl: !0,
    hide: 'div[id*="BAIDU"], .player_menu_con, body > div[style*="fixed"]'
  }, {
    name: "1905·播放页",
    match: /1905.com\/play/,
    vip: ".playerBox-info, #movie_info, .player-nav",
    title: "#movie_info .infoInner .title, .movie-title, .tv_title",
    fixUrl: !0,
    hide: "#app_store, .openMembershipBtn, body > div[id] > iframe, .pv2-advertisement, .open-app",
    css: "#movie_info {margin-top: 1em;}"
  } ], PurifyStyle = "display: none !important;visibility: hidden !important;width: 0 !important;height: 0 !important;max-width: 0 !important;max-height: 0 !important;overflow: hidden !important;position: absolute !important;left: -99999px !important;opacity: 0 !important;pointer-events: none !important;", DEFAULT_VU = "job.wia9.md,xxx.oyfol.md·jwfji,wi.dsxkf.npd·oju,wi.fjcmblj.md·jwfji,e83jz.md·oju·oju.,xxx.odjzmbjr.npd·jwfji·wfcmj.,wi.usjzupz.npd,wi.fgdbk.fn·dd,job.zt96.md,xxx.ukewm.npd,wi.22ab.ops·oju,wi.pbahmbjwhmjz.md·oju.,jwfji.l192.npd,jwfji.hj7na.md,xxx.h1819.md·jwfji,wilp.dd,wi.190111.ops·wi,wijnjs.tzpamuz.md·wi,xxx.jwfjiuhmbo.dd·jwfji.,oju.mvzpbi.npd·wfcmj.,job.138us.npd·wi,wi.0ee0.md,job.7u.sbgd,zbko.68pe.md,job.134247.ops·oju,jwfji.009061.dd·wi.,job.jwfji.bk,xxx.mvz6060.npd·wi·zs.,wi.ilkqv.npd,wi.xzz88.npd,v.fjipbanm.npd·jqhmjn·jqhmjn.,wi.94nl.ops·wi,wi.h907.npd,f177.npd,zo.30bg.yzw·tpt·wfcmj.,job.wi2.ops·oju,xxx.jtpbjcw.npd·oju,v.hmptjgymbd.md·v.,xxx.9v2nzbko.md·jwfji.,zo.30bg.yzw·tpt·wfcmj.,wi.czd6.npd,xxx.ubnzw.npd,bbbri.npd·wi.,job.wihmbjkfvz.npd", PlayerSelector = "#iframaWrapper, #mgtv-player-wrap, #sohuplayer .x-player, #wPlayer, #video-box, #playerbox, .td-h5__player, .td-playbox, .iqp-player, .g-play .video-area, #mod_player, #playBox, #j-player, #video, .m-video-player, .site_player", VipUrls = "安歌 https://z1.m1907.cn/?jx=\n胜蓝 https://123dan.top/jie/xi?url=\n巧颜 https://jx.fuxing56.com/jiexi/?url=\n景云 https://www.1717yun.com/beiyong/?url=\n翼遥 https://vip.mpos.ren/v/?url=\n博衍 https://jx.fwwmy1.cn/mingri/ming_v.php?url=\n乐康 https://jx.sinbinchina.com/?v=\n斯年 https://api.iztyy.com/jiexi/?url=\n南乔 https://by.dybhn.com/?url=\n望舒 https://v.dybhn.com/index.php?url=\n兰采 https://www.ckmov.vip/api.php?url=\n信石 http://at520.cn/jx/?url=\n凌泉 http://beijixs.cn/?url=\n秋桑 http://playx.top/?url=\n风藤 http://bofang.online/?url=\n落葵 http://api.6uzi.com/?url=\n天冬 http://nitian9.com/?url=\n文竹 http://api.oopw.top/jiexi/?url=\n紫芙 http://mimijiexi.top/?url=", PlayerCover = "https://p.pstatp.com/origin/ff460000f53068309d77";
  let Href = location.href, ooLogsDom;
  if (Is(/cookie.html/) || Is(/m\.le\.com/) && IsNot(/m.le.com\/search|so.le.com\/s|\.le\.com\/(ptv\/vplay\/|vplay_)/)) return;
  const charToNum = function(n) {
    return n.charCodeAt(0) - 97;
  }, numToChar = function(n) {
    return String.fromCharCode(97 + n);
  }, magicNumber = function(n) {
    return Number(n) + (n % 2 == 1 ? -1 : 1);
  }, magicLetter = function(n) {
    return numToChar(magicNumber(charToNum(n)));
  }, magicChar = function(n) {
    return /[a-z]/.test(n) ? magicLetter(n) : /\d/.test(n) ? magicNumber(n) : "";
  }, magicString = function(n) {
    return n.split("").reverse().map((function(n) {
      return magicChar(n);
    })).join("");
  }, screenWidth = window.screen.width, isMobile = screenWidth <= 600 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || !1, storePrefix = "觅影.", Store = {
    get(n) {
      let o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null, e = window.localStorage.getItem(storePrefix + n);
      try {
        e = JSON.parse(e);
      } catch (n) {}
      return null === e ? o : e;
    },
    set(n) {
      let o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null;
      window.localStorage.setItem(storePrefix + n, JSON.stringify(o));
    },
    remove(n) {
      window.localStorage.removeItem(storePrefix + n);
    }
  }, GlobalStore = {
    get(n) {
      let o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null, e = Store.get(n);
      if (!isGM) return e || o;
      null === e ? e = GM_getValue(storePrefix + n, o) : (GlobalStore.set(n, e), Store.remove(n));
      try {
        e = JSON.parse(e);
      } catch (n) {}
      return null === e ? o : e;
    },
    set(n) {
      let o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null;
      isGM ? GM_setValue(storePrefix + n, JSON.stringify(o)) : Store.set(n, o);
    },
    remove(n) {
      isGM ? GM_deleteValue(n) : Store.remove(n);
    }
  }, VU = DEFAULT_VU.replace(/·/g, "/").split(","), NoMobileVipUrlRegex = /jx\.wslmf\.com|beijixs\.cn/, customVipUrls = (GlobalStore.get("VipUrls") || "").trim() || VipUrls, vipUrls = ensureArray(customVipUrls).map((function(n) {
    let o = n.split(/\s+/);
    if (!(n = o.pop()).includes("http")) return {};
    let e = o.length > 0 ? o.join(" ") : n.match(/\/\/(.+\.)?([^\/]+)\.\w+\//)[2].replace(/^(\w)/, (function(n) {
      return n.toUpperCase();
    }));
    return {
      url: n,
      name: e
    };
  })).filter((function(n) {
    return n.url && (!isMobile || !NoMobileVipUrlRegex.test(n.url));
  })), isVipUrlRegex = toUrlRegex(vipUrls.map((function(n) {
    return n.url;
  })));
  await addJs("/jquery/3.4.1/jquery.min.js");
  const $ = jQuery.noConflict(!0), E = emitter();
  log("✔ Loaded " + PLUGIN_NAME + " v" + VERSION, {
    isMobile: isMobile,
    isGM: isGM,
    url: Href
  });
  let topClass = isMobile ? "o--m" : "o--pc";
  $("html").addClass(topClass);
  let ooPlayUrl = "";
  const hasUnsafeWindow = "undefined" != typeof unsafeWindow, MAX_SNIFF_PLAY_COUNT = 10;
  let isAllowIframeSniff = GlobalStore.get("isAllowIframeSniff") || !1;
  const isHiker = !!window.fy_bridge_app, isMixia = !!window.mx_browser_obj, isAllowHikerSniff = isHiker && !!window.fy_bridge_app.getNetworkRecords, isAllowMixiaSniff = isMixia && !!window.mx_browser_obj.getweblog;
  let isAllowSniff = isAllowHikerSniff || isAllowMixiaSniff || isAllowIframeSniff, sniffTimestamp = Date.now(), isSniffing = !1, sniffTick = 0, sniffUrls = [], sniffUrlsKey = [], isPlayingInPage = GlobalStore.get("isPlayingInPage") || !isMobile;
  const isInvalidSniffUrlRegex = /btrace.video.qq.com|qzonestyle.gtimg.cn|img.baidu.com|dplayer\/\w+.mp4|vip.fwwmy1.cn|vwecam.gtimg.com|com-t-iqiyi.com|hz189cloud.oos-hz.ctyunapi.cn|(titan.mgtv.com).+.m3u8|\/\/\//, isValidUrlRegex = /^(http|\/\/)/, isOnlyDownloadVideoUrlRegex = /.titan.mgtv.com/, isVideoUrlRegex = /\.(mp4|m3u8|3gp|wmv|flv|avi|rmvb|m4v|ts)|m3u8play.php/, shortVideoUrlRegex = /\/\/([^\/]+)\/(.*\/)?([^\/]+)\.(mp4|m3u8|3gp|wmv|flv|avi|rmvb|m4v|ts)/, shortVideoUrlLoseRegex = /\/\/([^\/]+)\/(.*[^\/])\/?(mp4|m3u8|3gp|wmv|flv|avi|rmvb|m4v|ts)/, MESSAGE_ID = OO_SIGN;
  let isLoadPlayer = !1, player, sniffTimes = {}, sniffStartTime = Date.now(), QR = "", qrcodeCode = "";
  const iframes = {};
  if (E.on("url.change", (function(n) {
    let {oldUrl: o, newUrl: e, autoPlay: i} = n;
    log("urlDetector: ".concat(o, " → ").concat(e));
    const t = BETTER_ADDONS.find((function(n) {
      return n.vip && Is(n.match, o);
    })), a = BETTER_ADDONS.find((function(n) {
      return n.vip && Is(n.match, e);
    }));
    log("reload execQuickAddons"), addonGo(), t && a && (i ? (log("auto play"), playVipItem($(".o--vip-item.is-active"))) : (sniffDone(),
    $(".o--vip-item").removeClass("is-active")));
  })), E.on("enable.sniff", (function(n) {
    n.from === PlayerCover && removeIframe(), !isAllowIframeSniff && (isAllowIframeSniff = !0,
    isAllowSniff = !0, GlobalStore.set("isAllowIframeSniff", !0), $(".o--vip").addClass("is-allow-sniff"));
  })), E.on("play.video", (function(n) {
    const o = getIframeId(n.from);
    log("✔ Sniff url: ".concat(n.url, " (").concat(n.from, ") #").concat(o, " - ").concat(getSniffTime(n.from))),
    removeIframe(o), sniffSuccess(n.url, n.from);
  })), E.on("sniff.fail", (function(n) {
    if (isAllowSniff) {
      const o = getIframeId(n.from);
      log("× Sniff fail url: ".concat(n.origin, " (").concat(n.from, ") #").concat(o, " - ").concat(getSniffTime(n.from))),
      removeIframe(o);
    }
  })), E.on("log", (function(n) {
    log("GET LOG:", n);
  })), Is(isVipUrlRegex) && (log("isVipUrlRegex"), Is(/=http/) && ($("title").html(PLUGIN_ID),
  $((function() {
    if ($("title").html(PLUGIN_ID), fixM3u8Playing(), Is(/beijixs\.cn\//)) if (log("beijixs.cn match"),
    /%\d/.test(location.href)) {
      addCss("body > form {position: absolute !important;left: 0 !important;right: 0 !important;top: 0 !important;bottom: 0 !important;background: #eee8d3 !important;z-index: 2147483647 !important;}form #divcss5 {height: auto;min-height: 90vh;}.o--fail {height: auto !important;}.o--fail > div {text-align: center;border-top: 1px solid #495057;border-bottom: 1px solid #495057;padding: 1em;color: #d9480f;font-weight: bold;font-size: 16px;background-color: #fff4e6;}.o--fail > div > div + div {margin-top: 1em;}");
      let n = 0;
      const o = setInterval((function() {
        const e = document.querySelector("video");
        if (e.duration < 390) {
          e.pause();
          const n = $("#TextBox2").attr("value") || "";
          $(".video-js").addClass("o--fail").html("<div><div>解析失败</div>".concat(n ? "<div>" + n + "</div>" : "", "</div>")),
          clearInterval(o);
        }
        n++ > 100 && clearInterval(o);
      }), 100);
    } else {
      const n = Href.split("url=")[1];
      if (n) {
        $("#TextBox1").val(decodeURI(n)), log("vipUrl:", decodeURI(n));
        const o = $("#Button1");
        o.length > 0 && ($(".video-js").css("display", "none !important"), o.click());
      }
      let o = 0;
      const e = setInterval((function() {
        const n = document.querySelector("video");
        n && n.duration < 360 ? n.pause() : n.play(), o++ > 100 && clearInterval(e);
      }), 100);
    } else if (Is(/m1907\.cn/)) {
      log("m1907.cn match"), addCss("#s-player + .show > div[title],#s-controls + div > div:nth-child(n+5):not(:last-child)\n{".concat(PurifyStyle, "}"));
      let n = 0;
      const o = setInterval((function() {
        ($("#s-player + .show").length > 0 || n++ > 30) && (clearInterval(o), $("#s-controls > div img + span").click());
      }), 100);
      window.alert = function() {};
    }
  })))), isNotTop) {
    if (location.href.includes("m1907")) {
      const n = window.alert;
      window.alert = function() {}, setTimeout((function() {
        window.alert = n;
      }), 1e3);
    }
    const n = document.body.clientWidth, o = n < 100, e = document.body.clientHeight, i = {
      isSniffIframe: o,
      docW: n,
      docH: e
    };
    return void (o ? sniffInIframe(i) : fixM3u8Playing(i));
  }
  log("【嗅探】isAllowSniff:", isAllowSniff ? "✔" : "×"), urlDetector(), $((function() {
    $("html").append((_D ? '<oo-logs style="display: none;"></oo-logs>' : "") + '<oo-iframes style="visibility: hidden; position: fixed; bottom: 0; pointer-events: none;"></oo-iframes>');
  }));
  const Icon = {
    vip: '<svg fill="currentColor" viewBox="0 0 18 18" role="img" aria-hidden="true"><path d="M17.731,6.27l-2.771-4.464c-0.332-0.534-0.906-0.852-1.538-0.852h-2.364c-0.553,0-1,0.448-1,1s0.447,1,1,1h2.261l2.628,4.232l-6.955,7.58L2.053,7.187l2.628-4.233h2.33c0.552,0,1-0.448,1-1s-0.448-1-1-1H4.577c-0.623,0-1.212,0.327-1.537,0.853L0.267,6.272c-0.416,0.671-0.346,1.521,0.189,2.133l7.475,8.167c0.275,0.313,0.663,0.475,1.056,0.475c0.324,0,0.651-0.11,0.92-0.336l7.648-8.321C18.077,7.794,18.148,6.943,17.731,6.27z"></path><path d="M4.517,6.167C4.108,6.538,4.078,7.171,4.45,7.58l3.81,4.19c0.189,0.208,0.458,0.327,0.739,0.327c0,0,0,0,0,0c0.281,0,0.55-0.118,0.739-0.327l3.81-4.184c0.372-0.409,0.343-1.041-0.066-1.413c-0.407-0.372-1.039-0.342-1.412,0.066L9,9.612L5.929,6.234C5.558,5.826,4.926,5.796,4.517,6.167z"></path></svg>',
    loader: '<svg><defs><filter id="o--l-f"><feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 5 -2" result="gooey" /><feComposite in="SourceGraphic" in2="gooey" operator="atop"/></filter></defs></svg>',
    settings: '<svg viewBox="0 0 32 32" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M13 2 L13 6 11 7 8 4 4 8 7 11 6 13 2 13 2 19 6 19 7 21 4 24 8 28 11 25 13 26 13 30 19 30 19 26 21 25 24 28 28 24 25 21 26 19 30 19 30 13 26 13 25 11 28 8 24 4 21 7 19 6 19 2 Z" /><circle cx="16" cy="16" r="4" /></svg>',
    qrcode: '<svg viewBox="0 0 512 512"><path d="M160 0H0v160h160V0zm-32 128H32V32h96v96z"/><path d="M64 64h32v32H64zM352 0v160h160V0H352zm128 128h-96V32h96v96z"/><path d="M416 64h32v32h-32zM0 512h160V352H0v160zm32-128h96v96H32v-96z"/><path d="M64 416h32v32H64zM256 0h64v32h-64zM256 128h32V96h32V64h-96V32h-32v64h64zM192 128h32v32h-32zM320 160h-32v32h-96v32h128zM32 288h32v-32H32v-64H0v128h32zM64 192h32v32H64z"/><path d="M192 320h64v-32h-32v-32h-64v-64h-32v64H96v64h32v-32h64zM288 256h32v64h-32zM288 352h-96v32h64v96h-64v32h96v-32h64v-32h-64z"/><path d="M192 416h32v32h-32zM320 352h32v64h-32zM480 416h-96v96h32v-64h64z"/><path d="M448 480h64v32h-64zM480 352h32v32h-32zM384 384h32v-96h-64v32h32zM448 224h-32v-32h-32v32h-32v32h128v-32h32v-32h-64zM448 288h64v32h-64z"/></svg>'
  }, _D_STYLES = "oo-logs {position: fixed;bottom: 0;right: 0;max-height: 300px;overflow-y: scroll;text-align: right;z-index: ".concat(MAX_Z_INDEX - 10, ";display: none;}oo-logs.is-active {display: block !important;}.o--log-message {display: inline-block;background-color: #4CAF50;color: #fff;padding: .25em .5em;margin-bottom: .25em;border-top-left-radius: 3px;border-bottom-left-radius: 3px;max-width: 800px;word-break: break-all;}.o--m.o--debug {max-width: 400px !important;margin: 0 auto !important;}.o--m.o--debug .mod_player > .player_container {max-height: 203px;}"), KEYFRAMES_STYLES = "@keyframes o--tvflicker {0%   {box-shadow: 0 0 100px 0 rgba(225,235,255,0.4);}100% {box-shadow: 0 0 60px 0 rgba(200,220,255,0.6);}}@keyframes o--blink {20%,24%,55% {color: #111;text-shadow: none;}  0%,19%,21%,23%,25%,54%,56%,100% {color: #fff6a9;text-shadow: 0 0 5px #ffa500, 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500, 0 0 6px #ff0000, 0 0 10px #ff8d00, 0 0 9px #ff0000;}}@keyframes o--bopA {0% {transform: scale(0.9);}50%,100% {transform: scale(1);}}@keyframes o--bopB {0% {transform: scale(0.9);}80%,100% {transform: scale(1) rotateZ(-3deg);}}@keyframes o--beat {to {transform: scale(1.4);}}@keyframes o--loader-spin {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}@keyframes o--color-change-opacity {0%   { opacity: 0.65; }50% { opacity: 0.95; }100% { opacity: 0.65; }}", VIP_STYLES = "\n.o--vip {position: relative;padding-bottom: 0.5em;background-color: rgba(255, 255, 255, 0.05);border-radius: 5px;width: 100%;}.o--vip + .o--vip {".concat(PurifyStyle, '}.o--vip-panel {display: flex;justify-content: space-between;align-items: center;padding: 10px 10px 0;font-size: 15px;width: 100%;}.o--vip-title {font-weight: bold;color: #257942;width: 100%;}.o--vip-small {font-size: 0.75em;margin: 0 10px;color: #ced4da;}.o--vip-panel, .o--vip-list {height: auto !important;}.o--menus {display: flex;justify-content: center;align-items: center;}.o--menus > div {display: inline-flex;margin-right: 1.5em;cursor: pointer;position: relative;}.o--qrcode-box {background-color: white;padding: 1px 2px 1px 1px;border-radius: 2px;opacity: .65;}.o--m .o--qrcode-box {display: none;}.o--qrcode-box:hover {opacity: 1;}.o--qrcode-box svg {width: 20px;height: 20px;}.o--qrcode-box .o--qrcode {overflow: hidden;display: none;background-color: #fff;position: absolute;top: -35px;left: -110px;z-index: 1;box-shadow: 0 4px 8px 0 rgba(0,0,0,0.35);border-radius: 3px;}.o--qrcode img {width: 100px;height: 100px;}.o--qrcode-text {position: absolute;background-color: #fff;text-align: center;z-index: 2;top: -49px;left: -110px;width: 100px;border-radius: 3px;color: #F57C00;letter-spacing: 1px;font-size: 12px;display: none;}.o--qrcode-box:hover .o--qrcode,.o--qrcode-box:hover .o--qrcode-text {display: block;}.o--setting-button {animation: o--color-change-opacity 5s normal infinite ease-in-out;}.o--setting-button svg {width: 24px;height: 24px;}.o--setting-button:hover {color: #66BB6A;cursor: pointer;}.o--vip-list {padding: 0.5em;letter-spacing: 1px;}.o--vip-list .o--vip-item {border-radius: 4px;display: inline-block;white-space: nowrap;background-color: #eef6fc;color: #1d72aa;margin: 4px;padding: 0.5em 0.5em 0.35em;cursor: pointer;font-size: 14px;line-height: 1.2;font-weight: 600;text-decoration: none;position: relative;overflow: hidden;transition: all 0.25s;}.o--vip-item.is-play-in-page::after {content: "";position: absolute;bottom: 0;left: 0;width: 100%;height: 2px;background-color: #2E7D32;}.o--vip-list .o--vip-sniff {width: 1.15em;}.o--vip:not(.is-allow-sniff) .o--vip-sniff {display: none;}.o--vip-sniff svg {display: block;}.o--vip-list .o--vip-item:hover, .o--vip-list .o--vip-item:active {background-color: #1d72aa;color: #eef6fc !important;}.o--vip-list .o--vip-item.is-active {background-color: #2b8a3e;color: #eef6fc;}.o--vip.is-sniff-success .o--vip-sniff {background-color: #2f9e44;color: #eef6fc;}.o--vip.is-sniffing .o--vip-sniff,.o--vip.is-sniff-success .o--vip-sniff,.o--vip.is-sniffing:not(.is-sniff-success) .o--vip-item,.o--vip-list .o--vip-item.is-active {cursor: not-allowed;pointer-events: none;opacity: 0.5 !important;}.o--vip.is-sniff-done .o--vip-sniff {opacity: .75 !important;}.o--vip.is-sniffing:not(.is-sniff-success) .o--vip-sniff {animation: o--beat 0.25s infinite alternate;}.o--vip .o--sniff-progress {display: none;bottom: auto;top: 0;}.o--vip.is-sniffing .o--sniff-progress {display: block !important;}.o--setting-panel {border-top: 1px solid #616161;padding: 1em .5em;display: none;margin: .5em 0;transition: all 0.5s;}.o--vip.is-setting-on .o--setting-panel {display: block;}.o--vip.is-setting-on .o--vip-list {display: none;}.o--edit-vip-source-panel {text-align: center;margin: 1em 1em .5em;}.o--edit-vip-source-panel textarea {padding: .75em;font-size: 14px;letter-spacing: 1px;border-radius: 5px;width: calc(100% - 1.5em);min-height: 18em;box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);border: 1px solid #eee;overflow-y: scroll;}.o--edit-hint {text-align: left;margin: .5em;color: #4CAF50;text-shadow: 0px 0px 1px #8BC34A;}.o--actions {text-align: right;}.o--action {color: wheat;letter-spacing: 1px;border: 1px solid;display: inline-flex;justify-content: center;align-items: center;padding: .15em .5em;border-radius: 3px;margin-right: 1em;cursor: pointer;background-color: #1b1b29;}.o--action a {color: #FF9800 !important;}.o--m .o--action {font-size: 12px;}.o--action:hover {color: #FFB74D;}.o--toggle .o--y, .o--toggle .o--n {font-weight: bold;font-size: 1.2em;margin-right: .15em;}.o--toggle.is-n .o--y {color: inherit;}.o--toggle:not(.is-n) .o--y {color: green;font-size: 1.5em;}.o--toggle.is-n .o--n {color: red;font-size: 1.5em;}.o--log-button {cursor: pointer;padding: 0 .35em;background-color: hsla(0,0%,100%,.9);box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);color: #9e774a;border-radius: 3px;display: inline-flex;}.o--log-button:hover {background-color: #9e774a;color: hsla(0,0%,100%,.9);}'), BASE_STYLES = "oo-iframes {visibility: hidden;pointer-events: none;position: fixed;bottom: 0;left: -9999px;max-width: 320px;max-height: 100px;display: block;}oo-iframes > iframe {max-width: 25%;display: inline-block;}.o--hide {display: none !important;}.o--vip-play {position: absolute;top: 0;left: 0;z-index: 1;margin: 1em;font-size: 14px;}.o--vip .o--vip-play {position: relative;font-size: 12px;background-color: #2d2d2e;margin: .5em 0 0;padding: .8em .5em .5em;}.is-play-in-page .o--vip-play {display: none;}.plyr--hide-controls ~ .o--vip-play {display: none;}.plyr--paused + .o--vip-play,.o--player:hover .o--vip-play {display: block !important;}.o--vip-play.is-hide {display: none !important;}.o--vip-play a {position: relative;margin-right: 8px;}.o--vip-play .o--sources a {background-color: #0db2fb;padding: .3em .75em .25em .75em;border-radius: 3px;color: #ffffff;cursor: pointer;opacity: .85;display: inline-flex;margin: .25em;}.o--vip-play .o--sources a.is-active {background-color: #1c7ed6;}.o--vip-play .o--sources a.is-active,.o--vip-play .o--sources a:hover {opacity: 1;font-weight: bold;}.o--vip-play .o--sources a.is-mp4 {border-bottom: 1px solid #eee;}.o--sniff-done {color: #4CAF50;}.o--play-url {color: #ffffff;padding: 1em 1em .5em;text-shadow: 1px 1px 2px #000000;}.o--play-url a {color: #0db2fb !important;text-decoration: underline;cursor: pointer;font-weight: bold;}.o--play-url .o--span {font-size: .9em;color: #EEEEEE;display: block;opacity: .9;margin-top: .5em;}.o--play-url .o--span.is-warning span {font-weight: bold;color: white;background-color: #FF5722;padding: .25em .5em;border-radius: 2px;}.o--play-url a span {color: #FF9800;}.o--play-url a:hover {color: #e67700 !important;}.o--player-box::before,.o--player-box::after {display: none !important;}.o--player {position: relative;height: 100%;max-height: 100%;background-color: #2d2d2e;overflow: hidden;z-index: ".concat(MAX_Z_INDEX, ';}.o--player:not(.is-loaded) #o--player-iframe {display: none;}.o--player.is-loaded .o--player-bg {visibility: hidden;}.o--player-bg {position: absolute;top: 0;bottom: 0;left: 0;right: 0;display: flex;justify-content: center;align-items: center;flex-direction: column;font-size: 16px;color: #f1f3f5;background-color: #292929;box-shadow: 0 0 5px 0 #232325;overflow: hidden;border: 10px solid #1b1b1b;border-bottom-width: 15px;border-radius: 10px;border-bottom-left-radius: 50% 1%;border-bottom-right-radius: 50% 1%;transition: margin-right 1s;margin: .5em;padding-bottom: 1em;animation: o--tvflicker .5s infinite alternate;}.o--m .o--player-bg {font-size: 12px;border-width: 1em;}.o--sign {opacity: .1;margin-top: 1em;}.o--version {margin-left: 1em;font-size: .8em;opacity: .9;}.o--slogan {letter-spacing: 2px;color: #f8964c;}.o--slogan strong {font-size: 2.5em;text-shadow: 0 0 5px #ffa500, 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500, 0 0 6px #ff0000, 0 0 10px #ff8d00, 0 0 9px #ff0000;color: #fff6a9;opacity: .8;transform: scale(0.9);display: inline-block;margin: 0 5px;}.o--slogan strong:first-child {animation: o--bopA 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards infinite alternate, o--blink 12s infinite;}.o--slogan strong:last-child {animation: o--bopB 1s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards infinite alternate, o--blink 12s 3s infinite;}.o--error-text {display: none;padding-top: 1em;letter-spacing: 1px;color: #F44336;}.o--player-bg.is-fail .o--slogan {color: #f76707;}.o--player-bg.is-fail .o--slogan strong {color: #d9480f;}.o--player-bg.is-fail .o--loader,.o--player-bg.is-fail + .o--vip-play {display: none;}.o--player-bg.is-fail .o--error-text {display: block;}.o--sniff-progress {position: absolute;left: 0;bottom: 0;height: 1px;width: 0;background-color: #fab132;border: 1px solid #bd7641;border-top-right-radius: 2px;transition: all 5s ease;}.o--player.is-loaded .o--sniff-progress,.o--player-bg.is-fail .o--sniff-progress {display: none;}.o--loader {border: 3.6px solid #ff974d;box-sizing: border-box;overflow: hidden;width: 2em;height: 2em;left: 50%;top: 50%;animation: o--loader-spin 2s linear infinite reverse;-webkit-filter: url(#o--l-f);filter: url(#o--l-f);box-shadow: 0 0 0 1px #ff974d inset;}.o--loader:before {content: "";position: absolute;animation: o--loader-spin 2s cubic-bezier(0.59, 0.25, 0.4, 0.69) infinite;background: #ff974d;-webkit-transform-origin: top center;transform-origin: top center;border-radius: 50%;width: 150%;height: 150%;top: 50%;left: -12.5%;}.o--player .plyr__progress input[type=range] {cursor: pointer;}.o--video {height: 100%;width: 100%;background-color: black;}'), STYLES = KEYFRAMES_STYLES + _D_STYLES + BASE_STYLES + VIP_STYLES;
  addonGo(), setTimeout((function() {
    HTML.removeAttribute(PLUGIN_ATTR);
  }), 1500);
}();