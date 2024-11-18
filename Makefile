all: build run check

build:
	docker compose -f pong-game/docker-compose.yml build

run:
	docker compose -f pong-game/docker-compose.yml up -d

check:
	# wait 5 seconds for sevices to initialize
	sleep 5
	# Check if the application container is running successfully
	@all_containers=$$(docker compose -f pong-game/docker-compose.yml ps -a --format '{{.Name}}'); \
	running_containers=$$(docker compose -f pong-game/docker-compose.yml ps --format '{{.Name}}'); \
	for container in $$all_containers; do \
		echo "$$running_containers" | grep -q "$$container" || (echo "Error: $$container is not running!" && exit 1); \
	done
	echo "All containers are running."

clean:
	docker compose -f pong-game/docker-compose.yml down -v

.PHONY: all
