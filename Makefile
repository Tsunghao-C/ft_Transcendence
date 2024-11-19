all: build run check

build:
	cp pong-game/.env.example pong-game/.env
	docker compose -f pong-game/docker-compose.yml build

run:
	docker compose -f pong-game/docker-compose.yml up -d
	docker compose -f pong-game/docker-compose.yml up -d

check:
	# wait 10 seconds for sevices to initialize
	sleep 10
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

.PHONY: all
