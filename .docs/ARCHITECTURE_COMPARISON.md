# アーキテクチャパターン比較ガイド

## 初心者向け：どのアーキテクチャを選ぶべき？

---

## 📚 目次

1. [アーキテクチャとは？](#アーキテクチャとは)
2. [5つのアーキテクチャパターン](#5つのアーキテクチャパターン)
3. [詳細比較](#詳細比較)
4. [実装例で比較](#実装例で比較)
5. [どれを選ぶべき？](#どれを選ぶべき)
6. [まとめ](#まとめ)

---

## アーキテクチャとは？

**アーキテクチャ = コードの設計図**

家を建てるときに設計図が必要なように、プログラムにも「どこに何を置くか」の設計が必要です。

### なぜアーキテクチャが必要？

| 問題             | アーキテクチャがないと...  | アーキテクチャがあると... |
| ---------------- | -------------------------- | ------------------------- |
| **コードの場所** | どこに何があるか分からない | すぐに見つかる            |
| **変更**         | 1つ変えると全部壊れる      | 影響範囲が限定的          |
| **バグ**         | どこにバグがあるか不明     | 原因を特定しやすい        |
| **チーム開発**   | コードが衝突しまくる       | 並行作業しやすい          |
| **テスト**       | テストが書けない           | 各部分を独立テスト可能    |

---

## 5つのアーキテクチャパターン

### 1. 🐣 単一ファイル構成（No Architecture）

**「とりあえず全部1ファイルに書く」**

```
server.ts  ← 全部ここ（1000行とか）
```

### 2. 📁 ファイル分割構成（Simple Separation）

**「ルートとロジックを分けてみた」**

```
routes/
  todo.ts
models/
  todo.ts
utils/
  helpers.ts
```

### 3. 🏛️ MVC（Model-View-Controller）

**「役割を3つに分ける古典的パターン」**

```
models/      ← データ
views/       ← 表示
controllers/ ← 処理
```

### 4. 📊 レイヤードアーキテクチャ（Layered Architecture）

**「層（レイヤー）で責任を分ける」**

```
controllers/ ← HTTPリクエスト処理
services/    ← ビジネスロジック
repositories/← データアクセス
```

### 5. ⭕ クリーンアーキテクチャ（Clean Architecture）

**「ビジネスロジックを中心に、依存を逆転させる」**

```
entities/    ← ビジネスルール（中心）
usecases/    ← アプリケーションロジック
interfaces/  ← 外部とのやり取り
infrastructure/ ← 技術的詳細
```

---

## 詳細比較

### 1. 🐣 単一ファイル構成

#### 構造

```typescript
// server.ts（全部入り）
import Fastify from 'fastify';

const app = Fastify();
let todos = []; // データ

// ルート定義
app.get('/todos', async () => {
  return todos;
});

app.post('/todos', async (request) => {
  const newTodo = {
    id: Date.now(),
    title: request.body.title,
    completed: false,
  };
  todos.push(newTodo);
  return newTodo;
});

app.listen({ port: 3000 });
```

#### ✅ メリット

- **超シンプル**: ファイル1つで完結
- **学習コスト低い**: 初心者でもすぐ理解できる
- **セットアップ不要**: すぐに書き始められる
- **小規模に最適**: Todoアプリなら十分

#### ❌ デメリット

- **スケールしない**: 100行超えたら地獄
- **テスト不可能**: 分離されていないためテストできない
- **再利用できない**: 他のプロジェクトで使えない
- **チーム開発不可**: 全員が同じファイルを編集

#### 📏 適用範囲

- プロトタイプ
- 学習目的
- 10〜100行程度の超小規模アプリ

---

### 2. 📁 ファイル分割構成

#### 構造

```
src/
├── routes/
│   └── todo.ts        ← ルート定義
├── models/
│   └── todo.ts        ← 型定義
├── utils/
│   └── db.ts          ← ユーティリティ
└── server.ts          ← 起動
```

```typescript
// routes/todo.ts
export async function todoRoutes(app) {
  let todos = []; // まだここにデータがある

  app.get('/todos', async () => {
    return todos;
  });

  app.post('/todos', async (request) => {
    // ビジネスロジックもここ
    const newTodo = { ...request.body, completed: false };
    todos.push(newTodo);
    return newTodo;
  });
}
```

#### ✅ メリット

- **見通しが良い**: ファイルごとに分かれている
- **シンプル**: まだ理解しやすい
- **検索しやすい**: ファイル名で探せる

#### ❌ デメリット

- **責任が不明確**: ルートファイルにロジックが混在
- **テストしにくい**: 依然として分離が不十分
- **再利用困難**: ロジックがルートに密結合

#### 📏 適用範囲

- 個人開発
- 100〜500行程度
- 短期プロジェクト

---

### 3. 🏛️ MVC（Model-View-Controller）

#### 構造

```
src/
├── models/
│   └── Todo.ts        ← データ構造とDB操作
├── views/
│   └── todo.html      ← 表示（APIなら不要）
├── controllers/
│   └── TodoController.ts  ← リクエスト処理
└── server.ts
```

```typescript
// models/Todo.ts（Model）
export class TodoModel {
  private todos = [];

  getAll() {
    return this.todos;
  }

  create(data) {
    const todo = { id: Date.now(), ...data };
    this.todos.push(todo);
    return todo;
  }
}

// controllers/TodoController.ts（Controller）
export class TodoController {
  constructor(private todoModel: TodoModel) {}

  async getTodos(request, reply) {
    const todos = this.todoModel.getAll();
    return reply.send(todos);
  }

  async createTodo(request, reply) {
    // バリデーション
    if (!request.body.title) {
      return reply.code(400).send({ error: 'Title required' });
    }

    const todo = this.todoModel.create(request.body);
    return reply.code(201).send(todo);
  }
}
```

#### ✅ メリット

- **役割が明確**: Model/View/Controllerで分離
- **歴史が長い**: 情報が豊富
- **フレームワークが多い**: Rails、Laravel、Spring等

#### ❌ デメリット

- **ビジネスロジックの置き場**: ModelかController？
- **Modelが肥大化**: すべてをModelに入れがち（Fat Model）
- **APIには不向き**: View層が不要なケースが多い

#### 📏 適用範囲

- Webアプリケーション（HTML返す）
- 中規模プロジェクト
- フレームワークに従う場合

---

### 4. 📊 レイヤードアーキテクチャ（今回採用）

#### 構造

```
src/modules/todos/
├── todo.types.ts          ← 型定義
├── todo.schema.ts         ← バリデーション
├── todo.repository.ts     ← データアクセス
├── todo.service.ts        ← ビジネスロジック
├── todo.controller.ts     ← リクエスト処理
└── todo.routes.ts         ← ルート定義
```

```typescript
// todo.repository.ts（データアクセス層）
export class TodoRepository {
  private todos: Todo[] = [];

  async findAll(): Promise<Todo[]> {
    return this.todos;
  }

  async create(data: CreateTodoDto): Promise<Todo> {
    const todo = { id: uuidv4(), ...data, completed: false };
    this.todos.push(todo);
    return todo;
  }
}

// todo.service.ts（ビジネスロジック層）
export class TodoService {
  constructor(private repository: TodoRepository) {}

  async getAllTodos(): Promise<Todo[]> {
    return this.repository.findAll();
  }

  async createTodo(data: CreateTodoDto): Promise<Todo> {
    // ビジネスルール: タイトルは3文字以上
    if (data.title.length < 3) {
      throw new ValidationError('タイトルは3文字以上必要です');
    }

    // 期限が過去でないかチェック
    if (data.dueDate && new Date(data.dueDate) < new Date()) {
      throw new ValidationError('期限は未来の日付を指定してください');
    }

    return this.repository.create(data);
  }
}

// todo.controller.ts（表現層）
export class TodoController {
  constructor(private service: TodoService) {}

  async getTodos(request: FastifyRequest, reply: FastifyReply) {
    const todos = await this.service.getAllTodos();
    return reply.code(200).send({ data: todos });
  }

  async createTodo(request: FastifyRequest, reply: FastifyReply) {
    const todo = await this.service.createTodo(request.body);
    return reply.code(201).send({ data: todo });
  }
}
```

#### 依存関係

```
Controller（表現）
    ↓ 依存
Service（ビジネスロジック）
    ↓ 依存
Repository（データアクセス）
```

#### ✅ メリット

- **責任が超明確**: 各層の役割が明確
- **テストしやすい**: 各層を独立してテスト可能
- **変更に強い**: DB変更時はRepositoryだけ修正
- **再利用可能**: Serviceは複数のControllerから使える
- **チーム開発向き**: 層ごとに担当を分けられる

#### ❌ デメリット

- **ボイラープレート**: ファイル数が多い（小規模だと過剰）
- **学習コスト**: 3層の理解が必要
- **間接的**: 単純なCRUDでも3ファイル経由

#### 📏 適用範囲

- 中〜大規模プロジェクト（本番運用）
- 複数人のチーム開発
- ビジネスロジックが複雑
- 長期保守が前提
- **← 今回のプロジェクトはこれ**

---

### 5. ⭕ クリーンアーキテクチャ

#### 構造

```
src/
├── domain/                    ← 中心（依存ゼロ）
│   ├── entities/
│   │   └── Todo.ts           ← ビジネスオブジェクト
│   └── repositories/
│       └── ITodoRepository.ts ← インターフェース
├── application/
│   └── usecases/
│       ├── CreateTodo.ts     ← ユースケース
│       └── GetTodos.ts
├── infrastructure/            ← 外側（詳細）
│   ├── repositories/
│   │   └── TodoRepositoryImpl.ts ← 実装
│   └── http/
│       └── TodoController.ts
└── main.ts
```

```typescript
// domain/entities/Todo.ts（エンティティ：中心）
export class Todo {
  constructor(
    public readonly id: string,
    public title: string,
    public completed: boolean,
  ) {
    // ビジネスルールをここに
    if (title.length < 3) {
      throw new Error('タイトルは3文字以上');
    }
  }

  complete() {
    this.completed = true;
  }
}

// domain/repositories/ITodoRepository.ts（インターフェース）
export interface ITodoRepository {
  findAll(): Promise<Todo[]>;
  save(todo: Todo): Promise<void>;
}

// application/usecases/CreateTodo.ts（ユースケース）
export class CreateTodoUseCase {
  constructor(private repository: ITodoRepository) {}

  async execute(title: string): Promise<Todo> {
    const todo = new Todo(uuidv4(), title, false);
    await this.repository.save(todo);
    return todo;
  }
}

// infrastructure/repositories/TodoRepositoryImpl.ts（実装）
export class TodoRepositoryImpl implements ITodoRepository {
  private todos: Todo[] = [];

  async findAll(): Promise<Todo[]> {
    return this.todos;
  }

  async save(todo: Todo): Promise<void> {
    this.todos.push(todo);
  }
}
```

#### 依存関係（同心円）

```
        ┌───────────────────┐
        │  Infrastructure   │  ← 外側（詳細）
        │  ┌─────────────┐ │
        │  │ Application │ │  ← 中間
        │  │  ┌───────┐  │ │
        │  │  │Domain │  │ │  ← 中心（ビジネスロジック）
        │  │  └───────┘  │ │
        │  └─────────────┘ │
        └───────────────────┘

依存の方向: 外→中（逆転している！）
```

#### ✅ メリット

- **最強の独立性**: ビジネスロジックが技術から完全独立
- **テスト最強**: モックがとても簡単
- **フレームワーク非依存**: どんな技術にも対応可能
- **長期保守に最適**: 10年後も安心

#### ❌ デメリット

- **超複雑**: 初心者には理解困難
- **大量のボイラープレート**: ファイル数が膨大
- **オーバーエンジニアリング**: 小中規模では完全に過剰
- **学習曲線が急**: 習得に時間がかかる

#### 📏 適用範囲

- 大規模エンタープライズシステム
- 10年以上運用するシステム
- フレームワーク変更の可能性
- ドメインロジックが超複雑

---

## 実装例で比較

### お題: 「Todoを作成する」機能

#### 1. 単一ファイル構成

```typescript
// server.ts
app.post('/todos', async (request) => {
  todos.push({ id: Date.now(), ...request.body });
  return todos[todos.length - 1];
});
```

**行数**: 3行  
**ファイル数**: 1

---

#### 2. ファイル分割構成

```typescript
// routes/todo.ts
export function todoRoutes(app) {
  app.post('/todos', async (request) => {
    const todo = { id: Date.now(), ...request.body };
    todos.push(todo);
    return todo;
  });
}
```

**行数**: 5行  
**ファイル数**: 2

---

#### 3. MVC

```typescript
// models/Todo.ts
class TodoModel {
  create(data) {
    const todo = { id: Date.now(), ...data };
    this.todos.push(todo);
    return todo;
  }
}

// controllers/TodoController.ts
class TodoController {
  async createTodo(req, reply) {
    return this.todoModel.create(req.body);
  }
}
```

**行数**: 10行  
**ファイル数**: 3

---

#### 4. レイヤードアーキテクチャ

```typescript
// todo.repository.ts
class TodoRepository {
  async create(data: CreateTodoDto): Promise<Todo> {
    const todo = { id: uuidv4(), ...data, completed: false };
    this.todos.push(todo);
    return todo;
  }
}

// todo.service.ts
class TodoService {
  async createTodo(data: CreateTodoDto): Promise<Todo> {
    if (data.title.length < 3) {
      throw new ValidationError('タイトルは3文字以上');
    }
    return this.repository.create(data);
  }
}

// todo.controller.ts
class TodoController {
  async createTodo(req: FastifyRequest, reply: FastifyReply) {
    const todo = await this.service.createTodo(req.body);
    return reply.code(201).send({ data: todo });
  }
}
```

**行数**: 18行  
**ファイル数**: 6（型定義含む）

---

#### 5. クリーンアーキテクチャ

```typescript
// domain/entities/Todo.ts
class Todo {
  constructor(id: string, title: string) {
    if (title.length < 3) throw new Error('Invalid title');
  }
}

// domain/repositories/ITodoRepository.ts
interface ITodoRepository {
  save(todo: Todo): Promise<void>;
}

// application/usecases/CreateTodo.ts
class CreateTodoUseCase {
  async execute(title: string): Promise<Todo> {
    const todo = new Todo(uuidv4(), title);
    await this.repository.save(todo);
    return todo;
  }
}

// infrastructure/repositories/TodoRepositoryImpl.ts
class TodoRepositoryImpl implements ITodoRepository {
  async save(todo: Todo): Promise<void> {
    this.todos.push(todo);
  }
}

// infrastructure/http/TodoController.ts
class TodoController {
  async create(req, reply) {
    const todo = await this.createTodoUseCase.execute(req.body.title);
    return reply.send(todo);
  }
}
```

**行数**: 30行+  
**ファイル数**: 10+

---

## 比較表

| 項目                 | 単一ファイル | ファイル分割 | MVC    | レイヤード | クリーン   |
| -------------------- | ------------ | ------------ | ------ | ---------- | ---------- |
| **複雑度**           | ⭐           | ⭐⭐         | ⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **学習コスト**       | 1日          | 1週間        | 2週間  | 1ヶ月      | 3ヶ月+     |
| **ファイル数**       | 1            | 3-5          | 5-10   | 10-20      | 20-50      |
| **テスト容易性**     | ❌           | △            | ○      | ◎          | ◎◎         |
| **保守性**           | ❌           | △            | ○      | ◎          | ◎◎         |
| **スケーラビリティ** | ❌           | △            | ○      | ◎          | ◎◎         |
| **チーム開発**       | ❌           | △            | ○      | ◎          | ◎◎         |
| **小規模向き**       | ◎◎           | ◎            | ○      | △          | ❌         |
| **大規模向き**       | ❌           | ❌           | △      | ◎          | ◎◎         |
| **初心者向き**       | ◎◎           | ◎            | ○      | △          | ❌         |

---

## どれを選ぶべき？

### 🗺️ プロジェクトサイズ別ガイド

```
行数              推奨アーキテクチャ
─────────────────────────────────────────
〜100行          単一ファイル
100〜500行       ファイル分割
500〜2000行      MVC or レイヤード
2000〜10000行    レイヤード
10000行〜        レイヤード or クリーン
```

### 👥 チームサイズ別ガイド

| チーム              | 推奨                       |
| ------------------- | -------------------------- |
| **1人（個人開発）** | 単一ファイル〜ファイル分割 |
| **2-3人**           | ファイル分割〜MVC          |
| **4-10人**          | レイヤード                 |
| **10人以上**        | レイヤード〜クリーン       |

### ⏰ 期間別ガイド

| 期間          | 推奨                   |
| ------------- | ---------------------- |
| **1週間以内** | 単一ファイル           |
| **1ヶ月以内** | ファイル分割           |
| **3ヶ月以内** | MVC                    |
| **6ヶ月-1年** | レイヤード             |
| **数年以上**  | レイヤード or クリーン |

### 🎯 目的別ガイド

| 目的                   | 推奨              |
| ---------------------- | ----------------- |
| **学習・プロトタイプ** | 単一ファイル      |
| **ハッカソン・MVP**    | ファイル分割      |
| **スタートアップ**     | MVC or レイヤード |
| **エンタープライズ**   | レイヤード        |
| **超長期運用システム** | クリーン          |

---

## 実際の選択フロー

### ステップ1: 質問に答える

1. **チームは何人？**
   - 1人 → 単純なものでOK
   - 2人以上 → 構造が必要

2. **何ヶ月運用する？**
   - 1ヶ月未満 → シンプルに
   - 6ヶ月以上 → しっかり設計

3. **コード行数の予想は？**
   - 500行未満 → 過度な設計不要
   - 1000行以上 → アーキテクチャ必須

4. **ビジネスロジックは複雑？**
   - シンプル（CRUD中心） → シンプルな構成
   - 複雑（計算・ルール多数） → レイヤード以上

5. **技術変更の可能性は？**
   - ない → 何でもOK
   - ある → クリーンアーキテクチャ

### ステップ2: フローチャート

```
Start
  │
  ├─ 学習目的？
  │    └─ YES → 単一ファイル
  │
  ├─ 500行以下？
  │    └─ YES → ファイル分割
  │
  ├─ チーム1-3人 & 短期？
  │    └─ YES → MVC
  │
  ├─ チーム4人以上 or 長期運用？
  │    └─ YES → レイヤード ★今回はこれ★
  │
  └─ 超大規模 & 超長期？
       └─ YES → クリーンアーキテクチャ
```

---

## 今回のプロジェクトでレイヤードを選んだ理由

### ✅ 選定理由

1. **学習目的**: 実務レベルのアーキテクチャを学ぶ
2. **適度な複雑さ**: シンプルすぎず、複雑すぎず
3. **実務で頻出**: 多くの企業で採用されている
4. **バランスが良い**: コストとメリットのバランス最適
5. **理解しやすい**: 初心者でも数週間で理解可能

### 🎓 学習パス

```
1週目: 単一ファイルで学習
   ↓
2週目: ファイル分割で整理
   ↓
3-4週目: レイヤードアーキテクチャ導入 ★ここ★
   ↓
将来: クリーンアーキテクチャに挑戦
```

---

## まとめ

### 黄金の選択ルール

1. **迷ったら1段階シンプルに**
   - 過剰設計は技術的負債になる
   - 必要になってからリファクタリング

2. **最初は小さく、成長に応じて進化**

   ```
   単一ファイル → ファイル分割 → レイヤード
   ```

3. **チームの習熟度を考慮**
   - 全員が理解できるものを選ぶ
   - 一人だけが分かる設計は危険

4. **プロジェクトの性質を見極める**
   - 短期的な検証 → シンプルに
   - 長期的な運用 → しっかり設計

### 各アーキテクチャの「卒業タイミング」

| From → To             | タイミング                         |
| --------------------- | ---------------------------------- |
| 単一 → 分割           | ファイルが200行超えたら            |
| 分割 → MVC            | 処理が複雑になってきたら           |
| MVC → レイヤード      | チームが増えてきたら               |
| レイヤード → クリーン | フレームワーク変更が必要になったら |

### 最後に

**完璧なアーキテクチャは存在しません。**

プロジェクトの規模、チーム、期間、目的に応じて適切なものを選びましょう。
そして、**必要になったら進化させる**柔軟性を持つことが大切です。

---

**Happy Coding! 🚀**
