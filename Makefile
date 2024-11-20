all: go check

go: build run

build:
	cp pong-game/.env.example pong-game/.env
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
	# wait 5 seconds for sevices to initialize
	sleep 5
	# Check if the application container is running successfully
	@all_containers=$$(docker compose -f pong-game/docker-compose.yml ps -a --format '{{.Name}}'); \
	running_containers=$$(docker compose -f pong-game/docker-compose.yml ps --format '{{.Name}}'); \
	for container in $$all_containers; do \
		if ! echo "$$running_containers" | grep -q "$$container"; then \
			echo "Error: $$container is not running!" exit 1; \
		fi; \
		restart_count=$$(docker inspect --format='{{.RestartCount}}' "$$container"); \
		if [ "$$restart_count" -gt 0 ]; then \
			echo "Error: $$container has restarted $$restart_count times!" && exit 1; \
		fi; \
		health_status=$$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$$container"); \
		if [ "$$health_status" != "none" ] && [ "$$health_status" != "healthy" ]; then \
			echo "Error: $$container health check failed (status: $$health_status)!" && exit 1; \
		fi; \
	done
	echo "All containers are running without restart issues."

clean:
	docker compose -f pong-game/docker-compose.yml down -v
	rm pong-game/.env

re: clean all

.PHONY: all build check run clean go start stop down status re
