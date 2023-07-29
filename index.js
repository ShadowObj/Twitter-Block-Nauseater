// ==UserScript==
// @name        Twitter Block Nauseater
// @homepage    https://github.com/ShadowObj/Twitter-Block-Nauseater
// @icon        https://cdn.jsdelivr.net/gh/ShadowObj/Twitter-Block-Nauseater@master/imgs/icon.svg
// @version     1.2.0
// @description One-click block all the nauseaters in the comment area.
// @description:zh-CN 共享黑名单, 一键拉黑所有令人生厌的反跨蝈蝻
// @description:zh-TW 共享黑名單，一鍵拉黑所有令人生厭的反跨蟈蝻
// @author      ShadowObj
// @source      forked from https://github.com/daymade/Twitter-Block-Porn
// @license     MIT
// @run-at      document-end
// @grant       GM_registerMenuCommand
// @grant       GM_openInTab
// @match       https://twitter.com/*
// @match       https://mobile.twitter.com/*
// @match       https://tweetdeck.twitter.com/*
// @exclude     https://twitter.com/account/*
// @require     https://cdn.jsdelivr.net/npm/axios@0.25.0/dist/axios.min.js
// @require     https://cdn.jsdelivr.net/npm/qs@6.10.3/dist/qs.min.js
// @require     https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// ==/UserScript==

/* global axios $ Qs */

const menu_command_list = GM_registerMenuCommand('打开共享黑名单 ①', function () {
  const url = 'https://twitter.com/i/lists/1685183911725252608/members'
  GM_openInTab(url, {active: true})
}, '');

(_ => {
  /* Begin of Dependencies */
  /* eslint-disable */

  // https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
  /*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
      that detects and handles AJAXed content.

      Usage example:

          waitForKeyElements (
              "div.comments"
              , commentCallbackFunction
          );

          //--- Page-specific function to do what we want when the node is found.
          function commentCallbackFunction (jNode) {
              jNode.text ("This comment changed by waitForKeyElements().");
          }

      IMPORTANT: This function requires your script to have loaded jQuery.
  */
  function waitForKeyElements (
      selectorTxt,    /* Required: The jQuery selector string that
                          specifies the desired element(s).
                      */
      actionFunction, /* Required: The code to run when elements are
                          found. It is passed a jNode to the matched
                          element.
                      */
      bWaitOnce,      /* Optional: If false, will continue to scan for
                          new elements even after the first match is
                          found.
                      */
      iframeSelector  /* Optional: If set, identifies the iframe to
                          search.
                      */
  ) {
      var targetNodes, btargetsFound;

      if (typeof iframeSelector == "undefined")
          targetNodes     = $(selectorTxt);
      else
          targetNodes     = $(iframeSelector).contents ()
                                            .find (selectorTxt);

      if (targetNodes  &&  targetNodes.length > 0) {
          btargetsFound   = true;
          /*--- Found target node(s).  Go through each and act if they
              are new.
          */
          targetNodes.each ( function () {
              var jThis        = $(this);
              var alreadyFound = jThis.data ('alreadyFound')  ||  false;

              if (!alreadyFound) {
                  //--- Call the payload function.
                  var cancelFound     = actionFunction (jThis);
                  if (cancelFound)
                      btargetsFound   = false;
                  else
                      jThis.data ('alreadyFound', true);
              }
          } );
      }
      else {
          btargetsFound   = false;
      }

      //--- Get the timer-control variable for this selector.
      var controlObj      = waitForKeyElements.controlObj  ||  {};
      var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
      var timeControl     = controlObj [controlKey];

      //--- Now set or clear the timer as appropriate.
      if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
          //--- The only condition where we need to clear the timer.
          clearInterval (timeControl);
          delete controlObj [controlKey]
      }
      else {
          //--- Set a timer, if needed.
          if ( ! timeControl) {
              timeControl = setInterval ( function () {
                      waitForKeyElements (    selectorTxt,
                                              actionFunction,
                                              bWaitOnce,
                                              iframeSelector
                                          );
                  },
                  300
              );
              controlObj [controlKey] = timeControl;
          }
      }
      waitForKeyElements.controlObj   = controlObj;
  }
  /* eslint-enable */
  /* End of Dependencies */

  let lang = document.documentElement.lang
  if (lang == 'en-US') {
    lang = 'en' // TweetDeck
  }
  if (lang == 'zh-CN') {
    lang = 'zh'
  }
  
  const translations = {
    en: {
      lang_name: 'English',
      block_btn: 'Block all Nauseaters',
      block_test_btn: 'Test block top 10 Nauseaters',
      block_success: 'All Nauseaters blocked!',
      block_test_success: 'Top 10 Nauseaters test blocked successfully!',
      export_btn: 'Export',
      export_success: 'Export successful!',
    },
    'en-GB': {
      lang_name: 'British English',
      block_btn: 'Block all Nauseaters',
      block_test_btn: 'Test block top 10 Nauseaters',
      block_success: 'All Nauseaters blocked!',
      block_test_success: 'Top 10 Nauseaters test blocked successfully!',
      export_btn: 'Export',
      export_success: 'Export successful!',
    },
    zh: {
      lang_name: '简体中文',
      block_btn: '屏蔽所有蝈蝻',
      block_test_btn: '屏蔽前10名',
      block_success: '蝈蝻已全部被屏蔽！',
      block_test_success: '前10名蝈蝻测试屏蔽成功！',
      export_btn: '导出',
      export_success: '导出成功！',
    },
    'zh-Hant': {
      lang_name: '正體中文',
      block_btn: '封鎖所有蟈蝻',
      block_test_btn: '測試封鎖前10名蟈蝻',
      block_success: '蟈蝻已全部被封鎖！',
      block_test_success: '前10名蟈蝻測試封鎖成功！',
      export_btn: '導出',
      export_success: '導出成功！',
    }
  }

  let i18n = translations[lang]

  function rgba_to_hex (rgba_str, force_remove_alpha) {
    return '#' + rgba_str.replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
      .split(',') // splits them at ","
      .filter((_, index) => !force_remove_alpha || index !== 3)
      .map(string => parseFloat(string)) // Converts them to numbers
      .map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
      .map(number => number.toString(16)) // Converts numbers to hex
      .map(string => string.length === 1 ? '0' + string : string) // Adds 0 when length of one number is 1
      .join('')
      .toUpperCase()
  }

  function hex_to_rgb (hex_str) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex_str)
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : ''
  }

  function invert_hex (hex) {
    return '#' + (Number(`0x1${hex.substring(1)}`) ^ 0xFFFFFF).toString(16).substring(1).toUpperCase()
  }

  function get_theme_color () {
    const FALLBACK_COLOR = 'rgb(128, 128, 128)'
    let bgColor = getComputedStyle(document.querySelector('#modal-header > span')).color || FALLBACK_COLOR
    let buttonTextColor = hex_to_rgb(invert_hex(rgba_to_hex(bgColor)))
    for (const ele of document.querySelectorAll('div[role=\'button\']')) {
      const color = ele?.style?.backgroundColor
      if (color != '') {
        bgColor = color
        const span = ele.querySelector('span')
        buttonTextColor = getComputedStyle(span)?.color || buttonTextColor
      }
    }

    return {
      bgColor,
      buttonTextColor,
      plainTextColor: $('span').css('color'),
      hoverColor: bgColor.replace(/rgb/i, 'rgba').replace(/\)/, ', 0.9)'),
      mousedownColor: bgColor.replace(/rgb/i, 'rgba').replace(/\)/, ', 0.8)')
    }
  }

  function get_cookie (cname) {
    const name = cname + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; ++i) {
      const c = ca[i].trim()
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length)
      }
    }
    return ''
  }

  function get_ancestor (dom, level) {
    for (let i = 0; i < level; ++i) {
      dom = dom.parent()
    }
    return dom
  }

  const ajax = axios.create({
    baseURL: 'https://api.twitter.com',
    withCredentials: true,
    headers: {
      Authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'X-Twitter-Auth-Type': 'OAuth2Session',
      'X-Twitter-Active-User': 'yes',
      'X-Csrf-Token': get_cookie('ct0')
    }
  })

  function get_list_id () {
    // https://twitter.com/any/thing/lists/1234567/anything => 1234567/anything => 1234567
    return location.href.split('lists/')[1].split('/')[0]
  }

  async function fetch_list_members_id(listId) {
    let cursor = -1;
    let allMembers = [];

    while (cursor != 0) {
      let response = await ajax.get(`/1.1/lists/members.json?list_id=${listId}&cursor=${cursor}`);
      let users = response.data.users;
      let members = users.map(u => u.id_str);
      allMembers = allMembers.concat(members);
      cursor = response.data.next_cursor;
    }

    return allMembers;
  }

  async function fetch_list_members_info(listId) {
    let cursor = -1;
    let allMembers = [];
    
    while (cursor != 0) {
      let response = await ajax.get(`/1.1/lists/members.json?list_id=${listId}&cursor=${cursor}`);
      let users = response.data.users;
      allMembers = allMembers.concat(users);
      cursor = response.data.next_cursor;
    }
    
    return allMembers;
  }

  function block_user (id) {
    ajax.post('/1.1/blocks/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }

  async function block_list_test_members () {
    const listId = get_list_id()
    const members = await fetch_list_members_id(listId)

    members.slice(0, 10).forEach(block_user)
  }

  async function block_list_members () {
    const listId = get_list_id()
    const members = await fetch_list_members_id(listId)

    // 加急名单: 特别活跃/拉黑我/来挑衅的蝈蝻
    const special_scammers = [
    ]

    members.concat(special_scammers).slice(0, 300).forEach(block_user)
  }

  async function export_list_members () {
    const listId = get_list_id();
    const members = await fetch_list_members_info(listId);
    
    // 创建一个 Blob 实例，包含 JSON 字符串的成员信息
    const blob = new Blob([JSON.stringify(members, null, 2)], {type : 'application/json'});
  
    // 创建一个下载链接并点击它来下载文件
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "members.json";
    link.click();
  }

  function get_notifier_of (msg) {
    return _ => {
      const banner = $(`
        <div id="bwl-notice" style="right:0px; position:fixed; left:0px; bottom:0px; display:flex; flex-direction:column;">
          <div class="tbwl-notice">
            <span>${msg}</span>
          </div>
        </div>
      `)
      const closeButton = $(`
        <span id="bwl-close-button" style="font-weight:700; margin-left:12px; margin-right:12px; cursor:pointer;">
          Close
        </span>
      `)
      closeButton.click(_ => banner.remove())
      $(banner).children('.tbwl-notice').append(closeButton)

      $('#layers').append(banner)
      setTimeout(() => banner.remove(), 5000)
      $('div[data-testid="app-bar-close"]').click()
    }
  }

  function mount_button (parentDom, name, executer, success_notifier) {
    const btn_mousedown = 'bwl-btn-mousedown'
    const btn_hover = 'bwl-btn-hover'

    const button = $(`
      <div
        aria-haspopup="true"
        role="button"
        data-focusable="true"
        class="bwl-btn-base"
        style="margin:3px"
      >
        <div class="bwl-btn-inner-wrapper">
          <span>
            <span class="bwl-text-font">${name}</span>
          </span>
        </div>
      </div>
    `).addClass(parentDom.prop('classList')[0])
      .hover(function () {
        $(this).addClass(btn_hover)
      }, function () {
        $(this).removeClass(btn_hover)
        $(this).removeClass(btn_mousedown)
      })
      .on('selectstart', function () {
        return false
      })
      .mousedown(function () {
        $(this).removeClass(btn_hover)
        $(this).addClass(btn_mousedown)
      })
      .mouseup(function () {
        $(this).removeClass(btn_mousedown)
        if ($(this).is(':hover')) {
          $(this).addClass(btn_hover)
        }
      })
      .click(executer)
      .click(success_notifier)

    parentDom.append(button)
  }

  function insert_css () {
    const FALLBACK_FONT_FAMILY = 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", Arial, sans-serif;'
    function get_font_family () {
      for (const ele of document.querySelectorAll('div[role=\'button\']')) {
        const font_family = getComputedStyle(ele).fontFamily
        if (font_family) {
          return font_family + ', ' + FALLBACK_FONT_FAMILY
        }
      }
      return FALLBACK_FONT_FAMILY
    }

    const colors = get_theme_color()

    // switch related
    $('head').append(`<style>
    </style>`)

    // TODO: reduce repeated styles
    $('head').append(`<style>
      .tbwl-notice {
        align-self: center;
        display: flex;
        flex-direction: row;
        padding: 12px;
        margin-bottom: 32px;
        border-radius: 4px;
        color:rgb(255, 255, 255);
        background-color: rgb(29, 155, 240);
        font-family: ${FALLBACK_FONT_FAMILY};
        font-size:15px;
        line-height:20px;
        overflow-wrap: break-word;
      }
      .bwl-btn-base {
        min-height: 30px;
        padding-left: 1em;
        padding-right: 1em;
        border: 1px solid ${colors.bgColor} !important;
        border-radius: 9999px;
        background-color: ${colors.bgColor};
      }
      .bwl-btn-mousedown {
        background-color: ${colors.mousedownColor};
        cursor: pointer;
      }
      .bwl-btn-hover {
        background-color: ${colors.hoverColor};
        cursor: pointer;
      }
      .bwl-btn-inner-wrapper {
        font-weight: bold;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-flex: 1;
        flex-grow: 1;
        color: ${colors.bgColor};
        display: flex;
      }
      .bwl-text-font {
        font-family: ${get_font_family()};
        color: ${colors.buttonTextColor};
      }
      .container {
        margin-top: 0px;
        margin-left: 0px;
        margin-right: 5px;
      }
      .checkbox {
        width: 100%;
        margin: 0px auto;
        position: relative;
        display: block;
        color: ${colors.plainTextColor};
      }
      .checkbox input[type="checkbox"] {
        width: auto;
        opacity: 0.00000001;
        position: absolute;
        left: 0;
        margin-left: 0px;
      }
      .checkbox label:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        margin: 0px;
        width: 22px;
        height: 22px;
        transition: transform 0.2s ease;
        border-radius: 3px;
        border: 2px solid ${colors.bgColor};
      }
      .checkbox label:after {
        content: '';
        display: block;
        width: 10px;
        height: 5px;
        border-bottom: 2px solid ${colors.bgColor};
        border-left: 2px solid ${colors.bgColor};
        -webkit-transform: rotate(-45deg) scale(0);
        transform: rotate(-45deg) scale(0);
        transition: transform ease 0.2s;
        will-change: transform;
        position: absolute;
        top: 8px;
        left: 6px;
      }
      .checkbox input[type="checkbox"]:checked ~ label::before {
        color: ${colors.bgColor};
      }
      .checkbox input[type="checkbox"]:checked ~ label::after {
        -webkit-transform: rotate(-45deg) scale(1);
        transform: rotate(-45deg) scale(1);
      }
      .checkbox label {
        position: relative;
        display: block;
        padding-left: 31px;
        margin-bottom: 0;
        font-weight: normal;
        cursor: pointer;
        vertical-align: sub;
        width:fit-content;
        width:-webkit-fit-content;
        width:-moz-fit-content;
      }
      .checkbox label span {
        position: relative;
        top: 50%;
        -webkit-transform: translateY(-50%);
        transform: translateY(-50%);
      }
      .checkbox input[type="checkbox"]:focus + label::before {
        outline: 0;
      }
    </style>`)
  }

  function main () {
    let inited = false

    const notice_export_success = get_notifier_of(i18n.export_success)
    const notice_block_test_success = get_notifier_of(i18n.block_test_success)
    const notice_block_success = get_notifier_of(`${i18n.block_success}, 为了安全起见, 每次最多拉黑300个`)

    waitForKeyElements('h2#modal-header[aria-level="2"][role="heading"]', ele => {
      if (!inited) {
        insert_css()
        inited = true
      }
      const ancestor = get_ancestor(ele, 3)
      const currentURL = window.location.href
      if (/\/lists\/[0-9]+\/members$/.test(currentURL)) {
        mount_button(ancestor, i18n.export_btn, export_list_members, notice_export_success)
        mount_button(ancestor, i18n.block_test_btn, block_list_test_members, notice_block_test_success)
        mount_button(ancestor, i18n.block_btn, block_list_members, notice_block_success)
      }
    })
  }

  (function bonus () {
    // Constants for URL and SVG content
    const TWITTER_ICON_URL = `https://abs.twimg.com/favicons/twitter.ico`;
    const TWITTER_SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#1d9bf0" class="bi bi-twitter" viewBox="0 0 16 16">
        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
    </svg>`;
    const TOOLTIP_TEXT = "已被 Twitter-Block-Nauseaters 替换为纯净版";
    const TOOLTIP_ID = "tooltip42";

    // Function to create new SVG element
    function createTwitterSvgElement() {
      let div = document.createElement('div');
      div.innerHTML = TWITTER_SVG_CONTENT;
      return div.querySelector('svg');
    }

    // Function to create tooltip element
    function createTooltipElement() {
      let tooltip = document.createElement('div');
      tooltip.textContent = TOOLTIP_TEXT;
      tooltip.style.position = 'absolute';
      tooltip.style.background = 'white';
      tooltip.style.border = '1px solid black';
      tooltip.style.padding = '5px';
      tooltip.id = TOOLTIP_ID;
      return tooltip;
    }

    // Function to reset favicon
    function resetFavicon() {
        let favicon = document.querySelector(`head>link[rel="shortcut icon"]`);
        if (favicon !== null) {
            favicon.href = TWITTER_ICON_URL;
        }
    }

    // Function to replace Twitter logo
    function replaceTwitterLogo() {
      let twitterLogo = document.querySelector('h1[role="heading"] svg');
      if (twitterLogo === null) {
          return;
      }
      let newSvgElement = createTwitterSvgElement();
      twitterLogo.replaceWith(newSvgElement);

      // Add mouseover and mouseout events to the SVG element
      newSvgElement.parentNode.addEventListener('mouseover', function(event) {
          // Remove existing tooltip if exists
          let existingTooltip = document.getElementById(TOOLTIP_ID);
          if (existingTooltip) {
              existingTooltip.remove();
          }

          let tooltip = createTooltipElement();
          tooltip.style.top = (event.clientY + 10) + 'px';
          tooltip.style.left = (event.clientX + 10) + 'px';
          document.body.appendChild(tooltip);
      });
      newSvgElement.parentNode.addEventListener('mouseout', function() {
          let tooltip = document.getElementById(TOOLTIP_ID);
          if (tooltip) {
              tooltip.remove();
          }
      });
    }

    // Reset favicon immediately
    resetFavicon();

    setInterval(replaceTwitterLogo, 1000);
  })()

  main()
})()
