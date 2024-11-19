all: build run check

build:
	cp pong-game/.env.example pong-game/.env
	docker compose -f pong-game/docker-compose.yml build

run:
	docker compose -f pong-game/docker-compose.yml up -d
	docker compose -f pong-game/docker-compose.yml up -d

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
		if [ $$(docker inspect --format='{{.RestartCount}}' "$$container") -gt 0 ]; then \
			echo "Error: $$container has restarted!" && exit 1; \
		fi; \
		if ! docker inspect "$$container" --format='{{.State.Health.Status}}' | grep -q "healthy"; then \
			echo "Error: $$container is not healthy!" && exit 1; \
		fi; \
	done
	echo "All containers are running."

clean:
	docker compose -f pong-game/docker-compose.yml down -v
	rm pong-game/.env

.PHONY: all
