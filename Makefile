all: go check

go: build run

build:
	cp pong-game/.env.example pong-game/.env
	mkdir -p pong-game/frontend/nginx/logs
	mkdir -p pong-game/frontend/nginx/modsec
	chmod -R 755 pong-game/frontend/nginx/logs
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

check:
	# wait 10 seconds for sevices to initialize
	sleep 10
	# Check if the application container is running successfully
	@all_containers=$$(docker compose -f pong-game/docker-compose.yml ps -a --format '{{.Name}}'); \
	running_containers=$$(docker compose -f pong-game/docker-compose.yml ps --format '{{.Name}}'); \
	for container in $$all_containers; do \
		if ! echo "$$running_containers" | grep -q "$$container"; then \
			echo "Error: $$container is not running!"; \
			docker logs "$$container"; \
			exit 1; \
		fi; \
		restart_count=$$(docker inspect --format='{{.RestartCount}}' "$$container"); \
		if [ "$$restart_count" -gt 0 ]; then \
			echo "Error: $$container has restarted $$restart_count times!"; \
			docker logs "$$container"; \
			exit 1; \
		fi; \
		health_status=$$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$$container"); \
		if [ "$$health_status" != "none" ] && [ "$$health_status" != "healthy" ]; then \
			echo "Error: $$container health check failed (status: $$health_status)!"; \
			docker logs "$$container"; \
			exit 1; \
		fi; \
	done
	echo "All containers are running without restart issues."

clean:
	docker compose -f pong-game/docker-compose.yml down -v
	rm -f pong-game/frontend/nginx/logs/*.log
	rm -f pong-game/frontend/nginx/modsec/*.log
	rm pong-game/.env

re: clean all

.PHONY: all build check run clean go start stop down status re
