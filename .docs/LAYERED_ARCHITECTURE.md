# レイヤードアーキテクチャ設計ドキュメント

## 📚 目次
1. [レイヤードアーキテクチャとは](#レイヤードアーキテクチャとは)
2. [各層の責務](#各層の責務)
3. [データフロー](#データフロー)
4. [本プロジェクトでの実装](#本プロジェクトでの実装)
5. [メリット・デメリット](#メリットデメリット)
6. [実装例](#実装例)

---

## レイヤードアーキテクチャとは

レイヤードアーキテクチャ（Layered Architecture）は、ソフトウェアを**責務ごとに層（レイヤー）に分割**する設計パターンです。各層は明確な役割を持ち、上位層から下位層への一方向の依存関係を持ちます。

### 基本構造

```
┌─────────────────────────────────┐
│  Presentation Layer（表現層）     │  ← HTTP リクエスト/レスポンス
│  Controller / Routes             │
└────────────┬────────────────────┘
             │ 依存
┌────────────▼────────────────────┐
│  Business Logic Layer（業務層）  │  ← ビジネスルール・検証
│  Service                         │
└────────────┬────────────────────┘
             │ 依存
┌────────────▼────────────────────┐
│  Data Access Layer（データ層）    │  ← データの永続化・取得
│  Repository                      │
└─────────────────────────────────┘
```

### 依存の方向性

- **上位層 → 下位層**: Controller は Service を使う、Service は Repository を使う
- **下位層 → 上位層**: ❌ 禁止（逆方向の依存は作らない）
- 各層は**自分の責務のみに集中**し、他層の詳細を知らない

---

## 各層の責務

### 1. Controller 層（表現層）

**役割**: HTTP リクエスト/レスポンスの管理

```typescript
// ✅ Controller が行うこと
- リクエストの受け取り
- パラメータの抽出
- Service 層の呼び出し
- レスポンスの返却（HTTPステータス含む）
- エラーのキャッチとHTTPエラーへの変換

// ❌ Controller が行わないこと
- ビジネスロジック
- データベース操作
- データの加工・計算
```

**実装例**:
```typescript
export class TodoController {
  constructor(private todoService: TodoService) {}

  async getTodos(request: FastifyRequest, reply: FastifyReply) {
    try {
      const todos = await this.todoService.findAll();
      return reply.status(200).send({ data: todos });
    } catch (error) {
      throw error;
    }
  }
}
```

### 2. Service 層（ビジネスロジック層）

**役割**: ビジネスルール・業務ロジックの実装

```typescript
// ✅ Service が行うこと
- ビジネスルールの検証
- 複雑なデータ加工
- トランザクション管理
- Repository 層の呼び出し
- ビジネス例外のスロー

// ❌ Service が行わないこと
- HTTPに関する処理（ステータスコードなど）
- 直接的なデータベース操作
- リクエスト/レスポンスオブジェクトの操作
```

**実装例**:
```typescript
export class TodoService {
  constructor(private todoRepository: TodoRepository) {}

  async createTodo(data: CreateTodoDto): Promise<Todo> {
    // ビジネスロジック: 期限が過去でないかチェック
    if (data.dueDate && new Date(data.dueDate) < new Date()) {
      throw new ValidationError('期限は未来の日付を指定してください');
    }

    // Repository を使ってデータ保存
    return await this.todoRepository.create(data);
  }

  async findAll(): Promise<Todo[]> {
    return await this.todoRepository.findAll();
  }
}
```

### 3. Repository 層（データアクセス層）

**役割**: データの永続化と取得

```typescript
// ✅ Repository が行うこと
- データの作成（Create）
- データの読み取り（Read）
- データの更新（Update）
- データの削除（Delete）
- データの検索・フィルタリング

// ❌ Repository が行わないこと
- ビジネスロジック
- データの検証（バリデーション）
- 複雑な計算や加工
```

**実装例**:
```typescript
export class TodoRepository {
  private todos: Todo[] = [];

  async create(data: CreateTodoData): Promise<Todo> {
    const todo: Todo = {
      id: uuidv4(),
      ...data,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.todos.push(todo);
    return todo;
  }

  async findAll(): Promise<Todo[]> {
    return this.todos;
  }

  async findById(id: string): Promise<Todo | null> {
    return this.todos.find(todo => todo.id === id) ?? null;
  }
}
```

---

## データフロー

### リクエストの流れ（上位 → 下位）

```
1. クライアント
   ↓ HTTPリクエスト
2. Controller
   ├─ リクエストを受信
   ├─ パラメータ抽出
   └─ Service を呼び出し
      ↓
3. Service
   ├─ ビジネスロジック実行
   ├─ データ検証
   └─ Repository を呼び出し
      ↓
4. Repository
   ├─ データベース操作
   └─ データを返却
      ↓
5. Service
   ├─ データ加工
   └─ Controller に返却
      ↓
6. Controller
   ├─ HTTPレスポンス生成
   └─ クライアントに返却
```

### 具体例: Todo 作成

```typescript
// 1. Controller: リクエスト受信
POST /api/v1/todos
Body: { title: "買い物", priority: "high" }

// 2. Controller → Service
todoService.createTodo({ title: "買い物", priority: "high" })

// 3. Service: ビジネスロジック
- タイトルの長さチェック
- 優先度の妥当性確認
- デフォルト値の設定

// 4. Service → Repository
todoRepository.create({
  title: "買い物",
  priority: "high",
  completed: false
})

// 5. Repository: データ保存
- UUID生成
- タイムスタンプ付与
- メモリ/DBに保存

// 6. Repository → Service → Controller → Client
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "買い物",
  priority: "high",
  completed: false,
  createdAt: "2026-02-11T10:00:00Z",
  updatedAt: "2026-02-11T10:00:00Z"
}
```

---

## 本プロジェクトでの実装

### ディレクトリ構成

```
back/src/modules/todos/
├── todo.types.ts         # 型定義（Entity, DTO）
├── todo.schema.ts        # Zodバリデーションスキーマ
├── todo.repository.ts    # Repository層: データアクセス
├── todo.service.ts       # Service層: ビジネスロジック
├── todo.controller.ts    # Controller層: リクエスト処理
└── todo.routes.ts        # ルート定義
```

### 依存関係の注入（DI）

```typescript
// routes.ts で各層をインスタンス化
const todoRepository = new TodoRepository();
const todoService = new TodoService(todoRepository);
const todoController = new TodoController(todoService);

// Fastify ルートに登録
export async function todoRoutes(app: FastifyInstance) {
  app.get('/api/v1/todos', (req, reply) => 
    todoController.getTodos(req, reply)
  );
}
```

### 型安全性の確保

```typescript
// todo.types.ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  // ...
}

export interface CreateTodoDto {
  title: string;
  priority: TodoPriority;
  // ...
}

// 各層で同じ型を使用することで型安全性を保証
```

---

## メリット・デメリット

### ✅ メリット

1. **関心の分離（Separation of Concerns）**
   - 各層が明確な責務を持つ
   - コードの見通しが良い

2. **テストしやすい**
   - 各層を独立してテスト可能
   - モックやスタブが作りやすい

3. **保守性が高い**
   - 変更の影響範囲が限定的
   - バグの原因特定が容易

4. **再利用性**
   - Service層は複数のControllerから使える
   - Repository層は複数のServiceから使える

5. **チーム開発向き**
   - 層ごとに担当を分けられる
   - 並行開発がしやすい

6. **技術の置き換えが容易**
   - データベース変更時はRepository層のみ修正
   - フレームワーク変更時はController層のみ修正

### ❌ デメリット

1. **ボイラープレートの増加**
   - 小規模アプリでは過剰設計になりがち
   - ファイル数が増える

2. **学習コスト**
   - アーキテクチャの理解が必要
   - 初心者には複雑に感じる

3. **パフォーマンスオーバーヘッド**
   - 層を跨ぐ呼び出しが増える
   - 簡単な処理でも複数ファイルを経由

### いつ使うべきか？

**✅ 推奨される場面**
- 中〜大規模なアプリケーション
- 複数人でのチーム開発
- 長期運用が想定されるプロジェクト
- ビジネスロジックが複雑

**❌ 不要な場面**
- 小規模な個人プロジェクト
- プロトタイプや検証目的
- CRUDのみの単純なアプリ

---

## 実装例

### 完全な実装フロー

#### 1. 型定義（todo.types.ts）

```typescript
export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueDate?: string;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TodoPriority;
  dueDate?: string;
}
```

#### 2. Repository 層（todo.repository.ts）

```typescript
export class TodoRepository {
  private todos: Todo[] = [];

  async create(data: CreateTodoDto): Promise<Todo> {
    const todo: Todo = {
      id: uuidv4(),
      ...data,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.todos.push(todo);
    return todo;
  }

  async findAll(): Promise<Todo[]> {
    return [...this.todos];
  }

  async findById(id: string): Promise<Todo | null> {
    return this.todos.find(todo => todo.id === id) ?? null;
  }

  async update(id: string, data: UpdateTodoDto): Promise<Todo | null> {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index === -1) return null;

    this.todos[index] = {
      ...this.todos[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.todos[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index === -1) return false;

    this.todos.splice(index, 1);
    return true;
  }
}
```

#### 3. Service 層（todo.service.ts）

```typescript
export class TodoService {
  constructor(private todoRepository: TodoRepository) {}

  async getAllTodos(): Promise<Todo[]> {
    return await this.todoRepository.findAll();
  }

  async getTodoById(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundError('Todoが見つかりません');
    }
    return todo;
  }

  async createTodo(data: CreateTodoDto): Promise<Todo> {
    // ビジネスロジック: 期限チェック
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate);
      if (dueDate < new Date()) {
        throw new BadRequestError('期限は未来の日付を指定してください');
      }
    }

    return await this.todoRepository.create(data);
  }

  async updateTodo(id: string, data: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepository.update(id, data);
    if (!todo) {
      throw new NotFoundError('Todoが見つかりません');
    }
    return todo;
  }

  async deleteTodo(id: string): Promise<void> {
    const deleted = await this.todoRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Todoが見つかりません');
    }
  }
}
```

#### 4. Controller 層（todo.controller.ts）

```typescript
export class TodoController {
  constructor(private todoService: TodoService) {}

  async getTodos(request: FastifyRequest, reply: FastifyReply) {
    const todos = await this.todoService.getAllTodos();
    return reply.status(200).send({ data: todos });
  }

  async getTodoById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const todo = await this.todoService.getTodoById(request.params.id);
    return reply.status(200).send({ data: todo });
  }

  async createTodo(
    request: FastifyRequest<{ Body: CreateTodoDto }>,
    reply: FastifyReply
  ) {
    const todo = await this.todoService.createTodo(request.body);
    return reply.status(201).send({ data: todo });
  }

  async updateTodo(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateTodoDto }>,
    reply: FastifyReply
  ) {
    const todo = await this.todoService.updateTodo(
      request.params.id,
      request.body
    );
    return reply.status(200).send({ data: todo });
  }

  async deleteTodo(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    await this.todoService.deleteTodo(request.params.id);
    return reply.status(204).send();
  }
}
```

#### 5. ルート定義（todo.routes.ts）

```typescript
export async function todoRoutes(app: FastifyInstance) {
  // 依存性の注入
  const todoRepository = new TodoRepository();
  const todoService = new TodoService(todoRepository);
  const todoController = new TodoController(todoService);

  // ルート登録
  app.get('/api/v1/todos', (req, reply) => 
    todoController.getTodos(req, reply)
  );
  
  app.get('/api/v1/todos/:id', (req, reply) => 
    todoController.getTodoById(req, reply)
  );
  
  app.post('/api/v1/todos', {
    schema: { body: createTodoSchema }
  }, (req, reply) => 
    todoController.createTodo(req, reply)
  );
  
  app.patch('/api/v1/todos/:id', (req, reply) => 
    todoController.updateTodo(req, reply)
  );
  
  app.delete('/api/v1/todos/:id', (req, reply) => 
    todoController.deleteTodo(req, reply)
  );
}
```

---

## まとめ

レイヤードアーキテクチャは、**責任の分離**という原則に基づいた堅牢な設計パターンです。

### 各層の役割を再確認

| 層 | 責務 | 例 |
|---|---|---|
| **Controller** | HTTP処理 | リクエスト受信、レスポンス返却 |
| **Service** | ビジネスロジック | 検証、計算、複雑な処理 |
| **Repository** | データアクセス | CRUD操作、データベース処理 |

### 成功のポイント

1. **各層の責務を守る** - 層を跨いだ責務の混在を避ける
2. **上から下への依存のみ** - 逆方向の依存を作らない
3. **型安全性を保つ** - TypeScriptの型を活用する
4. **テストを書く** - 各層を独立してテストする

このドキュメントを参考に、保守性の高いアプリケーション開発を行いましょう！
