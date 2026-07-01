# Playwright Hybrid Framework — Setup Guide

Hướng dẫn từng bước xây dựng framework từ đầu. Copy prompt theo từng bước và dán vào Claude Code để tái tạo project tương tự.

---

## Bước 1 — Khởi tạo project Playwright

```bash
npm init -y
npm install --save-dev @playwright/test @types/node
npx playwright install --with-deps
```

Sau khi cài xong, Playwright tự tạo `playwright.config.ts` và thư mục `tests/`.

---

## Bước 2 — Tạo CLAUDE.md ban đầu

Dùng lệnh `/init` trong Claude Code để tạo `CLAUDE.md` tự động từ codebase hiện tại.

> CLAUDE.md là file hướng dẫn cho Claude Code đọc mỗi khi mở session mới. Tạo ngay từ đầu, cập nhật liên tục sau mỗi thay đổi lớn.

---

## Bước 3 — Tạo kiến trúc framework (5 layers)

**Prompt dùng:**
```
Tôi muốn build framework Playwright theo kiến trúc 5 layer sau:

Tests → Fixtures → PageManager → PageObjects → BasePage

Hãy tạo toàn bộ cấu trúc thư mục và example class cho từng layer:
- base/BasePage.ts           — abstract base class, mọi Page Object extend từ đây
- page-objects/              — concrete Page Object classes, mỗi page 1 file
- page-manager/PageManager.ts — single entry point tới tất cả page objects
- fixtures/index.ts          — custom Playwright fixture inject PageManager vào tests
- tests/                     — test specs

Tạo example 2 page objects (NavigationPage, FormLayoutsPage, DatepickerPage),
PageManager quản lý chúng, và 2 test files dùng fixture.

Áp dụng best practice: method đặt tên theo business action, tests không instantiate
Page Object trực tiếp, fixture re-export expect để tests có 1 import duy nhất.
```

**Cấu trúc kết quả:**
```
base/
  BasePage.ts
page-objects/
  NavigationPage.ts
  FormLayoutsPage.ts
  DatepickerPage.ts
fixtures/
  index.ts            ← DI layer: mỗi Page Object là 1 Playwright fixture
helpers/              ← trống, dành cho utils sau này
tests/
  usePageObjects.spec.ts
  testSuite1.spec.ts
```

> **Lưu ý:** PageManager từng là một layer riêng (orchestrator giữ tất cả page objects). Đã loại bỏ vì Playwright fixtures đã là DI container — PageManager là layer thừa. Fixture giờ đăng ký từng Page Object trực tiếp, test khai báo chỉ những gì cần.

**Lý do chọn cấu trúc này:**

| Layer | Lý do tách riêng |
|---|---|
| `base/` | BasePage là foundation, không phải concrete page — đặt riêng tránh nhầm |
| `page-objects/` | Chỉ chứa concrete pages, rõ ràng hơn tên `pages/` |
| `fixtures/` | DI layer — đăng ký Page Objects + ApiManager, inject lazy vào tests |
| `helpers/` | Reserved cho date utils, random data, string utils... |

---

## Bước 4 — TypeScript config

**Prompt dùng:**
```
Tạo tsconfig.json cho project Playwright này với:
- strict mode
- ES2020 target
- path aliases cho tất cả layers để tránh relative imports dài

Path aliases cần:
- @fixtures  → fixtures/index.ts
- @base/*    → base/*
- @page-objects/* → page-objects/*
- @page-manager/* → page-manager/*
- @helpers/* → helpers/*

Sau khi tạo tsconfig.json, cập nhật tất cả imports hiện tại sang dùng aliases.
```

**Kết quả `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@base/*": ["base/*"],
      "@page-objects/*": ["page-objects/*"],
      "@page-manager/*": ["page-manager/*"],
      "@fixtures": ["fixtures/index"],
      "@helpers/*": ["helpers/*"]
    }
  },
  "include": ["base/**/*.ts", "page-objects/**/*.ts", "page-manager/**/*.ts", "fixtures/**/*.ts", "helpers/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Import trước vs sau:**
```typescript
// Trước
import { test, expect } from '../fixtures';
import { BasePage } from '../base/BasePage';

// Sau
import { test, expect } from '@fixtures';
import { BasePage } from '@base/BasePage';
```

---

---

## Bước 5 — Environment config

**Cài dotenv:**
```bash
npm install --save-dev dotenv
```

**Prompt dùng:**
```
Setup environment config cho Playwright project:
- Cài dotenv
- Tạo .env với BASE_URL, USER_EMAIL, USER_PASSWORD
- Tạo .env.example (template không có giá trị thật, commit file này)
- Thêm .env vào .gitignore
- Bật dotenv trong playwright.config.ts và kết nối baseURL
- Cập nhật tất cả test files: thay hardcode URL bằng page.goto('/')
```

**Kết quả:**

`.env` (không commit):
```
BASE_URL=https://your-app-url.com
USER_EMAIL=test@example.com
USER_PASSWORD=password123
```

`.env.example` (commit file này để team biết cần set biến gì):
```
BASE_URL=
USER_EMAIL=
USER_PASSWORD=
```

`playwright.config.ts` — thêm vào đầu file:
```typescript
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

// trong use:
baseURL: process.env.BASE_URL,
```

Tests dùng `page.goto('/')` thay vì hardcode URL — Playwright tự ghép với `baseURL`.

**Tại sao cần:**
- Không hardcode URL/credentials trong code
- Dễ switch giữa local/staging/prod chỉ bằng đổi `.env`
- Team không thấy credentials thật trong git history

---

---

## Bước 6 — Test data layer

**Cài faker:**
```bash
npm install --save-dev @faker-js/faker
```

**Prompt dùng:**
```
Setup test data layer cho Playwright framework:
- Cài @faker-js/faker
- Tạo folder test-data/
- Tạo UserData.ts: interface UserData + hàm generateUser() dùng faker
- Tạo DateData.ts: interface DateData + hàm generateFutureDate()
- Thêm path alias @test-data/* vào tsconfig.json
- Cập nhật tests hiện tại để dùng data từ factory thay vì hardcode
```

**Cấu trúc `test-data/`:**
```
test-data/
  UserData.ts     ← interface UserData + generateUser()
  DateData.ts     ← interface DateData + generateFutureDate()
```

**Pattern:**
```typescript
// Mỗi file = 1 interface + 1 factory function
export interface UserData {
  name: string;
  email: string;
  password: string;
}

export function generateUser(overrides: Partial<UserData> = {}): UserData {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,   // cho phép override field cụ thể khi cần
  };
}
```

**Dùng trong test:**
```typescript
import { generateUser } from '@test-data/UserData';

const user = generateUser();                          // random hoàn toàn
const user = generateUser({ email: 'fixed@test.com' }); // fix 1 field
```

**Tại sao cần:**
- Mỗi lần chạy test data khác nhau → phát hiện bug edge case tốt hơn
- Không hardcode data → test độc lập, không phụ thuộc vào data cũ
- `overrides` pattern cho phép fix field cụ thể khi test cần giá trị chính xác

---

---

## Bước 7 — Auth setup (storageState)

**Prompt dùng:**
```
Setup authentication cho Playwright framework dùng storageState:
- Tạo tests/auth.setup.ts: login bằng USER_EMAIL và USER_PASSWORD từ .env,
  lưu session vào playwright/.auth/user.json
- Cập nhật playwright.config.ts: thêm setup project chạy trước các browser projects,
  mỗi browser project dùng storageState từ file đã lưu
- Đảm bảo playwright/.auth/ đã có trong .gitignore
```

**Cách hoạt động:**

```
npx playwright test
    ↓
[setup project] auth.setup.ts chạy trước
    → đăng nhập 1 lần
    → lưu cookies + localStorage vào playwright/.auth/user.json
    ↓
[chromium / firefox / webkit] load session từ file
    → tất cả tests bắt đầu đã ở trạng thái logged in
```

**`tests/auth.setup.ts`:**
```typescript
import { test as setup } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: AUTH_FILE });
});
```

**`playwright.config.ts` — projects:**
```typescript
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
  // tương tự firefox, webkit
]
```

**Tại sao cần:**
- Login qua UI rất chậm (1-3s/lần) — nếu có 50 tests × 3 browsers = 150 lần login
- `storageState` lưu toàn bộ cookies/localStorage → load ngay, không cần login lại
- `dependencies: ['setup']` đảm bảo setup chạy xong trước khi tests bắt đầu

---

---

## Bước 8 — API Request layer

**Prompt dùng:**
```
Thêm API Request layer vào Playwright framework hiện tại:
- Tạo folder api/ với BaseApi.ts, UserApi.ts (example), ApiManager.ts
- BaseApi nhận APIRequestContext thay vì Page
- ApiManager quản lý tất cả API classes, pattern giống PageManager
- Thêm apiManager fixture vào fixtures/index.ts dùng request thay vì page
- Thêm @api/* path alias vào tsconfig.json
- Tạo example test hybrid: setup data qua API, verify qua UI, teardown qua API
```

**Cấu trúc `api/`:**
```
api/
  BaseApi.ts       ← nhận APIRequestContext, tương tự BasePage
  UserApi.ts       ← example API class
  ApiManager.ts    ← quản lý tất cả API classes
```

**Pattern API class:**
```typescript
export class UserApi extends BaseApi {
  async createUser(payload: CreateUserPayload) {
    const response = await this.request.post('/api/users', { data: payload });
    return response.json();
  }
  async deleteUser(id: number) {
    await this.request.delete(`/api/users/${id}`);
  }
}
```

**Fixture thêm apiManager:**
```typescript
apiManager: async ({ request }, use) => {
  await use(new ApiManager(request));
},
```

**Hybrid test pattern (setup API → verify UI → teardown API):**
```typescript
test('create user via API then verify on UI', async ({ pageManager, apiManager }) => {
  const user = generateUser();
  const created = await apiManager.onUserApi().createUser(user);  // nhanh, không qua UI
  // ... verify trên UI ...
  await apiManager.onUserApi().deleteUser(created.id);            // clean up
});
```

**Tại sao cần:**
- Setup data qua API nhanh hơn 10-50x so với đi qua UI
- Teardown sạch sau mỗi test, không để lại data thừa
- "Hybrid" = dùng API cho những gì không cần test, UI cho những gì cần verify

---

---

## Bonus — loggedInPage fixture (khi storageState không dùng được)

Một số app không cho lưu cookie hoặc invalidate session thường xuyên — `storageState` không có tác dụng. Giải pháp: thêm `loggedInPage` fixture để login qua UI mỗi lần nhưng không duplicate code.

**Thêm vào `fixtures/index.ts`:**
```typescript
import { test as base, Page } from '@playwright/test';

type TestFixtures = {
  pageManager: PageManager;
  apiManager: ApiManager;
  loggedInPage: Page;      // ← thêm type
};

export const test = base.extend<TestFixtures>({
  // ... pageManager, apiManager giữ nguyên ...

  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
    await page.getByLabel('Password').fill(process.env.USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
    await use(page);   // page đã logged in
  },
});
```

**Dùng trong test:**
```typescript
// Cần login + pageManager → khai báo cả 2, chúng dùng chung 1 page object
test('test cần auth', async ({ loggedInPage, pageManager }) => {
  // loggedInPage đã logged in, pageManager hoạt động trên cùng page đó
});

// Không cần login → chỉ dùng pageManager, không trigger login
test('test không cần auth', async ({ pageManager }) => { ... });
```

**Lưu ý quan trọng — fixture dependency:**

Nếu khai báo `loggedInPage` trong params của fixture khác (ví dụ `pageManager`), Playwright sẽ chạy `loggedInPage` trước rồi mới chạy `pageManager`. Điều này làm mọi test dùng `pageManager` đều bị trigger login — **không nên làm vậy**. Hãy để test tự khai báo fixture nào nó cần.

```typescript
// ❌ Sai — mọi test dùng pageManager đều bị login
pageManager: async ({ page, loggedInPage }, use) => { ... }

// ✅ Đúng — test tự quyết định
test('my test', async ({ loggedInPage, pageManager }) => { ... })
```

---

## Nice-to-have — có thể thêm sau

### Cao — thường cần sớm

**1. Allure Reporter**
Report đẹp hơn HTML mặc định, có history, trend, attachment screenshot. Hữu ích khi team lớn hoặc cần share report với stakeholder.
```
Prompt: Thêm Allure Reporter vào Playwright framework, cài package, config trong playwright.config.ts, thêm script "report:allure" vào package.json
```

**2. ESLint + Prettier + Husky** ✅ Đã làm — xem Bước 10 bên dưới

**3. Static test data (JSON) + Env Validator** ✅ Đã làm — xem Bước 11 và 12 bên dưới

### Trung bình — cần khi project lớn hơn

**4. Multi-environment test data**
`test-data/common/` + `test-data/staging/` + `test-data/production/` — staging và prod có data khác nhau, deep merge khi load.
- **Khi nào cần:** App có staging và production với accounts/data khác nhau
```
Prompt: Thêm multi-environment test data: tạo test-data/staging/ và test-data/production/ override test-data/common/,
cập nhật DataLoader để deep merge common + env-specific dựa trên biến TEST_ENVIRONMENT trong .env
```

**5. CI Sharding**
Chia tests chạy song song trên nhiều CI machines — 100 tests × 4 machines = mỗi machine chạy 25 tests.
- **Khi nào cần:** Test suite >50 tests, CI chạy >15 phút
```
Prompt: Thêm sharding vào playwright.config.ts và cập nhật .github/workflows/playwright.yml
để chạy 4 shards song song, merge report sau khi xong
```

**6. Test Tags (@smoke, @regression)**
Chạy subset tests nhanh trước khi deploy thay vì chạy toàn bộ suite.
- **Khi nào cần:** Cần chạy nhanh critical tests (~5 phút) trước deploy, full regression chạy ban đêm
```
Prompt: Hướng dẫn thêm test tags @smoke @critical @regression vào framework,
thêm scripts test:smoke và test:regression vào package.json
```

**7. Custom Reporting (JSON + Dashboard)**
JSON summary để notify Slack sau CI, interactive dashboard để báo cáo cho stakeholder.
- **Khi nào cần:** Team lớn, cần tự động notify kết quả test lên Slack/Teams
```
Prompt: Thêm custom reporter vào Playwright framework:
JSON summary reporter ghi results/summary.json, thêm script report:dashboard vào package.json
```

### Thấp — nice to have

**8. Visual Regression**
So sánh screenshot với baseline — detect UI thay đổi dù chỉ 1 pixel.
- **Khi nào cần:** UI phức tạp, team front-end lớn, cần detect regression tự động
```
Prompt: Thêm visual regression vào BasePage: verifyVisualSnapshot() và verifyElementSnapshot(),
config maxDiffPixels và threshold trong playwright.config.ts, tạo baseline theo environment
```

**9. Accessibility Testing (WCAG 2.1 AA)**
Tích hợp axe-core vào BasePage để tự động check accessibility violations.
- **Khi nào cần:** App cần WCAG compliance, gov projects, enterprise app
```
Prompt: Thêm accessibility testing vào BasePage dùng @axe-core/playwright:
checkAccessibility() (strict, fail on critical) và getAccessibilityResults() (soft, log only)
```

**10. Multi-user Fixture**
Nhiều users với isolated browser context trong cùng 1 test — test approval/collaboration workflows.
- **Khi nào cần:** App có workflow nhiều người: submit/approve, sender/receiver, admin/user
```
Prompt: Thêm multiUserTest fixture vào fixtures/index.ts: getUserPage(accountIndex) trả về
isolated BrowserContext per account, auto-close sau test
```

**11. Flaky test detection**
Chạy test nhiều lần liên tiếp để detect tests không ổn định trước khi merge.
```
Prompt: Thêm script "test:flaky" vào package.json dùng --repeat-each=5 để detect flaky tests
```

---

## Bước 10 — ESLint + Prettier + Husky

**3 tool này làm gì:**
- **ESLint** — kiểm tra code logic: biến không dùng, sai pattern Playwright, dùng `any` type
- **Prettier** — tự động format code: indent, dấu phẩy, dấu nháy, độ dài dòng
- **Husky** — chặn `git commit` nếu code có lỗi ESLint, tự chạy Prettier trước khi commit

**Luồng hoạt động:**
```
git commit → Husky chặn → lint-staged chạy ESLint + Prettier trên staged files
  → có lỗi ESLint? → từ chối commit
  → Prettier tự fix format → commit thành công
```

**Cài packages:**
```bash
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-playwright eslint-config-prettier prettier husky lint-staged
```

**Prompt dùng:**
```
Thêm ESLint + Prettier + Husky vào Playwright TypeScript framework:
- ESLint 9 flat config (eslint.config.mjs) với typescript-eslint, eslint-plugin-playwright, eslint-config-prettier
- Rules: no-unused-vars error, no-explicit-any warn, tắt expect-expect cho *.setup.ts
- Prettier với single quotes, trailing comma, printWidth 100
- Husky pre-commit hook chạy lint-staged
- lint-staged: chạy eslint --fix + prettier --write trên *.ts files
- Thêm scripts: lint, lint:fix, format, format:check vào package.json
- Khởi tạo git repo nếu chưa có (git init) trước khi chạy husky init
```

**Files tạo ra:**
```
eslint.config.mjs    ← ESLint flat config
.prettierrc          ← Prettier config
.prettierignore      ← Bỏ qua node_modules, playwright-report, test-results
.husky/
  pre-commit         ← chạy "npx lint-staged"
```

**`package.json` — thêm scripts và lint-staged:**
```json
"scripts": {
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
},
"lint-staged": {
  "*.ts": ["eslint --fix", "prettier --write"]
}
```

**`.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Tại sao cần:**
- Không thể "quên" check code — Husky tự động chặn commit xấu
- Mọi người trong team có code format giống nhau, không tranh luận về style trong PR review
- ESLint với Playwright plugin bắt được lỗi đặc thù như test không có assertion, dùng conditional trong test

---

## Bước 11 — Static test data (JSON) song song với faker

**Vấn đề faker gặp phải:**
Faker tạo data random mỗi lần chạy → khi test fail trên CI, không biết data nào đã gây ra lỗi → khó reproduce.

**Giải pháp:** Giữ faker cho happy path testing, thêm JSON static data khi cần data cố định.

**Prompt dùng:**
```
Thêm static test data (JSON) vào framework song song với faker:
- Tạo test-data/common/users.json với standardUser, adminUser, readOnlyUser
- Tạo test-data/common/dates.json với nearFuture, farFuture, nextMonth
- Tạo helpers/DataLoader.ts với hàm loadTestData<T>(fileName) đọc JSON từ test-data/common/
- Cập nhật UserData.ts: thêm interface StaticUsers + hàm getStaticUsers()
- Cập nhật DateData.ts: thêm interface StaticDates + hàm getStaticDates()
```

**Cấu trúc:**
```
test-data/
  common/
    users.json       ← standardUser, adminUser, readOnlyUser
    dates.json       ← nearFuture, farFuture, nextMonth
  UserData.ts        ← generateUser() (faker) + getStaticUsers() (JSON)
  DateData.ts        ← generateFutureDate() (faker) + getStaticDates() (JSON)
helpers/
  DataLoader.ts      ← loadTestData<T>(fileName)
```

**Khi nào dùng cái nào:**
```typescript
// Random — happy path, test với data mới mỗi lần
const user = generateUser();

// Static — khi cần reproduce bug hoặc data cụ thể
const { standardUser } = getStaticUsers();
const { adminUser }    = getStaticUsers();
```

---

## Bước 12 — Env Validator (fail fast)

**Quan trọng — EnvValidator KHÔNG login, KHÔNG mở browser.**
Nó chỉ đọc file `.env` và kiểm tra các biến có tồn tại không. Đây là 2 thứ khác nhau hoàn toàn:

| | EnvValidator | auth.setup.ts |
|---|---|---|
| Làm gì | Đọc file `.env`, check biến có tồn tại | Mở browser, login thật, lưu session |
| Mục đích | Chắc chắn credentials tồn tại trước khi chạy | Lưu session để tests dùng |
| Nếu fail | Thiếu biến trong `.env` | Sai password hoặc app lỗi |

**Luồng đúng khi chạy `npx playwright test`:**
```
1. global-setup.ts  → EnvValidator: ".env có đủ BASE_URL, USER_EMAIL, USER_PASSWORD không?"
                                           ↓ có đủ
2. auth.setup.ts    → Mở browser, login thật, lưu session vào playwright/.auth/user.json
                                           ↓ login xong
3. Tests chạy       → Load session từ file, bắt đầu test
```

**Vấn đề không có validator:**
Thiếu `USER_EMAIL` trong `.env` → test chạy, navigate tới login, fill form, crash với lỗi `Cannot read properties of undefined` ở giữa test → mất thời gian debug.

**Với validator:**
```
npx playwright test
  → globalSetup chạy trước
  → validateEnvironment() kiểm tra tất cả required vars
  → thiếu USER_EMAIL → throw Error ngay lập tức với message rõ ràng
  → không có test nào chạy cả
```

**Prompt dùng:**
```
Thêm environment validator vào Playwright framework:
- Tạo helpers/EnvValidator.ts: kiểm tra BASE_URL, USER_EMAIL, USER_PASSWORD có trong .env không,
  validate BASE_URL là URL hợp lệ, throw Error với message rõ ràng nếu thiếu
- Tạo global-setup.ts: load dotenv + gọi validateEnvironment()
- Thêm globalSetup: './global-setup.ts' vào playwright.config.ts
- Thêm global-setup.ts vào tsconfig.json include
```

**Error message khi thiếu env var:**
```
❌ Missing required environment variables:
   - USER_EMAIL
   - USER_PASSWORD

👉 Copy .env.example to .env and fill in the values.
```

**Tại sao cần:**
- Fail ngay ở đầu với message rõ ràng thay vì crash giữa test với lỗi khó hiểu
- Tiết kiệm thời gian debug — biết ngay nguyên nhân là thiếu env var
- `globalSetup` chạy 1 lần trước toàn bộ suite, không overhead cho từng test

---

## Khi chuyển sang dự án mới — update auth cho app khác

Chỉ cần cung cấp thông tin login của app mới, Claude Code sẽ tự update toàn bộ các file liên quan.

**Thông tin cần cung cấp:**
```
URL: https://your-new-app.com
Login page path: /login (hoặc / nếu redirect tự động)
Email field: getByLabel('Email') / getByPlaceholder('Username') / ...
Password field: getByLabel('Password') / ...
Submit button: getByRole('button', { name: 'Sign in' }) / ...
After login redirect to: /dashboard (URL để waitForURL)
OTP: có / không — nếu có thì secret key format thế nào
Credentials: email và password thật để điền vào .env
Có thêm field nào khác không: ví dụ tenant ID, company code...
```

**Claude Code sẽ tự update các file sau:**

| File | Thay đổi |
|---|---|
| `.env` / `.env.example` | Thêm/bỏ/đổi tên biến credentials |
| `helpers/EnvValidator.ts` | Update list required vars cho đúng |
| `global-setup.ts` | Update nếu có thay đổi logic load env |
| `tests/auth.setup.ts` | Update selectors, flow login, OTP handling |

Bạn không cần đụng vào code — chỉ cần mô tả form login là xong.

---

## Kiến trúc quyết định — update cái gì ở đâu

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Thêm page mới | Tạo `page-objects/MyPage.ts`, đăng ký fixture trong `fixtures/index.ts`, thêm `navigateToMyPage()` vào `NavigationPage` |
| Thêm API endpoint mới | Tạo `api/MyApi.ts`, thêm vào `ApiManager` |
| Thêm precondition / teardown | Thêm fixture mới vào `fixtures/index.ts` |
| Thêm test data model | Tạo `test-data/MyData.ts` với interface + factory function |

**Nguyên tắc:**
- `PageManager` / `ApiManager` là công cụ trung lập — không chứa logic setup/teardown, không biết test cần login hay không
- `Fixture` chỉ tạo mới khi có precondition/teardown cần tái sử dụng ở nhiều tests
- Test tự khai báo những fixture nào nó cần — không để fixture này depend vào fixture khác trừ khi luôn luôn cần

---

## Framework hoàn chỉnh ✓

```
base/               BasePage.ts
page-objects/       NavigationPage.ts, AppointmentPage.ts, ...
api/                BaseApi.ts, ApiManager.ts, ...
fixtures/           index.ts  (mỗi Page Object là 1 fixture + apiManager + loggedInPage)
test-data/          AppointmentData.ts, ...
                    common/*.json  (static data)
helpers/            DataLoader.ts, EnvValidator.ts
tests/
  e2e/              UI/browser tests
  api/              Pure API tests
  auth.setup.ts
.claude/
  skills/
    test-generator-e2e/   skill tự động generate test (playwright-cli + MCP fallback)
    e2e-test-debugger/    skill debug test failures
    create-pr/            skill tạo branch + commit + PR
    review-pr/            skill review PR theo framework conventions
doc/                framework-setup-guide.md
```

**Chạy riêng từng loại:**
```bash
npx playwright test tests/e2e    # chỉ chạy E2E
npx playwright test tests/api    # chỉ chạy API tests
npx playwright test              # chạy tất cả
```

---

## Bước 13 — Locator pattern trong constructor

**Vấn đề khi khai báo locator trong method:**
```typescript
// ❌ Sai — locator tạo mới mỗi lần gọi method, không rõ ràng
confirmationFacility() {
  return this.page.locator('#facility');
}
```

**Pattern đúng — khai báo trong constructor:**
```typescript
// ✅ Đúng — tất cả locators ở một chỗ, dễ review
export class AppointmentPage extends BasePage {
  private readonly facilitySelect: Locator;      // form — chỉ class dùng
  readonly confirmFacility: Locator;             // confirmation — test dùng trực tiếp

  constructor(page: Page) {
    super(page);
    this.facilitySelect = page.getByRole('combobox', { name: 'Facility' });
    this.confirmFacility = page.locator('#facility');
  }

  async fillForm(data: AppointmentData) {
    await this.facilitySelect.selectOption(data.facility); // dùng this.xxx
  }
}

// Trong test — truy cập trực tiếp, không có ()
await expect(appointmentPage.confirmFacility).toHaveText(data.facility);
```

**Quy tắc visibility:**
- `private readonly` — locators form/action, chỉ dùng trong class
- `readonly` (public) — locators confirmation/assertion, test truy cập trực tiếp
- Locator dynamic theo tham số → giữ inline trong method (không thể hardcode trước)

**Prompt dùng:**
```
Refactor tất cả Page Objects theo pattern: khai báo tất cả locators
là private readonly fields trong constructor, methods chỉ dùng this.locatorName.
Confirmation locators dùng readonly (public) để test access trực tiếp.
```

---

## Bước 14 — test.step() trong test files

**Vấn đề khi không dùng test.step():**
Khi test fail, report chỉ hiện dòng lỗi — không biết test đang làm gì khi fail.

**Với test.step():**
```typescript
test('book appointment and verify confirmation', async ({ pageManager }) => {
  const data = generateAppointmentData();
  const appointmentPage = pageManager.onAppointmentPage();

  await test.step('1. Navigate to Make Appointment page', async () => {
    await pageManager.onNavigationPage().navigateToMakeAppointment();
  });

  await test.step('2. Fill appointment form', async () => {
    await appointmentPage.fillForm(data);
  });

  await test.step('3. Submit appointment', async () => {
    await appointmentPage.bookAppointment();
  });

  await test.step('4. Verify confirmation details', async () => {
    await expect(appointmentPage.confirmFacility).toHaveText(data.facility);
    await expect(appointmentPage.confirmReadmission).toHaveText(data.readmission ? 'Yes' : 'No');
  });
});
```

**Lợi ích:**
- HTML report hiện rõ từng step — biết fail ở bước nào ngay
- Trace viewer group actions theo step — dễ debug hơn
- Test dễ đọc hơn — mỗi step = 1 intention rõ ràng

**Quy tắc:**
- Đánh số step: `'1. Navigate...'`, `'2. Fill...'`, `'3. Verify...'`
- Tất cả assertions gom vào `test.step('N. Verify ...')`
- Mỗi step = 1 nhóm logic liên quan, không quá nhỏ (tránh wrap từng dòng)

**Prompt dùng:**
```
Refactor tất cả test files: wrap mỗi nhóm actions trong test.step() với tên
mô tả rõ ràng. Tất cả assertions gom vào test.step('N. Verify ...')
```

---

## Bước 15 — Skill test-generator-e2e

Sau khi framework hoàn chỉnh, tạo Claude Code skill để tự động generate test từ natural language spec.

**Cài thêm package:**
```bash
npm install --save-dev @playwright/cli
```

**Tạo cấu trúc:**
```
.claude/
  skills/
    test-generator-e2e/
      SKILL.md           ← workflow + golden rules
      scripts/
        pre-explore.sh   ← check auth freshness trước khi explore
      references/
        templates.md     ← code templates
        examples.md      ← worked example (có raw playwright-cli output)
```

**Skill làm gì:**
1. Nhận spec dạng natural language
2. Explore UI để lấy locators:
   - **Primary:** `playwright-cli` — Claude tự chạy bash commands, persistent browser session, ~100 tokens/command. `pre-explore.sh` tự check + refresh auth nếu stale.
   - **Fallback:** Playwright MCP — dùng khi `playwright-cli` không capture được element (shadow DOM, iframe, animation phức tạp)
3. Generate Page Object + Test Data + Test File theo đúng framework conventions
4. Chạy tsc + lint + test để verify
5. Prompt chaining menu sau mỗi lần chạy

**Invoke:**
```
/test-generator-e2e
```

**Input format:**
```
Feature: [feature name]
URL: [page path]
Priority: [smoke / regression]
Feature tag: [kebab-case]

Scenarios:
- name: [test name]
  steps:
    1. [step description]
    2. [step description]
```

**Portable sang dự án khác:**
- Copy `.claude/skills/test-generator-e2e/` sang dự án mới
- Nếu dự án mới cùng kiến trúc → dùng ngay
- Nếu kiến trúc khác → nhờ Claude adapt `references/templates.md` cho phù hợp

**Prompt tạo skill:**
```
Đọc skill .claude/skills/test-generator-e2e/SKILL.md và
references/templates.md, sau đó đọc CLAUDE.md của dự án này
và adapt skill cho phù hợp với conventions của project mới.
```

---

## Bước 9 — npm scripts + screenshot/video on failure

**Prompt dùng:**
```
Thêm 2 thứ vào framework:
1. npm scripts vào package.json: test, test:e2e, test:api, test:ui, test:headed, report
2. Thêm screenshot: 'only-on-failure' và video: 'on-first-retry' vào playwright.config.ts
Cập nhật CLAUDE.md để dùng npm scripts thay vì npx trong commands
```

**`package.json` scripts:**
```json
"scripts": {
  "test": "playwright test",
  "test:e2e": "playwright test tests/e2e",
  "test:api": "playwright test tests/api",
  "test:ui": "playwright test --ui",
  "test:headed": "playwright test --headed",
  "report": "playwright show-report"
}
```

**`playwright.config.ts` — trong `use:`:**
```typescript
use: {
  baseURL: process.env.BASE_URL,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'on-first-retry',
}
```

**Tại sao cần:**
- npm scripts: gõ `npm run test:e2e` thay vì `npx playwright test tests/e2e` mỗi lần
- screenshot + video: khi test fail trên CI có đủ visual evidence trong `test-results/` để debug mà không cần chạy lại locally
