install: install-deps

start:
	PORT=5002 npx @hexlet/react-todo-app-with-backend

install-deps:
	npm ci

test:
	npm run test

test-coverage:
	npm run test-coverage

lint:
	npm run lint
