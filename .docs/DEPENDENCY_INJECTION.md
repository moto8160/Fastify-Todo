# DI（依存性注入）完全ガイド
## 初心者向け：図解で理解する Dependency Injection

---

## 📚 目次
1. [DIとは何か？](#diとは何か)
2. [DIがない世界（悪い例）](#diがない世界悪い例)
3. [DIがある世界（良い例）](#diがある世界良い例)
4. [DIの3つのメリット](#diの3つのメリット)
5. [DIの実装パターン](#diの実装パターン)
6. [本プロジェクトでのDI](#本プロジェクトでのdi)
7. [よくある質問](#よくある質問)

---

## DIとは何か？

**DI（Dependency Injection / 依存性注入）**とは、**「必要なものを外から渡す」**設計パターンです。

### 日常の例で理解する

#### ❌ DIなし（悪い例）
```
あなた「コーヒーが飲みたい」
　↓
自分でコーヒー豆を買いに行く
　↓
自分でミルを買う
　↓
自分で豆を挽く
　↓
自分でドリップする
　↓
やっと飲める
```

#### ✅ DIあり（良い例）
```
あなた「コーヒーが飲みたい」
　↓
カフェ店員「どうぞ☕」
　↓
すぐ飲める
```

**DI = 必要なもの（依存物）を外から渡してもらう**

---

## DIがない世界（悪い例）

### コード例: DIなしの実装

```typescript
// ❌ 悪い例: ServiceがRepositoryを自分で作る
export class TodoService {
  private todoRepository: TodoRepository;

  constructor() {
    // 自分でRepositoryを作っている（密結合）
    this.todoRepository = new TodoRepository();
  }

  async getAllTodos() {
    return this.todoRepository.findAll();
  }
}

// 使う側
const todoService = new TodoService();
```

### 何が問題？

#### 問題1: **テストが書けない**
```typescript
// テストしたいけど...
test('TodoServiceのテスト', () => {
  const service = new TodoService();
  // ❌ 内部でRepositoryを勝手に作るので、
  // モックRepositoryを渡せない！
  // 本物のDBに接続してしまう...
});
```

#### 問題2: **変更に弱い**
```typescript
// Repositoryの実装を変えたい
class TodoRepository {
  constructor(private databaseUrl: string) {} // URLが必要になった
}

// ❌ Serviceも変更が必要
class TodoService {
  constructor() {
    this.todoRepository = new TodoRepository('http://...'); // ここも変える
  }
}
```

#### 問題3: **再利用できない**
```typescript
// 開発環境用のRepositoryを使いたい
const devRepository = new DevTodoRepository();

// ❌ でも、Serviceは勝手に本番用Repositoryを作るので無理
const service = new TodoService(); // 本番用Repositoryが使われる
```

---

## DIがある世界（良い例）

### コード例: DIありの実装

```typescript
// ✅ 良い例: Repositoryを外から受け取る
export class TodoService {
  // constructorで外から受け取る
  constructor(private readonly todoRepository: TodoRepository) {}

  async getAllTodos() {
    return this.todoRepository.findAll();
  }
}

// 使う側がRepositoryを作って渡す
const todoRepository = new TodoRepository();
const todoService = new TodoService(todoRepository); // 注入！
```

### 何が嬉しい？

#### メリット1: **テストが書ける**
```typescript
// モックRepositoryを作る
class MockTodoRepository {
  async findAll() {
    return [{ id: '1', title: 'テストTodo', completed: false }];
  }
}

// テスト
test('TodoServiceのテスト', async () => {
  const mockRepo = new MockTodoRepository();
  const service = new TodoService(mockRepo); // モックを注入！
  
  const todos = await service.getAllTodos();
  expect(todos).toHaveLength(1);
  // ✅ DBに接続せずにテストできる！
});
```

#### メリット2: **変更に強い**
```typescript
// Repositoryの変更
class TodoRepository {
  constructor(private databaseUrl: string) {} // 変更
}

// ✅ Serviceは変更不要（外で作るだけ）
const repo = new TodoRepository('http://localhost:5432');
const service = new TodoService(repo);
```

#### メリット3: **柔軟に切り替えられる**
```typescript
// 環境に応じて切り替え
const repo = process.env.NODE_ENV === 'development'
  ? new DevTodoRepository()
  : new ProdTodoRepository();

const service = new TodoService(repo); // どちらでも動く
```

---

## DIの3つのメリット

### 1. 🧪 **テストしやすい（Testability）**

```
テストの鉄則: 外部システム（DB、API等）に依存しない

DIなし: DBに本当に接続してしまう（遅い、不安定）
DIあり: モックを注入できる（速い、安定）
```

**具体例**:
```typescript
// テスト用のダミーRepository
class InMemoryTodoRepository {
  private todos = [
    { id: '1', title: 'テスト用Todo', completed: false }
  ];
  
  async findAll() {
    return this.todos;
  }
}

// テストで使う
const testRepo = new InMemoryTodoRepository();
const service = new TodoService(testRepo); // 高速！
```

---

### 2. 🔧 **保守しやすい（Maintainability）**

```
変更の影響を局所化できる

DIなし:
  Repository変更 → Service変更 → Controller変更 → 連鎖的

DIあり:
  Repository変更 → Repositoryだけ変更 → 完了
```

**具体例**:
```typescript
// Repositoryの実装を丸ごと変える
// Before: メモリ内配列
class InMemoryTodoRepository { ... }

// After: データベース
class DatabaseTodoRepository { ... }

// ✅ Serviceは全く変更不要！
const repo = new DatabaseTodoRepository();
const service = new TodoService(repo);
```

---

### 3. 🔄 **再利用しやすい（Reusability）**

```
同じServiceを異なる状況で使える

Example:
  開発環境: メモリ内Repository
  テスト環境: モックRepository
  本番環境: データベースRepository
```

**具体例**:
```typescript
// 環境ごとに違うRepositoryを使う
function createTodoService() {
  let repo;
  
  switch (process.env.NODE_ENV) {
    case 'test':
      repo = new MockTodoRepository();
      break;
    case 'development':
      repo = new InMemoryTodoRepository();
      break;
    case 'production':
      repo = new DatabaseTodoRepository();
      break;
  }
  
  return new TodoService(repo); // 同じServiceを再利用
}
```

---

## DIの実装パターン

### パターン1: Constructor Injection（推奨）⭐

**最も一般的で推奨される方法**

```typescript
class TodoService {
  // constructorで受け取る
  constructor(private readonly todoRepository: TodoRepository) {}
  
  async getAllTodos() {
    return this.todoRepository.findAll();
  }
}

// 使う側
const repo = new TodoRepository();
const service = new TodoService(repo); // 注入
```

**✅ メリット**:
- 必須の依存関係が明確
- 不変（readonly）にできる
- 多くの言語・フレームワークで標準

---

### パターン2: Setter Injection

**あまり使われない**

```typescript
class TodoService {
  private todoRepository?: TodoRepository;
  
  // setterで後から設定
  setRepository(repo: TodoRepository) {
    this.todoRepository = repo;
  }
  
  async getAllTodos() {
    if (!this.todoRepository) {
      throw new Error('Repository not set');
    }
    return this.todoRepository.findAll();
  }
}

// 使う側
const service = new TodoService();
service.setRepository(new TodoRepository()); // 注入
```

**❌ デメリット**:
- 必須の依存が不明確
- 設定し忘れの危険
- nullチェックが必要

---

### パターン3: Property Injection

**デコレータがある言語で使われる（TypeScript + NestJS等）**

```typescript
class TodoService {
  @Inject()
  private todoRepository!: TodoRepository;
  
  async getAllTodos() {
    return this.todoRepository.findAll();
  }
}
```

**使われる場面**:
- NestJS
- Angular
- Spring（Java）

---

## 本プロジェクトでのDI

### 実際のコード

```typescript
// todo.routes.ts

export async function todoRoutes(app: FastifyInstance): Promise<void> {
  // ステップ1: Repositoryを作る（データアクセス層）
  const todoRepository = new TodoRepository();
  
  // ステップ2: ServiceにRepositoryを注入（ビジネスロジック層）
  const todoService = new TodoService(todoRepository);
  
  // ステップ3: ControllerにServiceを注入（表現層）
  const todoController = new TodoController(todoService);
  
  // ルート登録
  app.get('/api/todos', todoController.getTodos);
}
```

### 依存関係の流れ

```
Routes（ルート定義）
  ↓ 作成
Controller（表現層）
  ↓ DIで注入
Service（ビジネスロジック層）
  ↓ DIで注入
Repository（データアクセス層）
```

### コードのつながり

```typescript
// 1. Repository（最下層）
class TodoRepository {
  async findAll(): Promise<Todo[]> {
    return this.todos;
  }
}

// 2. Service（中間層）- Repositoryに依存
class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {} // DI
  
  async getAllTodos(): Promise<Todo[]> {
    return this.todoRepository.findAll(); // Repositoryを使う
  }
}

// 3. Controller（最上層）- Serviceに依存
class TodoController {
  constructor(private readonly todoService: TodoService) {} // DI
  
  async getTodos(request, reply): Promise<void> {
    const todos = await this.todoService.getAllTodos(); // Serviceを使う
    reply.send({ data: todos });
  }
}
```

---

## よくある質問

### Q1: なぜ`new`してるのにDI？

**A:** DIは「外から渡すこと」が重要です。

```typescript
// ❌ DIなし（内部でnew）
class TodoService {
  constructor() {
    this.repo = new TodoRepository(); // 内部でnew
  }
}

// ✅ DIあり（外からnew）
const repo = new TodoRepository(); // 外でnew
const service = new TodoService(repo); // 渡す
```

**ポイント**: `new`する**場所**が重要

---

### Q2: DIコンテナは必要？

**A:** 小〜中規模なら不要、大規模なら便利

```typescript
// 小規模: 手動DI（現在のプロジェクト）
const repo = new TodoRepository();
const service = new TodoService(repo);
const controller = new TodoController(service);

// 大規模: DIコンテナ（NestJS等）
@Injectable()
class TodoService {
  constructor(private repo: TodoRepository) {} // 自動注入
}
```

**DIコンテナ（例）**:
- NestJS（TypeScript）
- Spring（Java）
- ASP.NET Core（C#）

**今回は手動DIで十分！**

---

### Q3: interfaceは必要？

**A:** TypeScriptでは必須ではないが、ある方が良い

```typescript
// パターンA: interfaceなし（今回のプロジェクト）
class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}
}

// パターンB: interfaceあり（より柔軟）
interface ITodoRepository {
  findAll(): Promise<Todo[]>;
  create(data: CreateTodoDto): Promise<Todo>;
}

class TodoService {
  constructor(private readonly todoRepository: ITodoRepository) {}
  // ✅ どんな実装でも受け入れられる
}

// 複数の実装
class InMemoryTodoRepository implements ITodoRepository { ... }
class DatabaseTodoRepository implements ITodoRepository { ... }
class MockTodoRepository implements ITodoRepository { ... }
```

**使い分け**:
- シンプルなプロジェクト: interfaceなしでOK
- 複数実装がある: interface推奨
- テストが多い: interface推奨

---

### Q4: 何でも注入すべき？

**A:** いいえ、適切に判断する

```typescript
// ✅ 注入すべき
- Repository（データアクセス）
- Service（ビジネスロジック）
- 外部API Client
- Logger

// ❌ 注入不要
- 単純なUtility関数
- 定数
- 純粋な計算ロジック
```

**判断基準**:
1. **テストで差し替えたいか？** → YES なら注入
2. **複数の実装があるか？** → YES なら注入
3. **状態を持つか？** → YES なら注入

---

## まとめ

### DIの本質

```
DI = 「自分で作らず、外から受け取る」
```

### 3つの重要ポイント

1. **Constructor Injection が基本**
   ```typescript
   constructor(private readonly dependency: Dependency) {}
   ```

2. **依存は外で作る**
   ```typescript
   const repo = new Repository();
   const service = new Service(repo); // 外で作って渡す
   ```

3. **テストがしやすくなる**
   ```typescript
   const mockRepo = new MockRepository();
   const service = new Service(mockRepo); // モックを注入
   ```

### DIを使うべき理由

| 理由 | 説明 |
|------|------|
| 🧪 **テスト容易性** | モックを注入してユニットテスト可能 |
| 🔧 **保守性** | 変更の影響を局所化 |
| 🔄 **再利用性** | 同じコードを異なる実装で使える |
| 📦 **疎結合** | クラス間の依存を減らす |

### 実装の流れ

```typescript
// 1. 各層のクラスを定義
class Repository { ... }
class Service {
  constructor(private repo: Repository) {} // DI
}
class Controller {
  constructor(private service: Service) {} // DI
}

// 2. 組み立て（ルート定義で）
const repo = new Repository();
const service = new Service(repo);      // 注入
const controller = new Controller(service); // 注入

// 3. 完成！
```

---

## 参考: DIなし vs DIあり 完全比較

### ❌ DIなし
```typescript
class TodoService {
  private repo = new TodoRepository(); // 内部で作成
  
  async getTodos() {
    return this.repo.findAll();
  }
}

// 問題
- テストで差し替えられない
- Repository変更時にService変更が必要
- 柔軟性がない
```

### ✅ DIあり
```typescript
class TodoService {
  constructor(private repo: TodoRepository) {} // 外から受け取る
  
  async getTodos() {
    return this.repo.findAll();
  }
}

// メリット
const mockRepo = new MockRepository();
const service = new TodoService(mockRepo); // テストで差し替え可能

const dbRepo = new DatabaseRepository();
const service2 = new TodoService(dbRepo); // 本番用も使える
```

---

**DI = プログラムを柔軟で保守しやすくする基本テクニック！**

実装してみて、慣れることが一番の理解への近道です 🚀
