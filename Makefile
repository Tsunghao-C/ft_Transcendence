all: go check

go: build run

build:
	cp pong-game/.env.example pong-game/.env
	mkdir -p pong-game/frontend/nginx/logs
	- mkdir -p pong-game/security/vault_debian/volumes/file
	- mkdir -p pong-game/security/vault_debian/volumes/shared_data
	- mkdir -p pong-game/backend/app/media/profile_images
	chmod -R 755 pong-game/frontend/nginx/logs
	chmod -R 755 pong-game/backend/app/media/profile_images
	docker compose -f pong-game/docker-compose.yml build

run:
	docker compose -f pong-game/docker-compose.yml up -d

status:
	docker compose -f pong-game/docker-compose.yml ps

stop:
	docker compose -f pong-game/docker-compose.yml stop

start:
	docker compose -f pong-game/docker-compose.yml start

down:
	docker compose -f pong-game/docker-compose.yml down

update:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Usage: make update <service-name>"; \
		exit 1; \
	fi
	@container="$(filter-out $@,$(MAKECMDGOALS))"; \
	echo "Updating container: $$container"; \
	docker compose -f pong-game/docker-compose.yml stop $$container; \
	docker compose -f pong-game/docker-compose.yml rm -f $$container; \
	docker compose -f pong-game/docker-compose.yml build $$container; \
	docker compose -f pong-game/docker-compose.yml up -d $$container; \
	echo "Update complete for $$container"

check:
	# wait 10 seconds for sevices to initialize
	sleep 10
	# Check if the application container is running successfully
	@all_containers=$$(docker compose -f pong-game/docker-compose.yml ps -a --format '{{.Name}}'); \
	running_containers=$$(docker compose -f pong-game/docker-compose.yml ps --format '{{.Name}}'); \
	for container in $$all_containers; do \
		if ! echo "$$running_containers" | grep -q "$$container"; then \
			echo "\033[0;31mError: $$container is not running!\033[0m"; \
			docker logs "$$container"; \
			exit 1; \
		fi; \
		restart_count=$$(docker inspect --format='{{.RestartCount}}' "$$container"); \
		if [ "$$restart_count" -gt 0 ]; then \
			echo "\033[0;31mError: $$container has restarted $$restart_count times!\033[0m"; \
			docker logs "$$container"; \
			exit 1; \
		fi; \
		health_status=$$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$$container"); \
		if [ "$$health_status" != "none" ] && [ "$$health_status" != "healthy" ]; then \
			echo "\033[0;31mError: $$container health check failed (status: $$health_status)!\033[0m"; \
			docker logs "$$container"; \
			exit 1; \
		fi; \
	done
	@echo "\033[0;32mAll containers are running without restart issues.\033[0m"

	# wait another 10 seconds for backend sevices to be ready
	sleep 10
	# Run WebSocket health check script
	@echo "Checking WebSocket endpoints..."
	@chmod +x pong-game/tests/websocket_check.sh
	@./pong-game/tests/websocket_check.sh localhost || { echo "\033[0;31mWebSocket health checks failed!\033[0m"; exit 1; }

clean:
	docker volume prune --force
	docker builder prune --force         # clear build cache
	docker image prune --force           # clear dangling images
	docker system prune --force --volumes  # cleanup unused resources
	docker compose -f pong-game/docker-compose.yml down -v --remove-orphans
	rm -f pong-game/frontend/nginx/logs/*.log
	- rm -f pong-game/frontend/nginx/modsec/*.log
	- rm -rf pong-game/security/vault_debian/volumes/*
	- rm -rf --no-preserve-root pong-game/backend/app/media/profile_images
	- rm -rf pong-game/tests/lib
	rm pong-game/.env

re: clean all

# To clear out all the caches in the ~/.docker/buildx
kill:
	- docker stop $$(docker ps -qa)
	- docker rm $$(docker ps -qa)
	- docker rmi -f $$(docker images -qa)
	- docker volume rm $$(docker volume ls -q)
	- docker network rm $$(docker network ls -q) 2>/dev/null
	- docker buildx stop
	- rm -rf ~/.docker/buildx
	- docker buildx create --use

in:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Usage: make in <service-name>"; \
	else \
		docker compose -f pong-game/docker-compose.yml exec $(filter-out $@,$(MAKECMDGOALS)) bash; \
	fi

%:
	@:

.PHONY: all build check run clean go start stop down status re kill in update
