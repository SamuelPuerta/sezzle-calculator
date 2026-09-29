# Coverage report (generated 2026-09-29)

## Backend (go test ./... -cover)
```
github.com/samuelpuerta/sezzle-calculator/backend/cmd/server/main.go:16:		main			0.0%
github.com/samuelpuerta/sezzle-calculator/backend/cmd/server/main.go:44:		getenv			0.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/api/handler.go:36:		NewHandler		100.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/api/handler.go:48:		calculate		100.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/api/handler.go:76:		describeDecodeError	100.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/api/handler.go:88:		writeError		100.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/api/handler.go:92:		writeJSON		75.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/calculator/calculator.go:35:	IsUnary			100.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/calculator/calculator.go:39:	Calculate		100.0%
github.com/samuelpuerta/sezzle-calculator/backend/internal/calculator/calculator.go:85:	isFinite		100.0%
total:											(statements)		77.9%
```

## Frontend (vitest --coverage)
```
---------------|---------|----------|---------|---------|-------------------
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------|---------|----------|---------|---------|-------------------
All files      |     100 |    98.55 |     100 |     100 |                   
 App.tsx       |     100 |    96.15 |     100 |     100 | 43                
 api.ts        |     100 |      100 |     100 |     100 |                   
 operations.ts |     100 |      100 |     100 |     100 |                   
 validation.ts |     100 |      100 |     100 |     100 |                   
---------------|---------|----------|---------|---------|-------------------
```
