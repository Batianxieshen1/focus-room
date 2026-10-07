# Meting 云函数部署指南（约 2 分钟）

内置音乐播放器需要一个 Meting 兼容 API 作为数据源。本项目自带零依赖云函数（`cloudbase/functions/meting/`），推荐部署到腾讯云开发（CloudBase）免费环境——部署后国内访问稳定，且函数只返回元数据（音频由浏览器直连网易云 CDN），流量成本可忽略。

## 步骤

1. **开通云开发环境**
   - 打开 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)，按提示开通（有免费额度，个人使用足够）。
   - 记下环境 ID（形如 `my-env-8g0abc123`）。

2. **创建云函数**
   - 控制台左侧 → 「云函数」→ 「新建云函数」。
   - 函数名填 `meting`，运行时选 **Nodejs 16.13 或 18.15**，创建方式选「空白函数」。
   - 打开函数在线编辑器，用 `cloudbase/functions/meting/index.js` 的内容**完整替换** `index.js`（依赖为空，无需安装任何包）。
   - 保存并安装依赖（会秒过，因为没有依赖），等待部署完成。

3. **开启 HTTP 访问服务**
   - 控制台左侧 → 「云函数」→ 「HTTP 访问服务」，开启。
   - 你的 API 地址即为：
     ```
     https://<环境ID>.service.tcloudbase.com/meting
     ```

4. **验证**
   - 浏览器访问 `https://<环境ID>.service.tcloudbase.com/meting?type=playlist&id=459034281`
   - 看到一段 JSON 数组（含 name/artist/url/pic 字段）即成功。

5. **填入 Focus Room**
   - 打开 Focus Room → 底栏「设置」→ 「Meting API 地址（内置播放器）」粘贴上面的地址 → 保存。
   - 混音面板 → 网易云 tab → 播放方式选「内置播放器」→ 点任意歌单即可播放。

## 合规说明

- 函数代码可自由使用（随项目分发）。
- 通过 Meting 协议播放平台音源属于行业灰色惯例，适合个人项目与作品集展示；**若产品正式收费商用，请使用应用内的「官方外链」模式或只使用免版权音源**。
- VIP 歌曲接口返回空 url，播放器会自动跳过并提示，这是预期行为。
