.PHONY: setup dev migrate test clean docker-up docker-down

setup:
	@echo "Setting up Elephantfly Scan..."
	@pnpm install
	@cd apps/api && python3 -m venv venv || python -m venv venv
	@cd apps/api && source venv/bin/activate && pip install -r requirements.txt
	@echo "✓ Setup complete! Run 'make docker-up' to start Postgres, then 'make migrate' to run migrations."

dev:
	@echo "Starting development servers..."
	@pnpm dev

migrate:
	@echo "Running database migrations..."
	@cd apps/api && source venv/bin/activate && alembic upgrade head

test:
	@echo "Running tests..."
	@cd apps/api && source venv/bin/activate && pytest

docker-up:
	@echo "Starting Docker containers..."
	@docker-compose -f infra/docker-compose.yml up -d
	@echo "✓ Postgres and Adminer are running!"

docker-down:
	@echo "Stopping Docker containers..."
	@docker-compose -f infra/docker-compose.yml down

clean:
	@echo "Cleaning up..."
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@rm -rf apps/api/venv apps/api/__pycache__ apps/api/.pytest_cache
	@rm -rf apps/web/.next apps/web/out

