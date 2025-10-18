# Basketball Hub

Vue 3 + Vite application for the FIT5032 assignment. The project now satisfies **Business Requirement D & E** with external authentication, transactional email, Cloud Functions, interactive maps, accessibility upgrades, and export tooling.

## Feature Highlights

- **External Authentication (BR D.1)** – Firebase Auth with email/password and Google sign-in, role-aware routing, and profile persistence in Firestore.
- **Email with Attachments (BR D.2)** – SendGrid-powered Firebase Cloud Function (`/api/send-email`) surfaced through the admin email centre with optional attachments.
- **Interactive Tables (BR D.3)** – Reusable `InteractiveTable` component offering column filters, sorting, global search, and 10-row pagination. Used in the admin courts list and the new Data Explorer view that exposes two rich datasets.
- **Cloud Deployment Ready (BR D.4)** – Firebase Hosting + Functions configuration (`firebase.json`, `.firebaserc`) and helper script to publish a public build.
- **Program Applications (BR E.1)** – Cloud Functions `submitProgramApplication` & `moderateProgramApplication` persist user submissions server-side and allow admins to approve or reject requests.
- **Map & Routing (BR E.2)** – Court Finder integrates Google Maps, Places Autocomplete, and live routing from a chosen origin to any court marker.
- **Accessibility (BR E.3)** – Skip link, keyboard focus management, aria-live feedback, and an optional “Read this page” text-to-speech toggle driven by the Web Speech API.
- **Data Export (BR E.4)** – Data Explorer tables include CSV export buttons so data can be downloaded for reporting.

## Getting Started

```sh
npm install
npm install --prefix functions   # install Cloud Function dependencies
```

### Development

```sh
npm run dev    # Vue dev server at http://localhost:5173
```

缺省会呼叫部署好的 Cloud Function：`https://us-central1-basketballhub-5b97d.cloudfunctions.net/sendEmail`。  
若要改成其它环境（例如自订域名或 Emulator），设置 `VITE_EMAIL_API_URL` 即可。

若要启用地图功能，请在 `.env` 中提供 Google Maps API key：

```
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### Production Build

```sh
npm run build
```

## Email Cloud Function (SendGrid)

1. Create a SendGrid API key with “Mail Send” permissions.
2. Store the secrets in Firebase:

   ```sh
   firebase functions:secrets:set SENDGRID_API_KEY
   firebase functions:secrets:set EMAIL_SENDER_DEFAULT
   ```

3. Deploy (see below). After部署，访问 **Admin → Emails** 标签即可通过 Cloud Function 发送邮件（支持附件，最大约 10 MB/封）。

## Interactive Data Explorer

- Navigate to **Data Explorer** (新导航链接)。
- 两个交互式表格提供过滤、排序与 10 行分页，分别呈现 Programs 与 Courts 数据。

## Deploying to Firebase (Hosting + Functions)

1. 安装 Firebase CLI (`npm install -g firebase-tools`) 并登录 (`firebase login`)。
2. 更新 `.firebaserc` 内的 `projectId`。
3. 运行：

   ```sh
   npm run deploy:firebase
   ```

   该脚本会执行生产构建、确保函数依赖已安装，然后通过 `firebase deploy --only hosting,functions` 同步发布站点与 Cloud Function。

通过其它云主机（Cloudflare Pages、Vercel 等）部署静态前端时，仍可 `npm run build` 获取 `dist/`，但需另外提供 `/api/send-email` 的后端端点。

## Firestore Seed Script

若要把示例课程与球场资料写入 Firestore：

1. 在 Firebase Console 建立一个服务账号 JSON，下载后保存到本机（勿提交版本库）。
2. 设定环境变量：

   ```sh
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
   ```

3. 执行：

   ```sh
   npm install --prefix functions   # 首次使用时
   npm run seed:firestore
   ```

脚本会将示例数据写入 `programs` 与 `courts` 集合（如已有同名文件，会以合并方式更新）。完成后即可在前台页面读取到云端资料。

## Additional Cloud Functions

- `submitProgramApplication`（Callable）– 学员提交报名时触发，验证输入后写入 `programApplications` 集合并标记为 `pending`。
- `moderateProgramApplication`（Callable）– 管理员审批或拒绝报名，自动校验管理员角色并更新申请状态（`approved` / `rejected`）。

前端通过 `/src/services/applications.js` 调用这些函数，管理员可在 Dashboard → Applications 标签中查看与处理所有报名请求。

## Map & Accessibility Notes

- Court Finder 页面加载 Google Maps 后，可使用左侧搜索框定位任意起点，然后点击“View on map”或“Show directions”生成驾车路线。
- 页面顶部提供 *Skip to main content* 快捷键与 “Read this page” 朗读按钮，可配合键盘/触控板完成全站导航。若浏览器不支持 Web Speech API，则朗读按钮会自动隐藏。

## Data Export

Data Explorer 中的 Programs 与 Courts 卡片支持 Export CSV，会导出当前数据表的所有行，方便进行课堂统计或备份。

## Melbourne Courts Dataset

- `npm run fetch:courts` – 使用 Google Places Text Search API 抓取墨尔本附近篮球场（需先设置 `GOOGLE_MAPS_API_KEY` 环境变量）。结果会写入 `data/melbourne-courts.json`。
- `npm run import:courts` – 读取上述 JSON 并透过 Firebase Admin SDK 写入 Firestore 的 `courts` 集合。执行前请设置 `GOOGLE_APPLICATION_CREDENTIALS` 指向服务帐号 JSON。
