/* ============================================================================
 * Infinity Living Simulator — AI Director & Narrative Adjudication Engine
 * Attaches to window.INFINITY.AI (classic <script defer>, zero ES modules)
 *
 * SECURITY RULE:
 * - NEVER hardcode any API key in source code.
 * - Default apiKey is strictly ''.
 * - API configuration is read/written exclusively via localStorage under
 *   'infinity_sim_ai_config_v1'.
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  var STORAGE_KEY = 'infinity_sim_ai_config_v1';

  var PRESETS = {
    deepseek: {
      label: 'DeepSeek (推荐)',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat'
    },
    deepseek_r1: {
      label: 'DeepSeek Reasoner',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-reasoner'
    },
    openai: {
      label: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    },
    ollama: {
      label: '本地 Ollama',
      baseUrl: 'http://localhost:11434/v1',
      model: 'qwen2.5:14b'
    }
  };

  var DEFAULT_CONFIG = {
    provider: 'deepseek',
    baseUrl: PRESETS.deepseek.baseUrl,
    model: PRESETS.deepseek.model,
    apiKey: '',
    enabled: true
  };

  /* --------------------------------------------------------------------------
   * Configuration (strictly localStorage, zero hardcoded secrets)
   * -------------------------------------------------------------------------- */
  function safeGetStorage(key) {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function resolveChatEndpoint(baseUrl) {
    var clean = normalizeBaseUrl(baseUrl);
    if (!clean) return '';
    if (/\/chat\/completions$/i.test(clean)) return clean;
    return clean + '/chat/completions';
  }

  function isReasonerModel(model) {
    return /reasoner|\br1\b|^o1|^o3/i.test(String(model || '').trim());
  }

  function getConfig() {
    var raw = safeGetStorage(STORAGE_KEY);
    var parsed = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        parsed = null;
      }
    }
    var provider = (parsed && parsed.provider && PRESETS[parsed.provider])
      ? parsed.provider
      : (parsed && typeof parsed.provider === 'string' ? parsed.provider : DEFAULT_CONFIG.provider);
    var preset = PRESETS[provider] || PRESETS.deepseek;

    return {
      provider: provider,
      baseUrl: normalizeBaseUrl((parsed && parsed.baseUrl) || preset.baseUrl),
      model: String((parsed && parsed.model) || preset.model).trim(),
      apiKey: String((parsed && typeof parsed.apiKey === 'string') ? parsed.apiKey : '').trim(),
      enabled: parsed && typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_CONFIG.enabled
    };
  }

  function saveConfig(cfg) {
    var current = getConfig();
    var nextProvider = (cfg && cfg.provider) ? String(cfg.provider).trim() : current.provider;
    var preset = PRESETS[nextProvider] || null;

    var next = {
      provider: nextProvider || DEFAULT_CONFIG.provider,
      baseUrl: normalizeBaseUrl(
        cfg && typeof cfg.baseUrl === 'string' && cfg.baseUrl.trim()
          ? cfg.baseUrl
          : (preset && cfg && cfg.provider && cfg.provider !== current.provider ? preset.baseUrl : current.baseUrl)
      ),
      model: String(
        cfg && typeof cfg.model === 'string' && cfg.model.trim()
          ? cfg.model
          : (preset && cfg && cfg.provider && cfg.provider !== current.provider ? preset.model : current.model)
      ).trim(),
      apiKey: String(
        cfg && typeof cfg.apiKey === 'string' ? cfg.apiKey : current.apiKey
      ).trim(),
      enabled: cfg && typeof cfg.enabled === 'boolean' ? cfg.enabled : current.enabled
    };

    safeSetStorage(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function canUseLiveAI(cfg) {
    if (!cfg || !cfg.enabled) return false;
    if (!cfg.baseUrl || !cfg.model) return false;
    if (cfg.provider === 'ollama') return true;
    return Boolean(cfg.apiKey && cfg.apiKey.length > 0);
  }

  /* --------------------------------------------------------------------------
   * HTTP Client & Robust JSON Extraction (handles json_object + Reasoner)
   * -------------------------------------------------------------------------- */
  function diagnoseHttpError(status, bodyText) {
    var detail = '';
    if (bodyText) {
      try {
        var errJson = JSON.parse(bodyText);
        detail = (errJson && errJson.error && (errJson.error.message || errJson.error.type)) || '';
      } catch (_) {
        detail = String(bodyText).slice(0, 120);
      }
    }
    var suffix = detail ? '（' + detail + '）' : '';

    if (status === 401) return '鉴权失败 (401)：API Key 无效或已过期，请核对密钥。' + suffix;
    if (status === 402) return '账户余额不足 (402)：该 API 账户额度已耗尽，请检查计费状态。' + suffix;
    if (status === 403) return '拒绝访问 (403)：当前密钥无权调用此模型或接口受限。' + suffix;
    if (status === 404) return '接口或模型不存在 (404)：请检查 Base URL 与模型名（如 deepseek-chat）。' + suffix;
    if (status === 429) return '触发限流 (429)：请求过于频繁或并发超限，请稍后再试。' + suffix;
    if (status >= 500) return '模型服务异常 (' + status + ')：远端节点暂时不可用，已可切换离线推演。' + suffix;
    return '请求失败 (HTTP ' + status + ')' + suffix;
  }

  function diagnoseNetworkError(err) {
    if (!err) return '未知网络错误，请检查连接状态。';
    if (err.name === 'AbortError') {
      return '请求超时：模型响应过慢或网络受阻，请检查网络/代理或切换至 deepseek-chat。';
    }
    var msg = String(err.message || err);
    if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(msg)) {
      return '无法连接到接口：可能处于离线状态、遭遇 CORS 跨域拦截，或本地 Ollama 未允许浏览器跨域。';
    }
    return '连接异常：' + msg;
  }

  async function callChatCompletion(cfg, messages, options) {
    var opts = options || {};
    var endpoint = resolveChatEndpoint(cfg.baseUrl);
    if (!endpoint) {
      throw new Error('Base URL 为空，无法发起请求。');
    }

    var reasoner = isReasonerModel(cfg.model);
    var timeoutMs = opts.timeoutMs || (reasoner ? 32000 : 18000);

    var payload = {
      model: cfg.model,
      messages: messages,
      max_tokens: opts.maxTokens || (reasoner ? 1600 : 850),
      stream: false
    };

    if (!reasoner) {
      payload.temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.65;
      if (opts.expectJson) {
        payload.response_format = { type: 'json_object' };
      }
    }

    var headers = {
      'Content-Type': 'application/json'
    };
    if (cfg.apiKey) {
      headers.Authorization = 'Bearer ' + cfg.apiKey;
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function () {
        controller.abort();
      }, timeoutMs);
    }

    try {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      });

      var rawBody = await response.text();
      if (!response.ok) {
        // Retry once without response_format if a custom/Ollama endpoint rejects json_object
        if (response.status === 400 && payload.response_format && !opts._retriedNoFormat) {
          return await callChatCompletion(cfg, messages, {
            timeoutMs: timeoutMs,
            maxTokens: payload.max_tokens,
            temperature: payload.temperature,
            expectJson: false,
            _retriedNoFormat: true
          });
        }
        throw new Error(diagnoseHttpError(response.status, rawBody));
      }

      var data;
      try {
        data = JSON.parse(rawBody);
      } catch (_) {
        throw new Error('接口返回的不是合法 JSON 响应。');
      }

      var choice = data && data.choices && data.choices[0];
      var msgObj = choice && choice.message;
      var content = (msgObj && typeof msgObj.content === 'string') ? msgObj.content : '';
      if (!content && msgObj && typeof msgObj.reasoning_content === 'string') {
        content = msgObj.reasoning_content;
      }

      return {
        content: content,
        usage: data && data.usage ? data.usage : null
      };
    } catch (err) {
      if (err && err.message && /^(鉴权失败|账户余额不足|拒绝访问|接口或模型不存在|触发限流|模型服务异常|请求失败|Base URL|接口返回)/.test(err.message)) {
        throw err;
      }
      throw new Error(diagnoseNetworkError(err));
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function stripTrailingCommas(str) {
    return str.replace(/,\s*([}\]])/g, '$1');
  }

  function tryParseJson(str) {
    if (!str || typeof str !== 'string') return null;
    var trimmed = str.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch (_) {
      try {
        return JSON.parse(stripTrailingCommas(trimmed));
      } catch (__) {
        return null;
      }
    }
  }

  function findBalancedJsonObjects(text) {
    var results = [];
    var depth = 0;
    var start = -1;
    var inString = false;
    var escapeNext = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        if (depth > 0) {
          depth--;
          if (depth === 0 && start !== -1) {
            results.push(text.slice(start, i + 1));
            start = -1;
          }
        }
      }
    }
    return results;
  }

  function extractJsonObject(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;

    // 1. Strip <think>...</think> blocks emitted by reasoning models
    var cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Direct parse
    var direct = tryParseJson(cleaned);
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      return direct;
    }

    // 3. Fenced markdown code blocks (```json ... ``` or ``` ... ```)
    var fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
    var match;
    while ((match = fenceRegex.exec(cleaned)) !== null) {
      var fenced = tryParseJson(match[1]);
      if (fenced && typeof fenced === 'object' && !Array.isArray(fenced)) {
        return fenced;
      }
    }

    // 4. Balanced outer brace scan (prefer the last valid object in case reasoning preceded output)
    var candidates = findBalancedJsonObjects(cleaned);
    for (var i = candidates.length - 1; i >= 0; i--) {
      var parsed = tryParseJson(candidates[i]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  /* --------------------------------------------------------------------------
   * Test Connection
   * -------------------------------------------------------------------------- */
  async function testConnection() {
    var cfg = getConfig();
    if (!cfg.baseUrl) {
      return { ok: false, latencyMs: 0, error: '未配置 Base URL，请先选择预设或填写接口地址。' };
    }
    if (!cfg.model) {
      return { ok: false, latencyMs: 0, error: '未配置模型名称（例如 deepseek-chat）。' };
    }
    if (cfg.provider !== 'ollama' && !cfg.apiKey) {
      return {
        ok: false,
        latencyMs: 0,
        error: '未填写 API Key。请填入密钥（仅存于本地 localStorage），或留空以使用离线战术推演模式。'
      };
    }

    var t0 = Date.now();
    try {
      await callChatCompletion(
        cfg,
        [
          { role: 'system', content: '你是连接检测探针，仅回复 OK。' },
          { role: 'user', content: 'ping' }
        ],
        {
          maxTokens: isReasonerModel(cfg.model) ? 64 : 12,
          temperature: 0,
          expectJson: false,
          timeoutMs: isReasonerModel(cfg.model) ? 24000 : 12000
        }
      );
      return {
        ok: true,
        latencyMs: Math.max(1, Date.now() - t0),
        error: null
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Math.max(1, Date.now() - t0),
        error: (err && err.message) ? err.message : '连接测试失败。'
      };
    }
  }

  /* --------------------------------------------------------------------------
   * Context Normalization & Catalog Helpers
   * -------------------------------------------------------------------------- */
  function clamp(num, min, max, fallback) {
    var n = Number(num);
    if (!isFinite(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return Math.round(n);
  }

  function getCatalogMap() {
    var map = {};
    var list = INFINITY.SHOP_CATALOG;
    if (Array.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id) map[list[i].id] = list[i];
      }
    }
    var recipes = INFINITY.FUSION_RECIPES;
    if (Array.isArray(recipes)) {
      for (var j = 0; j < recipes.length; j++) {
        if (recipes[j] && recipes[j].result && recipes[j].result.id) {
          map[recipes[j].result.id] = recipes[j].result;
        }
      }
    }
    return map;
  }

  function resolveOwnedItems(ctx) {
    var raw = (ctx && (ctx.ownedItems || ctx.inventory || (ctx.player && (ctx.player.inventory || ctx.player.items || ctx.player.ownedItems)))) || [];
    var catalog = getCatalogMap();
    var out = [];
    var seen = {};
    for (var i = 0; i < raw.length; i++) {
      var entry = raw[i];
      var obj = null;
      if (typeof entry === 'string') {
        obj = catalog[entry] || { id: entry, name: entry, tags: [], desc: '' };
      } else if (entry && typeof entry === 'object') {
        var base = entry.id && catalog[entry.id] ? catalog[entry.id] : null;
        obj = {
          id: entry.id || (base && base.id) || ('ITEM_' + i),
          name: entry.name || (base && base.name) || entry.id || '未知道具',
          category: entry.category || (base && base.category) || 'general',
          categoryLabel: entry.categoryLabel || (base && base.categoryLabel) || '',
          tier: entry.tier || (base && base.tier) || 'D',
          tags: Array.isArray(entry.tags) ? entry.tags : (base && Array.isArray(base.tags) ? base.tags : []),
          energyType: entry.energyType || (base && base.energyType) || '通用',
          desc: entry.desc || (base && base.desc) || '',
          discounted: Boolean(entry.discounted),
          activeSkill: entry.activeSkill || (base && base.activeSkill) || null
        };
      }
      if (obj && obj.id && !seen[obj.id]) {
        seen[obj.id] = true;
        out.push(obj);
      }
    }
    return out;
  }

  function resolveCastDossier(npcId, ctxNpc) {
    var cast = (INFINITY.CAST && INFINITY.CAST[npcId]) || null;
    if (ctxNpc && typeof ctxNpc === 'object') {
      return {
        id: ctxNpc.id || npcId || (cast && cast.id) || 'yanci',
        name: ctxNpc.name || (cast && cast.name) || '严辞',
        role: ctxNpc.role || (cast && cast.role) || '同行考生',
        group: ctxNpc.group || (cast && cast.group) || 'original',
        inStationZero: typeof ctxNpc.inStationZero === 'boolean' ? ctxNpc.inStationZero : Boolean(cast && cast.inStationZero),
        personality: ctxNpc.personality || (cast && cast.personality) || '',
        speechStyle: ctxNpc.speechStyle || (cast && cast.speechStyle) || '',
        forbiddenTropes: Array.isArray(ctxNpc.forbiddenTropes) ? ctxNpc.forbiddenTropes : (cast && cast.forbiddenTropes) || []
      };
    }
    if (cast) return cast;
    return {
      id: npcId || 'yanci',
      name: npcId || '同行者',
      role: '空间考生',
      group: 'original',
      inStationZero: true,
      personality: '冷静、警惕、务实求生。',
      speechStyle: '短句克制，直指利害。',
      forbiddenTropes: ['禁止中二腔', '禁止廉价煽情', '禁止无脑吹捧']
    };
  }

  function resolvePresentExamNpcs(ctx) {
    var list = (ctx && (ctx.presentNpcs || ctx.squad || (ctx.scenario && ctx.scenario.presentNpcs))) || ['yanci', 'lujin', 'xutan', 'shenyan'];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var id = typeof item === 'string' ? item : (item && item.id);
      if (!id) continue;
      var dossier = resolveCastDossier(id, typeof item === 'object' ? item : null);
      // Canon squad NEVER appears inside Station Zero
      if (dossier.group === 'canon') continue;
      out.push(dossier);
    }
    if (out.length === 0) {
      out.push(resolveCastDossier('yanci'), resolveCastDossier('lujin'), resolveCastDossier('xutan'));
    }
    return out;
  }

  function resolveUndiscoveredClues(ctx) {
    var node = (ctx && (ctx.currentNode || (ctx.scenario && ctx.scenario.currentNode))) || null;
    var found = (ctx && (ctx.cluesFound || ctx.discoveredClues || (ctx.scenario && (ctx.scenario.cluesFound || ctx.scenario.discoveredClues)))) || [];
    var foundMap = {};
    for (var i = 0; i < found.length; i++) {
      var fid = typeof found[i] === 'string' ? found[i] : (found[i] && found[i].id);
      if (fid) foundMap[fid] = true;
    }

    var pool = [];
    var rawClues = (ctx && ctx.availableClues) || (node && node.clues) || [];
    for (var j = 0; j < rawClues.length; j++) {
      var c = rawClues[j];
      var cid = typeof c === 'string' ? c : (c && c.id);
      if (!cid || foundMap[cid]) continue;
      pool.push(typeof c === 'string' ? { id: cid, title: cid, desc: '' } : c);
    }
    return pool;
  }

  /* --------------------------------------------------------------------------
   * Anti-Cringe System Prompts (Cinematic, Razor-Sharp Infinite-Flow Chinese)
   * -------------------------------------------------------------------------- */
  var ANTI_CRINGE_CORE = [
    '【文风铁律 · 绝对禁止降智与油腻】',
    '1. 叙事质感：冷峻、克制、低光照胶片感。多用具体物理细节（冷铁、荧光频闪、湿冷水泥、腕表走针、气压变化、脚步回声），少用空洞形容词。',
    '2. 绝对禁用：日漫/二次元中二台词（“哼，有意思”“区区……”“觉醒吧”）、喊招式名、报技能说明书、像客服或百科一样科普世界观。',
    '3. 活人关系：所有角色都是随时可能死在同一场考试里的清醒求生者，各有底线、算计与盲区。绝不对玩家无脑崇拜、阿谀奉承或强行暧昧；信任只能靠筹码、判断力与履约换取。',
    '4. 字数纪律：narration 严格控制在 80–160 个中文字符，句句推进局势、空间变化或信息差，绝不水字数。',
    '5. 严格输出单个合法 JSON 对象，不要附加任何解释或 Markdown 外壳。'
  ].join('\n');

  function buildExamSystemPrompt() {
    return [
      '你是无限流生存模拟器《零号回廊 · 停摆站台》的冷酷战术导演兼规则裁判（AI Director）。',
      '你的职责：根据玩家提交的自由行动文本、已拥有道具/能力、当前站台节点、噪音/威胁度、检票员动向与在场队友性格，给出写实、公平、充满张力的战术裁定。',
      '',
      ANTI_CRINGE_CORE,
      '',
      '【裁定规则】',
      '- usedItems 必须是玩家已持有道具 ID 的子集；若玩家试图动用未拥有的超凡能力，应判 feasible=false 或给出代价沉重的现实替代后果。',
      '- 创意战术（利用环境、组合已有道具、反制假播报、布阵封锁、核对秒表误差）应获得明确收益：解锁当前节点未发现线索（clueUnlocked）、施加 nodeEffect（warded/marked/blackout/cleared）或牵制检票员（enemyStunTurns: 1~2）。',
      '- dialogues 仅限在场的原创考场人物（yanci/lujin/xutan/shenyan），绝不让原著人物（yelin/litianyang/anke/hezheng）进入零号回廊；每次返回 0~2 句简短锋利的活人反应。',
      '- 严辞冷静拆解漏洞、陆烬惜字如金盯方位与执行、许檀报读数与频段误差、沈砚温和圆滑七分真三分毒。',
      '- 若玩家动作噪音过大、强行硬刚或触碰禁区，可返回 triggerCrisis 对象触发毫秒级危机窗口。',
      '',
      '【严格 JSON Schema】',
      '{',
      '  "feasible": true,',
      '  "usedItems": ["仅限玩家已持有的道具ID"],',
      '  "energyCost": 0到45的整数,',
      '  "hpDelta": -35到15的整数,',
      '  "sanityDelta": -20到10的整数,',
      '  "soundDelta": -15到40的整数,',
      '  "threatDelta": -12到30的整数,',
      '  "enemyStunTurns": 0到2的整数,',
      '  "clueUnlocked": "当前节点有效未解锁线索ID或null",',
      '  "nodeEffect": null 或 {"nodeId": "当前节点ID", "effect": "warded|marked|blackout|cleared"},',
      '  "narration": "80-160字冷峻克制、极具画面感的战术结果段落",',
      '  "dialogues": [{"npcId": "yanci|lujin|xutan|shenyan", "line": "15-60字活人台词", "emotion": "sharp|calm|wary|tense|cold", "trustDelta": -8到8, "cautionDelta": -8到8, "bondDelta": -4到6}],',
      '  "systemBroadcast": null 或 {"fake": true/false, "text": "简短广播文本"},',
      '  "sparkNote": "可选：不超过28字记录你与队友擦出的战术/认知火花，否则null",',
      '  "triggerCrisis": null 或 {"title": "短标题", "countdownSec": 6到10, "threatText": "40字内紧迫威胁", "suggestedCounters": ["反制思路1", "反制思路2"]}',
      '}'
    ].join('\n');
  }

  function buildHallSystemPrompt(dossier) {
    var bans = (dossier.forbiddenTropes || []).map(function (b) { return '- ' + b; }).join('\n');
    return [
      '你是无限流生存模拟器「主空间长廊」中的活人角色扮演引擎。',
      '当前扮演角色：' + dossier.name + '（' + dossier.role + '，阵营：' + (dossier.group === 'canon' ? '原著灵安小队/资深者' : '原创同行者') + '）。',
      '性格内核：' + dossier.personality,
      '语言节奏：' + dossier.speechStyle,
      bans ? ('角色禁忌：\n' + bans) : '',
      '',
      ANTI_CRINGE_CORE,
      '',
      '【长廊交互原则】',
      '- 你们处于血色漩涡外围的公共长廊/补给终端旁，各自刚从或即将进入死考。',
      '- 根据当前的信赖(trust)、戒备(caution)、私人牵挂(bond)调整说话分寸：戒备高时惜字、留后手、要求等价筹码；信赖高时才肯给真正值钱的保命提醒。',
      '- 若该角色属于原著组（夜林/李天阳/安可/贺铮），严禁答应加入玩家小队或替玩家免费兜底，保持独立老手立场。',
      '',
      '【严格 JSON Schema】',
      '{',
      '  "npcId": "' + dossier.id + '",',
      '  "narration": "30-85字冷峻克制的神态/动作细节描写",',
      '  "line": "25-130字完全符合人设的真实口语台词",',
      '  "emotion": "calm|sharp|wary|cold|focused|amused|tense",',
      '  "trustDelta": -8到8的整数,',
      '  "cautionDelta": -8到8的整数,',
      '  "bondDelta": -5到6的整数,',
      '  "intelHint": "可选：不超过36字的筹码或考场风声提示，否则null",',
      '  "sparkNote": "可选：不超过28字的关系/认知火花记录，否则null"',
      '}'
    ].join('\n');
  }

  function buildCrisisSystemPrompt() {
    return [
      '你是无限流生存模拟器《零号回廊》的毫秒级危机裁定官（Crisis Adjudicator）。',
      '玩家正处于极短倒计时内的生死反应窗口，你需要根据玩家的应对文本、是否超时、已持有道具与当前节点环境，给出干脆、凌厉、符合因果的即时结算。',
      '',
      ANTI_CRINGE_CORE,
      '',
      '【危机裁定原则】',
      '- 若玩家超时或应对明显迟钝/脱离现实，判 outcome="hit"，承受真实生命或理智代价。',
      '- 若玩家动用合理已持有道具、利用地形遮蔽或准确反制规则漏洞，判 outcome="clean"，几乎无伤脱身甚至反手牵制敌人（enemyStunTurns: 1~2）。',
      '- 若应对勉强有效但代价偏高，判 outcome="partial"。',
      '- narration 严格控制在 80–150 字，突出毫秒级动作切面与感官冲击。',
      '',
      '【严格 JSON Schema】',
      '{',
      '  "survived": true,',
      '  "outcome": "clean|partial|hit",',
      '  "usedItems": ["仅限玩家已持有的道具ID"],',
      '  "energyCost": 0到40的整数,',
      '  "hpDelta": -40到0的整数,',
      '  "sanityDelta": -20到5的整数,',
      '  "soundDelta": -5到30的整数,',
      '  "threatDelta": -12到20的整数,',
      '  "enemyStunTurns": 0到2的整数,',
      '  "narration": "80-150字紧绷冷峻的瞬间动作结算",',
      '  "dialogues": [{"npcId": "yanci|lujin|xutan|shenyan", "line": "10-45字急促真实的战时短句", "emotion": "tense|sharp|calm", "trustDelta": -5到8, "cautionDelta": -6到6, "bondDelta": -2到6}],',
      '  "sparkNote": "可选：不超过28字，否则null"',
      '}'
    ].join('\n');
  }

  /* --------------------------------------------------------------------------
   * Result Sanitizers (strict schema enforcement & rule-engine safety)
   * -------------------------------------------------------------------------- */
  function sanitizeUsedItems(rawUsed, ownedItems) {
    if (!Array.isArray(rawUsed)) return [];
    var ownedSet = {};
    for (var i = 0; i < ownedItems.length; i++) {
      ownedSet[ownedItems[i].id] = true;
    }
    var clean = [];
    var seen = {};
    for (var j = 0; j < rawUsed.length; j++) {
      var id = String(rawUsed[j] || '').trim();
      if (id && ownedSet[id] && !seen[id]) {
        seen[id] = true;
        clean.push(id);
      }
    }
    return clean;
  }

  function sanitizeDialogues(rawDialogues, allowedNpcIds) {
    if (!Array.isArray(rawDialogues)) return [];
    var allowed = {};
    for (var i = 0; i < allowedNpcIds.length; i++) {
      allowed[allowedNpcIds[i]] = true;
    }
    var out = [];
    for (var j = 0; j < rawDialogues.length && out.length < 2; j++) {
      var d = rawDialogues[j];
      if (!d || typeof d !== 'object') continue;
      var npcId = String(d.npcId || '').trim();
      if (!allowed[npcId]) continue;
      var line = String(d.line || '').trim();
      if (!line) continue;
      out.push({
        npcId: npcId,
        line: line.slice(0, 140),
        emotion: String(d.emotion || 'calm').trim(),
        trustDelta: clamp(d.trustDelta, -10, 10, 0),
        cautionDelta: clamp(d.cautionDelta, -10, 10, 0),
        bondDelta: clamp(d.bondDelta, -6, 8, 0)
      });
    }
    return out;
  }

  function sanitizeNodeEffect(rawEffect, currentNodeId) {
    if (!rawEffect || typeof rawEffect !== 'object') return null;
    var validEffects = { warded: true, marked: true, blackout: true, cleared: true };
    var eff = String(rawEffect.effect || '').trim();
    if (!validEffects[eff]) return null;
    return {
      nodeId: String(rawEffect.nodeId || currentNodeId || '').trim(),
      effect: eff
    };
  }

  function sanitizeExamResult(raw, ctx, ownedItems, presentNpcs, undiscoveredClues, fallbackUsed) {
    var currentNode = (ctx && (ctx.currentNode || (ctx.scenario && ctx.scenario.currentNode))) || {};
    var currentNodeId = currentNode.id || '';
    var allowedNpcIds = presentNpcs.map(function (n) { return n.id; });
    var validClueMap = {};
    for (var i = 0; i < undiscoveredClues.length; i++) {
      validClueMap[undiscoveredClues[i].id] = true;
    }

    var clueUnlocked = null;
    if (raw.clueUnlocked && typeof raw.clueUnlocked === 'string') {
      var cid = raw.clueUnlocked.trim();
      if (undiscoveredClues.length === 0 || validClueMap[cid]) {
        clueUnlocked = cid;
      }
    }

    var sysBc = null;
    if (raw.systemBroadcast && typeof raw.systemBroadcast === 'object' && raw.systemBroadcast.text) {
      sysBc = {
        fake: Boolean(raw.systemBroadcast.fake),
        text: String(raw.systemBroadcast.text).trim().slice(0, 160)
      };
    }

    var crisis = null;
    if (typeof raw.triggerCrisis === 'string' && raw.triggerCrisis.trim()) {
      crisis = raw.triggerCrisis.trim();
    } else if (raw.triggerCrisis && typeof raw.triggerCrisis === 'object' && raw.triggerCrisis.title) {
      crisis = {
        title: String(raw.triggerCrisis.title).trim().slice(0, 40),
        countdownSec: clamp(raw.triggerCrisis.countdownSec, 5, 12, 8),
        threatText: String(raw.triggerCrisis.threatText || '阴影正沿铁轨逼近，留给你的反应窗口不足数秒。').trim().slice(0, 140),
        suggestedCounters: Array.isArray(raw.triggerCrisis.suggestedCounters)
          ? raw.triggerCrisis.suggestedCounters.slice(0, 3).map(function (s) { return String(s).trim(); }).filter(Boolean)
          : ['利用掩体屏息规避', '动用控场道具打断节奏']
      };
    }

    return {
      feasible: typeof raw.feasible === 'boolean' ? raw.feasible : true,
      usedItems: sanitizeUsedItems(raw.usedItems, ownedItems),
      energyCost: clamp(raw.energyCost, 0, 50, 5),
      hpDelta: clamp(raw.hpDelta, -40, 20, 0),
      sanityDelta: clamp(raw.sanityDelta, -25, 12, 0),
      soundDelta: clamp(raw.soundDelta, -20, 45, 4),
      threatDelta: clamp(raw.threatDelta, -15, 35, 2),
      enemyStunTurns: clamp(raw.enemyStunTurns, 0, 3, 0),
      clueUnlocked: clueUnlocked,
      nodeEffect: sanitizeNodeEffect(raw.nodeEffect, currentNodeId),
      narration: String(raw.narration || '冷白灯管微微震颤，你的动作在潮湿的站台空气里留下极短的回响。').trim(),
      dialogues: sanitizeDialogues(raw.dialogues, allowedNpcIds),
      systemBroadcast: sysBc,
      sparkNote: raw.sparkNote ? String(raw.sparkNote).trim().slice(0, 60) : null,
      triggerCrisis: crisis,
      fallbackUsed: Boolean(fallbackUsed)
    };
  }

  function sanitizeHallResult(raw, dossier, fallbackUsed) {
    return {
      npcId: dossier.id,
      narration: String(raw.narration || (dossier.name + '停下手里的动作，目光在你脸上短暂停留了一秒。')).trim(),
      line: String(raw.line || '“有话直说，公共长廊隔墙有耳。”').trim(),
      emotion: String(raw.emotion || 'calm').trim(),
      trustDelta: clamp(raw.trustDelta, -10, 10, 0),
      cautionDelta: clamp(raw.cautionDelta, -10, 10, 0),
      bondDelta: clamp(raw.bondDelta, -6, 8, 0),
      intelHint: raw.intelHint ? String(raw.intelHint).trim().slice(0, 80) : null,
      sparkNote: raw.sparkNote ? String(raw.sparkNote).trim().slice(0, 60) : null,
      fallbackUsed: Boolean(fallbackUsed)
    };
  }

  function sanitizeCrisisResult(raw, ownedItems, presentNpcs, fallbackUsed) {
    var allowedNpcIds = presentNpcs.map(function (n) { return n.id; });
    var outcome = String(raw.outcome || '').trim();
    if (outcome !== 'clean' && outcome !== 'partial' && outcome !== 'hit') {
      outcome = (raw.hpDelta && Number(raw.hpDelta) <= -15) ? 'hit' : 'partial';
    }
    return {
      survived: typeof raw.survived === 'boolean' ? raw.survived : outcome !== 'hit',
      outcome: outcome,
      usedItems: sanitizeUsedItems(raw.usedItems, ownedItems),
      energyCost: clamp(raw.energyCost, 0, 45, 8),
      hpDelta: clamp(raw.hpDelta, -45, 0, outcome === 'hit' ? -18 : (outcome === 'partial' ? -6 : 0)),
      sanityDelta: clamp(raw.sanityDelta, -25, 8, outcome === 'hit' ? -10 : -2),
      soundDelta: clamp(raw.soundDelta, -10, 35, 6),
      threatDelta: clamp(raw.threatDelta, -15, 25, outcome === 'clean' ? -6 : 6),
      enemyStunTurns: clamp(raw.enemyStunTurns, 0, 3, 0),
      narration: String(raw.narration || '气压骤降的瞬间你强行折身撤步，铁锈味擦着鼻尖掠过，鞋底在湿滑地砖上拖出一道刺耳短音。').trim(),
      dialogues: sanitizeDialogues(raw.dialogues, allowedNpcIds),
      sparkNote: raw.sparkNote ? String(raw.sparkNote).trim().slice(0, 60) : null,
      fallbackUsed: Boolean(fallbackUsed)
    };
  }

  /* --------------------------------------------------------------------------
   * Intelligent Offline Tactical Fallback (Zero-Cringe Chinese Parser)
   * -------------------------------------------------------------------------- */
  function scoreItemAgainstText(item, text) {
    var score = 0;
    if (!item || !text) return 0;
    var t = String(text);
    if (item.name && t.indexOf(item.name) !== -1) score += 10;
    if (item.name && item.name.length >= 2) {
      var shortName = item.name.slice(0, 2);
      if (t.indexOf(shortName) !== -1) score += 4;
    }
    var tags = item.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (tags[i] && t.indexOf(tags[i]) !== -1) score += 5;
    }

    // Semantic keyword families
    var families = [
      { re: /剑|御剑|斩|劈|剑气|剑意|冷兵器|刀/, matchTags: /剑|刀|刃|冷兵器|真元|强攻/ },
      { re: /阵|符|结界|封锁|警戒|标记|陷阱|法阵|锚点|刻画/, matchTags: /阵|符|控场|结界|空间|封锁|灵异/ },
      { re: /扫|探|测|频段|无人机|监控|热成像|读数|扫描|听/, matchTags: /侦察|探测|科技|传感|无人机|情报/ },
      { re: /枪|射|开火|雷|闪光|烟雾|电磁|爆|轰|砸/, matchTags: /火器|科技|热兵器|爆发|电磁|战术/ },
      { re: /隐|潜|静音|消音|暗|躲|闪|跃|撤|速/, matchTags: /隐匿|潜行|机动|敏捷|暗影|隐身/ },
      { re: /血|疗|治|药|包扎|净化|稳心|安神|理智/, matchTags: /医疗|恢复|净化|精神|辅助|生存/ }
    ];
    var hay = (item.name + ' ' + item.desc + ' ' + tags.join(' ') + ' ' + (item.energyType || '') + ' ' + (item.categoryLabel || ''));
    for (var f = 0; f < families.length; f++) {
      if (families[f].re.test(t) && families[f].matchTags.test(hay)) {
        score += 3;
      }
    }
    return score;
  }

  function matchOwnedItems(text, ownedItems, limit) {
    var scored = [];
    for (var i = 0; i < ownedItems.length; i++) {
      var s = scoreItemAgainstText(ownedItems[i], text);
      if (s > 0) scored.push({ item: ownedItems[i], score: s });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit || 2).map(function (x) { return x.item; });
  }

  function offlineAdjudicateExamAction(ctx, ownedItems, presentNpcs, undiscoveredClues) {
    var text = String((ctx && (ctx.actionText || ctx.text || ctx.playerAction)) || '').trim();
    var node = (ctx && (ctx.currentNode || (ctx.scenario && ctx.scenario.currentNode))) || { id: 'concourse', name: '检票大厅' };
    var nodeName = node.name || '当前站台';
    var nodeId = node.id || 'concourse';
    var threat = Number((ctx && (ctx.threat !== undefined ? ctx.threat : (ctx.scenario && ctx.scenario.threat))) || 25);

    var matched = matchOwnedItems(text, ownedItems, 2);
    var usedIds = matched.map(function (m) { return m.id; });
    var itemPhrase = matched.length > 0 ? ('借着【' + matched[0].name + '】的余势，') : '';

    var hasNpc = function (id) {
      return presentNpcs.some(function (n) { return n.id === id; });
    };

    // 1. Fake broadcast / wristwatch verification counter
    if (/广播|喇叭|扬声器|假播报|腕表|对表|秒针|时间差|校时/.test(text)) {
      var clueId = undiscoveredClues.length > 0 ? undiscoveredClues[0].id : null;
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: matched.length ? 6 : 2,
        hpDelta: 0,
        sanityDelta: 4,
        soundDelta: 2,
        threatDelta: -4,
        enemyStunTurns: 0,
        clueUnlocked: clueId,
        nodeEffect: null,
        narration: itemPhrase + '你没有抬头看天花板上的广播盒，而是垂眼盯住腕表秒针与站台挂钟的相位差。刺耳电流声里夹杂着半拍重复的磁带底噪——这段催促登车的指令根本不是空间主系统下发，而是' + nodeName + '的诱捕回路。',
        dialogues: hasNpc('yanci') ? [{
          npcId: 'yanci',
          line: '“秒针没停，站台钟慢了四秒。很好，这条假广播可以彻底剔除出决策前提。”',
          emotion: 'sharp',
          trustDelta: 4,
          cautionDelta: -3,
          bondDelta: 2
        }] : [],
        systemBroadcast: { fake: true, text: '【杂音中断】……请滞留乘客立刻前往二号闸机复检，重复，立刻——滋啦。' },
        sparkNote: '用腕表相位差直接拆穿站台假播报，替小队省下一轮试错。',
        triggerCrisis: null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 2. Ward / Array / Mark / Lock down node
    if (/布阵|阵法|设防|封锁|贴符|标记|陷阱|结界|警戒线|锚点|隔离/.test(text)) {
      var effectType = /标记|锚点|坐标/.test(text) ? 'marked' : 'warded';
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: matched.length ? 12 : 8,
        hpDelta: 0,
        sanityDelta: -1,
        soundDelta: 4,
        threatDelta: -5,
        enemyStunTurns: 0,
        clueUnlocked: null,
        nodeEffect: { nodeId: nodeId, effect: effectType },
        narration: itemPhrase + '你贴着' + nodeName + '的承重柱与闸机底座压低重心，将节点边界锁死在两步视觉死角内。潮湿水泥地上只留下一道几乎看不见的冷色微痕，一旦铁轨方向有异常体跨线，回震会先一步传回你的掌心。',
        dialogues: hasNpc('xutan') ? [{
          npcId: 'xutan',
          line: '“边界阻抗读数稳住了，噪音只抬了不到三分贝。至少这条通道不会被无声摸背。”',
          emotion: 'focused',
          trustDelta: 3,
          cautionDelta: -2,
          bondDelta: 1
        }] : [],
        systemBroadcast: null,
        sparkNote: '在' + nodeName + '布下无声警戒节点，压缩了检票员的绕后空间。',
        triggerCrisis: null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 3. Recon / Clue investigation
    if (/调查|检查|勘察|扫描|监听|翻找|查看|观察|线索|时刻表|日志|档案|痕迹|监控|票/.test(text)) {
      var foundClue = undiscoveredClues.length > 0 ? undiscoveredClues[0] : null;
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: matched.length ? 7 : 3,
        hpDelta: 0,
        sanityDelta: -2,
        soundDelta: 3,
        threatDelta: 2,
        enemyStunTurns: 0,
        clueUnlocked: foundClue ? foundClue.id : null,
        nodeEffect: null,
        narration: itemPhrase + '你避开地面积水，顺着' + nodeName + '的灯带阴影逐格排查。在剥落的金属铭牌与积灰折角下，指尖触到一处被刻意刮花的旧编号——' + (foundClue ? ('你把【' + (foundClue.title || foundClue.id) + '】的关键片段快速记进脑中，没有多留一秒。') : '这里的表层痕迹已经被人提前清理过，但残留的刮痕走向仍指向主控室方向。'),
        dialogues: hasNpc('yanci') ? [{
          npcId: 'yanci',
          line: foundClue ? '“样本对得上。把编号记在心里，别念出声，这地方对关键词有回声反应。”' : '“这里已经被翻过一轮了，沈砚进站台的时间比他自己说的早。”',
          emotion: 'sharp',
          trustDelta: 3,
          cautionDelta: -2,
          bondDelta: 1
        }] : [],
        systemBroadcast: null,
        sparkNote: foundClue ? ('在' + nodeName + '精准挖出关键证物，补齐了规则拼图。') : null,
        triggerCrisis: null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 4. Stealth / Blackout / Silence
    if (/隐蔽|潜行|关灯|断电|熄灯|屏息|躲|消音|静音|压低|藏|撤/.test(text)) {
      var isBlackout = /关灯|断电|熄灯|拉闸/.test(text);
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: matched.length ? 6 : 3,
        hpDelta: 0,
        sanityDelta: -1,
        soundDelta: -10,
        threatDelta: -6,
        enemyStunTurns: 0,
        clueUnlocked: null,
        nodeEffect: isBlackout ? { nodeId: nodeId, effect: 'blackout' } : null,
        narration: itemPhrase + '你顺手掐断了多余的声源，脚尖贴着盲道边缘滑入' + nodeName + '的照明盲区。' + (isBlackout ? '配电箱轻响一声，头顶频闪灯管彻底熄灭，暗影瞬间吞没了半条走廊。' : '呼吸被压到最低频率，远处传来的金属拖曳声在铁轨另一端顿了半秒，随后重新偏移。'),
        dialogues: hasNpc('lujin') ? [{
          npcId: 'lujin',
          line: '“脚步声偏左了，至少三十米外。维持这个静默，别碰铁皮护栏。”',
          emotion: 'calm',
          trustDelta: 2,
          cautionDelta: -2,
          bondDelta: 1
        }] : [],
        systemBroadcast: null,
        sparkNote: null,
        triggerCrisis: null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 5. Strike / Control / Disrupt
    if (/攻击|斩|砍|开火|射击|击晕|打断|牵制|砸|摧毁|引爆|冲|硬刚|拦截|压制/.test(text)) {
      var hasWeapon = matched.length > 0;
      var highRisk = threat >= 60 && !hasWeapon;
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: hasWeapon ? 16 : 10,
        hpDelta: highRisk ? -8 : 0,
        sanityDelta: -3,
        soundDelta: 18,
        threatDelta: 10,
        enemyStunTurns: hasWeapon ? 2 : 1,
        clueUnlocked: null,
        nodeEffect: null,
        narration: itemPhrase + '你没有给走廊里的黑影蓄力空间，借着' + nodeName + '的立柱反蹬突进，以最短路径切入截击线。' + (hasWeapon ? '冷冽的冲击波将迎面压来的诡异气压硬生生劈开半拍，检票员的脚步罕见地僵滞了一瞬，但刺耳的回响已顺着隧道传开。' : '徒手硬撼震得虎口发麻，你勉强逼退了前探的阴影，却也让整座站台的噪音读数瞬间飙高。'),
        dialogues: hasNpc('lujin') ? [{
          npcId: 'lujin',
          line: hasWeapon ? '“干得利落，我补左翼。三秒内撤出这片回音区。”' : '“手别硬接它的检票钳，退半步让我来顶。”',
          emotion: 'sharp',
          trustDelta: hasWeapon ? 4 : 1,
          cautionDelta: -2,
          bondDelta: 2
        }] : [],
        systemBroadcast: null,
        sparkNote: hasWeapon ? '果断抢先手截停异常压迫，替小队撕出转移窗口。' : null,
        triggerCrisis: threat >= 72 ? {
          title: '回音引潮 · 检票钳突袭',
          countdownSec: 8,
          threatText: '过高的噪音瞬间锁死了你的方位，冷雾中一道带铁锈味的剪影正贴地疾掠而来！',
          suggestedCounters: ['立刻借立柱错步闪避并静音', '动用防御/控场道具硬接后撤']
        } : null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 6. Probe Shen Yan or coordinate with squad
    if (/沈砚|套话|试探|质问|核实|审问|问|商量|交易|配合/.test(text)) {
      var probeShen = /沈砚|套话|质问|破绽|撒谎/.test(text) && hasNpc('shenyan');
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: 2,
        hpDelta: 0,
        sanityDelta: 0,
        soundDelta: 3,
        threatDelta: 1,
        enemyStunTurns: 0,
        clueUnlocked: null,
        nodeEffect: null,
        narration: probeShen
          ? '你把声音压到只有两人能听见的刻度，顺着沈砚刚才报出的停电间隔反问了一句。他指间转动的机械秒表顿了不到半格，随即笑着摊手，把话题轻巧地拨回检票口规则，却彻底坐实了他隐瞒入场时间的事实。'
          : '你在' + nodeName + '的立柱阴影后快速比划手势，用极短的词句与队友对齐了撤离线与时间底线。没人废话，呼吸与视线在同一秒重新落回通道两端。',
        dialogues: probeShen ? [{
          npcId: 'shenyan',
          line: '“哟，耳朵真尖。我那块表走得比站台快半拍，记岔了很正常——真要算账，不如先活着走出检票口？”',
          emotion: 'wary',
          trustDelta: -2,
          cautionDelta: 6,
          bondDelta: 0
        }] : (hasNpc('yanci') ? [{
          npcId: 'yanci',
          line: '“前提一致。接下来的两轮谁也别单独越过白线，有异动先打手势再开声。”',
          emotion: 'calm',
          trustDelta: 3,
          cautionDelta: -3,
          bondDelta: 1
        }] : []),
        systemBroadcast: null,
        sparkNote: probeShen ? '一句反问试出沈砚秒表节奏的破绽，提前防住了潜在背刺。' : null,
        triggerCrisis: null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 7. Medical / Stabilize
    if (/止血|治疗|包扎|恢复|吃药|喷雾|稳住|静心|喘口气|调息/.test(text)) {
      var hasMed = matched.length > 0;
      return sanitizeExamResult({
        feasible: true,
        usedItems: usedIds,
        energyCost: 4,
        hpDelta: hasMed ? 12 : 4,
        sanityDelta: hasMed ? 8 : 4,
        soundDelta: -2,
        threatDelta: 2,
        enemyStunTurns: 0,
        clueUnlocked: null,
        nodeEffect: null,
        narration: itemPhrase + '你背靠冰冷的瓷砖墙短暂收拢呼吸，快速处理掉渗血的擦伤并压住耳鸣。冷汗沿着脊背滑落，脉搏重新回到可控区间，但站台尽头传来的风声提醒你这里不能久停。',
        dialogues: hasNpc('xutan') ? [{
          npcId: 'xutan',
          line: '“体征稳下来了就行，我帮你盯着后方盲区，最多三十秒。”',
          emotion: 'calm',
          trustDelta: 2,
          cautionDelta: -1,
          bondDelta: 1
        }] : [],
        systemBroadcast: null,
        sparkNote: null,
        triggerCrisis: null
      }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
    }

    // 8. General tactical action fallback (contextual, never generic filler)
    var snippet = text ? ('「' + text.slice(0, 26) + (text.length > 26 ? '…' : '') + '」') : '一次试探性动作';
    return sanitizeExamResult({
      feasible: true,
      usedItems: usedIds,
      energyCost: matched.length ? 8 : 4,
      hpDelta: 0,
      sanityDelta: -1,
      soundDelta: 5,
      threatDelta: 3,
      enemyStunTurns: 0,
      clueUnlocked: null,
      nodeEffect: null,
      narration: itemPhrase + '你在' + nodeName + '迅速执行了' + snippet + '。冷白灯光在潮湿地面拉出短促斜影，铁轨深处的气流随之轻微扰动；暂时没有直接触发抹杀条款，但空气里的铁锈味比十秒前更浓了一分。',
      dialogues: hasNpc('yanci') ? [{
        npcId: 'yanci',
        line: '“试探有效，但别在同一个节点重复暴露节奏。下一拍直接给明确目标——查证、布防，或者换位。”',
        emotion: 'calm',
        trustDelta: 1,
        cautionDelta: 0,
        bondDelta: 0
      }] : [],
      systemBroadcast: null,
      sparkNote: null,
      triggerCrisis: null
    }, ctx, ownedItems, presentNpcs, undiscoveredClues, true);
  }

  function offlineHallInteraction(ctx, dossier) {
    var text = String((ctx && (ctx.userText || ctx.text || ctx.message)) || '').trim();
    var rel = (ctx && (ctx.relation || ctx.relationship)) || {};
    var trust = Number(rel.trust !== undefined ? rel.trust : 30);

    var isIntel = /情报|规则|考场|消息|传闻|线索|零号|新生|榜单|仙门|旧版本/.test(text);
    var isBuild = /兑换|道具|血统|强化|武器|融合|推荐|配置|打折|买/.test(text);
    var isTeam = /组队|合作|一起|帮我|带我|底牌|信任|结盟/.test(text);
    var isHostile = /滚|闭嘴|蠢|杀|威胁|少废话|滚开|骗/.test(text);

    var templates = {
      yanci: {
        intel: {
          narration: '严辞合上手里的纸质折页，指节在封皮上轻叩了两下，视线冷淡而专注。',
          line: '“最近两批场次的共同点只有一条：广播和字面提示开始出现反向诱导。进场前先定好时间校验标准，别把耳朵交给系统。”',
          emotion: 'sharp', trustDelta: 3, cautionDelta: -2, bondDelta: 1,
          intelHint: '严辞确认：近期规则考频繁出现“假播报”陷阱，腕表走秒是唯一硬基准。'
        },
        build: {
          narration: '严辞扫了一眼你腕表上的兑换记录，没有评价价格，只挑了最要害的缺口。',
          line: '“输出够用之前先补容错。一个低噪控场件，一个抗认知干扰的底牌，比堆纯面板多活两场。”',
          emotion: 'focused', trustDelta: 2, cautionDelta: -2, bondDelta: 1,
          intelHint: '严辞建议：优先补足侦察/控场/抗精神污染的短板，不要把点数全砸单一爆发。'
        },
        team: {
          narration: '严辞没有立刻点头，目光像称量筹码一样在你脸上停了两秒。',
          line: trust >= 50
            ? '“前十五分钟我来拆题，你负责执行与补位。丑话说在前头：谁临阵隐瞒关键线索，合约当场作废。”'
            : '“合作可以，但先拿执行力说话。下一场把你的保命类型报清楚，别等出事了才亮底牌。”',
          emotion: 'sharp', trustDelta: 4, cautionDelta: -3, bondDelta: 2,
          intelHint: null
        },
        hostile: {
          narration: '严辞神色没起波澜，只是把折页收进风衣内袋，往后退了半步拉开安全距离。',
          line: '“情绪失控在空间里是最廉价的死法。冷静下来再谈，或者各自进场。”',
          emotion: 'cold', trustDelta: -6, cautionDelta: 7, bondDelta: -3,
          intelHint: null
        },
        default: {
          narration: '严辞靠在血色漩涡外环的石柱边，顺手掐掉了腕表上的录音回放。',
          line: '“与其在长廊里猜下一场考什么，不如先把最坏的三种开局预案过一遍。你现在最缺的是输出，还是退路？”',
          emotion: 'calm', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: null
        }
      },
      lujin: {
        intel: {
          narration: '陆烬把擦枪布折好塞回战术包，抬眼看你时眉骨压得很低。',
          line: '“我不擅长猜弯弯绕绕的题。我只知道一点：密闭站台里，先响枪的人不一定先死，但停在原地发呆的肯定死。”',
          emotion: 'focused', trustDelta: 2, cautionDelta: -2, bondDelta: 1,
          intelHint: '陆烬的实战经验：狭小地形内保持移动与掩体切换，切忌原地硬吃先手。'
        },
        build: {
          narration: '陆烬盯着你的肩线和步距看了一秒，干脆利落地吐出几个字。',
          line: '“爆发够了就补一件保命位移，或者手雷。真被逼进死角，能争出两秒喘息的东西才值钱。”',
          emotion: 'calm', trustDelta: 3, cautionDelta: -2, bondDelta: 1,
          intelHint: '陆烬建议：带至少一件瞬发位移或控场消耗品，防止在走廊被堵死。'
        },
        team: {
          narration: '陆烬点了下头，指节捏得咔哒轻响，没有多余客套。',
          line: '“你盯细节，我顶前排。只要你不从背后卖人，我这边绝不先撤。”',
          emotion: 'sharp', trustDelta: 4, cautionDelta: -3, bondDelta: 2,
          intelHint: null
        },
        hostile: {
          narration: '陆烬眼神瞬间冷了下来，重心微沉，右手自然垂在腰侧扣具上。',
          line: '“嘴硬没用。真想练练去训练室，别在长廊里浪费力气。”',
          emotion: 'cold', trustDelta: -6, cautionDelta: 6, bondDelta: -3,
          intelHint: null
        },
        default: {
          narration: '陆烬收好电磁步枪的保险栓，简短地朝你抬了下下巴。',
          line: '“装备校完了？校完就留点精力，下一场不知道几点拉人，别把体力耗在废话上。”',
          emotion: 'calm', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: null
        }
      },
      xutan: {
        intel: {
          narration: '许檀压低帽檐，指尖在改装探测仪的屏蔽壳上敲了两下，把屏幕往你这边偏了十五度。',
          line: '“公共频道刚漂过一条异常频谱，下一场极可能是强规则叠加低能见度环境。电子设备大概率会漂移，记得留纯物理校准手段。”',
          emotion: 'focused', trustDelta: 3, cautionDelta: -2, bondDelta: 1,
          intelHint: '许檀截获的频谱特征：强规则密闭场会干扰电子时钟，物理参照物更可靠。'
        },
        build: {
          narration: '许檀推了推镜框，语速偏快却条理清楚。',
          line: '“有余钱的话，带一个非纯电侦察件或者阵法标记。盲区里多提前两秒看见轮廓，生存率能翻倍。”',
          emotion: 'sharp', trustDelta: 2, cautionDelta: -2, bondDelta: 1,
          intelHint: null
        },
        team: {
          narration: '许檀敲表盘的动作停了一下，扯出个很淡的笑。',
          line: '“行啊，侦察和频段比对交给我。不过先说好，我报撤退读数的时候，别跟我赌最后三秒。”',
          emotion: 'calm', trustDelta: 4, cautionDelta: -3, bondDelta: 2,
          intelHint: null
        },
        hostile: {
          narration: '许檀立刻合上探测仪护盖，脸色冷了几分，退回阴影柱后。',
          line: '“脾气这么冲的话，我就不把频段同步给你了。自己盲摸吧。”',
          emotion: 'wary', trustDelta: -5, cautionDelta: 6, bondDelta: -2,
          intelHint: null
        },
        default: {
          narration: '许檀蹲在兑换柱旁焊完最后一根细天线，抬头扫了你一眼。',
          line: '“刚调好屏蔽层，延迟压到十二毫秒以内了。你要是有什么拿不准的异常道具，可以报个属性，我帮你算算兼容风险。”',
          emotion: 'focused', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: null
        }
      },
      guhe: {
        intel: {
          narration: '顾禾没有抬头，继续核对医疗终端上的价目表，声音平静得像在念病历。',
          line: '“灵异污染和物理失血是两套账。很多新人死在考场里，不是因为伤太重，而是用了便宜药把异常症状暂时盖住了。”',
          emotion: 'cold', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: '顾禾提醒：理智/污染类侵蚀不能靠普通止血剂掩盖，需要专门净化或强意志压制。'
        },
        build: {
          narration: '顾禾转过半个身位，目光职业性地扫过你的手腕与领口。',
          line: '“预算紧就买止血喷雾配一支镇静类耗材。别买花哨的半成品血统，排异反应发作时没人替你付修复费。”',
          emotion: 'calm', trustDelta: 3, cautionDelta: -2, bondDelta: 1,
          intelHint: null
        },
        team: {
          narration: '顾禾轻轻摇了摇头，边界感画得极清。',
          line: '“我还在赤霄队编制里，不跨队签契约。真在公共区需要外伤处理，按空间市价算点数，我不赊账。”',
          emotion: 'wary', trustDelta: 0, cautionDelta: 2, bondDelta: 0,
          intelHint: null
        },
        hostile: {
          narration: '顾禾关掉医疗终端界面，连多余的眼神都没留给你。',
          line: '“门在那边。我只看病，不伺候躁狂症。”',
          emotion: 'cold', trustDelta: -6, cautionDelta: 8, bondDelta: -3,
          intelHint: null
        },
        default: {
          narration: '顾禾把两支密封安瓿收进白大褂内袋，语气不带起伏。',
          line: '“脉搏还算稳，说明上一场没伤到根基。有交易直说，没有的话别挡着后面的补给终端。”',
          emotion: 'calm', trustDelta: 1, cautionDelta: -1, bondDelta: 0,
          intelHint: null
        }
      },
      yelin: {
        intel: {
          narration: '夜林翻过折页的一角，目光淡得像在审视一份不知真伪的口供。',
          line: '“你想打听《新生》还是高阶场的规则？无偿递出来的情报通常裹着钩子。拿你亲眼验证过的一条异常机制来换，否则免谈。”',
          emotion: 'cold', trustDelta: 1, cautionDelta: 1, bondDelta: 0,
          intelHint: '夜林态度明确：原著灵安小队只认等价情报交换，不提供无偿指导。'
        },
        team: {
          narration: '夜林合上折页，连嘴角都没动一下。',
          line: '“灵安小队不缺人，也不替陌生人分担死亡配额。管好你自己的队伍，能活过下两场再谈照面。”',
          emotion: 'cold', trustDelta: -1, cautionDelta: 3, bondDelta: 0,
          intelHint: null
        },
        hostile: {
          narration: '夜林只淡淡看了你一眼，转身沿血色漩涡外环离开，没有接你的挑衅。',
          line: '“在公共区亮爪子，只会让别人提前摸清你的情绪阈值。”',
          emotion: 'cold', trustDelta: -5, cautionDelta: 6, bondDelta: -2,
          intelHint: null
        },
        default: {
          narration: '夜林靠在石栏阴影里，指尖夹着一支没拔帽的记号笔，神色毫无波澜。',
          line: '“公共长廊里消息满天飞，九成是用来抬价或钓鱼的。你要是真想多活几场，少听传闻，多盯系统措辞里的多余限定词。”',
          emotion: 'sharp', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: '夜林随口点出的破局习惯：重点审视任务文本里的“多余限定词”。'
        }
      },
      litianyang: {
        intel: {
          narration: '李天阳擦拭捕灵网扣件的手停顿了半秒，提到深层传闻时眼底立刻沉了下来。',
          line: /仙门|旧版本/.test(text)
            ? '“那两个字少在公共区提。知道得太早，活不到用上的那天。”'
            : '“灵异场里最要命的从来不是正面扑过来的东西，是让你以为‘照着做就能安全’的温和指令。”',
          emotion: /仙门|旧版本/.test(text) ? 'wary' : 'calm',
          trustDelta: /仙门|旧版本/.test(text) ? -2 : 2,
          cautionDelta: /仙门|旧版本/.test(text) ? 5 : -1,
          bondDelta: 0,
          intelHint: '李天阳的警告：对过于温和、催促感强烈的“安全指令”保持最高戒备。'
        },
        team: {
          narration: '李天阳把暗沉的扣件收回袖口，语气温和却不容置疑。',
          line: '“我习惯独来独往，也带不动新队伍的因果。能帮你的话刚才已经说完了，剩下的路得靠你自己走。”',
          emotion: 'calm', trustDelta: 0, cautionDelta: 2, bondDelta: 0,
          intelHint: null
        },
        default: {
          narration: '李天阳靠在石栏边，目光越过血色漩涡，带着一点老手特有的疲惫与克制。',
          line: '“新人刚过两场最容易犯的错，是觉得攒够点数买把好刀就稳了。记住，规则考里刀砍不断契约，留一件保命脱身的东西比什么都强。”',
          emotion: 'calm', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: null
        }
      },
      anke: {
        intel: {
          narration: '安可把双机通讯器调回静音，抬眼打量了你一圈，神情干练利落。',
          line: '“想换情报可以，按老规矩来——一条实测过的规则盲点，换一条近期高发场次的风声。空手套白狼的话，我还有清单要核。”',
          emotion: 'sharp', trustDelta: 1, cautionDelta: 0, bondDelta: 0,
          intelHint: null
        },
        build: {
          narration: '安可瞥了一眼兑换柱上的折扣栏，语速清脆。',
          line: '“折价货不是不能买，但买之前先算清楚代价会不会在死角里要你的命。远程控场和视野件永远不过时。”',
          emotion: 'focused', trustDelta: 2, cautionDelta: -2, bondDelta: 1,
          intelHint: '安可提醒：购买六折缺陷版强化前，务必确认其副作用不会在关键时刻反噬。'
        },
        default: {
          narration: '安可合上折价清单，冲你极浅地点了下头，分寸感拿捏得恰到好处。',
          line: '“能活着站在公共通道里挑配置，说明你至少没犯低级错误。灵安小队有自己的节奏，各自保命，场外少惹是非。”',
          emotion: 'calm', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: null
        }
      },
      hezheng: {
        build: {
          narration: '贺铮把战术手雷盒往臂弯里一夹，说话直来直去，半点不端架子。',
          line: '“听我一句实在的：预算紧别盯着那些名字花里胡哨的玩意儿，闪光、烟雾、防切割内衬，关键时刻能替你抢出一条命。”',
          emotion: 'calm', trustDelta: 3, cautionDelta: -2, bondDelta: 1,
          intelHint: '贺铮的实战建议：基础战术投掷物与防具在狭小地形的性价比远超预期。'
        },
        team: {
          narration: '贺铮挠了挠眉梢，干脆地摆了摆手。',
          line: '“哥们儿，我背上还扛着灵安那几个人的后路呢，没法兼顾外队。真在走廊里撞见了，互相别背后放冷枪就算交情。”',
          emotion: 'calm', trustDelta: 1, cautionDelta: 0, bondDelta: 1,
          intelHint: null
        },
        default: {
          narration: '贺铮把半截没点着的烟别回耳后，拍了拍手上的灰。',
          line: '“刚从考场下来别急着硬撑，该修的伤赶紧修。咱们拼死拼活赚点数，说到底不就图个活着回家么。”',
          emotion: 'calm', trustDelta: 2, cautionDelta: -1, bondDelta: 1,
          intelHint: null
        }
      }
    };

    var bank = templates[dossier.id] || templates.yanci;
    var pick = bank.default;
    if (isHostile && bank.hostile) pick = bank.hostile;
    else if (isTeam && bank.team) pick = bank.team;
    else if (isBuild && bank.build) pick = bank.build;
    else if (isIntel && bank.intel) pick = bank.intel;

    return sanitizeHallResult(pick, dossier, true);
  }

  function offlineAdjudicateCrisis(ctx, ownedItems, presentNpcs) {
    var text = String((ctx && (ctx.choiceOrText || ctx.responseText || ctx.actionText || ctx.text)) || '').trim();
    var timedOut = Boolean(ctx && ctx.timedOut);
    var crisis = (ctx && ctx.crisis) || { title: '突发危局' };
    var matched = matchOwnedItems(text, ownedItems, 2);
    var usedIds = matched.map(function (m) { return m.id; });
    var hasNpc = function (id) {
      return presentNpcs.some(function (n) { return n.id === id; });
    };

    if (timedOut || !text || text === '__TIMEOUT__') {
      return sanitizeCrisisResult({
        survived: true,
        outcome: 'hit',
        usedItems: [],
        energyCost: 0,
        hpDelta: -20,
        sanityDelta: -10,
        soundDelta: 12,
        threatDelta: 12,
        enemyStunTurns: 0,
        narration: '你慢了半拍。冷雾里的寒意在毫秒间贴上肩胛，金属检票钳擦着锁骨划过，带起一道冰凉刺痛的血痕。你被硬生生撞退两步撞在水泥柱上，耳膜里全是失真的电流嗡鸣。',
        dialogues: hasNpc('lujin') ? [{
          npcId: 'lujin',
          line: '“别发愣！往我这边滚半步，先止血！”',
          emotion: 'tense',
          trustDelta: -1,
          cautionDelta: 2,
          bondDelta: 0
        }] : [],
        sparkNote: null
      }, ownedItems, presentNpcs, true);
    }

    var isSharpCounter = matched.length > 0 || /躲|闪|滚|卧倒|断电|静音|屏息|格挡|反击|斩|射|抛|扔|对表|闭眼|阵|符|掩体/.test(text);
    if (isSharpCounter) {
      var isOffensive = /斩|射|反击|击晕|打断|闪光|雷|阵|符|牵制/.test(text) && matched.length > 0;
      var itemLabel = matched.length > 0 ? ('催动【' + matched[0].name + '】') : '借立柱死角强行折身';
      return sanitizeCrisisResult({
        survived: true,
        outcome: matched.length > 0 ? 'clean' : 'partial',
        usedItems: usedIds,
        energyCost: matched.length > 0 ? 12 : 6,
        hpDelta: matched.length > 0 ? 0 : -5,
        sanityDelta: matched.length > 0 ? 0 : -3,
        soundDelta: isOffensive ? 10 : 2,
        threatDelta: matched.length > 0 ? -6 : 2,
        enemyStunTurns: isOffensive ? 1 : 0,
        narration: '在【' + (crisis.title || '危机') + '】压顶的最后一瞬，你没有多余犹豫，直接' + itemLabel + '切出安全线。带着铁锈味的劲风擦着袖口掠空，地砖崩出细裂，你稳稳落回掩体阴影内，硬生生把必杀窗口拆成了一次擦肩。',
        dialogues: hasNpc('yanci') ? [{
          npcId: 'yanci',
          line: '“反应够快，节奏没乱。趁它收势的空档立刻换位。”',
          emotion: 'sharp',
          trustDelta: 4,
          cautionDelta: -3,
          bondDelta: 2
        }] : [],
        sparkNote: '在毫秒级危机窗口中精准拆招，稳住了全队阵脚。'
      }, ownedItems, presentNpcs, true);
    }

    return sanitizeCrisisResult({
      survived: true,
      outcome: 'partial',
      usedItems: usedIds,
      energyCost: 8,
      hpDelta: -10,
      sanityDelta: -5,
      soundDelta: 8,
      threatDelta: 5,
      enemyStunTurns: 0,
      narration: '你的仓促应对勉强偏开了致命轨迹，但余波仍震得小臂发麻。冷雾贴着面颊掠过，留下一道浅血口，你借反作用力跌进通道暗影里，勉强保住了一条命。',
      dialogues: hasNpc('xutan') ? [{
        npcId: 'xutan',
        line: '“还活着就好，别停在这里，它的下一轮扫描很快过来。”',
        emotion: 'tense',
        trustDelta: 1,
        cautionDelta: 0,
        bondDelta: 1
      }] : [],
      sparkNote: null
    }, ownedItems, presentNpcs, true);
  }

  /* --------------------------------------------------------------------------
   * Public AI Adjudication & Dialogue APIs
   * -------------------------------------------------------------------------- */
  async function adjudicateExamAction(ctx) {
    var ownedItems = resolveOwnedItems(ctx);
    var presentNpcs = resolvePresentExamNpcs(ctx);
    var undiscoveredClues = resolveUndiscoveredClues(ctx);
    var cfg = getConfig();

    if (!canUseLiveAI(cfg)) {
      return offlineAdjudicateExamAction(ctx, ownedItems, presentNpcs, undiscoveredClues);
    }

    var node = (ctx && (ctx.currentNode || (ctx.scenario && ctx.scenario.currentNode))) || {};
    var player = (ctx && ctx.player) || {};
    var scenario = (ctx && ctx.scenario) || {};

    var userPayload = {
      playerAction: String((ctx && (ctx.actionText || ctx.text || ctx.playerAction)) || '').trim(),
      player: {
        name: player.name || '考生',
        hp: player.hp,
        maxHp: player.maxHp,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        sanity: player.sanity,
        maxSanity: player.maxSanity,
        stats: player.stats || null
      },
      ownedItems: ownedItems.map(function (it) {
        return { id: it.id, name: it.name, tier: it.tier, tags: it.tags, desc: it.desc };
      }),
      currentNode: {
        id: node.id || '',
        name: node.name || '',
        desc: node.desc || '',
        effect: node.effect || null
      },
      undiscoveredCluesHere: undiscoveredClues.map(function (c) {
        return { id: c.id, title: c.title || c.id, desc: c.desc || '' };
      }),
      stationState: {
        turn: ctx.turn !== undefined ? ctx.turn : scenario.turn,
        sound: ctx.sound !== undefined ? ctx.sound : scenario.sound,
        threat: ctx.threat !== undefined ? ctx.threat : scenario.threat,
        enemyNode: ctx.enemyNode || (scenario.enemy && scenario.enemy.nodeId) || null
      },
      presentNpcs: presentNpcs.map(function (n) {
        return { id: n.id, name: n.name, role: n.role, speechStyle: n.speechStyle };
      }),
      recentLog: Array.isArray(ctx && ctx.recentLog) ? ctx.recentLog.slice(-4) : []
    };

    try {
      var res = await callChatCompletion(
        cfg,
        [
          { role: 'system', content: buildExamSystemPrompt() },
          { role: 'user', content: JSON.stringify(userPayload) }
        ],
        { expectJson: true, temperature: 0.65 }
      );
      var parsed = extractJsonObject(res.content);
      if (!parsed || typeof parsed.narration !== 'string') {
        return offlineAdjudicateExamAction(ctx, ownedItems, presentNpcs, undiscoveredClues);
      }
      return sanitizeExamResult(parsed, ctx, ownedItems, presentNpcs, undiscoveredClues, false);
    } catch (_) {
      return offlineAdjudicateExamAction(ctx, ownedItems, presentNpcs, undiscoveredClues);
    }
  }

  async function generateHallInteraction(ctx) {
    var npcId = String((ctx && (ctx.npcId || (ctx.npc && ctx.npc.id))) || 'yanci').trim();
    var dossier = resolveCastDossier(npcId, ctx && ctx.npc);
    var cfg = getConfig();

    if (!canUseLiveAI(cfg)) {
      return offlineHallInteraction(ctx, dossier);
    }

    var ownedItems = resolveOwnedItems(ctx);
    var player = (ctx && ctx.player) || {};
    var rel = (ctx && (ctx.relation || ctx.relationship)) || {};

    var userPayload = {
      playerMessage: String((ctx && (ctx.userText || ctx.text || ctx.message)) || '').trim(),
      playerProfile: {
        name: player.name || '新人考生',
        callsign: player.callsign || '',
        points: player.points,
        permission: player.permission,
        ownedItems: ownedItems.slice(0, 8).map(function (it) { return it.name; })
      },
      currentRelation: {
        trust: rel.trust,
        caution: rel.caution,
        bond: rel.bond
      },
      recentHistory: Array.isArray(ctx && (ctx.recentHistory || ctx.history))
        ? (ctx.recentHistory || ctx.history).slice(-6)
        : []
    };

    try {
      var res = await callChatCompletion(
        cfg,
        [
          { role: 'system', content: buildHallSystemPrompt(dossier) },
          { role: 'user', content: JSON.stringify(userPayload) }
        ],
        { expectJson: true, temperature: 0.72 }
      );
      var parsed = extractJsonObject(res.content);
      if (!parsed || typeof parsed.line !== 'string') {
        return offlineHallInteraction(ctx, dossier);
      }
      return sanitizeHallResult(parsed, dossier, false);
    } catch (_) {
      return offlineHallInteraction(ctx, dossier);
    }
  }

  async function adjudicateCrisis(ctx) {
    var ownedItems = resolveOwnedItems(ctx);
    var presentNpcs = resolvePresentExamNpcs(ctx);
    var cfg = getConfig();

    if (!canUseLiveAI(cfg) || (ctx && ctx.timedOut)) {
      return offlineAdjudicateCrisis(ctx, ownedItems, presentNpcs);
    }

    var player = (ctx && ctx.player) || {};
    var crisis = (ctx && ctx.crisis) || {};
    var node = (ctx && (ctx.currentNode || (ctx.scenario && ctx.scenario.currentNode))) || {};

    var userPayload = {
      crisis: {
        id: crisis.id || '',
        title: crisis.title || '突发危局',
        threatText: crisis.threatText || '',
        suggestedCounters: crisis.suggestedCounters || []
      },
      playerResponse: String((ctx && (ctx.choiceOrText || ctx.responseText || ctx.actionText || ctx.text)) || '').trim(),
      timedOut: Boolean(ctx && ctx.timedOut),
      currentNode: { id: node.id || '', name: node.name || '' },
      player: {
        hp: player.hp,
        energy: player.energy,
        sanity: player.sanity
      },
      ownedItems: ownedItems.map(function (it) {
        return { id: it.id, name: it.name, tags: it.tags, desc: it.desc };
      }),
      presentNpcs: presentNpcs.map(function (n) {
        return { id: n.id, name: n.name };
      })
    };

    try {
      var res = await callChatCompletion(
        cfg,
        [
          { role: 'system', content: buildCrisisSystemPrompt() },
          { role: 'user', content: JSON.stringify(userPayload) }
        ],
        { expectJson: true, temperature: 0.6 }
      );
      var parsed = extractJsonObject(res.content);
      if (!parsed || typeof parsed.narration !== 'string') {
        return offlineAdjudicateCrisis(ctx, ownedItems, presentNpcs);
      }
      return sanitizeCrisisResult(parsed, ownedItems, presentNpcs, false);
    } catch (_) {
      return offlineAdjudicateCrisis(ctx, ownedItems, presentNpcs);
    }
  }

  /* --------------------------------------------------------------------------
   * 2.5D Live Tactical Radio (DeepSeek / OpenAI / Ollama + Offline Chinese Parser)
   * Strictly original Station Zero cast: yanci, lujin, xutan, shenyan (ZERO canon)
   * -------------------------------------------------------------------------- */
  var STATION_ZERO_RADIO_NPCS = ['yanci', 'lujin', 'xutan', 'shenyan'];

  var LIVE_RADIO_ORDER_LABELS = {
    follow: '跟随掩护',
    goto_dispatch: '前往信号调度室',
    goto_substation: '前往旧变电间',
    goto_platform0: '前往0号站台',
    goto_concourse: '回防检票大厅',
    goto_corridor: '控制换乘长廊',
    hold: '原地警戒防守',
    engage: '牵制/攻击检票员',
    regroup: '全员收拢汇合'
  };

  var ZONE_NAME_FALLBACK = {
    concourse: 'B1 检票大厅',
    corridor: 'B2 换乘长廊',
    dispatch: '信号调度室',
    substation: '旧变电间',
    tunnel: '废弃应急通道',
    platform0: '0号站台铁轨'
  };

  function getZoneLabel(zoneId) {
    if (INFINITY.StationMap && INFINITY.StationMap.ZONES && INFINITY.StationMap.ZONES[zoneId]) {
      return INFINITY.StationMap.ZONES[zoneId].name;
    }
    return ZONE_NAME_FALLBACK[zoneId] || zoneId || '未知区域';
  }

  function buildLiveRadioSystemPrompt() {
    return [
      '你是无限流实时2.5D考场《零号回廊 · 停摆站台》的加密短波小队通讯导演（Live Radio AI）。',
      '玩家正在实时移动与战斗中通过加密短波呼叫队友或下达战术指令。你必须根据当前实时局势（坐标、轨控改写进度、检票员距离/状态、小队分布）给出冷峻、短促、活人感拉满的语音回复，并准确输出真实可执行的小队移动/战斗指令 squadOrders。',
      '',
      ANTI_CRINGE_CORE,
      '',
      '【允许出场人物（严禁原著角色夜林/李天阳/安可/贺铮/顾禾发声）】',
      '- yanci（严辞｜执棋队长）：短句冷冽、结构化拆解规则与漏洞，盯调度室道岔、腕表校时与假播报。',
      '- lujin（陆烬｜攻坚主C）：惜字如金、盯方位距离与执行，“收到”“我顶左翼”“三秒够了”，绝不废话。',
      '- xutan（许檀｜侦察技术）：语速利落、爱报频段/读数/延迟/变电间和电路状态，关键时刻稳得住。',
      '- shenyan（沈砚｜临时并场老生）：温和圆滑、七分真三分毒、暗藏自私条款；被质问时顺滑撇清，接到硬命令时会半真半假敷衍或勉强照办。',
      '',
      '【squadOrders 合法枚举（必须严格匹配）】',
      'follow（跟随玩家掩护）| goto_dispatch（去信号调度室）| goto_substation（去旧变电间）| goto_platform0（去0号站台）| goto_concourse（去检票大厅）| goto_corridor（去换乘长廊）| hold（原地警戒防守）| engage（主动牵制/攻击检票员）| regroup（向玩家收拢汇合）',
      '',
      '【对话与指令纪律】',
      '- 玩家点名某人做事（如“陆烬掩护我”“严辞去调度室”“全体跟我走”“许檀快撤”）时，必须给出对应 npcId 的 squadOrders，否则人物不会在 2.5D 地图里真正行动！',
      '- dialogues 返回 1~2 句，每句严格 10~55 个中文字符（要能放进 2.5D 角色头顶气泡里清晰阅读）。',
      '- 若玩家只是询问局势/试探沈砚/确认假播报，可让 squadOrders 为空数组 []，并基于真实 snapshot 数据作答。',
      '',
      '【严格 JSON Schema】',
      '{',
      '  "replyNpcId": "yanci|lujin|xutan|shenyan",',
      '  "dialogues": [',
      '    {"npcId": "yanci|lujin|xutan|shenyan", "line": "10-55字短促真实的加密短波语音", "trustDelta": -6到6, "cautionDelta": -6到6, "bondDelta": -3到5}',
      '  ],',
      '  "squadOrders": [',
      '    {"npcId": "yanci|lujin|xutan|shenyan", "order": "合法枚举值", "label": "简短中文指令标签"}',
      '  ],',
      '  "narration": "可选：不超过48字的无线电电流/环境细节，否则null",',
      '  "sparkNote": "可选：不超过28字的战术协同火花，否则null"',
      '}'
    ].join('\n');
  }

  function sanitizeLiveRadioResult(raw, fallbackUsed) {
    var allowedSet = {};
    for (var i = 0; i < STATION_ZERO_RADIO_NPCS.length; i++) {
      allowedSet[STATION_ZERO_RADIO_NPCS[i]] = true;
    }

    var dialogues = [];
    if (raw && Array.isArray(raw.dialogues)) {
      for (var d = 0; d < raw.dialogues.length && dialogues.length < 2; d++) {
        var entry = raw.dialogues[d];
        if (!entry || typeof entry !== 'object') continue;
        var nid = String(entry.npcId || '').trim();
        if (!allowedSet[nid]) continue;
        var line = String(entry.line || '').trim();
        if (!line) continue;
        dialogues.push({
          npcId: nid,
          line: line.slice(0, 96),
          trustDelta: clamp(entry.trustDelta, -8, 8, 0),
          cautionDelta: clamp(entry.cautionDelta, -8, 8, 0),
          bondDelta: clamp(entry.bondDelta, -4, 6, 0)
        });
      }
    }

    var squadOrders = [];
    var seenOrderNpc = {};
    if (raw && Array.isArray(raw.squadOrders)) {
      for (var o = 0; o < raw.squadOrders.length; o++) {
        var ord = raw.squadOrders[o];
        if (!ord || typeof ord !== 'object') continue;
        var onid = String(ord.npcId || '').trim();
        var ocode = String(ord.order || '').trim();
        if (!allowedSet[onid] || !LIVE_RADIO_ORDER_LABELS[ocode] || seenOrderNpc[onid]) continue;
        seenOrderNpc[onid] = true;
        squadOrders.push({
          npcId: onid,
          order: ocode,
          label: String(ord.label || LIVE_RADIO_ORDER_LABELS[ocode]).trim().slice(0, 20)
        });
      }
    }

    var replyNpcId = raw && typeof raw.replyNpcId === 'string' ? raw.replyNpcId.trim() : '';
    if (!allowedSet[replyNpcId]) {
      replyNpcId = (dialogues[0] && dialogues[0].npcId) || (squadOrders[0] && squadOrders[0].npcId) || 'yanci';
    }

    if (dialogues.length === 0) {
      dialogues.push({
        npcId: replyNpcId,
        line: '“短波收到，保持频道静默，按指令推进。”',
        trustDelta: 1,
        cautionDelta: 0,
        bondDelta: 0
      });
    }

    return {
      replyNpcId: replyNpcId,
      dialogues: dialogues,
      squadOrders: squadOrders,
      narration: raw && raw.narration ? String(raw.narration).trim().slice(0, 80) : null,
      sparkNote: raw && raw.sparkNote ? String(raw.sparkNote).trim().slice(0, 50) : null,
      fallbackUsed: Boolean(fallbackUsed)
    };
  }

  function detectOrderInClause(clause) {
    if (/调度室|信号室|信号调度|主控|控制台|道岔|Z-03/i.test(clause)) return 'goto_dispatch';
    if (/变电间|配电|闸刀|发电|逆极|B相|电源|Z-04/i.test(clause)) return 'goto_substation';
    if (/0号站台|零号站台|主站台|站台|月台|铁轨|撤离点|出站|登车|Z-06|Z-00/i.test(clause)) return 'goto_platform0';
    if (/检票大厅|检票厅|大厅|检票口|闸机|起点|Z-01/i.test(clause)) return 'goto_concourse';
    if (/换乘长廊|长廊|走廊|中段|十字|Z-02/i.test(clause)) return 'goto_corridor';
    if (/掩护我|跟我走|跟着我|过来帮|来我这|贴紧|跟紧|护卫|护送|掩护|跟我|随我/.test(clause)) return 'follow';
    if (/快撤|撤退|撤回|汇合|集合|靠拢|退回|聚拢|别硬撑|撤过来|回来/.test(clause)) return 'regroup';
    if (/攻击|击杀|打检票员|拖住|牵制|拦截|压制|吸引|开火|干掉|封印|顶住|迎击|缠住|上去打|帮我打/.test(clause)) return 'engage';
    if (/原地|守住|警戒|别动|待命|盯住|看好|停下|架枪|蹲守|隐蔽|躲好|别露头/.test(clause)) return 'hold';
    return null;
  }

  function detectTargetsInClause(clause) {
    var targets = [];
    if (/严辞|队长/.test(clause)) targets.push('yanci');
    if (/陆烬|老陆/.test(clause)) targets.push('lujin');
    if (/许檀|小许/.test(clause)) targets.push('xutan');
    if (/沈砚|老生|掮客/.test(clause)) targets.push('shenyan');
    if (/全体|全员|大家|所有人|全队|你们都|都跟我|一起/.test(clause)) {
      ['yanci', 'lujin', 'xutan'].forEach(function (id) {
        if (targets.indexOf(id) === -1) targets.push(id);
      });
    }
    return targets;
  }

  function buildOfflineOrderReply(npcId, order, snap) {
    var insp = (snap && snap.inspector) || {};
    var dist = isFinite(Number(insp.distToPlayer)) ? Math.round(Number(insp.distToPlayer)) : 24;
    var overridePct = Math.round(Number((snap && snap.overridePct) || 0));

    var map = {
      yanci: {
        goto_dispatch: { line: '“收到，我切去信号调度室核对道岔联锁。你盯住检票员动向。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        goto_substation: { line: '“我去旧变电间合闸，断电前两秒会敲麦提醒。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 },
        goto_platform0: { line: overridePct >= 100 ? '“道岔已反转，我向0号站台推进，别踩空黄线外缘。”' : '“轨控才改写到' + overridePct + '%，我先抵近0号站台边缘待命，别贸然越线。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 },
        goto_concourse: { line: '“明白，我折返检票大厅卡住退路与闸机视野。”', trustDelta: 2, cautionDelta: -1, bondDelta: 0 },
        goto_corridor: { line: '“我进换乘长廊控住十字通道，有回声立刻报点。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 },
        follow: { line: '“收到，我补你侧后方两步位，随时对表核验播报。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        regroup: { line: '“向你坐标收拢。三十秒内别开麦制造额外噪点。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        engage: { line: '“我卡侧面封它退路，但别指望硬换血，抓紧做正事。”', trustDelta: 2, cautionDelta: 0, bondDelta: 1 },
        hold: { line: '“原地架线警戒，有异常频段马上切短波。”', trustDelta: 2, cautionDelta: -1, bondDelta: 0 }
      },
      lujin: {
        follow: { line: dist <= 12 ? '“收到，它在' + dist + '米内，我贴你左翼顶住。”' : '“收到，我紧跟掩护，前面交给我探。”', trustDelta: 4, cautionDelta: -2, bondDelta: 2 },
        engage: { line: '“明白，我去正面拉住检票员仇恨。给你抢出空档，动作快。”', trustDelta: 4, cautionDelta: -2, bondDelta: 2 },
        goto_dispatch: { line: '“收到，我过去替调度室清场守门。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 },
        goto_substation: { line: '“我去变电间顶着，合闸响声大，引怪算我的。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        goto_platform0: { line: '“我先压去0号站台架枪清线，到了打手势。”', trustDelta: 3, cautionDelta: -1, bondDelta: 1 },
        goto_concourse: { line: '“回检票大厅卡点，收到。”', trustDelta: 2, cautionDelta: -1, bondDelta: 0 },
        goto_corridor: { line: '“换乘长廊归我钉死，它过不去。”', trustDelta: 3, cautionDelta: -1, bondDelta: 1 },
        regroup: { line: '“我断后收拢，别回头，直奔汇合点。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        hold: { line: '“收到，原地压低身位警戒，谁靠近谁挨枪。”', trustDelta: 2, cautionDelta: -1, bondDelta: 0 }
      },
      xutan: {
        goto_substation: { line: '“收到！旧变电间归我，B相逆极闸刀接通前我先测阻抗。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        goto_dispatch: { line: '“我去信号调度室接管终端，十秒内把频段读数同步给你。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        regroup: { line: '“收到，马上撤离当前死角，正往你坐标靠拢！”', trustDelta: 3, cautionDelta: -2, bondDelta: 2 },
        follow: { line: '“我跟紧你后侧，PKE探头开着，有43.2Hz异常立刻报。”', trustDelta: 3, cautionDelta: -2, bondDelta: 1 },
        goto_platform0: { line: '“正转向0号站台，我盯着铁轨共振读数。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 },
        goto_concourse: { line: '“明白，先退回检票大厅拉低声纹。”', trustDelta: 2, cautionDelta: -1, bondDelta: 0 },
        goto_corridor: { line: '“我去换乘长廊中继信号，顺手扫一遍盲区。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 },
        engage: { line: '“我用频段脉冲干扰它胸口对讲机，正面硬拼别指望我！”', trustDelta: 2, cautionDelta: 0, bondDelta: 1 },
        hold: { line: '“收到，原地静默架探头，呼吸压到最低了。”', trustDelta: 2, cautionDelta: -1, bondDelta: 0 }
      },
      shenyan: {
        follow: { line: '“行啊，跟着活命几率高点——不过走前面探路的事，可别算我头上。”', trustDelta: 0, cautionDelta: 1, bondDelta: 0 },
        goto_dispatch: { line: '“调度室啊……行，我顺路过去瞄一眼，真撞上检票员我可先撤。”', trustDelta: 1, cautionDelta: 2, bondDelta: 0 },
        goto_substation: { line: '“变电间动静那么大？行吧，我去外围帮你们望风。”', trustDelta: 0, cautionDelta: 2, bondDelta: 0 },
        goto_platform0: { line: '“早该去0号站台了嘛——我就说那儿离出路最近，马上到。”', trustDelta: 1, cautionDelta: 2, bondDelta: 0 },
        regroup: { line: '“别催，正往你们那头挪呢，我这块机械表可比你们走得准。”', trustDelta: 0, cautionDelta: 1, bondDelta: 0 },
        engage: { line: '“让我去正面缠检票员？小兄弟真会开玩笑——我最多在侧翼帮你扔个响动。”', trustDelta: -2, cautionDelta: 4, bondDelta: 0 },
        hold: { line: '“正合我意，这柱子后面视野挺好，我替大家盯着。”', trustDelta: 0, cautionDelta: 1, bondDelta: 0 },
        goto_concourse: { line: '“检票大厅灯光稳，我先退回去歇口气。”', trustDelta: 0, cautionDelta: 1, bondDelta: 0 },
        goto_corridor: { line: '“换乘长廊四通八达，我去转一圈看有没有漏掉的车票。”', trustDelta: 0, cautionDelta: 2, bondDelta: 0 }
      }
    };

    var byNpc = map[npcId] || map.yanci;
    return byNpc[order] || { line: '“收到，按' + (LIVE_RADIO_ORDER_LABELS[order] || '指令') + '执行。”', trustDelta: 2, cautionDelta: -1, bondDelta: 1 };
  }

  function offlineHandleLiveRadio(ctx) {
    var text = String((ctx && ctx.text) || '').trim();
    var snap = (ctx && ctx.snapshot) || {};
    var insp = snap.inspector || {};
    var inspDist = isFinite(Number(insp.distToPlayer)) ? Math.round(Number(insp.distToPlayer)) : 28;
    var inspZone = getZoneLabel(insp.zoneId);
    var overridePct = Math.round(Number(snap.overridePct || 0));
    var cluesCount = Number(snap.cluesFoundCount || 0);
    var cluesTotal = Number(snap.cluesTotal || 6);

    // Split multi-part commands like "陆烬掩护我，严辞去调度室"
    var rawClauses = text.split(/[，,。；;！!、\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (rawClauses.length === 0) rawClauses = [text];

    var squadOrders = [];
    var orderByNpc = {};
    var dialogues = [];
    var talkedNpc = {};
    var sparkNote = null;

    function addOrder(npcId, order) {
      if (!LIVE_RADIO_ORDER_LABELS[order]) return;
      if (orderByNpc[npcId]) return;
      orderByNpc[npcId] = order;
      squadOrders.push({
        npcId: npcId,
        order: order,
        label: LIVE_RADIO_ORDER_LABELS[order]
      });
    }

    function addDialogue(npcId, line, td, cd, bd) {
      if (talkedNpc[npcId] || dialogues.length >= 2) return;
      talkedNpc[npcId] = true;
      dialogues.push({
        npcId: npcId,
        line: line,
        trustDelta: td || 0,
        cautionDelta: cd || 0,
        bondDelta: bd || 0
      });
    }

    // 1. Parse tactical orders across clauses
    for (var i = 0; i < rawClauses.length; i++) {
      var clause = rawClauses[i];
      var order = detectOrderInClause(clause);
      var targets = detectTargetsInClause(clause);

      if (order) {
        if (targets.length === 0) {
          if (order === 'goto_dispatch') targets = ['yanci'];
          else if (order === 'goto_substation') targets = ['xutan'];
          else if (order === 'follow' || order === 'engage') targets = ['lujin'];
          else if (order === 'regroup' || order === 'goto_platform0' || order === 'hold') targets = ['yanci', 'lujin', 'xutan'];
          else targets = ['yanci'];
        }
        for (var t = 0; t < targets.length; t++) {
          addOrder(targets[t], order);
        }
      }
    }

    // Generate crisp replies for emitted orders
    if (squadOrders.length > 0) {
      var isAllSquad = squadOrders.length >= 3 && /全体|全员|大家|所有人|全队|一起/.test(text);
      if (isAllSquad) {
        var mainOrder = squadOrders[0].order;
        var leadNpc = (mainOrder === 'follow' || mainOrder === 'engage') ? 'lujin' : 'yanci';
        var secondNpc = leadNpc === 'lujin' ? 'yanci' : 'xutan';
        var r1 = buildOfflineOrderReply(leadNpc, mainOrder, snap);
        var r2 = buildOfflineOrderReply(secondNpc, mainOrder, snap);
        addDialogue(leadNpc, r1.line, r1.trustDelta, r1.cautionDelta, r1.bondDelta);
        addDialogue(secondNpc, r2.line, r2.trustDelta, r2.cautionDelta, r2.bondDelta);
        sparkNote = '加密短波一键同步全队战术位，压缩了站台盲区风险。';
      } else {
        for (var s = 0; s < squadOrders.length && dialogues.length < 2; s++) {
          var so = squadOrders[s];
          var rep = buildOfflineOrderReply(so.npcId, so.order, snap);
          addDialogue(so.npcId, rep.line, rep.trustDelta, rep.cautionDelta, rep.bondDelta);
        }
        if (squadOrders.length >= 2) {
          sparkNote = '双线语音分派到位，小队进入实时协同推进状态。';
        }
      }

      return sanitizeLiveRadioResult({
        replyNpcId: dialogues[0].npcId,
        dialogues: dialogues,
        squadOrders: squadOrders,
        narration: null,
        sparkNote: sparkNote
      }, true);
    }

    // 2. Interrogate / call out Shen Yan
    if (/沈砚|老生/.test(text)) {
      var suspicious = /干嘛|干什么|在哪|撒谎|骗|假票|伪造|背刺|动机|隐瞒|秒表|扣罚|条款/.test(text);
      var shenZone = '回廊阴影里';
      if (Array.isArray(snap.squad)) {
        for (var k = 0; k < snap.squad.length; k++) {
          if (snap.squad[k].id === 'shenyan') shenZone = snap.squad[k].zoneName || shenZone;
        }
      }
      addDialogue(
        'shenyan',
        suspicious
          ? '“哟，疑心这么重？我就在' + shenZone + '替你们盯梢呢——真要算账，不如先活着走出0号站台？”'
          : '“我在' + shenZone + '听着呢。别把动静闹太大，检票员最喜欢挑爱喊话的新人下手。”',
        suspicious ? -2 : 0,
        suspicious ? 5 : 1,
        0
      );
      if (suspicious) {
        addDialogue('yanci', '“别跟他耗嘴皮，我记着他进场时间的误差。盯紧自己的表。”', 2, -1, 1);
      }
      return sanitizeLiveRadioResult({
        replyNpcId: 'shenyan',
        dialogues: dialogues,
        squadOrders: [],
        sparkNote: suspicious ? '在短波里正面敲打沈砚，迫使其收起一部分小动作。' : null
      }, true);
    }

    // 3. Fake broadcast / wristwatch check
    if (/广播|播报|真假|腕表|秒针|时间|喇叭|声音/.test(text)) {
      addDialogue(
        'yanci',
        '“别信站台喇叭，那是43.2Hz副载波伪造的。只认腕表物理秒针，未反转道岔前绝不越黄线。”',
        3, -2, 1
      );
      return sanitizeLiveRadioResult({
        replyNpcId: 'yanci',
        dialogues: dialogues,
        squadOrders: [],
        sparkNote: '短波校准腕表时间基准，彻底免疫假播报诱导。'
      }, true);
    }

    // 4. Situation / Inspector / Objective / Clues report using LIVE 2.5D snapshot!
    if (/检票员|怪物|在哪|位置|距离|状态|情况|进度|怎么赢|办法|线索|报告|汇报|报点/.test(text)) {
      var mutNote = insp.mutated ? '（已进入二阶段变异，警惕瞬移奇袭！）' : '';
      var wpNote = insp.weakpointExposed ? '【核心弱点暴露中！快集火！】' : '';
      var inspLine = insp.hp <= 0 || insp.sealedPct >= 100
        ? '“检票员已经失能，直接推进目标或者去0号站台撤离！”'
        : (insp.intelKnown === false
          ? '“检票员当前在盲区，未捕获确切位置——先开声纹侦察。轨控改写 ' + overridePct + '%，线索 ' + cluesCount + '/' + cluesTotal + '。”'
          : '“检票员在' + inspZone + '，距你约' + inspDist + '米' + mutNote + wpNote + '（' + (insp.state === 'HUNT' || insp.state === 'chase' ? '正在追猎！' : '巡逻警戒中') + '）。轨控改写 ' + overridePct + '%，线索 ' + cluesCount + '/' + cluesTotal + '。”');
      addDialogue('xutan', inspLine, 2, -1, 1);
      if (overridePct < 100) {
        addDialogue('yanci', insp.mutated
          ? '“它变异后会按威胁值循环发动瞬移与压制波，每次大招收尾或弹反后胸口核心会暴露弱点，抓住窗口集火！”'
          : '“调度室与变电间双端改写满100%即可在0号站台撤离；或者集中火力击杀/封印检票员。”', 2, -1, 0);
      }
      return sanitizeLiveRadioResult({
        replyNpcId: 'xutan',
        dialogues: dialogues,
        squadOrders: [],
        sparkNote: null
      }, true);
    }

    // 5. Named NPC general ping
    var named = detectTargetsInClause(text);
    if (named.length > 0) {
      var targetId = named[0];
      var genericByNpc = {
        yanci: '“短波在线。需要我切去调度室、变电间，还是贴身协同，直接报点。”',
        lujin: inspDist <= 12 ? '“在听，它离你只有' + inspDist + '米。喊一声我立刻顶上去。”' : '“在听。需要掩护还是拉怪，直接下令。”',
        xutan: '“频道延迟九毫秒，读数正常。当前轨控改写 ' + overridePct + '%，你定下一步。”',
        shenyan: '“听得清清楚楚。你们年轻人节奏真快，有需要搭手的地方提前吱声。”'
      };
      addDialogue(targetId, genericByNpc[targetId] || genericByNpc.yanci, 1, -1, 0);
      return sanitizeLiveRadioResult({
        replyNpcId: targetId,
        dialogues: dialogues,
        squadOrders: []
      }, true);
    }

    // 6. Default tactical response based on immediate danger
    if (inspDist <= 11 && insp.hp > 0 && insp.sealedPct < 100) {
      addDialogue('lujin', '“别废话，检票员距你不到' + inspDist + '米！喊‘掩护我’或‘拖住它’，我立刻切过来。”', 1, 0, 1);
      return sanitizeLiveRadioResult({ replyNpcId: 'lujin', dialogues: dialogues, squadOrders: [] }, true);
    }

    addDialogue(
      'yanci',
      overridePct >= 100
        ? '“收到。轨控已经改写完成，全员向0号站台靠拢即可脱出，说一声‘全员去站台’。”'
        : '“收到。目前轨控 ' + overridePct + '%，可直接用短波指派我们去调度室、变电间或掩护你。”',
      1, -1, 0
    );
    return sanitizeLiveRadioResult({ replyNpcId: 'yanci', dialogues: dialogues, squadOrders: [] }, true);
  }

  async function handleLiveRadio(ctx) {
    var text = String((ctx && ctx.text) || '').trim();
    if (!text) {
      return sanitizeLiveRadioResult({
        replyNpcId: 'yanci',
        dialogues: [{ npcId: 'yanci', line: '“空载波？频道通着，有指令直说。”', trustDelta: 0, cautionDelta: 0, bondDelta: 0 }],
        squadOrders: []
      }, true);
    }

    var cfg = getConfig();
    if (!canUseLiveAI(cfg)) {
      return offlineHandleLiveRadio(ctx);
    }

    var snap = (ctx && ctx.snapshot) || {};
    var player = (ctx && ctx.player) || {};
    var rels = (ctx && ctx.relationships) || {};
    var relSummary = {};
    for (var i = 0; i < STATION_ZERO_RADIO_NPCS.length; i++) {
      var id = STATION_ZERO_RADIO_NPCS[i];
      var r = rels[id] || {};
      relSummary[id] = {
        trust: r.trust != null ? r.trust : 35,
        caution: r.caution != null ? r.caution : 50,
        bond: r.bond != null ? r.bond : 15
      };
    }

    var userPayload = {
      playerRadioText: text,
      player: {
        name: player.name || '受试者',
        hp: snap.hp != null ? Math.round(snap.hp) : player.hp,
        maxHp: snap.maxHp || player.maxHp || 100,
        energy: snap.energy != null ? Math.round(snap.energy) : player.energy,
        zoneId: snap.zoneId || 'concourse',
        zoneName: snap.zoneName || getZoneLabel(snap.zoneId)
      },
      liveWorld: {
        timeRemainingSec: snap.timeRemainingSec,
        trainCountdownSec: snap.trainCountdownSec,
        trainInStation: Boolean(snap.trainInStation),
        overridePct: Math.round(Number(snap.overridePct || 0)),
        cluesFoundCount: snap.cluesFoundCount || 0,
        cluesTotal: snap.cluesTotal || 6,
        soundLevel: Math.round(Number(snap.soundLevel || 0)),
        threatLevel: Math.round(Number(snap.threatLevel || 0)),
        inspector: snap.inspector || null,
        squad: Array.isArray(snap.squad) ? snap.squad.map(function (m) {
          return {
            id: m.id,
            name: m.name,
            zoneId: m.zoneId,
            zoneName: m.zoneName,
            hp: Math.round(Number(m.hp || 0)),
            maxHp: Math.round(Number(m.maxHp || 100)),
            order: m.order,
            alive: m.alive !== false
          };
        }) : []
      },
      relationships: relSummary,
      recentRadio: Array.isArray(ctx && ctx.recentRadio) ? ctx.recentRadio.slice(-5) : []
    };

    try {
      var res = await callChatCompletion(
        cfg,
        [
          { role: 'system', content: buildLiveRadioSystemPrompt() },
          { role: 'user', content: JSON.stringify(userPayload) }
        ],
        { expectJson: true, temperature: 0.65, maxTokens: 520, timeoutMs: 14000 }
      );
      var parsed = extractJsonObject(res.content);
      if (!parsed || (!Array.isArray(parsed.dialogues) && !Array.isArray(parsed.squadOrders))) {
        return offlineHandleLiveRadio(ctx);
      }
      var sanitized = sanitizeLiveRadioResult(parsed, false);
      // Safety net: if player gave an unmistakable tactical movement order and LLM forgot squadOrders, merge parsed orders
      if (sanitized.squadOrders.length === 0) {
        var offlineCheck = offlineHandleLiveRadio(ctx);
        if (offlineCheck.squadOrders && offlineCheck.squadOrders.length > 0) {
          sanitized.squadOrders = offlineCheck.squadOrders;
        }
      }
      return sanitized;
    } catch (_) {
      return offlineHandleLiveRadio(ctx);
    }
  }

  /* --------------------------------------------------------------------------
   * Inspector Boss Phase-2 Mutation, Threat-Driven Skill Cycle & Weakpoint Director
   * -------------------------------------------------------------------------- */
  var INSPECTOR_MUTATION_CONFIG = {
    hpThreshold: 0.55,
    highThreatThreshold: 85,
    highThreatHpThreshold: 0.72,
    threatTiers: {
      lowMax: 34,
      highMax: 69
    },
    cycles: {
      phase1: {
        low: ['lunge', 'cleave', 'gaze'],
        high: ['lunge', 'cleave', 'slam', 'gaze'],
        critical: ['slam', 'lunge', 'cleave', 'gaze']
      },
      phase2: {
        low: ['lunge', 'blink_ambush', 'cleave', 'gaze'],
        high: ['blink_ambush', 'cleave', 'slam', 'lunge', 'gaze'],
        critical: ['blink_ambush', 'slam', 'lunge', 'cleave', 'blink_ambush', 'gaze']
      }
    },
    weakpoint: {
      baseDamageMult: 1.75,
      critOrFlankMult: 2.0,
      bonusSealPct: 5,
      energyRefund: 10,
      windows: {
        blink_overheat: { duration: 3.2, callout: '✦ 瞬移过载 · 核心弱点暴露!' },
        slam_recovery: { duration: 3.4, callout: '✦ 压制波泄能 · 核心弱点暴露!' },
        gaze_evaded: { duration: 2.8, callout: '✦ 探灯反冲 · 核心弱点暴露!' },
        wall_crash: { duration: 3.6, callout: '✦ 撞墙失衡 · 核心弱点暴露!' },
        parry_shatter: { duration: 4.5, callout: '✦ 弹反碎核 · 弱点全开!' },
        emp_shatter: { duration: 4.5, callout: '✦ EMP过载 · 弱点全开!' },
        seal_shatter: { duration: 4.0, callout: '✦ 封印撕裂 · 核心暴露!' }
      }
    }
  };

  function getThreatTier(threatLevel) {
    var t = Number(threatLevel);
    if (!isFinite(t)) t = 0;
    if (t >= INSPECTOR_MUTATION_CONFIG.threatTiers.highMax + 1) return 'critical';
    if (t >= INSPECTOR_MUTATION_CONFIG.threatTiers.lowMax + 1) return 'high';
    return 'low';
  }

  function evaluateInspectorMutation(state) {
    var st = state || {};
    var maxHp = Math.max(1, Number(st.maxHp) || 520);
    var hp = Math.max(0, Number(st.hp != null ? st.hp : maxHp));
    var hpRatio = hp / maxHp;
    var threat = Number(st.threatLevel) || 0;
    var threatTier = getThreatTier(threat);
    var alreadyMutated = Boolean(st.alreadyMutated || Number(st.currentPhase) >= 2);

    var shouldMutate = alreadyMutated ||
      (hpRatio <= INSPECTOR_MUTATION_CONFIG.hpThreshold) ||
      (threat >= INSPECTOR_MUTATION_CONFIG.highThreatThreshold && hpRatio <= INSPECTOR_MUTATION_CONFIG.highThreatHpThreshold);

    var justMutated = !alreadyMutated && shouldMutate;
    var mutationTier = !shouldMutate
      ? 'dormant'
      : (threatTier === 'critical' ? 'overdrive' : 'mutated');

    var speedMult = !shouldMutate
      ? (threatTier === 'critical' ? 1.12 : (threatTier === 'high' ? 1.05 : 1.0))
      : (threatTier === 'critical' ? 1.36 : (threatTier === 'high' ? 1.28 : 1.22));
    var damageMult = !shouldMutate
      ? (threatTier === 'critical' ? 1.12 : 1.0)
      : (threatTier === 'critical' ? 1.34 : (threatTier === 'high' ? 1.25 : 1.18));
    var cooldownMult = !shouldMutate
      ? (threatTier === 'critical' ? 0.88 : 1.0)
      : (threatTier === 'critical' ? 0.64 : (threatTier === 'high' ? 0.74 : 0.82));
    var blinkCooldownSec = threatTier === 'critical' ? 4.2 : (threatTier === 'high' ? 5.8 : 7.2);

    var radioAlert = null;
    if (justMutated) {
      radioAlert = threat >= INSPECTOR_MUTATION_CONFIG.highThreatThreshold && hpRatio > INSPECTOR_MUTATION_CONFIG.hpThreshold
        ? '【高危异变 · 提前变异】站台威胁度突破临界阈值，零号检票员强行撕裂外壳进入二阶段变异！警惕高频瞬移奇袭，盯紧其大招收尾暴露的胸口发射核！'
        : '【死考警戒 · 二阶段变异】零号检票员胸口43.2Hz发信核畸变过载！已解锁威胁度联动技能循环与「空间瞬移奇袭」——每次大招泄能或弹反后会暴露弱点核心，务必抓住窗口集火！';
    }

    return {
      phase: shouldMutate ? 2 : 1,
      mutated: shouldMutate,
      justMutated: justMutated,
      mutationTier: mutationTier,
      threatTier: threatTier,
      speedMult: speedMult,
      damageMult: damageMult,
      cooldownMult: cooldownMult,
      blinkCooldownSec: blinkCooldownSec,
      radioAlert: radioAlert
    };
  }

  function isSkillValidForContext(skill, dist, hasLos, cds, mutated) {
    var cd = Number(cds && cds[skill]) || 0;
    if (cd > 0) return false;
    if (!hasLos && skill !== 'blink_ambush') return false;
    if (skill === 'blink_ambush') {
      return mutated && dist >= 4.2 && dist <= 22.0;
    }
    if (skill === 'slam') {
      return dist <= 7.2;
    }
    if (skill === 'lunge') {
      return dist <= 5.8;
    }
    if (skill === 'cleave') {
      return dist <= 3.6;
    }
    if (skill === 'gaze') {
      return dist >= 4.8 && dist <= 17.5;
    }
    return false;
  }

  function selectInspectorSkillCycle(ctx) {
    var c = ctx || {};
    var threat = Number(c.threatLevel) || 0;
    var threatTier = getThreatTier(threat);
    var mutated = Boolean(c.mutated || Number(c.phase) >= 2);
    var dist = Number(c.distToTarget);
    if (!isFinite(dist)) dist = 99;
    var hasLos = Boolean(c.hasLos);
    var cds = c.cooldowns || {};
    var cycleIdx = Math.max(0, Math.floor(Number(c.cycleIndex) || 0));

    if (c.isStunned) {
      return {
        skill: 'stunned',
        nextCycleIndex: cycleIdx,
        threatTier: threatTier,
        exposeWeakpointAfter: false,
        weakpointReason: null,
        weakpointWindowSec: 0,
        telegraphSec: 0,
        callout: null
      };
    }

    var phaseKey = mutated ? 'phase2' : 'phase1';
    var rotation = INSPECTOR_MUTATION_CONFIG.cycles[phaseKey][threatTier] || INSPECTOR_MUTATION_CONFIG.cycles.phase1.low;
    var chosen = null;
    var nextIdx = cycleIdx;

    // Try up to rotation.length entries starting from cycleIdx to respect the deterministic threat cycle
    for (var step = 0; step < rotation.length; step++) {
      var idx = (cycleIdx + step) % rotation.length;
      var candidate = rotation[idx];
      if (isSkillValidForContext(candidate, dist, hasLos, cds, mutated)) {
        chosen = candidate;
        nextIdx = (idx + 1) % rotation.length;
        break;
      }
    }

    if (!chosen) {
      return {
        skill: 'pursue',
        nextCycleIndex: cycleIdx,
        threatTier: threatTier,
        exposeWeakpointAfter: false,
        weakpointReason: null,
        weakpointWindowSec: 0,
        telegraphSec: 0,
        callout: null
      };
    }

    var telegraphMap = {
      blink_ambush: threatTier === 'critical' ? 0.38 : 0.48,
      slam: mutated ? 0.92 : 1.05,
      lunge: mutated ? (threatTier === 'critical' ? 0.62 : 0.68) : 0.85,
      cleave: mutated ? 0.48 : 0.55,
      gaze: mutated ? 1.10 : 1.25
    };
    var calloutMap = {
      blink_ambush: threatTier === 'critical' ? '空间折跃奇袭!' : '瞬移截击!',
      slam: '轨道压制波! 快撤出红圈',
      lunge: '处决突刺! (可弹反/破甲)',
      cleave: '铁剪横扫!',
      gaze: '查票凝视! 找掩体/潜行'
    };

    var exposeAfter = mutated && (chosen === 'blink_ambush' || chosen === 'slam');
    var wpReason = chosen === 'blink_ambush' ? 'blink_overheat' : (chosen === 'slam' ? 'slam_recovery' : null);
    var wpCfg = wpReason ? INSPECTOR_MUTATION_CONFIG.weakpoint.windows[wpReason] : null;

    return {
      skill: chosen,
      nextCycleIndex: nextIdx,
      threatTier: threatTier,
      exposeWeakpointAfter: exposeAfter,
      weakpointReason: wpReason,
      weakpointWindowSec: wpCfg ? wpCfg.duration : 0,
      telegraphSec: telegraphMap[chosen] || 0.7,
      callout: calloutMap[chosen] || null
    };
  }

  function computeWeakpointTrigger(eventType, state) {
    var st = state || {};
    var win = INSPECTOR_MUTATION_CONFIG.weakpoint.windows[eventType] || null;
    if (!win) return null;
    // In critical threat overdrive, weakpoint windows are slightly tighter (-12%) for higher skill ceiling
    var threatTier = getThreatTier(st.threatLevel);
    var dur = threatTier === 'critical' ? Number((win.duration * 0.88).toFixed(2)) : win.duration;
    return {
      reason: eventType,
      duration: dur,
      callout: win.callout
    };
  }

  function evaluateWeakpointExposure(ctx) {
    var c = ctx || {};
    var rem = Math.max(0, Number(c.weakpointTimer) || 0);
    var baseDmg = Math.max(1, Number(c.baseDamage) || 1);
    if (rem <= 0) {
      return {
        exposed: false,
        remainingSec: 0,
        damageMult: 1.0,
        finalDamage: Math.round(baseDmg),
        bonusSealPct: 0,
        energyRefund: 0,
        callout: null
      };
    }
    var wp = INSPECTOR_MUTATION_CONFIG.weakpoint;
    var mult = (c.isCrit || c.isFlank) ? wp.critOrFlankMult : wp.baseDamageMult;
    var finalDmg = Math.max(1, Math.round(baseDmg * mult));
    return {
      exposed: true,
      remainingSec: Number(rem.toFixed(2)),
      damageMult: mult,
      finalDamage: finalDmg,
      bonusSealPct: wp.bonusSealPct,
      energyRefund: wp.energyRefund,
      callout: '✦ 弱点贯通 -' + finalDmg
    };
  }

  function createInspectorDirector() {
    var cycleIndex = 0;
    var mutated = false;
    return {
      evaluateMutation: function (state) {
        var res = evaluateInspectorMutation(Object.assign({}, state || {}, { alreadyMutated: mutated }));
        if (res.mutated) mutated = true;
        return res;
      },
      selectSkill: function (ctx) {
        var res = selectInspectorSkillCycle(Object.assign({}, ctx || {}, {
          mutated: mutated || Boolean(ctx && ctx.mutated),
          cycleIndex: cycleIndex
        }));
        cycleIndex = res.nextCycleIndex;
        return res;
      },
      triggerWeakpoint: computeWeakpointTrigger,
      evaluateWeakpoint: evaluateWeakpointExposure,
      getState: function () {
        return { mutated: mutated, cycleIndex: cycleIndex };
      },
      reset: function () {
        cycleIndex = 0;
        mutated = false;
      }
    };
  }

  /* --------------------------------------------------------------------------
   * Attach Public API to window.INFINITY.AI
   * -------------------------------------------------------------------------- */
  INFINITY.AI = {
    STORAGE_KEY: STORAGE_KEY,
    PRESETS: PRESETS,
    INSPECTOR_MUTATION_CONFIG: INSPECTOR_MUTATION_CONFIG,
    getConfig: getConfig,
    saveConfig: saveConfig,
    testConnection: testConnection,
    adjudicateExamAction: adjudicateExamAction,
    generateHallInteraction: generateHallInteraction,
    adjudicateCrisis: adjudicateCrisis,
    handleLiveRadio: handleLiveRadio,
    getThreatTier: getThreatTier,
    evaluateInspectorMutation: evaluateInspectorMutation,
    selectInspectorSkillCycle: selectInspectorSkillCycle,
    computeWeakpointTrigger: computeWeakpointTrigger,
    evaluateWeakpointExposure: evaluateWeakpointExposure,
    createInspectorDirector: createInspectorDirector
  };
})(typeof window !== 'undefined' ? window : globalThis);
